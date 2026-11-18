package pl.padport.app;

import android.app.Service;
import android.content.Intent;
import android.net.Uri;
import android.os.*;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

/** A dedicated process owns one Node instance and its document descriptors. */
public final class NodeService extends Service {
    static final int START = 1, CONTROL = 2, STOP = 3, EVENT = 4;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Messenger incoming = new Messenger(new Handler(Looper.getMainLooper(), this::receive));
    private Messenger client;
    private GameDocuments documents;
    private boolean started, stopping;
    private volatile boolean exited;
    private volatile boolean ready;
    private String readyEvent;

    private native int run(String[] arguments);
    private native boolean dispatch(String value, boolean snapshot);

    @Override public IBinder onBind(Intent intent) { return incoming.getBinder(); }

    private boolean receive(Message message) {
        if (message.what == START) {
            if (started) {
                if (message.replyTo.getBinder().equals(client.getBinder())) {
                    if (readyEvent != null) send(readyEvent);
                } else {
                    Message rejected = Message.obtain(null, EVENT);
                    Bundle data = new Bundle();
                    data.putString("value", "{\"event\":\"failed\",\"value\":\"Another game runtime is still active\"}");
                    rejected.setData(data);
                    try { message.replyTo.send(rejected); }
                    catch (RemoteException error) { android.util.Log.w("PadPort-Runtime", "Runtime requester disconnected", error); }
                }
                return true;
            }
            started = true;
            client = message.replyTo;
            Bundle data = message.getData();
            documents = new GameDocuments(this, Uri.parse(data.getString("tree")));
            new Thread(() -> start(data), "game-node").start();
        } else if (message.what == CONTROL) {
            if (client == null || !message.replyTo.getBinder().equals(client.getBinder()) || stopping || !ready) return true;
            String command = message.getData().getString("value");
            try {
                if (!dispatch(command, new JSONObject(command).optString("op").equals("publish")))
                    emit("failed", "Runtime control channel is closed");
            } catch (org.json.JSONException error) { emit("failed", error.toString()); }
        } else if (message.what == STOP) {
            if (client == null || message.replyTo.getBinder().equals(client.getBinder())) stopRuntime();
        } else return false;
        return true;
    }

    private void copyAsset(String asset, File target) throws IOException {
        try (InputStream input = getAssets().open(asset); OutputStream output = new FileOutputStream(target)) {
            byte[] buffer = new byte[16384];
            for (int count; (count = input.read(buffer)) != -1;) output.write(buffer, 0, count);
        }
    }

    private void start(Bundle data) {
        try {
            File directory = new File(getFilesDir(), "runtime");
            Files.createDirectories(directory.toPath());
            File script = new File(directory, "node.cjs");
            copyAsset("runtime/node.cjs", script);
            copyAsset("runtime-client.js", new File(directory, "runtime-client.js"));
            File configuration = new File(directory, "session.json");
            Files.write(configuration.toPath(), data.getString("config").getBytes(StandardCharsets.UTF_8));
            System.loadLibrary("node");
            System.loadLibrary("padport-runtime");
            int status = run(new String[]{"node", script.getAbsolutePath(), configuration.getAbsolutePath()});
            ready = false;
            android.util.Log.i("PadPort-Runtime", "Node exited with status " + status);
            emit("closed", Integer.toString(status));
        } catch (Exception | LinkageError error) {
            emit("failed", error.toString());
        } finally {
            exited = true;
            main.postDelayed(() -> android.os.Process.killProcess(android.os.Process.myPid()), 100);
        }
    }

    String request(String value) { return documents.request(value); }

    void message(String value) {
        main.post(() -> runtimeEvent(value));
    }

    private void runtimeEvent(String value) {
        try {
            JSONObject event = new JSONObject(value);
            if (event.getString("event").equals("ready")) {
                if (exited) return;
                readyEvent = value;
                ready = true;
                if (stopping) { dispatch("{\"op\":\"stop\"}", false); return; }
            }
            send(value);
        } catch (org.json.JSONException error) { emit("failed", error.toString()); }
    }

    private void emit(String event, String value) {
        if (event.equals("failed") || event.equals("closed"))
            android.util.Log.e("PadPort-Runtime", event + ": " + value);
        try { send(new JSONObject().put("event", event).put("value", value).toString()); }
        catch (org.json.JSONException impossible) { throw new IllegalStateException(impossible); }
    }

    private void send(String value) {
        if (client == null) return;
        Message message = Message.obtain(null, EVENT);
        Bundle data = new Bundle(); data.putString("value", value); message.setData(data);
        try { client.send(message); }
        catch (RemoteException error) { main.post(this::stopRuntime); }
    }

    private void stopRuntime() {
        if (stopping) return;
        stopping = true;
        main.postDelayed(() -> android.os.Process.killProcess(android.os.Process.myPid()), 5000);
        if (ready) dispatch("{\"op\":\"stop\"}", false);
        stopSelf();
    }

    @Override public boolean onUnbind(Intent intent) { stopRuntime(); return false; }

    @Override public void onDestroy() {
        stopRuntime();
        super.onDestroy();
    }
}
