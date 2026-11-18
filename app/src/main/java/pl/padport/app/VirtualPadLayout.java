package pl.padport.app;

import android.view.KeyEvent;

/** Responsive hit areas in standard Gamepad button order. */
final class VirtualPadLayout {
    record Button(String label,int index,float left,float top,float right,float bottom,boolean round,int key){
        Button(String label,int index,float left,float top,float right,float bottom,boolean round){this(label,index,left,top,right,bottom,round,0);}
        boolean contains(float x,float y){return x>=left&&x<=right&&y>=top&&y<=bottom;}
        float centerX(){return (left+right)/2;}
        float centerY(){return (top+bottom)/2;}
    }
    final float unit,dpadUnit,dpadX,dpadY,dpadRadius;
    final Button[] buttons;
    final boolean mtool;
    static float sectorSweep(int sector){return (sector&1)==0?60:30;}
    static float sectorStart(int sector){return sector*45-sectorSweep(sector)/2;}

    VirtualPadLayout(int width,int height,float density){this(width,height,density,false);}
    VirtualPadLayout(int width,int height,float density,boolean mtool){
        this(width,height,density,mtool,VirtualControllerSettings.StickLayout.DEFAULT.scale(),
            VirtualControllerSettings.StickLayout.DEFAULT.x(),VirtualControllerSettings.StickLayout.DEFAULT.y());
    }
    VirtualPadLayout(int width,int height,float density,boolean mtool,float scale,float horizontal,float vertical){
        this.mtool=mtool;
        float base=Math.min(density,Math.min(width/480f,height/320f));
        unit=Math.max(.01f,mtool?Math.min(base*1.3f,Math.min(width/400f,height/270f)):base);
        dpadUnit=Math.max(.01f,Math.min(unit*scale,Math.min(width/4f,height/2f)/(mtool?80:66)));
        dpadRadius=(mtool?80:66)*dpadUnit;
        dpadX=dpadRadius+Math.max(0,width/2f-2*dpadRadius)*horizontal;
        dpadY=dpadRadius+Math.max(0,height-2*dpadRadius)*vertical;
        if(mtool){
            buttons=new Button[]{
                key("Esc",KeyEvent.KEYCODE_ESCAPE,50*unit,28*unit,16*unit),
                key("W",KeyEvent.KEYCODE_W,20*unit,56*unit,14*unit),
                key("E",KeyEvent.KEYCODE_E,92*unit,40*unit,16*unit),
                key("F2",KeyEvent.KEYCODE_F2,60*unit,68*unit,16*unit),
                key("Q",KeyEvent.KEYCODE_Q,32*unit,100*unit,18*unit),
                key("Ctrl",KeyEvent.KEYCODE_CTRL_LEFT,20*unit,height-28*unit,18*unit),
                key("Z",KeyEvent.KEYCODE_Z,width-140*unit,height-92*unit,24*unit),
                key("X",KeyEvent.KEYCODE_X,width-80*unit,height-104*unit,18*unit),
                key("C",KeyEvent.KEYCODE_C,width-80*unit,height-156*unit,14*unit),
                key("D",KeyEvent.KEYCODE_D,width-28*unit,height-156*unit,14*unit),
                key("S",KeyEvent.KEYCODE_S,width-20*unit,height-120*unit,16*unit),
                key("A",KeyEvent.KEYCODE_A,width-20*unit,height-76*unit,16*unit),
                key("Shift",KeyEvent.KEYCODE_SHIFT_LEFT,width-44*unit,height-28*unit,20*unit),
                key("Ctrl",KeyEvent.KEYCODE_CTRL_LEFT,width-100*unit,height-20*unit,18*unit)
            };
            return;
        }
        float right=width-100*unit,cy=height-94*unit,gap=48*unit,r=26*unit;
        buttons=new Button[]{
            circle("A",0,right,cy+gap,r),circle("B",1,right+gap,cy,r),
            circle("X",2,right-gap,cy,r),circle("Y",3,right,cy-gap,r),
            rect("L1",4,24*unit,height-218*unit,54*unit,34*unit),
            rect("L2",6,88*unit,height-218*unit,54*unit,34*unit),
            rect("R2",7,width-142*unit,height-218*unit,54*unit,34*unit),
            rect("R1",5,width-78*unit,height-218*unit,54*unit,34*unit),
            rect("SELECT",8,width/2f-64*unit,height-42*unit,56*unit,30*unit),
            rect("START",9,width/2f+8*unit,height-42*unit,56*unit,30*unit)
        };
    }
    private static Button circle(String label,int index,float x,float y,float r){return new Button(label,index,x-r,y-r,x+r,y+r,true);}
    private static Button key(String label,int key,float x,float y,float r){return new Button(label,-1,x-r,y-r,x+r,y+r,true,key);}
    private static Button rect(String label,int index,float x,float y,float w,float h){return new Button(label,index,x,y,x+w,y+h,false);}
    boolean inDpad(float x,float y){return mtool?Math.hypot(x-dpadX,y-dpadY)<=dpadRadius:Math.abs(x-dpadX)<=dpadRadius&&Math.abs(y-dpadY)<=dpadRadius;}
    Button buttonAt(float x,float y){
        for(Button button:buttons)if(button.contains(x,y)&&(!mtool||Math.hypot(x-button.centerX(),y-button.centerY())<=(button.right()-button.left())/2))return button;
        return null;
    }
    boolean contains(float x,float y){return inDpad(x,y)||buttonAt(x,y)!=null;}
    int keyAt(float x,float y){Button button=buttonAt(x,y);return button==null?0:button.key();}
    int maskAt(float x,float y){
        Button button=buttonAt(x,y);
        if(button!=null)return button.index()<0?0:1<<button.index();
        if(!inDpad(x,y))return 0;
        if(mtool){
            float dx=x-dpadX,dy=y-dpadY;
            if(Math.hypot(dx,dy)<18*dpadUnit)return 0;
            return directionMask(dx,dy);
        }
        int mask=0;float dx=x-dpadX,dy=y-dpadY,dead=18*dpadUnit;
        if(dx < -dead)mask|=1<<14;else if(dx>dead)mask|=1<<15;
        if(dy < -dead)mask|=1<<12;else if(dy>dead)mask|=1<<13;
        return mask;
    }
    int directionMask(float dx,float dy){
        if(dx==0&&dy==0)return 0;
        double angle=Math.toDegrees(Math.atan2(dy,dx));
        int cardinal=(int)Math.round(angle/90);
        int sector=Math.floorMod(Math.abs(angle-cardinal*90)<=30?cardinal*2:(int)Math.round(angle/45),8);
        return switch(sector){
            case 0 -> 1<<15;case 1 -> (1<<15)|(1<<13);case 2 -> 1<<13;case 3 -> (1<<13)|(1<<14);
            case 4 -> 1<<14;case 5 -> (1<<14)|(1<<12);case 6 -> 1<<12;default -> (1<<12)|(1<<15);
        };
    }
}
