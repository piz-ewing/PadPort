package pl.padport.app;

import static org.junit.Assert.*;
import java.io.IOException;
import java.util.Map;
import org.json.JSONObject;
import org.junit.Test;

public class GameSaveTransferTest {
    @Test public void saveNamesStayInsideTheSelectedEnginesSaveDirectory() throws Exception {
        assertEquals("file1.rpgsave",GameSaveTransfer.fileName("file1.rpgsave","MV"));
        assertEquals("File1.RPGSAVE.bak",GameSaveTransfer.fileName("File1.RPGSAVE.bak","MV"));
        assertEquals("autosave.rmmzsave",GameSaveTransfer.fileName("autosave.rmmzsave","MZ"));
        for(String name:new String[]{"../file1.rpgsave","save/file1.rpgsave",".hidden.rpgsave",
                "file1.rpgsave\n","C:drive.rpgsave","a\\file1.rpgsave","index.html","file1.rmmzsave"})
            assertThrows(name,IOException.class,()->GameSaveTransfer.fileName(name,"MV"));
        assertThrows(IOException.class,()->GameSaveTransfer.fileName("file1.rpgsave","MZ"));
        assertThrows(IOException.class,()->GameSaveTransfer.fileName("Save1.rxdata","RGSS"));
    }

    @Test public void exportsValidateAllNamesTypesAndSizeBeforeWriting() throws Exception {
        JSONObject files=new JSONObject().put("File1.rpgsave","compressed==").put("global.rpgsave","metadata==");
        assertEquals(Map.of("File1.rpgsave","compressed==","global.rpgsave","metadata=="),GameSaveTransfer.validateFiles(files,"MV"));
        assertThrows(IOException.class,()->GameSaveTransfer.validateFiles(new JSONObject(),"MV"));
        assertThrows(IOException.class,()->GameSaveTransfer.validateFiles(new JSONObject().put("file1.rpgsave",5),"MV"));
        assertThrows(IOException.class,()->GameSaveTransfer.validateFiles(new JSONObject().put("file1.rpgsave","a").put("FILE1.RPGSAVE","b"),"MV"));
        String oversized="a".repeat(32*1024*1024+1);
        assertThrows(IOException.class,()->GameSaveTransfer.validateFiles(new JSONObject().put("file1.rpgsave",oversized),"MV"));
    }
}
