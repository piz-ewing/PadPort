package pl.padport.app;

import android.content.Context;
import android.net.Uri;
import android.webkit.*;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.function.Consumer;

/** Serves the bundled controller test page. */
final class ControllerTestClient extends WebViewClient {
    static final String ORIGIN = "https://tester.padport.local";
    private final Context context;
    private final Consumer<String> log;
    Runnable loaded = () -> {};
    Consumer<Boolean> gone = crashed -> {};

    ControllerTestClient(Context context, Consumer<String> log) { this.context = context; this.log = log; }

    private byte[] asset(String name) throws IOException {
        try (InputStream input = context.getAssets().open(name)) { return GameSource.readBounded(input, 1024 * 1024); }
    }

    private WebResourceResponse response(String mime, int status, String reason, byte[] data) {
        return new WebResourceResponse(mime, "utf-8", status, reason, Map.of("Cache-Control", "no-store"), new ByteArrayInputStream(data));
    }

    @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (!"https".equals(uri.getScheme()) || !"tester.padport.local".equals(uri.getHost()))
            return response("text/plain", 403, "Forbidden", new byte[0]);
        try {
            if ("/index.html".equals(uri.getPath())) {
                String page = new String(asset("diagnostics.html"), StandardCharsets.UTF_8);
                page = page.replace("</head>", "<script src=\"/__padport__/tester.js\"></script></head>");
                return response("text/html", 200, "OK", page.getBytes(StandardCharsets.UTF_8));
            }
            if ("/__padport__/tester.js".equals(uri.getPath())) {
                JSONObject config = new JSONObject().put("engine", "diagnostics")
                    .put("language", AppLanguage.code(context)).put("debug", PlayerDebugSettings.enabled(context));
                byte[] bytes = ("window.__PADPORT_CONFIG__=" + config + ";\n" +
                    new String(asset("runtime/controller-tester.js"), StandardCharsets.UTF_8)).getBytes(StandardCharsets.UTF_8);
                return response("application/javascript", 200, "OK", bytes);
            }
            return response("text/plain", 404, "Not Found", new byte[0]);
        } catch (IOException | org.json.JSONException error) {
            log.accept(error.toString());
            return response("text/plain", 500, "Read Failed", new byte[0]);
        }
    }

    @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        return !request.getUrl().toString().startsWith(ORIGIN + "/");
    }
    @Override public void onPageFinished(WebView view, String url) { loaded.run(); }
    @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) { gone.accept(detail.didCrash()); return true; }
}
