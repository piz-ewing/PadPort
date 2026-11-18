package pl.padport.app;

import org.json.JSONObject;

final class GameEngine {
    private GameEngine() {}

    static boolean isWebGame(JSONObject game) { return game != null && !game.has("exec"); }

    static Class<?> player(JSONObject game) {
        if (!isWebGame(game)) return RgssActivity.class;
        return PlayerActivity.class;
    }
}
