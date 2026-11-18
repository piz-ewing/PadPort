package pl.padport.app;

/** Touch positions are measured in physical radii, including the radial dead zone. */
final class VirtualStick {
    private static final float DEAD_ZONE=.15f,DRAG_RADIUS=1.2f;
    static final float EDGE_MARGIN=1.02f;
    final float radiusX,radiusY;
    private final float minX,maxX,minY,maxY,homeX,homeY;
    float x,y,axisX,axisY,thumbX,thumbY;

    VirtualStick(int width,int height,float radiusX,float radiusY,float homeX,float homeY){
        this.radiusX=radiusX;this.radiusY=radiusY;
        minX=EDGE_MARGIN*radiusX;maxX=Math.max(minX,width/2f-minX);
        minY=EDGE_MARGIN*radiusY;maxY=Math.max(minY,height-minY);
        this.homeX=PadMath.clamp(homeX,minX,maxX);this.homeY=PadMath.clamp(homeY,minY,maxY);
        reset();
    }
    void reset(){x=homeX;y=homeY;axisX=axisY=thumbX=thumbY=0;}
    void move(float fingerX,float fingerY,boolean dragging){
        float dx=(fingerX-x)/radiusX,dy=(fingerY-y)/radiusY;
        float distance=(float)Math.hypot(dx,dy);
        if(dragging&&distance>DRAG_RADIUS){
            x=PadMath.clamp(fingerX-dx/distance*DRAG_RADIUS*radiusX,minX,maxX);
            y=PadMath.clamp(fingerY-dy/distance*DRAG_RADIUS*radiusY,minY,maxY);
            dx=(fingerX-x)/radiusX;dy=(fingerY-y)/radiusY;distance=(float)Math.hypot(dx,dy);
        }
        float thumbScale=distance>1?1/distance:1;
        thumbX=dx*thumbScale;thumbY=dy*thumbScale;
        if(distance<=DEAD_ZONE){axisX=axisY=0;return;}
        float magnitude=PadMath.clamp((distance-DEAD_ZONE)/(1-DEAD_ZONE),0,1);
        axisX=dx/distance*magnitude;axisY=dy/distance*magnitude;
    }
}
