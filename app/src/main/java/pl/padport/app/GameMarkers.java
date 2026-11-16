package pl.padport.app;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Log;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.AccessDeniedException;
import java.nio.file.FileAlreadyExistsException;

/** Empty root markers used by PC-oriented game plugins. */
final class GameMarkers {
    private static final int LIMIT = 32 * 1024 * 1024;
    private final GameSource source;
    private final ContentResolver resolver;
    private record Document(String id, String name, boolean directory) {}

    GameMarkers(GameSource source) {
        this.source = source;
        resolver = source.context.getContentResolver();
    }

    private Uri uri(Document document) {
        return DocumentsContract.buildDocumentUriUsingTree(source.tree, document.id());
    }

    private Document find(Document parent, String name) throws IOException {
        Document match = null;
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(source.tree, parent.id());
        String[] columns = {DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE};
        try (Cursor cursor = resolver.query(children, columns, null, null, null)) {
            if (cursor == null) throw new IOException("Unable to read save directory");
            while (cursor.moveToNext()) {
                if (!name.equalsIgnoreCase(cursor.getString(1))) continue;
                if (match != null) throw new IOException("Ambiguous save filename: " + name);
                match = new Document(cursor.getString(0), cursor.getString(1),
                    DocumentsContract.Document.MIME_TYPE_DIR.equals(cursor.getString(2)));
            }
        }
        return match;
    }

    static String markerName(String path) throws IOException {
        if (path == null || path.trim().isEmpty() || path.length() > 200
            || path.chars().anyMatch(c -> c < 0x20 || ".\\/:*?\"<>|".indexOf(c) >= 0))
            throw new AccessDeniedException(String.valueOf(path));
        return path;
    }

    private Document root() throws IOException {
        Document current = new Document(DocumentsContract.getTreeDocumentId(source.tree), "", true);
        if (!source.prefix.isEmpty()) {
            current = find(current, source.prefix.substring(0, source.prefix.length() - 1));
            if (current == null || !current.directory()) throw new IOException("Game directory is missing");
        }
        return current;
    }

    private Object marker(JSONObject command) throws Exception {
        String name = markerName(command.getString("path"));
        Document parent = root(), file = find(parent, name);
        switch (command.getString("op")) {
            case "marker-stat":
                long size = 0;
                if (file != null && !file.directory()) {
                    try (Cursor cursor = resolver.query(uri(file), new String[]{DocumentsContract.Document.COLUMN_SIZE}, null, null, null)) {
                        if (cursor == null || !cursor.moveToFirst()) throw new IOException("Unable to stat marker");
                        size = cursor.getLong(0);
                    }
                }
                return new JSONObject().put("exists", file != null).put("size", size)
                    .put("directory", file != null && file.directory());
            case "marker-read":
                if (file == null) throw new FileNotFoundException(name);
                if (file.directory()) throw new AccessDeniedException(name);
                try (InputStream in = resolver.openInputStream(uri(file))) {
                    if (in == null) throw new IOException("Unable to read marker");
                    return android.util.Base64.encodeToString(GameSource.readBounded(in, 64 * 1024), android.util.Base64.NO_WRAP);
                }
            case "marker-open":
                String flags = command.getString("value");
                if (!flags.equals("w") && !flags.equals("wx")) throw new AccessDeniedException(name);
                if (file != null) {
                    if (flags.equals("wx")) throw new FileAlreadyExistsException(name);
                    if (file.directory()) throw new AccessDeniedException(name);
                    // Never truncate a nonempty game resource while creating a marker.
                    try (InputStream in = resolver.openInputStream(uri(file))) {
                        if (in == null || in.read() != -1) throw new AccessDeniedException(name);
                    }
                } else {
                    Uri made = DocumentsContract.createDocument(resolver, uri(parent), "application/octet-stream", name);
                    if (made == null) throw new IOException("Unable to create marker; grant write access to the game folder");
                    try (Cursor cursor = resolver.query(made, new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null)) {
                        if (cursor == null || !cursor.moveToFirst() || !name.equals(cursor.getString(0))) {
                            DocumentsContract.deleteDocument(resolver, made);
                            throw new FileAlreadyExistsException(name);
                        }
                    }
                }
                return true;
            default: throw new IOException("Unknown marker operation");
        }
    }

    synchronized String execute(String request) {
        JSONObject response = new JSONObject();
        try {
            if (!"MV".equals(source.engine) && !"MZ".equals(source.engine))
                throw new IOException("Node file access requires an MV/MZ game");
            response.put("ok", true).put("value", marker(new JSONObject(request)));
        } catch (Exception error) {
            Log.e("PadPort", "Game marker operation failed", error);
            String code = error instanceof FileAlreadyExistsException ? "EEXIST"
                : error instanceof AccessDeniedException || error instanceof SecurityException ? "EACCES"
                : error instanceof FileNotFoundException ? "ENOENT" : "EIO";
            try { response.put("ok", false).put("error", error.toString()).put("code", code); }
            catch (org.json.JSONException impossible) { throw new IllegalStateException(impossible); }
        }
        return response.toString();
    }
}
