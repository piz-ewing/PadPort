package pl.padport.app;

import org.junit.Test;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.net.ServerSocket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;

public class RuntimeFileChannelTest {
    @Test public void persistentChannelReadsFragmentedResponsesAndDoesNotReplayFailedWrites() throws Exception {
        try (ServerSocket server = new ServerSocket(0); RuntimeFileChannel channel = new RuntimeFileChannel()) {
            CompletableFuture<Void> peer = CompletableFuture.runAsync(() -> {
                try (var socket = server.accept()) {
                    socket.setSoTimeout(3000);
                    var input = new DataInputStream(socket.getInputStream());
                    var output = socket.getOutputStream();
                    var headers = new ByteArrayOutputStream();
                    int tail = 0;
                    while (tail != 0x0d0a0d0a) {
                        int value = input.readUnsignedByte(); headers.write(value); tail = (tail << 8) | value;
                    }
                    String request = headers.toString(StandardCharsets.US_ASCII);
                    assertTrue(request.startsWith("GET /session/__padport__/sync HTTP/1.1"));
                    assertTrue(request.contains("Authorization: Bearer test-token"));
                    output.write("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: padport-sync\r\n\r\n".getBytes(StandardCharsets.US_ASCII));
                    output.flush();
                    for (int i = 0; i < 2; i++) {
                        byte[] header = new byte[8]; input.readFully(header);
                        var fields = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN);
                        int length = fields.getInt(); assertEquals(1, fields.getInt());
                        byte[] command = new byte[length]; input.readFully(command);
                        assertEquals("request" + i, new String(command, StandardCharsets.UTF_8));
                        byte[] reply = ("response" + i + " 章节").getBytes(StandardCharsets.UTF_8);
                        byte[] framed = ByteBuffer.allocate(8 + reply.length).order(ByteOrder.LITTLE_ENDIAN)
                            .putInt(reply.length).putInt(1).put(reply).array();
                        output.write(framed, 0, 3); output.flush();
                        output.write(framed, 3, framed.length - 3); output.flush();
                    }
                    byte[] header = new byte[8]; input.readFully(header);
                    int length = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN).getInt();
                    byte[] command = new byte[length]; input.readFully(command);
                    assertEquals("write-once", new String(command, StandardCharsets.UTF_8));
                } catch (Exception error) { throw new RuntimeException(error); }
            });
            String base = "http://127.0.0.1:" + server.getLocalPort() + "/session/";
            assertEquals("response0 章节", channel.request(base, "test-token", "request0"));
            assertEquals("response1 章节", channel.request(base, "test-token", "request1"));
            assertThrows(java.io.IOException.class, () -> channel.request(base, "test-token", "write-once"));
            peer.get(5, TimeUnit.SECONDS);
            channel.close();
            assertThrows(java.io.IOException.class, () -> channel.request(base, "test-token", "closed"));
        }
    }
}
