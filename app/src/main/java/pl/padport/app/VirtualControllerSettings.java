package pl.padport.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.view.View;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.function.Consumer;

/** Private settings are read directly by both the main process and the RGSS process. */
final class VirtualControllerSettings {
    private static final int DEFAULT_TRANSPARENCY=50;
    record StickLayout(int size,int horizontal,int vertical){
        static final StickLayout DEFAULT=new StickLayout(160,10,95);
        float scale(){return size/100f;}
        float x(){return horizontal/100f;}
        float y(){return vertical/100f;}
    }
    private static File flag(Context context){return new File(context.getFilesDir(),"on-screen-controller.enabled");}
    private static File transparencyFile(Context context){return new File(context.getFilesDir(),"on-screen-controller.transparency");}
    private static File layoutFile(Context context){return new File(context.getFilesDir(),"on-screen-controller.layout");}
    private static File stickFile(Context context,boolean dragging){return new File(context.getFilesDir(),dragging?"on-screen-controller.dragging-origin":"on-screen-controller.dynamic-center");}
    private static File stickLayoutFile(Context context){return new File(context.getFilesDir(),"on-screen-controller.stick-layout");}
    static StickLayout stickLayout(Context context){
        try{
            String[] values=new String(Files.readAllBytes(stickLayoutFile(context).toPath()),StandardCharsets.UTF_8).trim().split(",");
            if(values.length!=3)throw new NumberFormatException("Expected three joystick layout values");
            return new StickLayout(Math.max(50,Math.min(250,Integer.parseInt(values[0]))),
                clampTransparency(Integer.parseInt(values[1])),clampTransparency(Integer.parseInt(values[2])));
        }catch(java.nio.file.NoSuchFileException e){return StickLayout.DEFAULT;}
        catch(IOException|NumberFormatException e){android.util.Log.w("TouchController","Unable to read joystick layout",e);return StickLayout.DEFAULT;}
    }
    private static void writeStickLayout(Context context,StickLayout layout) throws IOException{
        writeSetting(stickLayoutFile(context),layout.size()+","+layout.horizontal()+","+layout.vertical());
    }
    static boolean dynamicCenter(Context context){return readStickOption(stickFile(context,false));}
    static boolean draggingOrigin(Context context){return readStickOption(stickFile(context,true));}
    private static boolean readStickOption(File file){
        try{return !"false".equals(new String(Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8).trim());}
        catch(java.nio.file.NoSuchFileException e){return true;}
        catch(IOException e){android.util.Log.w("TouchController","Unable to read joystick setting",e);return true;}
    }
    static boolean mtoolLayout(Context context){return readLayout(layoutFile(context));}
    static boolean readLayout(File file){
        try{return "mtool".equals(new String(Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8).trim());}
        catch(IOException e){return false;}
    }
    static void writeLayout(File file,boolean mtool) throws IOException {writeSetting(file,mtool?"mtool":"default");}
    static boolean enabled(Context context){return flag(context).isFile();}
    static int transparency(Context context){return readTransparency(transparencyFile(context));}
    static float alpha(Context context){return alphaFor(transparency(context));}
    static float alphaFor(int transparency){return 1f-clampTransparency(transparency)/100f;}
    private static int clampTransparency(int value){return Math.max(0,Math.min(100,value));}
    static int readTransparency(File file){
        try{return clampTransparency(Integer.parseInt(new String(Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8).trim()));}
        catch(IOException|NumberFormatException e){return DEFAULT_TRANSPARENCY;}
    }
    static void writeTransparency(File file,int value) throws IOException {
        writeSetting(file,Integer.toString(clampTransparency(value)));
    }
    private static void writeSetting(File file,String value) throws IOException {
        File tmp=new File(file+".tmp");
        try{
            Files.write(tmp.toPath(),value.getBytes(StandardCharsets.UTF_8));
            try{Files.move(tmp.toPath(),file.toPath(),StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}
            catch(AtomicMoveNotSupportedException e){Files.move(tmp.toPath(),file.toPath(),StandardCopyOption.REPLACE_EXISTING);}
        }finally{Files.deleteIfExists(tmp.toPath());}
    }
    private static void save(Context context,boolean enabled) throws IOException {
        File flag=flag(context);
        if(enabled){if(!flag.exists()&&!flag.createNewFile())throw new IOException("Unable to enable touch controller");}
        else if(flag.exists()&&!flag.delete())throw new IOException("Unable to disable touch controller");
    }
    static CheckBox checkbox(Activity activity,Consumer<Boolean> changed){
        CheckBox box=new CheckBox(activity);box.setText(R.string.show_virtual_controller);
        box.setChecked(enabled(activity));
        box.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener(){
            @Override public void onCheckedChanged(CompoundButton button,boolean checked){
                try{save(activity,checked);changed.accept(checked);}
                catch(IOException e){
                    button.setOnCheckedChangeListener(null);button.setChecked(enabled(activity));button.setOnCheckedChangeListener(this);
                    Toast.makeText(activity,R.string.controller_setting_error,Toast.LENGTH_LONG).show();
                }
            }
        });
        return box;
    }
    static LinearLayout transparencyControl(Activity activity){
        LinearLayout panel=Ui.column(activity);
        TextView label=Ui.text(activity,activity.getString(R.string.virtual_controller_transparency,transparency(activity)),15,Ui.TEXT);
        panel.addView(label);
        SeekBar slider=new SeekBar(activity);slider.setMax(100);slider.setProgress(transparency(activity));
        slider.setContentDescription(activity.getString(R.string.virtual_controller_transparency_label));panel.addView(slider);
        panel.addView(Ui.text(activity,R.string.virtual_controller_transparency_hint,12,Ui.MUTED));
        slider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){
            private boolean dragging;
            private void persist(SeekBar bar){
                try{writeTransparency(transparencyFile(activity),bar.getProgress());}
                catch(IOException e){bar.setProgress(transparency(activity));Toast.makeText(activity,R.string.controller_setting_error,Toast.LENGTH_LONG).show();}
            }
            public void onProgressChanged(SeekBar bar,int progress,boolean fromUser){
                label.setText(activity.getString(R.string.virtual_controller_transparency,progress));
                if(fromUser&&!dragging)persist(bar);
            }
            public void onStartTrackingTouch(SeekBar bar){dragging=true;}
            public void onStopTrackingTouch(SeekBar bar){dragging=false;persist(bar);}
        });
        return panel;
    }
    static LinearLayout layoutControl(Activity activity,Runnable changed){
        LinearLayout panel=Ui.column(activity);
        panel.addView(Ui.text(activity,R.string.virtual_controller_layout,16,Ui.TEXT));
        Spinner selector=new Spinner(activity,Spinner.MODE_DROPDOWN);
        ArrayAdapter<String> adapter=new ArrayAdapter<>(activity,android.R.layout.simple_spinner_item,
            new String[]{activity.getString(R.string.virtual_layout_default),activity.getString(R.string.virtual_layout_mtool)});
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        selector.setAdapter(adapter);selector.setSelection(mtoolLayout(activity)?1:0);
        selector.setContentDescription(activity.getString(R.string.virtual_controller_layout));
        selector.setMinimumHeight(Ui.dp(activity,48));
        panel.addView(selector,new LinearLayout.LayoutParams(-1,-2));
        selector.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener(){
            public void onItemSelected(AdapterView<?> parent,View view,int position,long id){
                boolean mtool=position==1;
                if(mtool==mtoolLayout(activity))return;
                try{writeLayout(layoutFile(activity),mtool);changed.run();}
                catch(IOException e){
                    selector.setSelection(mtoolLayout(activity)?1:0);
                    Toast.makeText(activity,R.string.controller_setting_error,Toast.LENGTH_LONG).show();
                }
            }
            public void onNothingSelected(AdapterView<?> parent){}
        });
        panel.addView(stickOption(activity,false,changed));
        panel.addView(Ui.text(activity,R.string.virtual_dynamic_center_hint,12,Ui.MUTED));
        panel.addView(stickOption(activity,true,changed));
        panel.addView(Ui.text(activity,R.string.virtual_dragging_origin_hint,12,Ui.MUTED));
        panel.addView(Ui.button(activity,R.string.virtual_stick_layout,()->showStickLayout(activity,changed)));
        return panel;
    }
    private static void showStickLayout(Activity activity,Runnable changed){
        LinearLayout content=Ui.column(activity);
        StickLayout initial=stickLayout(activity);
        SeekBar[] sliders=new SeekBar[3];
        int[] labels={R.string.virtual_stick_size,R.string.virtual_stick_horizontal,R.string.virtual_stick_vertical};
        int[] values={initial.size(),initial.horizontal(),initial.vertical()};
        Runnable persist=()->{
            StickLayout layout=new StickLayout(sliders[0].getProgress()+50,sliders[1].getProgress(),sliders[2].getProgress());
            try{writeStickLayout(activity,layout);changed.run();}
            catch(IOException e){Toast.makeText(activity,R.string.controller_setting_error,Toast.LENGTH_LONG).show();}
        };
        for(int i=0;i<sliders.length;i++){
            int minimum=i==0?50:0,resource=labels[i];
            TextView label=Ui.text(activity,activity.getString(resource,values[i]),15,Ui.TEXT);content.addView(label);
            SeekBar slider=new SeekBar(activity);sliders[i]=slider;slider.setMax(i==0?200:100);slider.setProgress(values[i]-minimum);
            slider.setContentDescription(label.getText());content.addView(slider,new LinearLayout.LayoutParams(-1,Ui.dp(activity,48)));
            slider.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){
                private boolean dragging;
                public void onProgressChanged(SeekBar bar,int progress,boolean fromUser){
                    label.setText(activity.getString(resource,progress+minimum));bar.setContentDescription(label.getText());
                    if(fromUser&&!dragging)persist.run();
                }
                public void onStartTrackingTouch(SeekBar bar){dragging=true;}
                public void onStopTrackingTouch(SeekBar bar){dragging=false;persist.run();}
            });
        }
        content.addView(Ui.text(activity,R.string.virtual_stick_layout_hint,12,Ui.MUTED));
        ScrollView scroll=new ScrollView(activity);scroll.addView(Ui.dialogContent(activity,content));
        AlertDialog dialog=new AlertDialog.Builder(activity).setTitle(R.string.virtual_stick_layout)
            .setView(scroll).setPositiveButton(R.string.close,null)
            .setNeutralButton(R.string.virtual_stick_reset,null).create();
        dialog.setOnShowListener(d->dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v->{
            StickLayout defaults=StickLayout.DEFAULT;
            sliders[0].setProgress(defaults.size()-50);sliders[1].setProgress(defaults.horizontal());sliders[2].setProgress(defaults.vertical());persist.run();
        }));
        dialog.show();
    }
    private static CheckBox stickOption(Activity activity,boolean dragging,Runnable changed){
        File file=stickFile(activity,dragging);
        CheckBox box=new CheckBox(activity);
        box.setText(dragging?R.string.virtual_dragging_origin:R.string.virtual_dynamic_center);
        box.setMinHeight(Ui.dp(activity,48));
        box.setChecked(readStickOption(file));
        box.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener(){
            public void onCheckedChanged(CompoundButton button,boolean checked){
                try{writeSetting(file,Boolean.toString(checked));changed.run();}
                catch(IOException e){
                    button.setOnCheckedChangeListener(null);button.setChecked(readStickOption(file));button.setOnCheckedChangeListener(this);
                    Toast.makeText(activity,R.string.controller_setting_error,Toast.LENGTH_LONG).show();
                }
            }
        });
        return box;
    }
}
