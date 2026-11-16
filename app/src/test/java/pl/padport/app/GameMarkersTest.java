package pl.padport.app;

import static org.junit.Assert.*;
import java.io.IOException;
import org.junit.Test;

public class GameMarkersTest {
    @Test public void markersAreRestrictedToExtensionlessNamesAtTheGameRoot() throws Exception {
        assertEquals("plugin-marker",GameMarkers.markerName("plugin-marker"));
        for(String path:new String[]{"../escape","/absolute","save/file1.rpgsave","index.html",".hidden","a\\b","C:drive","","   ","a\n","a".repeat(201)})
            assertThrows(path,IOException.class,()->GameMarkers.markerName(path));
        assertThrows(IOException.class,()->GameMarkers.markerName(null));
    }

}