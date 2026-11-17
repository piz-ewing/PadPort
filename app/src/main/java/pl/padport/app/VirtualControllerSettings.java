package pl.padport.app;

import android.app.Activity;
import android.content.Context;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.SeekBar;
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
    private static File flag(Context context){return new File(context.getFilesDir(),"on-screen-controller.enabled");}
    private static File transparencyFile(Context context){return new File(context.getFilesDir(),"on-screen-controller.transparency");}
    private static File layoutFile(Context context){return new File(context.getFilesDir(),"on-screen-controller.layout");}
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
        return panel;
    }
}
