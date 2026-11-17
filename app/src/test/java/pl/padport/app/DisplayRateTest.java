package pl.padport.app;

import static org.junit.Assert.*;

import java.io.File;
import java.io.IOException;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DisplayRateTest {
    @Rule public TemporaryFolder temporary=new TemporaryFolder();

    @Test public void displayPreferencePersistsBothSwitchPositions() throws Exception {
        File flag=new File(temporary.getRoot(),"limit-60hz.enabled");
        assertFalse(flag.isFile());
        DisplayRate.saveFlag(flag,true);DisplayRate.saveFlag(flag,true);
        assertTrue(new File(flag.getPath()).isFile());
        DisplayRate.saveFlag(flag,false);DisplayRate.saveFlag(flag,false);
        assertFalse(flag.exists());
    }

    @Test public void unwritablePreferenceReportsFailure() {
        File flag=new File(temporary.getRoot(),"missing/limit-60hz.enabled");
        assertThrows(IOException.class,()->DisplayRate.saveFlag(flag,true));
        assertFalse(flag.exists());
    }
    @Test public void thorTopScreenPicksItsSixtyHertzMode(){
        // AYN Thor: top 1080x1920 (modes 1: 60 Hz, 2: 120 Hz), bottom 1080x1240 (3: 120 Hz, 4: 60 Hz).
        int[][] modes={{1,1080,1920},{2,1080,1920},{3,1080,1240},{4,1080,1240}};
        float[] rates={60.000004f,120.00001f,120.00001f,60.000004f};
        assertEquals(1,DisplayRate.pick(1080,1920,modes,rates));
        assertEquals(4,DisplayRate.pick(1080,1240,modes,rates));
    }
    @Test public void noSixtyHertzModeAtThisResolutionMeansNoChange(){
        int[][] modes={{1,1440,3200},{2,1080,2400}};
        assertEquals(0,DisplayRate.pick(1440,3200,modes,new float[]{120f,60f}));
        assertEquals(0,DisplayRate.pick(1080,2400,new int[][]{{5,1080,2400}},new float[]{90f}));
        assertEquals(7,DisplayRate.pick(1080,2400,new int[][]{{7,1080,2400}},new float[]{59.94f}));
    }
}
