package pl.padport.app;

import android.view.KeyEvent;
import java.util.HashMap;
import java.util.Map;

/** Event-driven hit areas; all geometry and weights use millimetres. */
final class VirtualInputPrediction {
    private static final float CAPTURE=6,LOOK_AHEAD=12,MAX_LEAD=1.25f,MAX_WEIGHT=16;
    private final VirtualPadLayout layout;
    private final float pxPerMmX,pxPerMmY,splitX,homeX,homeY,radiusX,radiusY;
    private final float[] x,y,core,weightCap,weights;
    private final Map<Integer,Pointer> pointers=new HashMap<>();
    private final long[] taps=new long[12];
    private final int[] last={-1,-1,-1};
    private final long[] lastTime=new long[3],interval=new long[3];
    private final int[] groups;
    private int tapIndex,confirm=-1,cancel=-1;

    private static final class Pointer {
        float x,y,startX,startY,travel,vx,vy,leadX,leadY;
        long time,downTime;
        int key=-1;
        int previous=-1,group;
        long previousTime,interval;
        int samples;
        boolean moving;
    }
    VirtualInputPrediction(VirtualPadLayout layout,float pxPerMmX,float pxPerMmY,float splitX,
            float homeX,float homeY,float radiusX,float radiusY){
        this.layout=layout;this.pxPerMmX=pxPerMmX;this.pxPerMmY=pxPerMmY;
        this.splitX=splitX;
        this.homeX=homeX;this.homeY=homeY;this.radiusX=radiusX;this.radiusY=radiusY;
        int count=layout.buttons.length+4;
        groups=new int[count];
        x=new float[count];y=new float[count];core=new float[count];
        weightCap=new float[count];weights=new float[count];
        for(int i=0;i<layout.buttons.length;i++){
            VirtualPadLayout.Button button=layout.buttons[i];
            x[i]=button.centerX()/pxPerMmX;y[i]=button.centerY()/pxPerMmY;
            groups[i]=button.centerX()<splitX?0:1;
            core[i]=Math.min(5,Math.min((button.right()-button.left())/pxPerMmX,(button.bottom()-button.top())/pxPerMmY)/2);
            if(button.index()==0||button.key()==KeyEvent.KEYCODE_Z)confirm=i;
            if(button.index()==1||button.key()==KeyEvent.KEYCODE_X)cancel=i;
        }
        for(int d=0;d<4;d++){
            int i=layout.buttons.length+d;
            groups[i]=2;
            x[i]=(homeX+(d==2?-1:d==3?1:0)*radiusX*.7f)/pxPerMmX;
            y[i]=(homeY+(d==0?-1:d==1?1:0)*radiusY*.7f)/pxPerMmY;
            core[i]=Math.min(5,Math.min(radiusX/pxPerMmX,radiusY/pxPerMmY)*.2f);
        }
        for(int i=0;i<count;i++){
            float cap=MAX_WEIGHT;
            for(int j=0;j<count;j++)if(i!=j){
                float distance=(float)Math.hypot(x[i]-x[j],y[i]-y[j]);
                cap=Math.min(cap,Math.max(0,distance*(distance-2*core[j])));
            }
            weightCap[i]=cap;
        }
    }
    void clear(){
        pointers.clear();java.util.Arrays.fill(taps,0);java.util.Arrays.fill(last,-1);
        java.util.Arrays.fill(lastTime,0);java.util.Arrays.fill(interval,0);tapIndex=0;
    }
    void begin(int pointer,float px,float py,long time,boolean direction){
        Pointer p=new Pointer();p.downTime=time;p.group=direction?2:px<splitX?0:1;
        p.startX=px/pxPerMmX;p.startY=py/pxPerMmY;
        p.previous=last[p.group];p.previousTime=lastTime[p.group];p.interval=interval[p.group];
        pointers.put(pointer,p);sample(pointer,px,py,time);
    }
    boolean stationary(int pointer,float px,float py){
        Pointer p=pointers.get(pointer);
        return p!=null&&p.x==px/pxPerMmX&&p.y==py/pxPerMmY;
    }
    void sample(int pointer,float px,float py,long time){
        Pointer p=pointers.get(pointer);if(p==null)return;
        float mx=px/pxPerMmX,my=py/pxPerMmY;long dt=time-p.time;
        if(p.samples>0&&dt<=0)return;
        p.travel=Math.max(p.travel,(float)Math.hypot(mx-p.startX,my-p.startY));
        if(p.samples>0&&dt<=100){
            float alpha=(float)dt/(12+dt);
            float vx=p.vx+alpha*((mx-p.x)/dt-p.vx),vy=p.vy+alpha*((my-p.y)/dt-p.vy);
            float ax=p.samples>=2?(vx-p.vx)/dt:0,ay=p.samples>=2?(vy-p.vy)/dt:0;
            float dx=vx*LOOK_AHEAD+.5f*ax*LOOK_AHEAD*LOOK_AHEAD;
            float dy=vy*LOOK_AHEAD+.5f*ay*LOOK_AHEAD*LOOK_AHEAD;
            float scale=Math.min(1,MAX_LEAD/Math.max(.001f,(float)Math.hypot(dx,dy)));
            p.leadX=dx*scale;p.leadY=dy*scale;p.vx=vx;p.vy=vy;
        }else{p.vx=p.vy=p.leadX=p.leadY=0;p.samples=0;}
        p.x=mx;p.y=my;p.time=time;p.samples++;
    }
    void release(int pointer,long time,boolean direction){
        Pointer p=pointers.remove(pointer);
        if(direction&&p!=null&&time-p.downTime<=160)taps[tapIndex++%taps.length]=time;
    }
    void press(int pointer,int key,long time,boolean learn){
        Pointer p=pointers.get(pointer);if(p==null||p.key==key)return;
        p.key=key;if(key<0||!learn)return;
        int group=groups[key];
        interval[group]=lastTime[group]==0?300:Math.max(1,time-lastTime[group]);lastTime[group]=time;last[group]=key;
    }
    boolean moving(int pointer,float px,float py,long time){
        Pointer p=pointers.get(pointer);if(p==null)return false;
        if(p.moving)return true;
        if(p.travel<1.5f)return false;
        int cadence=0;for(long tap:taps)if(tap>0&&time-tap<1200)cadence++;
        float distance=(float)Math.hypot((px-homeX)/pxPerMmX,(py-homeY)/pxPerMmY);
        double logit=.18*(distance-9)+.025*(time-p.downTime-160)-.65*cadence;
        p.moving=1/(1+Math.exp(-logit))>=.5;return p.moving;
    }
    int buttonAt(float px,float py,long time,int pointer,boolean predictive){
        Pointer p=pointers.get(pointer);
        float mx=px/pxPerMmX,my=py/pxPerMmY;
        VirtualPadLayout.Button direct=layout.buttonAt(px,py);
        int directKey=-1;
        if(direct!=null){
            for(int i=0;i<layout.buttons.length;i++)if(layout.buttons[i]==direct&&(p==null||groups[i]==p.group)){directKey=i;break;}
            if(directKey>=0&&(p==null||p.key<0||Math.hypot(mx-x[directKey],my-y[directKey])<=core[directKey]))return directKey;
        }
        if(p!=null&&p.key>=0&&p.key<layout.buttons.length&&edgeDistance(p.key,mx,my)<=3)return p.key;
        if(directKey>=0)return directKey;
        if(!predictive)return -1;
        // The direction control owns its complete visible area.
        if(Math.hypot((px-homeX)/radiusX,(py-homeY)/radiusY)<=1)return -1;
        prepare(time,pointer);float best=Float.POSITIVE_INFINITY;int selected=-1;
        float leadX=p==null?0:p.leadX,leadY=p==null?0:p.leadY;
        for(int i=0;i<layout.buttons.length;i++){
            if((p!=null&&groups[i]!=p.group)||edgeDistance(i,mx,my)>CAPTURE)continue;
            float dx=mx+leadX-x[i],dy=my+leadY-y[i],score=dx*dx+dy*dy-weights[i];
            if(score<best){best=score;selected=i;}
        }
        return selected;
    }
    private float edgeDistance(int key,float mx,float my){
        VirtualPadLayout.Button button=layout.buttons[key];
        float dx=Math.max(0,Math.abs(mx-x[key])-(button.right()-button.left())/(2*pxPerMmX));
        float dy=Math.max(0,Math.abs(my-y[key])-(button.bottom()-button.top())/(2*pxPerMmY));
        if(layout.mtool&&button.round()){
            float rx=(button.right()-button.left())/(2*pxPerMmX),ry=(button.bottom()-button.top())/(2*pxPerMmY);
            return Math.max(0,((float)Math.hypot((mx-x[key])/rx,(my-y[key])/ry)-1)*Math.min(rx,ry));
        }
        return (float)Math.hypot(dx,dy);
    }
    int direction(float px,float py,long time,int pointer){
        float mx=px/pxPerMmX,my=py/pxPerMmY;
        for(int i=layout.buttons.length;i<x.length;i++)if(Math.hypot(mx-x[i],my-y[i])<=core[i])return i;
        prepare(time,pointer);Pointer p=pointers.get(pointer);if(p!=null){mx+=p.leadX;my+=p.leadY;}
        float best=Float.POSITIVE_INFINITY;int selected=layout.buttons.length;
        for(int i=layout.buttons.length;i<x.length;i++){
            float dx=mx-x[i],dy=my-y[i],score=dx*dx+dy*dy-weights[i];
            if(score<best){best=score;selected=i;}
        }
        if(p!=null&&p.key>=layout.buttons.length&&p.key!=selected){
            float dx=mx-x[p.key],dy=my-y[p.key];
            float margin=2*(float)Math.hypot(x[selected]-x[p.key],y[selected]-y[p.key]);
            if(best+margin>=dx*dx+dy*dy-weights[p.key])return p.key;
        }
        return selected;
    }
    private void prepare(long time,int pointer){
        Pointer p=pointers.get(pointer);
        int previous=p==null?-1:p.previous;
        float decay=previous>=0&&time-p.previousTime<1500?(float)Math.exp(-Math.log(2)*(time-p.previousTime)/600):0;
        float rhythm=p!=null&&p.interval>0?PadMath.clamp(300f/p.interval,.5f,1.5f):1;
        for(int i=0;i<x.length;i++){
            if(p==null||groups[i]!=p.group){weights[i]=0;continue;}
            float probability=i==previous?(i==confirm?.75f:i==cancel?.65f:i==layout.buttons.length+1?.7f:.55f):.02f;
            float w=MAX_WEIGHT*probability*rhythm*decay;
            if(p!=null&&p.key>=0&&i!=p.key){
                float dx=x[i]-x[p.key],dy=y[i]-y[p.key],distance=(float)Math.hypot(dx,dy);
                if(distance>0)w+=Math.min(6,12*Math.max(0,(p.vx*dx+p.vy*dy)/distance));
            }
            weights[i]=Math.min(weightCap[i],w);
        }
    }
}
