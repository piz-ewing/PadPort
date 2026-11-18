package pl.padport.app;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.IOException;

public class PlayerActivity extends LocalizedActivity {
    private ControllerHub controllers;
    private WebView web;
    private KeyboardDispatcher keyboard;
    private boolean webReady;
    private JSONObject game;
    private NodeRuntime server;
    private boolean backendFailed;
    private FrameLayout root;
    private FrameLayout menu;
    private AlertDialog diagnostics;
    private Button menuButton;
    private VirtualControllerView virtualControls;
    private Boolean playbackPaused;
    private int playbackRevision;
    private boolean foreground;
    private final RuntimeLog logs=new RuntimeLog();
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        root=new FrameLayout(this);root.setBackgroundColor(Color.BLACK);setContentView(root);
        DisplayRate.apply(this);
        controllers=new ControllerHub(this);controllers.onChange=this::updateKeyboard;controllers.start();
        TextView loading=Ui.text(this,R.string.opening_game,20,Ui.TEXT);loading.setGravity(Gravity.CENTER);
        root.addView(loading,new FrameLayout.LayoutParams(-1,-1));
        String id=getIntent().getStringExtra("game");
        if(id==null) setup(null);
        else try {
            game=Library.get(this,id);
            if(game==null) throw new IOException(getString(R.string.game_not_in_library));
            server=new NodeRuntime(this,game,this::runtimeEvent);
            controllers.onChange=()->{server.publish(controllers.snapshot());updateKeyboard();};
            server.publish(controllers.snapshot());
        } catch(Exception error) {runtimeFailure(error.toString());}
    }
    private void runtimeEvent(JSONObject event) {
        if(isDestroyed()||isFinishing())return;
        switch(event.optString("event")) {
            case "ready" -> setup(game);
            case "log" -> log(event.optString("value"));
            case "debug-state" -> debugState=event.optString("value");
            case "failed", "closed" -> runtimeFailure(event.optString("value"));
        }
    }
    private void runtimeFailure(String message) {
        log(message,true);
        if(backendFailed||isDestroyed()||isFinishing())return;
        backendFailed=true;webReady=false;
        if(keyboard!=null)keyboard.clear();
        if(web!=null){root.removeView(web);web.removeJavascriptInterface("PadPortFiles");web.resumeTimers();web.stopLoading();web.destroy();web=null;}
        if(server!=null)server.close();
        new AlertDialog.Builder(this).setTitle(R.string.launch_error)
            .setMessage(getString(R.string.launch_error_details,message))
            .setPositiveButton(R.string.back,(d,n)->finish()).setOnCancelListener(d->finish()).show();
    }
    @SuppressWarnings("SetJavaScriptEnabled") private void setup(JSONObject selected) {
        if(keyboard!=null)keyboard.clear();webReady=false;
        game=selected;menu=null;playbackPaused=null;playbackRevision++;root.removeAllViews();web=new WebView(this);
        keyboard=new KeyboardDispatcher(event->{if(web!=null)web.dispatchKeyEvent(event);});
        web.setBackgroundColor(Color.BLACK);web.setFocusableInTouchMode(true);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);
        settings.setCacheMode(game==null?WebSettings.LOAD_NO_CACHE:WebSettings.LOAD_DEFAULT);settings.setSupportMultipleWindows(false);
        if(game!=null)settings.setUserAgentString("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36");
        settings.setBuiltInZoomControls(false);settings.setSupportZoom(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUseWideViewPort(true);settings.setLoadWithOverviewMode(true);
        web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT,false);
        WebView.setWebContentsDebuggingEnabled(PlayerDebugSettings.remoteEnabled(this));
        String url;
        if(game==null) {
            web.addJavascriptInterface(new Host(),"PadPortHost");
            ControllerTestClient client=new ControllerTestClient(this,this::log);
            client.loaded=this::pageLoaded;
            client.gone=this::renderGone;
            web.setWebViewClient(client);
            url=ControllerTestClient.ORIGIN+"/index.html";
        } else {
            web.addJavascriptInterface(new FilesHost(),"PadPortFiles");
            web.setWebViewClient(new WebViewClient(){
                @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
                    String target=request.getUrl().toString();
                    if(target.startsWith(server.base)||target.startsWith("about:"))return false;
                    log("Blocked navigation: "+target);return true;
                }
                @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){
                    webReady=false;playbackPaused=null;playbackRevision++;updateKeyboard();
                }
                @Override public void onPageFinished(WebView view,String url){pageLoaded();}
                @Override public boolean onRenderProcessGone(WebView view,RenderProcessGoneDetail detail){
                    renderGone(detail.didCrash());return true;
                }
            });
            url=server.url;
        }
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onConsoleMessage(ConsoleMessage message){
                log(message.messageLevel()+" "+message.message()+" @ "+message.sourceId()+":"+message.lineNumber(),
                    message.messageLevel()==ConsoleMessage.MessageLevel.ERROR);return true;
            }
            @Override public boolean onJsAlert(WebView view,String url,String message,JsResult result){
                new AlertDialog.Builder(PlayerActivity.this).setMessage(message).setPositiveButton(R.string.ok,(d,n)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;
            }
        });
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        virtualControls=new VirtualControllerView(this,controllers);
        root.addView(virtualControls,new FrameLayout.LayoutParams(-1,-1));
        menuButton=Ui.button(this,"☰",this::openMenu);menuButton.setTextSize(24);menuButton.setAlpha(.7f);
        menuButton.setPadding(0,0,0,0);menuButton.setMinWidth(0);menuButton.setMinimumWidth(0);
        menuButton.setBackground(Ui.background(Ui.BG,Ui.dp(this,24)));
        menuButton.setContentDescription(getString(R.string.app_menu));menuButton.setFocusable(false);
        FrameLayout.LayoutParams bp=new FrameLayout.LayoutParams(Ui.dp(this,48),Ui.dp(this,48),Gravity.TOP|Gravity.END);
        bp.setMargins(0,Ui.dp(this,8),Ui.dp(this,10),0);root.addView(menuButton,bp);
        root.setOnApplyWindowInsetsListener((v,insets)->{
            int right=0,left=0;
            if(android.os.Build.VERSION.SDK_INT>=28){
                android.view.DisplayCutout cut=insets.getDisplayCutout();
                if(cut!=null){right=cut.getSafeInsetRight();left=cut.getSafeInsetLeft();}
            }
            v.setPadding(left,0,right,0);return insets;
        });
        immersive();web.requestFocus();web.loadUrl(url);
        refreshVirtualController();
    }
    private void pageLoaded(){webReady=true;playbackPaused=null;playbackRevision++;syncPlayback();}
    private void immersive(){
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            |View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event){return controllers!=null && controllers.key(event) || super.dispatchKeyEvent(event);}
    @Override public boolean dispatchGenericMotionEvent(MotionEvent event){return controllers!=null && controllers.motion(event) || super.dispatchGenericMotionEvent(event);}
    @Override protected void onResume(){super.onResume();foreground=true;if(controllers!=null)controllers.refresh();syncPlayback();}
    @Override protected void onPause(){foreground=false;pauseGame();super.onPause();}
    @Override public void onWindowFocusChanged(boolean focus){
        super.onWindowFocusChanged(focus);
        if(!focus){
            if(virtualControls!=null)virtualControls.suspend();
            if(controllers!=null)controllers.clear(!canPlay());
            if(keyboard!=null)keyboard.clear();
            js("PadPort.clearInput()");
        }else{syncPlayback();refreshVirtualController();updateKeyboard();}
    }
    @Override public void onBackPressed(){if(menu!=null)closeMenu();else openMenu();}
    private boolean canPlay(){return foreground&&menu==null&&diagnostics==null&&!isFinishing();}
    private void syncPlayback(){if(web==null)return;if(canPlay())resumeGame();else pauseGame();}
    private void js(String code){if(web!=null)web.evaluateJavascript("if(window.PadPort){"+code+";}",null);}
    private void updateKeyboard(){
        if(game==null&&web!=null&&webReady)
            web.evaluateJavascript("if(window.PadPortTester)PadPortTester.update("+controllers.snapshot()+")",null);
        if(keyboard==null)return;
        if(web!=null&&webReady&&canPlay()&&hasWindowFocus())keyboard.update(controllers.keyboardKeys());
        else keyboard.clear();
    }
    private void refreshVirtualController(){
        if(virtualControls!=null)
            virtualControls.configure(VirtualControllerSettings.enabled(this),canPlay()&&hasWindowFocus());
    }
    private void pauseGame(){
        if(Boolean.TRUE.equals(playbackPaused))return;
        playbackPaused=true;
        int revision=++playbackRevision;
        if(virtualControls!=null)virtualControls.suspend();
        if(keyboard!=null)keyboard.clear();
        if(controllers!=null)controllers.clear(true);
        if(web!=null){
            String bridge=game==null?"PadPortHost":"PadPortFiles";
            web.evaluateJavascript("Promise.resolve(window.PadPort?PadPort.pause():null).catch(error=>console.error(error))"
                +".then(()=>window."+bridge+".playbackPaused("+revision+"));",null);
        }
    }
    private void finishPause(int revision){
        if(web!=null&&revision==playbackRevision&&Boolean.TRUE.equals(playbackPaused)&&!canPlay()){
            web.onPause();web.pauseTimers();
        }
    }
    private void resumeGame(){
        if(!Boolean.FALSE.equals(playbackPaused)){
            playbackPaused=false;
            playbackRevision++;
            if(web!=null){web.onResume();web.resumeTimers();}
            if(controllers!=null)controllers.clear(false);
            js("PadPort.resume()");
        }
        if(web!=null)web.requestFocus();
        immersive();refreshVirtualController();updateKeyboard();
    }
    private void openMenu(){
        if(menu!=null || diagnostics!=null || web==null)return;
        menu=new FrameLayout(this);menu.setBackgroundColor(0x66000000);
        menu.setOnClickListener(v->closeMenu());
        LinearLayout content=Ui.column(this);content.setPadding(Ui.dp(this,16),Ui.dp(this,12),Ui.dp(this,16),Ui.dp(this,12));
        content.setBackground(Ui.background(Ui.BG,Ui.dp(this,16)));content.setOnClickListener(v->{});
        content.addView(Ui.text(this,R.string.app_menu,20,Ui.TEXT));
        content.addView(Ui.button(this,game==null?R.string.back_to_test:R.string.back_to_game,this::closeMenu));
        content.addView(Ui.button(this,R.string.controller_mapping,()->startActivity(new Intent(this,ControllerActivity.class))));
        content.addView(Ui.button(this,R.string.diagnostics_copy_log,this::showLog));
        content.addView(Ui.button(this,game==null?R.string.close_tester:R.string.back_to_library,this::finish));
        content.addView(VirtualControllerSettings.checkbox(this,enabled->refreshVirtualController()));
        content.addView(VirtualControllerSettings.layoutControl(this,this::refreshVirtualController));
        content.addView(VirtualControllerSettings.transparencyControl(this));
        if(game!=null)content.addView(DisplayRate.checkbox(this));
        content.addView(PlayerDebugSettings.controls(this,enabled->{
            WebView.setWebContentsDebuggingEnabled(PlayerDebugSettings.remoteEnabled(this));
            debugState="";
            if(server!=null)server.command("debug:"+enabled);
            else js("PadPortDebug.setEnabled("+enabled+")");
        }));
        ScrollView scroll=new ScrollView(this);scroll.addView(content);
        FrameLayout.LayoutParams panel=new FrameLayout.LayoutParams(Math.min(Ui.dp(this,320),getResources().getDisplayMetrics().widthPixels-Ui.dp(this,24)),-1,Gravity.TOP|Gravity.END);
        panel.setMargins(Ui.dp(this,12),Ui.dp(this,12),Ui.dp(this,12),Ui.dp(this,12));
        menu.addView(scroll,panel);root.addView(menu,new FrameLayout.LayoutParams(-1,-1));
        menuButton.setVisibility(View.INVISIBLE);
        pauseGame();
    }
    private void closeMenu(){
        if(menu!=null){root.removeView(menu);menu=null;}
        if(menuButton!=null)menuButton.setVisibility(View.VISIBLE);
        syncPlayback();
    }
    private void log(String text){log(text,text.startsWith("ERROR ")||text.startsWith("PROMISE "));}
    private void log(String text,boolean error){
        if(logs.add(text,error))android.util.Log.println(error?android.util.Log.ERROR:android.util.Log.INFO,"PadPort-Player",text);
    }
    private volatile String debugState="";
    private void showLog(){
        if(diagnostics!=null)return;
        String content=logs.report();
        if(!debugState.isEmpty())content+="\n\n"+debugState;
        final String report=content;
        TextView text=Ui.text(this,content,12,Ui.TEXT);text.setTextIsSelectable(true);ScrollView scroll=new ScrollView(this);scroll.addView(text);
        diagnostics=new AlertDialog.Builder(this).setTitle(R.string.game_diagnostics).setView(scroll).setPositiveButton(R.string.close,null)
            .setNeutralButton(R.string.copy,(d,n)->((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("PadPort log",report))).create();
        diagnostics.setOnDismissListener(d->{diagnostics=null;syncPlayback();});
        pauseGame();diagnostics.show();
    }
    public final class Host {
        @JavascriptInterface public void playbackPaused(int revision){runOnUiThread(()->finishPause(revision));}
        @JavascriptInterface public void debugState(String state){
            if(PlayerDebugSettings.enabled(PlayerActivity.this)&&state.length()<=32768)debugState=state;
        }
        @JavascriptInterface public String snapshot(){return controllers.snapshot();}
        @JavascriptInterface public void log(String message){PlayerActivity.this.log(message);}
    }
    public final class FilesHost {
        @JavascriptInterface public void playbackPaused(int revision){runOnUiThread(()->finishPause(revision));}
        @JavascriptInterface public String request(String token,String command){return server.request(token,command);}
    }
    /** The WebView renderer died (crash or low-memory kill). Keep the app, offer a restart. */
    private void renderGone(boolean crashed){

        log("WebView renderer "+(crashed?"crashed":"was killed by the system to free memory"),true);
        webReady=false;if(keyboard!=null)keyboard.clear();
        if(web!=null){WebView dead=web;web=null;root.removeView(dead);dead.removeJavascriptInterface("PadPortHost");dead.removeJavascriptInterface("PadPortFiles");dead.resumeTimers();dead.destroy();}
        if(diagnostics!=null)diagnostics.dismiss();
        if(menu!=null){root.removeView(menu);menu=null;}
        if(isFinishing()||isDestroyed())return;
        new AlertDialog.Builder(this).setTitle(R.string.renderer_gone_title)
            .setMessage(crashed?R.string.renderer_crashed:R.string.renderer_killed)
            .setPositiveButton(R.string.renderer_restart,(d,n)->setup(game))
            .setNegativeButton(R.string.back_to_library,(d,n)->finish()).setCancelable(false).show();
    }
    @Override protected void onDestroy(){
        webReady=false;if(keyboard!=null)keyboard.clear();
        if(virtualControls!=null)virtualControls.suspend();
        if(controllers!=null)controllers.close();
        if(web!=null){root.removeView(web);web.removeJavascriptInterface("PadPortHost");web.removeJavascriptInterface("PadPortFiles");web.resumeTimers();web.destroy();web=null;}
        if(server!=null)server.close();
        super.onDestroy();
    }
}
