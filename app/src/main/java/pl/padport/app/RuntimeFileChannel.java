package pl.padport.app;

import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

final class RuntimeFileChannel implements AutoCloseable {
    private static final int LIMIT = 64 * 1024 * 1024;
    private volatile Socket socket;
    private DataInputStream input;
    private OutputStream output;
    private volatile boolean closed;

    private void connect(String base, String token) throws IOException {
        URI uri = URI.create(base + "__padport__/sync");
        Socket current = new Socket();
        socket = current;
        if (closed) { current.close(); throw new IOException("File channel is closed"); }
        current.connect(new InetSocketAddress("127.0.0.1", uri.getPort()), 5000);
        current.setSoTimeout(30000);
        current.setTcpNoDelay(true);
        input = new DataInputStream(current.getInputStream());
        output = current.getOutputStream();
        String request = "GET " + uri.getRawPath() + " HTTP/1.1\r\nHost: " + uri.getRawAuthority() +
            "\r\nConnection: Upgrade\r\nUpgrade: padport-sync\r\nAuthorization: Bearer " + token + "\r\n\r\n";
        output.write(request.getBytes(StandardCharsets.US_ASCII));
        output.flush();
        ByteArrayOutputStream headers = new ByteArrayOutputStream();
        int tail = 0;
        while (tail != 0x0d0a0d0a) {
            int value = input.read();
            if (value < 0) throw new IOException("File channel closed during handshake");
            if (headers.size() >= 8192) throw new IOException("File channel response header is too large");
            headers.write(value);
            tail = (tail << 8) | value;
        }
        if (!headers.toString(StandardCharsets.US_ASCII.name()).startsWith("HTTP/1.1 101 "))
            throw new IOException("File channel handshake rejected");
    }

    synchronized String request(String base, String token, String command) throws IOException {
        try {
            if (closed) throw new IOException("File channel is closed");
            byte[] bytes = command.getBytes(StandardCharsets.UTF_8);
            if (bytes.length == 0 || bytes.length > LIMIT) throw new IOException("File request is too large");
            if (socket == null) connect(base, token);
            byte[] header = ByteBuffer.allocate(8).order(ByteOrder.LITTLE_ENDIAN).putInt(bytes.length).putInt(1).array();
            output.write(header);
            output.write(bytes);
            output.flush();
            input.readFully(header);
            ByteBuffer reply = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN);
            int size = reply.getInt(), type = reply.getInt();
            if (type != 1 || size <= 0 || size > LIMIT) throw new IOException("Invalid file response header");
            byte[] response = new byte[size];
            input.readFully(response);
            return new String(response, StandardCharsets.UTF_8);
        } catch (IOException error) {
            disconnect();
            throw error;
        }
    }

    private void disconnect() {
        Socket current = socket;
        socket = null;
        if (current != null) try { current.close(); }
        catch (IOException error) { android.util.Log.w("PadPort-Runtime", "Closing file channel", error); }
    }

    @Override public void close() {
        closed = true;
        disconnect();
    }
}
