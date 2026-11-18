package pl.padport.app;

import org.json.JSONObject;
import org.junit.Test;
import static org.junit.Assert.*;

public class GameEngineTest {
    @Test public void onlyMvMzGamesUseAWebEngine() throws Exception{
        JSONObject mz=new JSONObject().put("id","0123456789abcdef01234567").put("title","Test").put("engine","MZ");
        JSONObject xp=new JSONObject().put("id","0123456789abcdef01234568").put("title","Test").put("engine","XP").put("exec","Game");
        assertTrue(GameEngine.isWebGame(mz));
        assertFalse(GameEngine.isWebGame(xp));
        assertFalse(GameEngine.isWebGame(null));
        // RGSS never asks the engine setting (no Context needed).
        assertEquals(RgssActivity.class,GameEngine.player(xp));
        assertEquals(PlayerActivity.class,GameEngine.player(mz));
    }
}
