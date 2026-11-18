package pl.padport.app;

import android.content.*;
import android.net.Uri;
import android.os.*;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.IOException;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.concurrent.CompletableFuture;

/** Activity-side connection to the game's runtime process. */
final class NodeRuntime implements AutoCloseable, ServiceConnection {
    private static CompletableFuture<Void> retiring = CompletableFuture.completedFuture(null);
    private static NodeRuntime active;
    private final Context context;
    private final String id;
    private final String bridgeToken = UUID.randomUUID().toString();
    private final RuntimeFileChannel fileChannel = new RuntimeFileChannel();
    private final Bundle start = new Bundle();
    private final Consumer<JSONObject> events;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final CompletableFuture<Void> terminated = new CompletableFuture<>();
    private final Messenger incoming = new Messenger(new Handler(Looper.getMainLooper(), this::receive));
    private final IBinder.DeathRecipient death = () -> main.post(this::disconnected);
    private final Runnable startupTimeout = () -> failure("Game runtime did not become ready within 30 seconds");
    private Messenger service;
    private boolean bound, terminal;
    private volatile boolean closed, ready;
    private String snapshot;
    String url, base, origin;

    private boolean receive(Message message) {
        if (message.what != NodeService.EVENT) return false;
        if (closed || terminal) return true;
        try {
            JSONObject event = new JSONObject(message.getData().getString("value"));
            if (event.getString("event").equals("ready")) {
                if (ready) return true;
                main.removeCallbacks(startupTimeout);
                url = event.getString("url"); base = event.getString("base"); origin = event.getString("origin");
                context.getSharedPreferences("runtime_ports", Context.MODE_PRIVATE).edit()
                    .putInt(id, Uri.parse(origin).getPort()).apply();
                ready = true;
                if (snapshot != null) publish(snapshot);
            }
            if (event.getString("event").equals("failed") || event.getString("event").equals("closed")) {
                failure(event.optString("value"));
                return true;
            }
            events.accept(event);
        } catch (JSONException error) { failure(error.toString()); }
        return true;
    }

    NodeRuntime(Context context, JSONObject record, Consumer<JSONObject> events) throws JSONException {
        this.context = context.getApplicationContext();
        this.events = events;
        id = record.getString("id");
        JSONObject configuration = new JSONObject().put("id", id)
            .put("title", record.getString("title")).put("language", AppLanguage.code(context))
            .put("debug", PlayerDebugSettings.enabled(context)).put("bridgeToken", bridgeToken);
        int port = this.context.getSharedPreferences("runtime_ports", Context.MODE_PRIVATE).getInt(id, 0);
        if (port >= 20000 && port <= 65535) configuration.put("port", port);
        start.putString("tree", record.getString("uri")); start.putString("config", configuration.toString());
        main.post(() -> {
            if (closed) return;
            NodeRuntime previous = active;
            active = this;
            if (previous != null) previous.close();
            retiring.thenRun(() -> main.post(this::bind));
        });
    }

    private void bind() {
        if (closed) return;
        bound = context.bindService(new Intent(context, NodeService.class), this, Context.BIND_AUTO_CREATE);
        if (bound) main.postDelayed(startupTimeout, 30000);
        else failure("Cannot bind game runtime");
    }

    @Override public void onServiceConnected(ComponentName name, IBinder binder) {
        if (service != null) return;
        service = new Messenger(binder);
        try { binder.linkToDeath(death, 0); }
        catch (RemoteException error) { disconnected(); return; }
        send(closed ? NodeService.STOP : NodeService.START, closed ? Bundle.EMPTY : start);
    }

    private void disconnected() {
        main.removeCallbacks(startupTimeout);
        if (service != null) service.getBinder().unlinkToDeath(death, 0);
        service = null; ready = false;
        if (bound) { context.unbindService(this); bound = false; }
        terminated.complete(null);
        if (!closed && !terminal) failure("Game runtime process disconnected");
    }

    @Override public void onServiceDisconnected(ComponentName name) { disconnected(); }
    @Override public void onBindingDied(ComponentName name) { disconnected(); }
    @Override public void onNullBinding(ComponentName name) { disconnected(); }

    private void failure(String value) {
        if (terminal || closed) return;
        terminal = true; ready = false;
        main.removeCallbacks(startupTimeout);
        try { events.accept(new JSONObject().put("event", "failed").put("value", value)); }
        catch (JSONException impossible) { throw new IllegalStateException(impossible); }
        finally { close(); }
    }

    private void send(int what, Bundle data) {
        Message message = Message.obtain(null, what);
        message.replyTo = incoming; message.setData(data);
        try { service.send(message); }
        catch (RemoteException error) { disconnected(); }
    }

    void publish(String value) {
        snapshot = value;
        if (!ready || closed) return;
        try { control(new JSONObject().put("op", "publish").put("value", new JSONObject(value))); }
        catch (JSONException error) { throw new IllegalArgumentException("Invalid input state", error); }
    }

    void flush() {
        if (snapshot != null && ready && !closed) publish(snapshot);
    }

    String request(String token, String command) {
        try {
            if (!bridgeToken.equals(token)) return "{\"error\":{\"code\":\"EACCES\",\"message\":\"Invalid file bridge token\"}}";
            if (!ready || closed) throw new IOException("Game runtime is closed");
            return fileChannel.request(base, bridgeToken, command);
        } catch (IOException error) {
            try { return new JSONObject().put("error", new JSONObject().put("code", "EIO").put("message", error.toString())).toString(); }
            catch (JSONException impossible) { throw new IllegalStateException(impossible); }
        }
    }

    void command(String value) {
        if (!ready || closed) return;
        try { control(new JSONObject().put("op", "command").put("value", value)); }
        catch (JSONException impossible) { throw new IllegalStateException(impossible); }
    }

    private void control(JSONObject command) {
        Bundle data = new Bundle(); data.putString("value", command.toString());
        send(NodeService.CONTROL, data);
    }

    @Override public void close() {
        if (closed) return;
        closed = true;
        fileChannel.close();
        ready = false;
        main.removeCallbacks(startupTimeout);
        if (active == this) active = null;
        if (bound) {
            retiring = terminated;
            if (service != null) send(NodeService.STOP, Bundle.EMPTY);
        } else terminated.complete(null);
    }
}
