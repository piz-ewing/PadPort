package pl.padport.app;

import java.util.HashMap;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;

/** Pointer ownership and input merging, independent of Android and the renderer. */
final class VirtualPadState {
    private static final int ALL_BUTTONS=(1<<17)-1;
    private final Map<Integer,Integer> pointers=new HashMap<>();
    private final Map<Integer,Integer> keyPointers=new HashMap<>();
    private boolean enabled,paused;
    private int stickPointer=-1;
    private float stickX,stickY;

    boolean enabled(){return enabled;}
    boolean interactive(){return enabled&&!paused;}
    boolean tracks(int pointer){return pointers.containsKey(pointer);}
    void enabled(boolean value){if(enabled!=value){enabled=value;clear();}}
    void paused(boolean value){paused=value;clear();}
    void touch(int pointer,int mask){if(interactive())pointers.put(pointer,mask&ALL_BUTTONS);}
    void touchKey(int pointer,int key){if(interactive()){if(key==0)keyPointers.remove(pointer);else keyPointers.put(pointer,key);}}
    Set<Integer> keys(){return interactive()?new HashSet<>(keyPointers.values()):new HashSet<>();}
    boolean keyDown(int key){return interactive()&&keyPointers.containsValue(key);}
    void stick(int pointer,float x,float y,int mask){
        if(!interactive())return;
        stickPointer=pointer;stickX=x;stickY=y;touch(pointer,mask);touchKey(pointer,0);
    }
    void release(int pointer){
        pointers.remove(pointer);keyPointers.remove(pointer);
        if(pointer==stickPointer){stickPointer=-1;stickX=stickY=0;}
    }
    void clear(){pointers.clear();keyPointers.clear();stickPointer=-1;stickX=stickY=0;}
    int buttons(){
        if(!interactive())return 0;
        int mask=0;for(int value:pointers.values())mask|=value;return mask;
    }
    float button(int index){return index>=0&&index<17&&(buttons()&(1<<index))!=0?1:0;}
    float axis(int index){
        if(!interactive())return 0;
        if(stickPointer!=-1&&(index==0||index==1))return index==0?stickX:stickY;
        if(index==0)return button(15)-button(14);
        if(index==1)return button(13)-button(12);
        return 0;
    }
    float mergeButton(int index,float physical){return Math.max(physical,button(index));}
    float mergeAxis(int index,float physical){
        float touch=axis(index);
        return Math.abs(touch)>Math.abs(physical)?touch:physical;
    }
}
