package pl.padport.app;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.io.IOException;

final class VirtualControllerEditor {
    static void show(Activity activity,Runnable changed){
        Dialog dialog=new Dialog(activity);dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        FrameLayout root=new FrameLayout(activity);root.setBackgroundColor(0x99000000);
        VirtualControllerView controls=new VirtualControllerView(activity,new ControllerHub(activity));
        controls.configure(true,false);root.addView(controls,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout panel=Ui.column(activity);
        int padding=Ui.dp(activity,12);panel.setPadding(padding,padding,padding,padding);
        panel.setBackground(Ui.background(Ui.BG,Ui.dp(activity,16)));
        panel.addView(Ui.text(activity,R.string.virtual_stick_layout_hint,14,Ui.TEXT));
        TextView size=Ui.text(activity,activity.getString(R.string.virtual_stick_size,controls.editedLayout().size()),14,Ui.MUTED);
        panel.addView(size);
        controls.editLayout(value->size.setText(activity.getString(R.string.virtual_stick_size,value.size())));
        LinearLayout actions=new LinearLayout(activity);
        actions.addView(Ui.button(activity,R.string.virtual_stick_reset,()->controls.previewLayout(VirtualControllerSettings.StickLayout.DEFAULT)),new LinearLayout.LayoutParams(0,Ui.dp(activity,48),1));
        actions.addView(Ui.button(activity,R.string.cancel,dialog::dismiss),new LinearLayout.LayoutParams(0,Ui.dp(activity,48),1));
        actions.addView(Ui.button(activity,R.string.virtual_stick_save,()->{
            try{VirtualControllerSettings.writeStickLayout(activity,controls.editedLayout());changed.run();dialog.dismiss();}
            catch(IOException e){Toast.makeText(activity,R.string.controller_setting_error,Toast.LENGTH_LONG).show();}
        }),new LinearLayout.LayoutParams(0,Ui.dp(activity,48),1));
        panel.addView(actions);
        FrameLayout.LayoutParams position=new FrameLayout.LayoutParams(Ui.dp(activity,320),-2,Gravity.TOP|Gravity.END);
        position.setMargins(padding,padding,padding,padding);root.addView(panel,position);
        View viewport=activity.findViewById(android.R.id.content);
        root.addOnLayoutChangeListener((view,left,top,right,bottom,oldLeft,oldTop,oldRight,oldBottom)->{
            int[] origin=new int[2],target=new int[2];root.getLocationOnScreen(origin);viewport.getLocationOnScreen(target);
            int insetLeft=Math.max(0,target[0]-origin[0]),insetTop=Math.max(0,target[1]-origin[1]);
            int insetRight=Math.max(0,origin[0]+root.getWidth()-target[0]-viewport.getWidth());
            int insetBottom=Math.max(0,origin[1]+root.getHeight()-target[1]-viewport.getHeight());
            if(root.getPaddingLeft()!=insetLeft||root.getPaddingTop()!=insetTop||root.getPaddingRight()!=insetRight||root.getPaddingBottom()!=insetBottom)
                root.setPadding(insetLeft,insetTop,insetRight,insetBottom);
        });
        dialog.setContentView(root);
        Window window=dialog.getWindow();window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if(android.os.Build.VERSION.SDK_INT>=28){
            WindowManager.LayoutParams attributes=window.getAttributes();
            attributes.layoutInDisplayCutoutMode=activity.getWindow().getAttributes().layoutInDisplayCutoutMode;
            window.setAttributes(attributes);
        }
        window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            |View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        dialog.show();window.setLayout(-1,-1);
    }
}
