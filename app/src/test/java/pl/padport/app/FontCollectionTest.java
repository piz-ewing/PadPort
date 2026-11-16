package pl.padport.app;

import java.io.IOException;
import java.nio.ByteBuffer;
import org.junit.Test;
import static org.junit.Assert.*;

public class FontCollectionTest {
    private byte[] collection(int flavor) {
        byte[] bytes = new byte[164];
        ByteBuffer b = ByteBuffer.wrap(bytes);
        b.putInt(0, 0x74746366).putInt(4, 0x20000).putInt(8, 2).putInt(12, 32).putInt(16, 144);
        b.putInt(32, flavor).putShort(36, (short) 2);
        b.putInt(44, 0x68656164).putInt(48, 0x12340000).putInt(52, 80).putInt(56, 54);
        b.putInt(60, 0x74657374).putInt(64, 0x01020300).putInt(68, 140).putInt(72, 3);
        b.putInt(80, 0x12340000).putInt(88, 0x456789ab);
        bytes[140]=1;bytes[141]=2;bytes[142]=3;
        return bytes;
    }

    @Test public void extractsFirstFaceWithRebasedTablesAndValidChecksum() throws Exception {
        for (int flavor : new int[]{0x10000, 0x4f54544f}) {
            byte[] source=collection(flavor), original=source.clone();
            byte[] font=FontCollection.firstFace(source);
            ByteBuffer b=ByteBuffer.wrap(font);
            assertEquals(104,font.length);
            assertEquals(flavor,b.getInt(0));
            assertEquals(44,b.getInt(20));
            assertEquals(100,b.getInt(36));
            assertEquals(0x01020300,b.getInt(100));
            int sum=0;for(int p=0;p<font.length;p+=4)sum+=b.getInt(p);
            assertEquals(0xb1b0afba,sum);
            assertArrayEquals(original,source);
            assertEquals(flavor==0x10000?"font/ttf":"font/otf",FontCollection.mime(font));
        }
        for(int field:new int[]{0,4,8,12,52,56}) {
            byte[] invalid=collection(0x10000);ByteBuffer.wrap(invalid).putInt(field,-1);
            assertThrows(IOException.class,()->FontCollection.firstFace(invalid));
        }
        assertThrows(IOException.class,()->FontCollection.firstFace(new byte[8]));
    }
}
