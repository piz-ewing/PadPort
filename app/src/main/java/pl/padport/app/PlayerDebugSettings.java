package pl.padport.app;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.Toast;
import java.util.function.Consumer;

final class PlayerDebugSettings {
    private PlayerDebugSettings(){}

    static boolean enabled(Context context){
        return context.getSharedPreferences("player-debug",Context.MODE_PRIVATE).getBoolean("enabled",false);
    }

    static boolean remoteEnabled(Context context){
        return enabled(context)||(context.getApplicationInfo().flags&ApplicationInfo.FLAG_DEBUGGABLE)!=0;
    }

    static LinearLayout controls(Activity activity,Consumer<Boolean> changed){
        LinearLayout panel=Ui.column(activity);
        Switch control=new Switch(activity);control.setText(R.string.player_debug);
        control.setTextColor(Ui.TEXT);control.setTextSize(16);control.setMinHeight(Ui.dp(activity,48));
        control.setChecked(enabled(activity));panel.addView(control);
        panel.addView(Ui.text(activity,R.string.player_debug_details,13,Ui.MUTED));
        control.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener(){
            @Override public void onCheckedChanged(CompoundButton button,boolean checked){
                if(!activity.getSharedPreferences("player-debug",Context.MODE_PRIVATE).edit().putBoolean("enabled",checked).commit()){
                    button.setOnCheckedChangeListener(null);button.setChecked(enabled(activity));button.setOnCheckedChangeListener(this);
                    Toast.makeText(activity,R.string.controller_setting_error,Toast.LENGTH_LONG).show();return;
                }
                changed.accept(checked);
            }
        });
        return panel;
    }
}
