const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/runtime-debug.js'),'utf8');

function setup(enabled=false){
    const intervals=new Map(),listeners=new Map(),reports=[];let next=0;
    class XMLHttpRequest{
        constructor(){this.events=new Map();}
        open(method,url){this.url=url;}
        send(){if(this.url==='throw')throw new Error('send failed');return 42;}
        addEventListener(type,callback){this.events.set(type,callback);}
        finish(status){this.status=status;this.events.get('loadend')();}
    }
    const originalOpen=XMLHttpRequest.prototype.open,originalSend=XMLHttpRequest.prototype.send;
    const sandbox={XMLHttpRequest,document:{visibilityState:'visible'},
        __PADPORT_CONFIG__:{debug:enabled},PadPortHost:{debugState:payload=>reports.push(JSON.parse(payload)),
            snapshot:()=>JSON.stringify({revision:7,paused:false,inputMode:'gamepad'})},
        setInterval:callback=>{const id=++next;intervals.set(id,callback);return id;},
        clearInterval:id=>intervals.delete(id),
        addEventListener:(type,callback)=>listeners.set(type,callback),
        removeEventListener:(type,callback)=>{if(listeners.get(type)===callback)listeners.delete(type);},
        SceneManager:{_scene:{constructor:{name:'Scene_Map'},_active:true},_sceneStarted:true,_stopped:false},
        Graphics:{frameCount:20},Input:{_currentState:{ok:true,left:false}},WebAudio:{_context:{state:'running'}}};
    sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox);
    return {sandbox,intervals,listeners,reports,originalOpen,originalSend,
        tick(){for(const callback of intervals.values())callback();}};
}

test('disabled debugging leaves request methods and timers untouched',()=>{
    const t=setup();assert.equal(t.intervals.size,0);assert.equal(t.reports.length,0);
    assert.equal(t.sandbox.XMLHttpRequest.prototype.open,t.originalOpen);
    assert.equal(t.sandbox.XMLHttpRequest.prototype.send,t.originalSend);
    assert.equal(t.listeners.size,0);
});

test('live activation records frozen frames and event waits without advancing the engine',()=>{
    const t=setup();
    t.sandbox.$gameMap={_interpreter:{_index:3,_list:[null,null,null,{code:231}],_waitMode:'image',_waitCount:0,
        _childInterpreter:{_index:0,_list:[{code:101}],_waitMode:'message',_waitCount:0}}};
    t.sandbox.ImageManager={_imageCache:{_items:{image:{bitmap:{_url:'img/pictures/example.png',_loadingState:'requesting'}}}}};
    t.sandbox.PadPortDebug.setEnabled(true);t.tick();
    const state=t.reports.at(-1).samples.at(-1);
    assert.equal(state.frameDelta,0);assert.equal(state.scene,'Scene_Map');
    assert.deepEqual(state.interpreters.map(i=>i.waitMode),['image','message']);
    assert.equal(state.images[0].state,'requesting');assert.deepEqual(state.pressed,['ok']);
    assert.equal(state.native.paused,false);assert.equal(state.native.inputMode,'gamepad');
    t.sandbox.Graphics.frameCount+=60;t.sandbox.PadPortDebug.snapshot();t.tick();
    assert.equal(t.reports.at(-1).samples.at(-1).frameDelta,60);
    assert.equal(t.sandbox.SceneManager._stopped,false);
    assert.equal(t.sandbox.$gameMap._interpreter._index,3);
});

test('pending XHR tracking preserves results, cleans failures and restores original methods',()=>{
    const t=setup(true),xhr=new t.sandbox.XMLHttpRequest();xhr.open('GET','data/example.json');
    assert.equal(xhr.send(),42);t.tick();assert.equal(t.reports.at(-1).samples.at(-1).requests.length,1);
    xhr.finish(404);t.tick();assert.equal(t.reports.at(-1).samples.at(-1).requests.length,0);
    assert.match(t.reports.at(-1).errors[0].error,/HTTP 404/);
    assert.ok(t.reports.at(-1).errors[0].error.includes('XHR GET data/example.json'));
    const failed=new t.sandbox.XMLHttpRequest();failed.open('GET','throw');assert.throws(()=>failed.send(),/send failed/);
    assert.equal(t.sandbox.PadPortDebug.snapshot().requests.length,0);
    t.sandbox.PadPortDebug.setEnabled(false);
    assert.equal(t.intervals.size,0);assert.equal(t.listeners.size,0);
    assert.equal(t.sandbox.XMLHttpRequest.prototype.open,t.originalOpen);
    assert.equal(t.sandbox.XMLHttpRequest.prototype.send,t.originalSend);
    t.sandbox.PadPortDebug.setEnabled(true);assert.equal(t.intervals.size,1);
    assert.equal(t.reports.at(-1).samples.length,1);
});

test('runtime history is bounded and retains error stacks and stopped state',()=>{
    const t=setup(true);
    t.sandbox.SceneManager._stopped=true;t.sandbox.SceneManager._freeze=true;
    t.listeners.get('error')({error:{stack:'Error: example\n at update (example.js:2)'}});
    t.listeners.get('unhandledrejection')({reason:'rejected'});
    for(let i=0;i<40;i++)t.tick();
    const report=t.reports.at(-1);assert.equal(report.samples.length,10);
    assert.match(report.errors[0].error,/at update/);assert.equal(report.errors[1].error,'rejected');
    assert.equal(report.samples.at(-1).stopped,true);assert.equal(report.samples.at(-1).frozen,true);
    t.sandbox.PadPortDebug.setEnabled(false);const count=t.reports.length;t.tick();assert.equal(t.reports.length,count);
});

test('Gecko debug commands enable the same diagnostics in a running page',()=>{
    const t=setup(),handlers=new Map();delete t.sandbox.PadPortHost;
    t.sandbox.PadPort={};t.sandbox.EventSource=class{addEventListener(type,callback){handlers.set(type,callback);}};
    t.sandbox.fetch=async()=>({});
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../app/src/main/assets/gecko-host.js'),'utf8'),t.sandbox);
    handlers.get('cmd')({data:'debug:true'});assert.equal(t.intervals.size,1);
    handlers.get('cmd')({data:'debug:false'});assert.equal(t.intervals.size,0);
});

test('request wrappers installed by plugins survive repeated debug toggles',()=>{
    const t=setup(true),proto=t.sandbox.XMLHttpRequest.prototype;
    const wrapped=proto.send;let calls=0;
    proto.send=function(){calls++;return wrapped.apply(this,arguments);};
    const pluginSend=proto.send;
    t.sandbox.PadPortDebug.setEnabled(false);assert.equal(proto.send,pluginSend);
    t.sandbox.PadPortDebug.setEnabled(true);
    const xhr=new t.sandbox.XMLHttpRequest();xhr.open('GET','data/example.json');
    assert.equal(xhr.send(),42);assert.equal(calls,1);
    xhr.finish(200);t.sandbox.PadPortDebug.setEnabled(false);assert.equal(proto.send,pluginSend);
});

test('completed requests from a disabled session do not enter a new report',()=>{
    const t=setup(true),xhr=new t.sandbox.XMLHttpRequest();xhr.open('GET','data/old.json');xhr.send();
    t.sandbox.PadPortDebug.setEnabled(false);t.sandbox.PadPortDebug.setEnabled(true);
    xhr.finish(404);t.tick();assert.equal(t.reports.at(-1).errors.length,0);
});

test('large diagnostic input stays within the native report size limit',()=>{
    const t=setup(true);
    t.sandbox.ImageManager={_cache:Object.fromEntries(Array.from({length:12},(_,i)=>[i,{_url:'x'.repeat(2000),_loadingState:'requesting'}]))};
    for(let i=0;i<12;i++)t.listeners.get('error')({message:'e'.repeat(10000)});
    for(let i=0;i<12;i++)t.tick();
    const report=t.reports.at(-1);
    assert.ok(Buffer.byteLength(JSON.stringify(report),'utf8')<=32768);
    assert.equal(report.samples.at(-1).images.length,12);
    assert.ok(report.errors.length>0);
});
