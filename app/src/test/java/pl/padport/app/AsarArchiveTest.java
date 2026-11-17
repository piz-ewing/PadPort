package pl.padport.app;

import static org.junit.Assert.*;
import org.junit.Test;
import org.json.JSONObject;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

public class AsarArchiveTest {
    private static byte[] archive(JSONObject files, byte[] data) throws Exception {
        byte[] json = new JSONObject().put("files", files).toString().getBytes(StandardCharsets.UTF_8);
        int header = 8 + ((json.length + 3) & ~3);
        ByteBuffer out = ByteBuffer.allocate(8 + header + data.length).order(ByteOrder.LITTLE_ENDIAN);
        out.putInt(4).putInt(header).putInt(header - 4).putInt(json.length).put(json);
        out.position(8 + header);out.put(data);
        return out.array();
    }
    private static JSONObject file(long offset, long size) throws Exception {
        return new JSONObject().put("offset", Long.toString(offset)).put("size", size);
    }
    private static JSONObject directory(JSONObject files) throws Exception { return new JSONObject().put("files", files); }
    private static JSONObject webRoot() throws Exception {
        return new JSONObject().put("index.html", file(0, 1))
            .put("js", directory(new JSONObject().put("rpg_core.js", file(1, 1))));
    }
    private static AsarArchive parse(byte[] bytes) throws IOException { return AsarArchive.read(new ByteArrayInputStream(bytes), bytes.length); }
    @Test public void detectsNestedWebRootAndKeepsUnicodePaths() throws Exception {
        byte[] bytes = archive(new JSONObject().put("src", directory(webRoot().put("测试.txt", file(2, 2))))
            .put("main.js", file(4, 1)), new byte[]{10, 20, 30, 40, 50});
        AsarArchive a = parse(bytes);
        assertEquals("src/", a.gameRoot());
        AsarArchive.Member member = a.files().get("src/测试.txt");
        assertEquals(2, member.size());assertEquals(bytes.length - 3, member.offset());
    }
    @Test public void readsBeyondFourGigabytesWithoutExtractingOrLeakingNextMember() throws Exception {
        long gap = (1L << 32) + 123;
        byte[] header = archive(new JSONObject().put("movie.bin", file(gap, 3)), new byte[0]);
        File tmp = Files.createTempFile("asar-test-", ".bin").toFile();
        try {
            try (RandomAccessFile out = new RandomAccessFile(tmp, "rw")) {
                out.write(header);out.seek(header.length + gap);out.write(new byte[]{1, 2, 3, 99});
            }
            AsarArchive a;
            try (InputStream in = new FileInputStream(tmp)) { a = AsarArchive.read(in, tmp.length()); }
            AsarArchive.Member m = a.files().get("movie.bin");
            try (InputStream in = AsarArchive.slice(new FileInputStream(tmp), m.offset(), m.size())) {
                assertEquals(1, in.skip(1));assertEquals(2, in.read());
                assertArrayEquals(new byte[]{3}, in.readAllBytes());assertEquals(-1, in.read());
                assertEquals(0, in.read(new byte[0]));
            }
        } finally { Files.delete(tmp.toPath()); }
    }
    @Test public void indexesUnpackedSidecarsAndFileAndDirectoryLinks() throws Exception {
        JSONObject root = new JSONObject().put("src", directory(webRoot()))
            .put("asset.bin", new JSONObject().put("size", 20).put("unpacked", true))
            .put("alias.bin", new JSONObject().put("link", "asset.bin"))
            .put("web", new JSONObject().put("link", "src"));
        AsarArchive a = parse(archive(root, new byte[]{1, 2}));
        assertEquals("asset.bin", a.files().get("alias.bin").unpackedPath());
        assertEquals(a.files().get("src/index.html"), a.files().get("web/index.html"));
        assertThrows(IOException.class, a::gameRoot);
    }
    @Test public void rejectsTraversalCyclesAndInvalidOffsets() throws Exception {
        for (JSONObject files : new JSONObject[]{
            new JSONObject().put("..", file(0, 0)),
            new JSONObject().put("bad/name", file(0, 0)),
            new JSONObject().put("link", new JSONObject().put("link", "../outside")),
            new JSONObject().put("a", new JSONObject().put("link", "b")).put("b", new JSONObject().put("link", "a")),
            new JSONObject().put("past-end", file(3, 1)),
            new JSONObject().put("overflow", file(Long.MAX_VALUE, 1)),
            new JSONObject().put("negative", file(-1, 1)),
            new JSONObject().put("fraction", new JSONObject().put("size", 1.5).put("offset", "0"))
        }) assertThrows(IOException.class, () -> parse(archive(files, new byte[]{1})));
    }
    @Test public void rejectsTruncatedAndOversizedHeadersAndNonWebPackages() throws Exception {
        byte[] good = archive(new JSONObject().put("main.js", file(0, 1)), new byte[]{1});
        assertThrows(IOException.class, () -> parse(java.util.Arrays.copyOf(good, 15)));
        byte[] bad = good.clone();ByteBuffer.wrap(bad).order(ByteOrder.LITTLE_ENDIAN).putInt(4, Integer.MAX_VALUE);
        assertThrows(IOException.class, () -> parse(bad));
        assertThrows(IOException.class, parse(good)::gameRoot);
    }
    @Test public void reportsPrematureMemberEnd() throws Exception {
        File tmp = Files.createTempFile("asar-short-", ".bin").toFile();
        try {
            Files.write(tmp.toPath(), new byte[]{5});
            try (InputStream in = AsarArchive.slice(new FileInputStream(tmp), 0, 2)) {
                assertEquals(5, in.read());assertThrows(EOFException.class, in::read);
            }
        } finally { Files.delete(tmp.toPath()); }
    }
    @Test public void chainedLinksUseTheCanonicalUnpackedPath() throws Exception {
        JSONObject files = new JSONObject()
            .put("data", directory(new JSONObject().put("asset.bin", new JSONObject().put("size", 7))).put("unpacked", true))
            .put("alias", new JSONObject().put("link", "data"))
            .put("second", new JSONObject().put("link", "alias/asset.bin"));
        AsarArchive a = parse(archive(files, new byte[0]));
        assertEquals("data/asset.bin", a.files().get("second").unpackedPath());
    }
}
