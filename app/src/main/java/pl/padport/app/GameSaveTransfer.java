package pl.padport.app;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Log;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Manual save copies; normal gameplay keeps the engine's browser storage. */
final class GameSaveTransfer {
    private static final int LIMIT = 32 * 1024 * 1024;
    private final GameSource source;
    private final ContentResolver resolver;
    private record Document(String id, String name, boolean directory) {}
    private record Replacement(Document original, Document staged) {}

    GameSaveTransfer(GameSource source) {
        this.source = source;
        resolver = source.context.getContentResolver();
    }

    static String fileName(String name, String engine) throws IOException {
        String extension = switch (engine) {
            case "MV" -> ".rpgsave";
            case "MZ" -> ".rmmzsave";
            default -> throw new IOException("Save transfer requires an MV/MZ game");
        };
        String lower = name.toLowerCase(Locale.ROOT);
        if (name.length() > 200 || name.startsWith(".") || name.chars().anyMatch(c -> c < 32 || "/\\:*?\"<>|".indexOf(c) >= 0)
            || !(lower.endsWith(extension) || ("MV".equals(engine) && lower.endsWith(extension + ".bak"))))
            throw new IOException("Invalid save filename: " + name);
        return name;
    }

    static Map<String, String> validateFiles(JSONObject files, String engine) throws Exception {
        Map<String, String> values = new LinkedHashMap<>();
        Set<String> names = new HashSet<>();
        long total = 0;
        for (Iterator<String> keys = files.keys(); keys.hasNext();) {
            String name = keys.next();
            fileName(name, engine);
            if (!names.add(name.toLowerCase(Locale.ROOT))) throw new IOException("Ambiguous save filename: " + name);
            Object value = files.get(name);
            if (!(value instanceof String)) throw new IOException("Invalid save content: " + name);
            total += ((String)value).getBytes(StandardCharsets.UTF_8).length;
            if (total > LIMIT) throw new IOException("Save transfer exceeds 32 MB");
            values.put(name, (String)value);
        }
        if (values.isEmpty()) throw new IOException("No save files to export");
        return values;
    }

    private Uri uri(Document document) {
        return DocumentsContract.buildDocumentUriUsingTree(source.tree, document.id());
    }

    private Map<String, Document> children(Document folder) throws IOException {
        Map<String, Document> result = new LinkedHashMap<>();
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(source.tree, folder.id());
        String[] columns = {DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE};
        try (Cursor cursor = resolver.query(children, columns, null, null, null)) {
            if (cursor == null) throw new IOException("Unable to read game directory");
            while (cursor.moveToNext()) {
                Document file = new Document(cursor.getString(0), cursor.getString(1),
                    DocumentsContract.Document.MIME_TYPE_DIR.equals(cursor.getString(2)));
                if (result.put(file.name().toLowerCase(Locale.ROOT), file) != null)
                    throw new IOException("Ambiguous filename: " + file.name());
            }
        }
        return result;
    }

    private Document directory(boolean create) throws IOException {
        Document root = new Document(DocumentsContract.getTreeDocumentId(source.tree), "", true);
        String prefix = source.writablePrefix();
        if (!prefix.isEmpty()) {
            root = children(root).get(prefix.substring(0, prefix.length() - 1).toLowerCase(Locale.ROOT));
            if (root == null || !root.directory()) throw new IOException("Game directory is missing");
        }
        Document folder = children(root).get("save");
        if (folder == null && create) folder = create(root, "save", DocumentsContract.Document.MIME_TYPE_DIR);
        if (folder != null && !folder.directory()) throw new IOException("The save path is not a directory");
        return folder;
    }

    private JSONObject read() throws Exception {
        JSONObject files = new JSONObject();
        Document folder = directory(false);
        if (folder == null) return files;
        int remaining = LIMIT;
        for (Document file : children(folder).values()) {
            String lower = file.name().toLowerCase(Locale.ROOT);
            String extension = "MV".equals(source.engine) ? ".rpgsave" : ".rmmzsave";
            if (file.directory() || !(lower.endsWith(extension) || ("MV".equals(source.engine) && lower.endsWith(extension + ".bak")))) continue;
            fileName(file.name(), source.engine);
            try (InputStream in = resolver.openInputStream(uri(file))) {
                if (in == null) throw new IOException("Unable to read save: " + file.name());
                byte[] bytes = GameSource.readBounded(in, remaining);
                remaining -= bytes.length;
                files.put(file.name(), new String(bytes, StandardCharsets.UTF_8));
            }
        }
        return files;
    }

    private Document create(Document folder, String name, String mime) throws IOException {
        Uri made = DocumentsContract.createDocument(resolver, uri(folder), mime, name);
        if (made == null) throw new IOException("Unable to create " + name + "; grant write access to the game folder");
        return new Document(DocumentsContract.getDocumentId(made), name, DocumentsContract.Document.MIME_TYPE_DIR.equals(mime));
    }

    private Document rename(Document file, String name) throws IOException {
        Uri renamed = DocumentsContract.renameDocument(resolver, uri(file), name);
        if (renamed == null) throw new IOException("Unable to rename save: " + file.name());
        return new Document(DocumentsContract.getDocumentId(renamed), name, false);
    }

    private void delete(Document file) throws IOException {
        if (!DocumentsContract.deleteDocument(resolver, uri(file))) throw new IOException("Unable to delete temporary save: " + file.name());
    }

    private int write(JSONObject files) throws Exception {
        Map<String, String> values = validateFiles(files, source.engine);
        Document folder = directory(true);
        Map<String, Document> existing = children(folder);
        Map<String, Document> staged = new LinkedHashMap<>();
        Map<String, Replacement> replaced = new LinkedHashMap<>();
        try {
            for (var entry : values.entrySet()) {
                Document original = existing.get(entry.getKey().toLowerCase(Locale.ROOT));
                if (original != null && original.directory()) throw new IOException("Save file is a directory: " + original.name());
                Document temporary = create(folder, ".padport-" + UUID.randomUUID() + ".tmp", "application/octet-stream");
                staged.put(entry.getKey(), temporary);
                try (OutputStream out = resolver.openOutputStream(uri(temporary), "wt")) {
                    if (out == null) throw new IOException("Unable to write save: " + entry.getKey());
                    out.write(entry.getValue().getBytes(StandardCharsets.UTF_8));
                    out.flush();
                }
            }
            for (var entry : staged.entrySet()) {
                Document original = existing.get(entry.getKey().toLowerCase(Locale.ROOT));
                String name = original == null ? entry.getKey() : original.name();
                Document previous = original == null ? null : rename(original, ".padport-" + UUID.randomUUID() + ".bak");
                replaced.put(name, new Replacement(previous, null));
                Document saved = rename(entry.getValue(), name);
                entry.setValue(null);
                replaced.put(name, new Replacement(previous, saved));
            }
        } catch (Exception failure) {
            List<Map.Entry<String, Replacement>> rollback = new ArrayList<>(replaced.entrySet());
            Collections.reverse(rollback);
            for (var entry : rollback) {
                try {
                    if (entry.getValue().staged() != null) delete(entry.getValue().staged());
                    if (entry.getValue().original() != null) rename(entry.getValue().original(), entry.getKey());
                } catch (Exception restoreFailure) { failure.addSuppressed(restoreFailure); }
            }
            throw failure;
        } finally {
            for (Document file : staged.values()) {
                if (file != null) try { delete(file); }
                catch (IOException | RuntimeException error) { Log.w("PadPort", "Cannot remove staged save", error); }
            }
        }
        for (Replacement replacement : replaced.values()) {
            if (replacement.original() != null) try { delete(replacement.original()); }
            catch (IOException | RuntimeException error) { Log.w("PadPort", "Previous save retained after export", error); }
        }
        return values.size();
    }

    synchronized String execute(String request) {
        JSONObject response = new JSONObject();
        try {
            if (!"MV".equals(source.engine) && !"MZ".equals(source.engine)) throw new IOException("Save transfer requires an MV/MZ game");
            JSONObject command = new JSONObject(request);
            Object result = switch (command.getString("op")) {
                case "import" -> read();
                case "export" -> write(command.getJSONObject("files"));
                default -> throw new IOException("Unknown save transfer operation");
            };
            response.put("ok", true).put("value", result);
        } catch (Exception error) {
            Log.e("PadPort", "Save transfer failed", error);
            try { response.put("ok", false).put("error", error.toString()); }
            catch (org.json.JSONException impossible) { throw new IllegalStateException(impossible); }
        }
        return response.toString();
    }
}
