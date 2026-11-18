package pl.padport.app;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;
import android.system.ErrnoException;
import android.system.OsConstants;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.nio.file.*;
import java.util.*;

/** Authorized document operations for the runtime's filesystem adapter. */
final class GameDocuments {
    private final Uri tree;
    private final ContentResolver resolver;
    private final LinkedHashMap<String, Directory> directories = new LinkedHashMap<>(16, .75f, true);
    private int cachedDocuments;
    private static native void setAppend(int fd) throws ErrnoException;
    record Document(String id, String name, boolean directory, long size, long modified) {}

    static final class Directory {
        final List<Document> documents;
        final long loaded = System.nanoTime();
        private final Map<String, Document> exact = new HashMap<>(), folded = new HashMap<>();

        Directory(List<Document> documents) {
            this.documents = List.copyOf(documents);
            for (Document document : documents) {
                exact.put(document.name(), document);
                String key = document.name().toLowerCase(Locale.ROOT);
                if (folded.containsKey(key)) folded.put(key, null);
                else folded.put(key, document);
            }
        }

        Document child(String name) throws FileAlreadyExistsException {
            Document document = exact.get(name);
            if (document != null) return document;
            String key = name.toLowerCase(Locale.ROOT);
            if (folded.containsKey(key) && folded.get(key) == null) throw new FileAlreadyExistsException(name);
            return folded.get(key);
        }
    }

    GameDocuments(Context context, Uri tree) {
        this.tree = tree;
        resolver = context.getContentResolver();
    }

    private Uri uri(Document document) {
        return DocumentsContract.buildDocumentUriUsingTree(tree, document.id());
    }

    private Document root() {
        return new Document(DocumentsContract.getTreeDocumentId(tree), "", true, 0, 0);
    }

    private Directory directory(Document parent) throws IOException {
        if (!parent.directory()) throw new NotDirectoryException(parent.name());
        Directory cached = directories.get(parent.id());
        if (cached != null && System.nanoTime() - cached.loaded < 5_000_000_000L) return cached;
        invalidate(parent);
        List<Document> result = new ArrayList<>();
        String[] columns = {DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.COLUMN_SIZE, DocumentsContract.Document.COLUMN_LAST_MODIFIED};
        try (Cursor cursor = resolver.query(DocumentsContract.buildChildDocumentsUriUsingTree(tree, parent.id()), columns, null, null, null)) {
            if (cursor == null) throw new IOException("Cannot list document directory");
            while (cursor.moveToNext()) result.add(new Document(cursor.getString(0), cursor.getString(1),
                DocumentsContract.Document.MIME_TYPE_DIR.equals(cursor.getString(2)), cursor.isNull(3) ? -1 : cursor.getLong(3),
                cursor.isNull(4) ? 0 : cursor.getLong(4)));
        }
        Directory directory = new Directory(result);
        if (result.size() <= 65536) {
            directories.put(parent.id(), directory);
            cachedDocuments += result.size();
            while (directories.size() > 128 || cachedDocuments > 65536) {
                Iterator<Directory> iterator = directories.values().iterator();
                cachedDocuments -= iterator.next().documents.size();
                iterator.remove();
            }
        }
        return directory;
    }

    private List<Document> children(Document parent) throws IOException { return directory(parent).documents; }

    private void invalidate(Document parent) {
        Directory previous = directories.remove(parent.id());
        if (previous != null) cachedDocuments -= previous.documents.size();
    }

    private Document parent(String name) throws IOException {
        int slash = name.lastIndexOf('/');
        return find(slash < 0 ? "" : name.substring(0, slash));
    }

    private Document child(Document parent, String name) throws IOException {
        return directory(parent).child(name);
    }

    private String path(String value) {
        String path = AssetPaths.normalize(value);
        for (String part : path.split("/"))
            if (part.indexOf(':') >= 0 || part.chars().anyMatch(c -> c < 32)) throw new IllegalArgumentException("Invalid document name");
        return path;
    }

    private Document find(String name) throws IOException {
        String physical = path(name);
        Document current = root();
        for (String part : physical.split("/")) {
            if (part.isEmpty()) continue;
            current = child(current, part);
            if (current == null) throw new FileNotFoundException(name);
        }
        return current;
    }

    private Document create(Document parent, String name, boolean directory) throws IOException {
        invalidate(parent);
        Uri made = DocumentsContract.createDocument(resolver, uri(parent),
            directory ? DocumentsContract.Document.MIME_TYPE_DIR : "application/octet-stream", name);
        if (made == null) throw new AccessDeniedException(name);
        try (Cursor cursor = resolver.query(made, new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null)) {
            if (cursor == null || !cursor.moveToFirst() || !name.equals(cursor.getString(0))) {
                if (!DocumentsContract.deleteDocument(resolver, made)) throw new IOException("Cannot remove duplicate document");
                throw new FileAlreadyExistsException(name);
            }
        }
        return new Document(DocumentsContract.getDocumentId(made), name, directory, 0, 0);
    }

    private JSONObject stat(Document file) throws Exception {
        try (Cursor cursor = resolver.query(uri(file), new String[]{DocumentsContract.Document.COLUMN_SIZE,
            DocumentsContract.Document.COLUMN_LAST_MODIFIED}, null, null, null)) {
            if (cursor == null) throw new IOException("Cannot query document metadata");
            if (!cursor.moveToFirst()) throw new FileNotFoundException(file.name());
            file = new Document(file.id(), file.name(), file.directory(), cursor.isNull(0) ? -1 : cursor.getLong(0),
                cursor.isNull(1) ? 0 : cursor.getLong(1));
        }
        return new JSONObject().put("size", file.size()).put("mode", file.directory() ? 0040700 : 0100600)
            .put("mtimeMs", file.modified()).put("ctimeMs", file.modified()).put("birthtimeMs", file.modified())
            .put("atimeMs", file.modified()).put("type", file.directory() ? "directory" : "file");
    }

    private Object execute(JSONObject command) throws Exception {
        String op = command.getString("op"), name = path(command.optString("file", ""));
        if ("stat".equals(op)) {
            return stat(find(name));
        }
        if ("list".equals(op)) {
            TreeSet<String> names = new TreeSet<>();
            for (Document item : children(find(name))) names.add(item.name());
            return new JSONArray(names);
        }
        if ("resource".equals(op)) {
            Document local = find(name);
            if (local.directory()) throw new ErrnoException("open", OsConstants.EISDIR);
            try (AssetFileDescriptor descriptor = resolver.openAssetFileDescriptor(uri(local), "r")) {
                if (descriptor == null) throw new FileNotFoundException(name);
                long offset = descriptor.getStartOffset();
                long size = descriptor.getLength() >= 0 ? descriptor.getLength() : local.size();
                try (ParcelFileDescriptor duplicate = ParcelFileDescriptor.dup(descriptor.getFileDescriptor())) {
                    return new JSONObject().put("fd", duplicate.detachFd()).put("offset", offset).put("size", size);
                }
            }
        }
        if ("mkdir".equals(op)) {
            boolean recursive = command.optBoolean("recursive");
            Document current = find("");
            String[] parts = name.split("/");
            for (int i = 0; i < parts.length; i++) {
                if (parts[i].isEmpty()) continue;
                Document next = child(current, parts[i]);
                if (next == null) {
                    if (!recursive && i != parts.length - 1) throw new FileNotFoundException(name);
                    next = create(current, parts[i], true);
                } else if (!next.directory()) throw new FileAlreadyExistsException(name);
                else if (!recursive && i == parts.length - 1) throw new FileAlreadyExistsException(name);
                current = next;
            }
            return JSONObject.NULL;
        }
        if ("open".equals(op)) {
            String flags = command.optString("flags", "r");
            if (!Set.of("r", "r+", "w", "wx", "w+", "wx+", "a", "ax", "a+", "ax+").contains(flags))
                throw new IllegalArgumentException("Unsupported open flags");
            Document file;
            boolean existed = true;
            try { file = find(name); }
            catch (FileNotFoundException missing) {
                existed = false;
                if (flags.startsWith("r")) throw missing;
                int slash = name.lastIndexOf('/');
                file = create(find(slash < 0 ? "" : name.substring(0, slash)), name.substring(slash + 1), false);
            }
            if (file.directory()) throw new ErrnoException("open", OsConstants.EISDIR);
            if (flags.contains("x") && existed) throw new FileAlreadyExistsException(name);
            if (!flags.equals("r")) invalidate(parent(name));
            String mode = flags.startsWith("a") ? (flags.contains("+") ? "rw" : "wa")
                : flags.startsWith("w") ? (flags.contains("+") ? "rwt" : "wt") : (flags.contains("+") ? "rw" : "r");
            try (ParcelFileDescriptor descriptor = resolver.openFileDescriptor(uri(file), mode)) {
                if (descriptor == null) throw new AccessDeniedException(name);
                if (flags.startsWith("a")) {
                    setAppend(descriptor.getFd());
                }
                return descriptor.detachFd();
            }
        }
        if ("unlink".equals(op) || "rmdir".equals(op)) {
            Document file = find(name);
            if (name.isEmpty()) throw new AccessDeniedException(name);
            if ("rmdir".equals(op) && !file.directory()) throw new NotDirectoryException(name);
            if ("unlink".equals(op) && file.directory()) throw new ErrnoException("unlink", OsConstants.EISDIR);
            if (file.directory() && !children(file).isEmpty()) throw new DirectoryNotEmptyException(name);
            invalidate(parent(name));
            invalidate(file);
            if (!DocumentsContract.deleteDocument(resolver, uri(file))) throw new AccessDeniedException(name);
            return JSONObject.NULL;
        }
        if ("rename".equals(op)) {
            String target = path(command.getString("to"));
            int slash = name.lastIndexOf('/'), targetSlash = target.lastIndexOf('/');
            if (!name.substring(0, slash + 1).equals(target.substring(0, targetSlash + 1)))
                throw new ErrnoException("rename", OsConstants.EXDEV);
            Document original = find(name), parent = find(slash < 0 ? "" : name.substring(0, slash));
            Document existing = child(parent, target.substring(targetSlash + 1));
            invalidate(parent);
            Document previous = null;
            if (existing != null) {
                if (existing.id().equals(original.id())) return JSONObject.NULL;
                if (existing.directory() || original.directory()) throw new FileAlreadyExistsException(target);
                Uri moved = DocumentsContract.renameDocument(resolver, uri(existing), ".padport-" + UUID.randomUUID() + ".tmp");
                if (moved == null) throw new AccessDeniedException(target);
                previous = new Document(DocumentsContract.getDocumentId(moved), existing.name(), false, existing.size(), existing.modified());
            }
            try {
                if (DocumentsContract.renameDocument(resolver, uri(original), target.substring(targetSlash + 1)) == null)
                    throw new AccessDeniedException(name);
            } catch (Exception failure) {
                if (previous != null) try {
                    if (DocumentsContract.renameDocument(resolver, uri(previous), previous.name()) == null)
                        throw new IOException("Cannot restore replaced document");
                } catch (Exception restore) { failure.addSuppressed(restore); }
                throw failure;
            }
            if (previous != null && !DocumentsContract.deleteDocument(resolver, uri(previous)))
                android.util.Log.w("PadPort", "Cannot remove replaced document");
            return JSONObject.NULL;
        }
        throw new UnsupportedOperationException(op);
    }

    synchronized String request(String json) {
        JSONObject response = new JSONObject();
        try { response.put("value", execute(new JSONObject(json))); }
        catch (Exception error) {
            String code = error instanceof ErrnoException nativeError ? OsConstants.errnoName(nativeError.errno)
                : error instanceof FileNotFoundException ? "ENOENT"
                : error instanceof FileAlreadyExistsException ? "EEXIST"
                : error instanceof AccessDeniedException || error instanceof SecurityException ? "EACCES"
                : error instanceof NotDirectoryException ? "ENOTDIR"
                : error instanceof DirectoryNotEmptyException ? "ENOTEMPTY"
                : error instanceof IllegalArgumentException ? "EINVAL"
                : error instanceof UnsupportedOperationException ? "ENOSYS" : "EIO";
            try { response.put("error", new JSONObject().put("code", code).put("message", error.toString())); }
            catch (org.json.JSONException impossible) { throw new IllegalStateException(impossible); }
        }
        return response.toString();
    }
}
