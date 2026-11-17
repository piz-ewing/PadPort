package pl.padport.app;

import org.json.JSONException;
import org.json.JSONObject;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Electron ASAR index. Offsets are relative to the archive, including its header. */
final class AsarArchive {
    private static final int MAX_HEADER = 32 * 1024 * 1024;
    private static final int MAX_ENTRIES = 200_000;
    record Member(long offset, long size, String unpackedPath) {}
    private record Target(JSONObject entry, String path, boolean unpacked) {}
    private final Map<String, Member> files = new LinkedHashMap<>();
    private final JSONObject root;
    private final long dataOffset, archiveSize;
    private int visited;

    private AsarArchive(JSONObject root, long dataOffset, long archiveSize) throws IOException, JSONException {
        this.root = root;
        this.dataOffset = dataOffset;
        this.archiveSize = archiveSize;
        walk(root, "", "", false, new HashSet<>(), 0);
    }

    static AsarArchive read(InputStream input, long archiveSize) throws IOException {
        DataInputStream in = new DataInputStream(input);
        byte[] first = new byte[16];
        in.readFully(first);
        ByteBuffer ints = ByteBuffer.wrap(first).order(ByteOrder.LITTLE_ENDIAN);
        long sizePayload = Integer.toUnsignedLong(ints.getInt());
        long headerSize = Integer.toUnsignedLong(ints.getInt());
        long payloadSize = Integer.toUnsignedLong(ints.getInt());
        long jsonSize = Integer.toUnsignedLong(ints.getInt());
        if (sizePayload != 4 || headerSize < 8 || headerSize > MAX_HEADER
            || headerSize != 8 + ((jsonSize + 3) & ~3L) || payloadSize != headerSize - 4
            || (archiveSize >= 0 && headerSize + 8 > archiveSize))
            throw new IOException("Invalid ASAR header");
        byte[] json = new byte[(int)jsonSize];
        in.readFully(json);
        for (long padding = headerSize - 8 - jsonSize; padding > 0; padding--) in.readByte();
        try {
            String text = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(json)).toString();
            return new AsarArchive(new JSONObject(text).getJSONObject("files"), headerSize + 8, archiveSize);
        } catch (JSONException | CharacterCodingException error) {
            throw new IOException("Invalid ASAR index", error);
        }
    }

    Map<String, Member> files() { return Collections.unmodifiableMap(files); }

    /** A unique MV/MZ web root; Electron's main script is not a browser entry point. */
    String gameRoot() throws IOException {
        Map<String, String> names = new HashMap<>();
        for (String path : files.keySet()) {
            String lower = path.toLowerCase(Locale.ROOT);
            if (names.containsKey(lower)) names.put(lower, ""); else names.put(lower, path);
        }
        List<String> roots = new ArrayList<>();
        for (String path : files.keySet()) {
            String lower = path.toLowerCase(Locale.ROOT);
            if (!(lower.equals("index.html") || lower.endsWith("/index.html")) || !path.equals(names.get(lower))) continue;
            String prefix = path.substring(0, path.length() - "index.html".length());
            String base = prefix.toLowerCase(Locale.ROOT);
            if (present(names, base + "js/rpg_core.js") || present(names, base + "js/rmmz_core.js")) roots.add(prefix);
        }
        if (roots.size() != 1) throw new IOException(roots.isEmpty()
            ? "ASAR contains no supported MV/MZ web entry point" : "ASAR contains multiple MV/MZ web entry points");
        return roots.get(0);
    }

    private static boolean present(Map<String, String> paths, String name) {
        String path = paths.get(name);
        return path != null && !path.isEmpty();
    }

    private static void name(String value) throws IOException {
        if (value.isEmpty() || value.equals(".") || value.equals("..")
            || value.chars().anyMatch(c -> c < 32 || c == '/' || c == 92))
            throw new IOException("Unsafe ASAR filename");
    }

    private static String linkPath(String value) throws IOException {
        try {
            if (value.isEmpty() || value.startsWith("/") || value.indexOf(':') >= 0
                || !value.equals(AssetPaths.normalize(value))) throw new IllegalArgumentException();
            for (String part : value.split("/")) name(part);
            return value;
        } catch (IllegalArgumentException error) { throw new IOException("Unsafe ASAR link", error); }
    }

    private Target node(String path, Set<String> links) throws IOException, JSONException {
        JSONObject children = root, current = null;
        String actual = "";
        boolean external = false;
        String[] parts = path.split("/");
        for (int i = 0; i < parts.length; i++) {
            name(parts[i]);
            current = children.optJSONObject(parts[i]);
            if (current == null) throw new IOException("ASAR link target is missing");
            actual += parts[i];
            if (current.has("link")) {
                String target = linkPath(current.getString("link"));
                if (links.size() >= 40 || !links.add(target)) throw new IOException("Cyclic ASAR link");
                Target resolved = node(target, links);
                current = resolved.entry();actual = resolved.path();external = resolved.unpacked();
            }
            external |= current.optBoolean("unpacked", false);
            if (i + 1 < parts.length) {children = current.getJSONObject("files");actual += "/";}
        }
        return new Target(current, actual, external);
    }

    private void walk(JSONObject children, String virtual, String physical, boolean unpacked,
                      Set<String> links, int depth) throws IOException, JSONException {
        if (depth > 128) throw new IOException("ASAR directory nesting exceeds limit");
        for (Iterator<String> keys = children.keys(); keys.hasNext();) {
            if (++visited > MAX_ENTRIES) throw new IOException("ASAR entry count exceeds limit");
            String key = keys.next();
            name(key);
            String path = virtual + key, actual = physical + key;
            if (path.length() > 8192) throw new IOException("ASAR path exceeds limit");
            JSONObject entry = children.getJSONObject(key);
            Set<String> chain = links;
            boolean external = unpacked;
            if (entry.has("link")) {
                actual = linkPath(entry.getString("link"));
                chain = new HashSet<>(links);
                if (chain.size() >= 40 || !chain.add(actual)) throw new IOException("Cyclic ASAR link");
                Target target = node(actual, chain);
                entry = target.entry();actual = target.path();external = target.unpacked();
            }
            external |= entry.optBoolean("unpacked", false);
            if (entry.has("files")) walk(entry.getJSONObject("files"), path + "/", actual + "/", external, chain, depth + 1);
            else {
                long size = unsigned(entry.get("size"));
                long offset = -1;
                if (!external) {
                    long relative = unsigned(entry.getString("offset"));
                    if (relative > Long.MAX_VALUE - dataOffset) throw new IOException("ASAR offset overflow");
                    offset = dataOffset + relative;
                    if (size > Long.MAX_VALUE - offset || (archiveSize >= 0 && offset + size > archiveSize))
                        throw new IOException("ASAR member exceeds archive bounds");
                }
                files.put(path, new Member(offset, size, external ? actual : null));
            }
        }
    }

    private static long unsigned(Object value) throws IOException {
        String text = String.valueOf(value);
        if (text.isEmpty() || !text.chars().allMatch(c -> c >= '0' && c <= '9')) throw new IOException("Invalid ASAR size or offset");
        try { return Long.parseLong(text); }
        catch (NumberFormatException error) { throw new IOException("ASAR size or offset overflow", error); }
    }

    /** Owns the supplied stream. Seeking is required; scanning gigabytes per request is not viable. */
    static InputStream slice(FileInputStream in, long offset, long size) throws IOException {
        if (offset < 0 || size < 0 || offset > Long.MAX_VALUE - size) throw new IOException("Invalid ASAR stream bounds");
        in.getChannel().position(offset);
        return new InputStream() {
            long remaining = size;
            @Override public int read() throws IOException {
                byte[] one = new byte[1];
                return read(one, 0, 1) == -1 ? -1 : one[0] & 255;
            }
            @Override public int read(byte[] bytes, int off, int len) throws IOException {
                if (off < 0 || len < 0 || off > bytes.length - len) throw new IndexOutOfBoundsException();
                if (len == 0) return 0;
                if (remaining == 0) return -1;
                int count = in.getChannel().read(ByteBuffer.wrap(bytes, off, (int)Math.min(len, remaining)));
                if (count < 0) throw new EOFException("ASAR member is truncated");
                remaining -= count;
                return count;
            }
            @Override public long skip(long count) throws IOException {
                long step = Math.min(Math.max(count, 0), remaining);
                in.getChannel().position(in.getChannel().position() + step);
                remaining -= step;
                return step;
            }
            @Override public int available() { return (int)Math.min(remaining, Integer.MAX_VALUE); }
            @Override public void close() throws IOException { in.close(); }
        };
    }
}
