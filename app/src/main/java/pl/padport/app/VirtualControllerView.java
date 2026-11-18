package pl.padport.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.MotionEvent;
import android.view.View;
import java.util.Collections;

/** Transparent multitouch overlay; gestures starting outside its controls pass to the game. */
final class VirtualControllerView extends View {
    private final ControllerHub hub;
    private final VirtualPadState state;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    private VirtualPadLayout layout;
    private boolean mtool;
    private boolean draggingOrigin,predictive;
    private VirtualInputPrediction prediction;
    private boolean editing,resizing;
    private int editorPointer=-1;
    private float editorOffsetX,editorOffsetY,editorDistance;
    private int editorSize;
    private java.util.function.Consumer<VirtualControllerSettings.StickLayout> layoutChanged;
    private VirtualStick stick;
    private VirtualControllerSettings.StickLayout stickLayout=VirtualControllerSettings.StickLayout.DEFAULT;
    private int stickPointer=-1;
    private final Rect gestureExclusion=new Rect();

    VirtualControllerView(Context context,ControllerHub hub){
        super(context);this.hub=hub;state=hub.virtualPad;
        setAlpha(VirtualControllerSettings.alpha(context));
        setFocusable(false);setContentDescription(context.getString(R.string.virtual_controller_name));
        setVisibility(GONE);
    }
    void configure(boolean enabled,boolean interactive){
        setAlpha(VirtualControllerSettings.alpha(getContext()));
        boolean selected=VirtualControllerSettings.mtoolLayout(getContext());
        boolean dragging=VirtualControllerSettings.draggingOrigin(getContext());
        boolean predictionEnabled=VirtualControllerSettings.inputPrediction(getContext());
        VirtualControllerSettings.StickLayout geometry=VirtualControllerSettings.stickLayout(getContext());
        boolean reset=state.enabled()!=enabled||state.interactive()!=(enabled&&interactive)||predictive!=predictionEnabled;
        predictive=predictionEnabled;
        if(layout==null||mtool!=selected||draggingOrigin!=dragging||!stickLayout.equals(geometry)){
            mtool=selected;draggingOrigin=dragging;stickLayout=geometry;state.clear();rebuildLayout();
            reset=true;
        }
        if(reset){state.clear();resetStick();if(prediction!=null)prediction.clear();}
        state.enabled(enabled);state.paused(!interactive);
        setVisibility(enabled?VISIBLE:GONE);updateGestureExclusion();hub.virtualChanged();invalidate();
    }
    void suspend(){state.clear();state.paused(true);resetStick();if(prediction!=null)prediction.clear();updateGestureExclusion();hub.virtualChanged();invalidate();}
    @Override protected void onSizeChanged(int w,int h,int oldw,int oldh){
        super.onSizeChanged(w,h,oldw,oldh);
        state.clear();rebuildLayout();
        updateGestureExclusion();hub.virtualChanged();
    }
    private void rebuildLayout(){
        DisplayMetrics metrics=getResources().getDisplayMetrics();
        layout=new VirtualPadLayout(getWidth(),getHeight(),metrics.density,mtool,stickLayout.scale(),stickLayout.x(),stickLayout.y());
        float xdpi=metrics.xdpi>0&&Float.isFinite(metrics.xdpi)?metrics.xdpi:metrics.densityDpi;
        float ydpi=metrics.ydpi>0&&Float.isFinite(metrics.ydpi)?metrics.ydpi:metrics.densityDpi;
        float rx=Math.max(1,Math.min(12*stickLayout.scale()*xdpi/25.4f,getWidth()/(4f*VirtualStick.EDGE_MARGIN)));
        float ry=Math.max(1,Math.min(12*stickLayout.scale()*ydpi/25.4f,getHeight()/(2f*VirtualStick.EDGE_MARGIN)));
        float x=.4f*rx+Math.max(0,getWidth()/2f-1.4f*rx)*stickLayout.x();
        float y=ry+Math.max(0,getHeight()-2*ry)*stickLayout.y();
        stick=new VirtualStick(getWidth(),getHeight(),rx,ry,x,y);
        prediction=new VirtualInputPrediction(layout,xdpi/25.4f,ydpi/25.4f,getWidth()/2f,
            draggingOrigin?stick.x:layout.dpadX,draggingOrigin?stick.y:layout.dpadY,
            draggingOrigin?rx:layout.dpadRadius,draggingOrigin?ry:layout.dpadRadius);
        stickPointer=-1;
    }
    private boolean movableStick(){return draggingOrigin;}
    private boolean startsStick(float x,float y){
        if(!movableStick()||layout.buttonAt(x,y)!=null)return false;
        return Math.hypot((x-stick.x)/stick.radiusX,(y-stick.y)/stick.radiusY)<=1;
    }
    private boolean inDirection(float x,float y){return movableStick()?startsStick(x,y):layout.buttonAt(x,y)==null&&layout.inDpad(x,y);}
    private boolean contains(float x,float y,long time,int pointer){
        return inDirection(x,y)||layout.buttonAt(x,y)!=null||predictive&&prediction.buttonAt(x,y,time,pointer,true)>=0;
    }
    private void resetStick(){stickPointer=-1;if(stick!=null)stick.reset();}
    void editLayout(java.util.function.Consumer<VirtualControllerSettings.StickLayout> changed){
        editing=true;layoutChanged=changed;setAlpha(1);setVisibility(VISIBLE);
        state.paused(true);resetStick();setGestureExclusionEmpty();invalidate();
    }
    VirtualControllerSettings.StickLayout editedLayout(){return stickLayout;}
    void previewLayout(VirtualControllerSettings.StickLayout value){
        stickLayout=value;rebuildLayout();invalidate();if(layoutChanged!=null)layoutChanged.accept(value);
    }
    private float stickX(){return movableStick()?stick.x:layout.dpadX;}
    private float stickY(){return movableStick()?stick.y:layout.dpadY;}
    private float stickRadiusX(){return movableStick()?stick.radiusX:layout.dpadRadius;}
    private float stickRadiusY(){return movableStick()?stick.radiusY:layout.dpadRadius;}
    private float resizeX(){
        float r=16*getResources().getDisplayMetrics().density;
        return PadMath.clamp(stickX()+stickRadiusX()*.7071f,r,Math.max(r,getWidth()-r));
    }
    private float resizeY(){
        float r=16*getResources().getDisplayMetrics().density;
        return PadMath.clamp(stickY()+stickRadiusY()*.7071f,r,Math.max(r,getHeight()-r));
    }
    private boolean editTouch(MotionEvent event){
        if(layout==null)return true;
        int action=event.getActionMasked(),at=event.getActionIndex();
        if(action==MotionEvent.ACTION_DOWN){
            float x=event.getX(),y=event.getY(),hit=24*getResources().getDisplayMetrics().density;
            resizing=Math.hypot(x-resizeX(),y-resizeY())<=hit;
            if(!resizing&&Math.hypot((x-stickX())/stickRadiusX(),(y-stickY())/stickRadiusY())>1)return true;
            editorPointer=event.getPointerId(0);editorOffsetX=x-stickX();editorOffsetY=y-stickY();
            editorSize=stickLayout.size();editorDistance=Math.max(1,(float)Math.hypot(editorOffsetX,editorOffsetY));
            getParent().requestDisallowInterceptTouchEvent(true);
        }else if(action==MotionEvent.ACTION_MOVE&&editorPointer!=-1){
            int index=event.findPointerIndex(editorPointer);if(index<0)return true;
            float x=event.getX(index),y=event.getY(index);
            if(resizing){
                float cx=stickX(),cy=stickY();
                int size=Math.round(editorSize*(float)Math.hypot(x-cx,y-cy)/editorDistance);
                stickLayout=new VirtualControllerSettings.StickLayout(Math.max(50,Math.min(250,size)),stickLayout.horizontal(),stickLayout.vertical());
                rebuildLayout();placeStick(cx,cy);
            }else placeStick(x-editorOffsetX,y-editorOffsetY);
            if(layoutChanged!=null)layoutChanged.accept(stickLayout);invalidate();
        }else if(action==MotionEvent.ACTION_CANCEL||action==MotionEvent.ACTION_UP
                ||action==MotionEvent.ACTION_POINTER_UP&&event.getPointerId(at)==editorPointer){
            editorPointer=-1;resizing=false;getParent().requestDisallowInterceptTouchEvent(false);
            if(action==MotionEvent.ACTION_UP)performClick();
        }
        return true;
    }
    private void placeStick(float cx,float cy){
        float rx=stickRadiusX(),ry=stickRadiusY();
        float minX=(movableStick()?.4f:1)*rx,spanX=Math.max(0,getWidth()/2f-rx-minX);
        float spanY=Math.max(0,getHeight()-2*ry);
        int horizontal=spanX>0?Math.round(100*(cx-minX)/spanX):stickLayout.horizontal();
        int vertical=spanY>0?Math.round(100*(cy-ry)/spanY):stickLayout.vertical();
        stickLayout=new VirtualControllerSettings.StickLayout(stickLayout.size(),Math.max(0,Math.min(100,horizontal)),Math.max(0,Math.min(100,vertical)));
        rebuildLayout();
    }
    @Override protected void onDetachedFromWindow(){state.clear();resetStick();setGestureExclusionEmpty();hub.virtualChanged();super.onDetachedFromWindow();}

    @Override public boolean onTouchEvent(MotionEvent event){
        if(editing)return editTouch(event);
        if(layout==null||!state.enabled())return false;
        int action=event.getActionMasked(),at=event.getActionIndex();
        int before=state.buttons();
        float axisX=state.axis(0),axisY=state.axis(1);
        java.util.Set<Integer> keysBefore=state.keys();
        if(action==MotionEvent.ACTION_DOWN){
            if(!contains(event.getX(),event.getY(),event.getEventTime(),event.getPointerId(0)))return false;
            state.clear();resetStick();
            getParent().requestDisallowInterceptTouchEvent(true);
        }
        if(!state.interactive())return contains(event.getX(at),event.getY(at),event.getEventTime(),event.getPointerId(at));
        java.util.Set<Integer> active=new java.util.HashSet<>();
        if(action!=MotionEvent.ACTION_UP&&action!=MotionEvent.ACTION_CANCEL){
            for(int i=0;i<event.getPointerCount();i++)
                if(action!=MotionEvent.ACTION_POINTER_UP||i!=at)active.add(event.getPointerId(i));
        }
        if(action==MotionEvent.ACTION_DOWN||action==MotionEvent.ACTION_POINTER_DOWN){
            int pointer=event.getPointerId(at);float x=event.getX(at),y=event.getY(at);
            boolean direction=inDirection(x,y);
            if(!direction||stickPointer==-1){
                if(direction){stickPointer=pointer;stick.reset();}
                prediction.begin(pointer,x,y,event.getEventTime(),direction);
                if(contains(x,y,event.getEventTime(),pointer))touch(pointer,x,y,event.getEventTime());
                else prediction.release(pointer,event.getEventTime(),false);
            }
        }else if(action==MotionEvent.ACTION_MOVE){
            for(int i=0;i<event.getPointerCount();i++)if(state.tracks(event.getPointerId(i))){
                if(predictive&&prediction.stationary(event.getPointerId(i),event.getX(i),event.getY(i)))continue;
                if(predictive){
                    for(int h=0;h<event.getHistorySize();h++)prediction.sample(event.getPointerId(i),event.getHistoricalX(i,h),event.getHistoricalY(i,h),event.getHistoricalEventTime(h));
                    prediction.sample(event.getPointerId(i),event.getX(i),event.getY(i),event.getEventTime());
                }
                touch(event.getPointerId(i),event.getX(i),event.getY(i),event.getEventTime());
            }
        }else if(action==MotionEvent.ACTION_UP||action==MotionEvent.ACTION_POINTER_UP){
            int pointer=event.getPointerId(at);prediction.release(pointer,event.getEventTime(),predictive&&pointer==stickPointer);
            state.release(pointer);if(pointer==stickPointer)resetStick();
        }else if(action==MotionEvent.ACTION_CANCEL){state.clear();resetStick();prediction.clear();}
        state.retainPointers(active);
        prediction.retainPointers(active,event.getEventTime());
        if(stickPointer!=-1&&!active.contains(stickPointer))resetStick();
        if(action==MotionEvent.ACTION_UP||action==MotionEvent.ACTION_CANCEL)getParent().requestDisallowInterceptTouchEvent(false);
        if(before!=state.buttons()||axisX!=state.axis(0)||axisY!=state.axis(1)||!keysBefore.equals(state.keys()))hub.virtualChanged();
        updateGestureExclusion();invalidate();
        if(action==MotionEvent.ACTION_UP)performClick();
        return true;
    }
    private void touch(int pointer,float x,float y,long time){
        if(pointer==stickPointer){
            boolean moving=!predictive||prediction.moving(pointer,x,y,time);
            if(movableStick())stick.move(x,y,moving);
            if(predictive&&!moving){
                float cx=movableStick()?stick.x:layout.dpadX,cy=movableStick()?stick.y:layout.dpadY;
                float rx=movableStick()?stick.radiusX:layout.dpadRadius,ry=movableStick()?stick.radiusY:layout.dpadRadius;
                int key=Math.hypot((x-cx)/rx,(y-cy)/ry)<=.15f?-1:prediction.direction(x,y,time,pointer);
                prediction.press(pointer,key,time,true);int d=key-layout.buttons.length;
                state.stick(pointer,d==2?-1:d==3?1:0,d==0?-1:d==1?1:0,key<0?0:1<<(12+d));
            }else if(movableStick()){
                state.stick(pointer,stick.axisX,stick.axisY,layout.directionMask(stick.axisX,stick.axisY));
            }else{
                int mask=layout.directionMaskAt(x,y);
                state.stick(pointer,((mask>>15)&1)-((mask>>14)&1),((mask>>13)&1)-((mask>>12)&1),mask);
            }
        }else{
            int key=prediction.buttonAt(x,y,time,pointer,predictive);
            VirtualPadLayout.Button button=key<0?null:layout.buttons[key];
            prediction.press(pointer,key,time,predictive);
            state.touch(pointer,button==null||button.index()<0?0:1<<button.index());
            state.touchKey(pointer,button==null?0:button.key());
        }
    }
    private void setGestureExclusionEmpty(){
        if(Build.VERSION.SDK_INT>=29&&!gestureExclusion.isEmpty())setSystemGestureExclusionRects(Collections.emptyList());
        gestureExclusion.setEmpty();
    }
    private void updateGestureExclusion(){
        if(Build.VERSION.SDK_INT<29)return;
        if(editing||!state.interactive()||!movableStick()||getVisibility()!=VISIBLE){setGestureExclusionEmpty();return;}
        float density=getResources().getDisplayMetrics().density;
        int height=Math.min(getHeight(),Math.round(200*density));
        int top=Math.round(PadMath.clamp(stick.y-height/2f,0,getHeight()-height));
        int right=Math.min(getWidth()/2,(int)Math.ceil(stick.x+stick.radiusX));
        int threshold=Math.max(1,Math.round(8*density));
        if(gestureExclusion.isEmpty()||stickPointer==-1||Math.abs(gestureExclusion.top-top)>=threshold||Math.abs(gestureExclusion.right-right)>=threshold){
            if(gestureExclusion.top!=top||gestureExclusion.right!=right||gestureExclusion.bottom!=top+height){
                gestureExclusion.set(0,top,right,top+height);
                setSystemGestureExclusionRects(Collections.singletonList(new Rect(gestureExclusion)));
            }
        }
    }
    @Override public boolean performClick(){super.performClick();return true;}

    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);if(layout==null)return;
        drawControls(canvas);
        if(editing){
            float rx=stickRadiusX()*VirtualStick.EDGE_MARGIN,ry=stickRadiusY()*VirtualStick.EDGE_MARGIN;
            paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(2*getResources().getDisplayMetrics().density);paint.setColor(Ui.ACCENT_TEXT);
            canvas.drawOval(stickX()-rx,stickY()-ry,stickX()+rx,stickY()+ry,paint);
            float x=resizeX(),y=resizeY(),r=16*getResources().getDisplayMetrics().density;
            paint.setStyle(Paint.Style.FILL);paint.setColor(Ui.ACCENT);canvas.drawCircle(x,y,r,paint);
            paint.setStyle(Paint.Style.STROKE);paint.setColor(Ui.BG);
            canvas.drawLine(x-r*.35f,y-r*.35f,x+r*.35f,y+r*.35f,paint);
            canvas.drawLine(x+r*.35f,y-r*.1f,x+r*.35f,y+r*.35f,paint);
            canvas.drawLine(x-r*.1f,y+r*.35f,x+r*.35f,y+r*.35f,paint);
        }
    }
    private void drawControls(Canvas canvas){
        float u=layout.dpadUnit,cx=layout.dpadX,cy=layout.dpadY,r=layout.dpadRadius;
        if(movableStick()){
            canvas.save();canvas.translate(stick.x,stick.y);canvas.scale(stick.radiusX/r,stick.radiusY/r);
            drawCircularDpad(canvas,u,0,0,r);
            if(stickPointer!=-1){
                paint.setStyle(Paint.Style.FILL);paint.setColor(0x99f6f6f6);
                canvas.drawCircle(stick.thumbX*r*.82f,stick.thumbY*r*.82f,r*.18f,paint);
            }
            canvas.restore();
            for(VirtualPadLayout.Button button:layout.buttons)drawButton(canvas,button,layout.unit);
            return;
        }
        if(layout.mtool){
            drawCircularDpad(canvas,u,cx,cy,r);
            for(VirtualPadLayout.Button button:layout.buttons)drawButton(canvas,button,layout.unit);
            return;
        }
        paint.setStyle(Paint.Style.FILL);paint.setColor(0x33000000);
        canvas.drawRoundRect(cx-r,cy-r,cx+r,cy+r,16*u,16*u,paint);
        drawButton(canvas,new VirtualPadLayout.Button("↑",12,cx-21*u,cy-64*u,cx+21*u,cy-22*u,false),u);
        drawButton(canvas,new VirtualPadLayout.Button("↓",13,cx-21*u,cy+22*u,cx+21*u,cy+64*u,false),u);
        drawButton(canvas,new VirtualPadLayout.Button("←",14,cx-64*u,cy-21*u,cx-22*u,cy+21*u,false),u);
        drawButton(canvas,new VirtualPadLayout.Button("→",15,cx+22*u,cy-21*u,cx+64*u,cy+21*u,false),u);
        for(VirtualPadLayout.Button button:layout.buttons)drawButton(canvas,button,layout.unit);
    }
    private void drawCircularDpad(Canvas canvas,float u,float cx,float cy,float r){
        paint.setStyle(Paint.Style.FILL);paint.setColor(0x33000000);canvas.drawCircle(cx,cy,r,paint);
        paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.5f*u);paint.setColor(0x99f6f6f6);
        canvas.drawCircle(cx,cy,r,paint);canvas.drawCircle(cx,cy,r*.56f,paint);canvas.drawCircle(cx,cy,movableStick()?r*.15f:18*u,paint);
        RectF outer=new RectF(cx-r,cy-r,cx+r,cy+r);
        for(int i=0;i<8;i++){
            double angle=i*Math.PI/4;
            float x=cx+(float)Math.cos(angle)*r*.78f,y=cy+(float)Math.sin(angle)*r*.78f;
            int mask=layout.directionMask((float)Math.cos(angle),(float)Math.sin(angle));
            boolean down=(state.buttons()&mask)==mask;
            if(down){paint.setStyle(Paint.Style.FILL);paint.setColor(0x66ffffff);canvas.drawArc(outer,VirtualPadLayout.sectorStart(i),VirtualPadLayout.sectorSweep(i),true,paint);}
            double edge=Math.toRadians(VirtualPadLayout.sectorStart(i)+VirtualPadLayout.sectorSweep(i));
            paint.setStyle(Paint.Style.STROKE);paint.setColor(0x99f6f6f6);
            canvas.drawLine(cx+(float)Math.cos(edge)*r*.56f,cy+(float)Math.sin(edge)*r*.56f,cx+(float)Math.cos(edge)*r,cy+(float)Math.sin(edge)*r,paint);
            canvas.save();canvas.rotate(i*45,x,y);
            float arrowScale=(i&1)==0?1f:.7f;
            Path arrow=new Path();arrow.moveTo(x+8*u*arrowScale,y);arrow.lineTo(x-6*u*arrowScale,y-8*u*arrowScale);arrow.lineTo(x-6*u*arrowScale,y+8*u*arrowScale);arrow.close();
            paint.setStyle(Paint.Style.FILL);paint.setColor(down?0xfff6f6f6:0xaaf6f6f6);canvas.drawPath(arrow,paint);canvas.restore();
        }
    }
    private void drawButton(Canvas canvas,VirtualPadLayout.Button button,float unit){
        boolean down=button.key()!=0?state.keyDown(button.key()):state.button(button.index())>.5f;
        float radius=button.round()?(button.right()-button.left())/2:9*unit;
        paint.setStyle(Paint.Style.FILL);paint.setColor(layout.mtool?(down?0x99ffffff:0x331d1c1d):(down?0xbbd16197:0x661d1c1d));
        canvas.drawRoundRect(button.left(),button.top(),button.right(),button.bottom(),radius,radius,paint);
        paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.5f*unit);paint.setColor(layout.mtool?0x99f6f6f6:(down?0xeed16197:0x99f6f6f6));
        canvas.drawRoundRect(button.left(),button.top(),button.right(),button.bottom(),radius,radius,paint);
        paint.setStyle(Paint.Style.FILL);paint.setColor(down?0xff1d1c1d:0xddf6f6f6);
        paint.setTypeface(Typeface.DEFAULT_BOLD);paint.setTextSize((button.label().length()>2?11:18)*unit);paint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText(button.label(),button.centerX(),button.centerY()-(paint.ascent()+paint.descent())/2,paint);
    }
}
