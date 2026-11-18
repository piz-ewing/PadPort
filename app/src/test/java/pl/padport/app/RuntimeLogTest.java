package pl.padport.app;

import org.junit.Test;
import static org.junit.Assert.*;

public class RuntimeLogTest {
    @Test public void warningFloodRetainsTheErrorAndItsStack() {
        RuntimeLog log = new RuntimeLog();
        String failure = "TypeError: failure" + System.lineSeparator() + " at update (engine.js:5)";
        log.add(failure, true);
        int emitted = 0;
        for (int i = 0; i < 21848; i++) if (log.add("WARNING invalid alignment", false)) emitted++;
        assertEquals(15, emitted);
        assertTrue(log.report().startsWith(failure));
        assertTrue(log.report().contains("WARNING invalid alignment [x21848]"));
        for (int i = 0; i < 200; i++) log.add("message " + i, false);
        assertTrue(log.report().contains(failure));
        assertFalse(log.report().contains("message 0"));
        assertTrue(log.report().contains("message 199"));
    }

    @Test public void errorsAndMessageSizesStayBounded() {
        RuntimeLog log = new RuntimeLog();
        for (int i = 0; i < 30; i++) log.add("ERROR " + i, true);
        assertFalse(log.report().contains("ERROR 0"));
        assertTrue(log.report().contains("ERROR 29"));
        RuntimeLog longMessage = new RuntimeLog();
        longMessage.add("a".repeat(20000), true);
        assertEquals(8192, longMessage.report().length());
    }
}
