package pl.padport.app;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Locale;

/** Serves the default face of a TTC/OTC as a standalone browser font. */
final class FontCollection {
    static final int LIMIT = 64 * 1024 * 1024;

    static boolean matches(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        return lower.endsWith(".ttc") || lower.endsWith(".otc");
    }

    static String mime(byte[] font) {
        return ByteBuffer.wrap(font).getInt() == 0x4f54544f ? "font/otf" : "font/ttf";
    }

    static byte[] firstFace(byte[] collection) throws IOException {
        ByteBuffer input = ByteBuffer.wrap(collection).order(ByteOrder.BIG_ENDIAN);
        bounds(0, 16, collection.length);
        int version = input.getInt(4);
        long faces = uint(input, 8);
        if (input.getInt(0) != 0x74746366 || (version != 0x10000 && version != 0x20000)
                || faces == 0 || faces > 4096) throw new IOException("Invalid OpenType collection header");
        bounds(0, 12 + 4 * faces + (version == 0x20000 ? 12 : 0), collection.length);
        long faceOffset = uint(input, 12);
        bounds(faceOffset, 12, collection.length);
        int face = (int) faceOffset, flavor = input.getInt(face);
        int count = Short.toUnsignedInt(input.getShort(face + 4));
        if ((flavor != 0x10000 && flavor != 0x4f54544f) || count == 0 || count > 4095)
            throw new IOException("Invalid OpenType face directory");
        int directorySize = 12 + 16 * count;
        bounds(face, directorySize, collection.length);
        long size = directorySize;
        for (int i = 0; i < count; i++) {
            int record = face + 12 + 16 * i;
            long length = uint(input, record + 12);
            bounds(uint(input, record + 8), length, collection.length);
            size += (length + 3) & ~3L;
            if (size > LIMIT) throw new IOException("OpenType face exceeds size limit");
        }
        byte[] font = new byte[(int) size];
        ByteBuffer output = ByteBuffer.wrap(font).order(ByteOrder.BIG_ENDIAN);
        System.arraycopy(collection, face, font, 0, directorySize);
        int power = Integer.highestOneBit(count);
        output.putShort(6, (short) (power * 16));
        output.putShort(8, (short) Integer.numberOfTrailingZeros(power));
        output.putShort(10, (short) (count * 16 - power * 16));
        int offset = directorySize, head = -1;
        for (int i = 0; i < count; i++) {
            int record = 12 + 16 * i;
            int source = (int) uint(input, face + record + 8);
            int length = (int) uint(input, face + record + 12);
            System.arraycopy(collection, source, font, offset, length);
            output.putInt(record + 8, offset);
            if (input.getInt(face + record) == 0x68656164) {
                if (head >= 0 || length < 54) throw new IOException("Invalid OpenType head table");
                head = offset;
                output.putInt(head + 8, 0);
            }
            offset += (length + 3) & ~3;
        }
        if (head < 0) throw new IOException("Missing OpenType head table");
        // Collection offsets and checkSumAdjustment are not valid in a standalone sfnt.
        int sum = 0;
        for (int p = 0; p < font.length; p += 4) sum += output.getInt(p);
        output.putInt(head + 8, 0xb1b0afba - sum);
        return font;
    }

    private static long uint(ByteBuffer input, int offset) {
        return Integer.toUnsignedLong(input.getInt(offset));
    }

    private static void bounds(long offset, long length, long size) throws IOException {
        if (offset > size || length > size - offset) throw new IOException("Truncated OpenType collection");
    }
}
