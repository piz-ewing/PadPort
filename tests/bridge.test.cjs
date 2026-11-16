const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = ['node-buffer.js','ui-strings.js','bridge.js'].map(name=>fs.readFileSync(path.join(__dirname, '../app/src/main/assets',name), 'utf8')).join('\n');

// Game files as the PadPort server serves them: case-insensitive, 404 when missing.
function fakeServer(files) {
    const requests=[];
    const lookup=url=>{
        const rel=decodeURIComponent(new URL(url).pathname.slice(1)).toLowerCase();
        for(const [name,data] of Object.entries(files)) if(name.toLowerCase()===rel) return data;
        return null;
    };
    class XMLHttpRequest {
        open(method,url,async){this.method=method;this.url=url;this.async=async;}
        overrideMimeType(m){this.mime=m;}
        send(){
            requests.push(this.method+' '+this.url);
            if(this.async!==false) throw Error('fs must use synchronous requests');
            const data=lookup(this.url);
            this.status=data==null?404:200;
            this.responseText=data==null?'Not found':(this.method==='HEAD'?'':
                (this.mime&&this.mime.includes('x-user-defined')?Array.from(data,b=>String.fromCharCode(b|0xf700)).join(''):Buffer.from(data).toString('utf8')));
            this.length=data==null?9:data.length;
        }
        getResponseHeader(h){return h.toLowerCase()==='content-length'?`${this.length}, ${this.length}`:null;}
    }
    return {XMLHttpRequest,requests};
}

function setup(language, files={}) {
    let current={revision:1,paused:false,pads:[null,null,null,null]};
    const events=[], local=new Map(), forage=new Map(), listeners=new Map();
    let clears=0;
    const server=fakeServer(files);
    // Gecko-like fullscreen API: requests outside a user gesture reject.
    class Element { mozRequestFullScreen(){ return Promise.reject(new TypeError('Fullscreen request denied')); } }
    class Document { mozCancelFullScreen(){ return Promise.reject(new TypeError('Not in fullscreen')); } }
    const sandbox={console, Element, Document, Event:class Event{constructor(type){this.type=type;}}, Blob, ArrayBuffer, Uint8Array, URL, AbortController, setTimeout, clearTimeout,
        XMLHttpRequest:server.XMLHttpRequest, document:{baseURI:'https://g1.padport.local/index.html'},
        performance:{now:()=>42}, navigator:{}, __PADPORT_CONFIG__:{title:'Test Game',engine:'MZ',language},
        localStorage:{get length(){return local.size;}, key:i=>[...local.keys()][i],getItem:k=>local.get(k)??null,
            setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},
        localforage:{ready:async()=>{},keys:async()=>[...forage.keys()],getItem:async k=>forage.get(k),
            setItem:async(k,v)=>forage.set(k,v),removeItem:async k=>forage.delete(k)},
        Input:{clear(){clears++;}}, TouchInput:{clear(){}},
        PadPortHost:{snapshot:()=>JSON.stringify(current),log(){},saveError(){},importReady(){}},
        requestAnimationFrame(){},addEventListener(type,callback){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(callback);},dispatchEvent:e=>events.push(e)};
    sandbox.window=sandbox;
    vm.createContext(sandbox);vm.runInContext(source,sandbox);
    return {sandbox,events,local,forage,requests:server.requests,clears:()=>clears,set:x=>current=x,fire:type=>(listeners.get(type)||[]).forEach(fn=>fn({type}))};
}
function pad(id=7,buttons=[]) {return {nativeId:id,id:'Xbox test',index:0,axes:[.75,-1,.2,.4],buttons:Array.from({length:17},(_,i)=>buttons[i]||0)};}

test('native buttons and analog values are Gamepad objects, with zero keyboard events',()=>{
    const t=setup();t.set({revision:2,paused:false,pads:[pad(7,{0:1,6:.8}),null,null,null]});
    const p=t.sandbox.navigator.getGamepads()[0];
    assert.equal(p.mapping,'standard');assert.equal(p.buttons[0].pressed,true);
    assert.equal(p.buttons[6].value,.8);assert.equal(p.axes[0],.75);
    assert.deepEqual(t.events.map(x=>x.type),['gamepadconnected']);
});
test('release, disconnect and slot reuse cannot leave a stuck direction',()=>{
    const t=setup();t.set({revision:2,pads:[pad(7,{12:1})]});
    const old=t.sandbox.navigator.getGamepads()[0];
    t.set({revision:3,pads:[null]});assert.equal(t.sandbox.navigator.getGamepads()[0],null);
    assert.equal(old.connected,false);assert.equal(old.buttons[12].pressed,false);assert.equal(t.clears(),1);
    t.set({revision:4,pads:[pad(8,{1:1})]});assert.equal(t.sandbox.navigator.getGamepads()[0]._nativeId,8);
    assert.deepEqual(t.events.map(x=>x.type),['gamepadconnected','gamepaddisconnected','gamepadconnected']);
});
test('pausing releases buttons and axes even when Android still reports held input',()=>{
    const t=setup();t.set({revision:2,pads:[pad(7,{0:1})],paused:true});
    const p=t.sandbox.navigator.getGamepads()[0];assert.equal(p.buttons[0].value,0);assert.equal(p.axes[0],0);assert.equal(t.clears(),1);
});
test('RPG Maker remains in browser storage mode',()=>{
    const t=setup();assert.equal(typeof t.sandbox.process,'undefined');assert.equal(typeof t.sandbox.nw,'undefined');
    assert.equal(t.sandbox.require('os').userInfo().username,'Player');
    assert.throws(()=>t.sandbox.require('child_process'),/module is unavailable/);
});
test('fullscreen requests (CGMZ Start Fullscreen, F4) cannot stop the game in an already fullscreen player',async()=>{
    const t=setup();
    const body=new t.sandbox.Element(),doc=new t.sandbox.Document();
    // rmmz_core Graphics._requestFullScreen picks the first variant that exists.
    for(const name of ['requestFullScreen','mozRequestFullScreen','webkitRequestFullScreen','requestFullscreen','webkitRequestFullscreen'])
        await assert.doesNotReject(body[name](),name);
    for(const name of ['cancelFullScreen','mozCancelFullScreen','webkitCancelFullScreen','exitFullscreen','webkitExitFullscreen'])
        await assert.doesNotReject(doc[name](),name);
});
test('Look Outside monsterImageExists() works: read-only fs over the game server',()=>{
    const t=setup('en',{'img/enemies/EyeZombies/Zombie_KnifeEye_Far.png_':[1,2,3,4]});
    // verbatim from Look Outside js/plugins/bunchastuff.js - crashed in battle before
    const monsterImageExists=vm.runInContext(`(function monsterImageExists(filename){
        var fs = require ("fs");
        var foundit = fs.existsSync("./img/enemies/" + filename+".png");
        foundit = foundit || fs.existsSync("./img/enemies/" + filename+".png_");
        return foundit;
    })`,t.sandbox);
    assert.equal(monsterImageExists('EyeZombies/Zombie_KnifeEye_Far'),true);
    assert.equal(monsterImageExists('EyeZombies/Zombie_KnifeEye_Close'),false);
    const before=t.requests.length;
    monsterImageExists('EyeZombies/Zombie_KnifeEye_Far');monsterImageExists('EyeZombies/Zombie_KnifeEye_Close');
    assert.equal(t.requests.length,before,'answers are cached for the session');
    assert.ok(t.requests.every(r=>r.startsWith('HEAD https://g1.padport.local/img/enemies/')));
});
test('fs: case-insensitive names, stat, text and binary reads, encoded paths, node: prefix',()=>{
    const t=setup('en',{'data/System.json':[...Buffer.from('{"t":"żółw"}')],'img/pictures/a b#1.png':[0,127,128,255]});
    const fs=t.sandbox.require('node:fs');
    assert.equal(fs.existsSync('DATA\\system.JSON'),true);
    assert.equal(fs.statSync('data/System.json').size,Buffer.from('{"t":"żółw"}').length);
    assert.equal(fs.statSync('nope.txt',{throwIfNoEntry:false}),undefined);
    assert.throws(()=>fs.statSync('nope.txt'),e=>e.code==='ENOENT');
    assert.equal(JSON.parse(fs.readFileSync('./data/System.json','utf8')).t,'żółw');
    assert.deepEqual(Array.from(fs.readFileSync('img/pictures/a b#1.png')),[0,127,128,255]);
    assert.ok(t.requests.some(r=>r.endsWith('/img/pictures/a%20b%231.png')));
    assert.throws(()=>fs.readFileSync('missing.png'),e=>e.code==='ENOENT');
});
test('resource fs refuses writes with a localized message',()=>{
    const en=setup('en'),pl=setup('pl');
    assert.throws(()=>en.sandbox.require('fs').writeFileSync('save/file1.rmmzsave','x'),/read-only/);
    assert.throws(()=>pl.sandbox.require('fs').mkdirSync('save'),/tylko do odczytu/);
    assert.equal(typeof en.sandbox.process,'undefined');
});

test('Node Buffer preserves UTF-8, base64, typed-array and module semantics',()=>{
    const t=setup('zh',{'img/test.png':[0,127,128,255]}), B=t.sandbox.Buffer;
    assert.equal(B.from('cGx1Z2luLW1hcmtlcg==','base64').toString('utf8'),'plugin-marker');
    const value='存档测试 · 😀';
    assert.equal(B.from(B.from(value).toString('base64'),'base64').toString('utf8'),value);
    assert.equal(t.sandbox.require('node:buffer').Buffer,B);
    const bytes=t.sandbox.require('fs').readFileSync('img/test.png');
    assert.equal(B.isBuffer(bytes),true);
    assert.equal(bytes.toString('hex'),'007f80ff');
});

test('load-event marker creation persists, propagates failures and never bypasses resource protection',()=>{
    const t=setup(), files=new Map(), calls=[];
    t.sandbox.PadPortHost.markerFile=request=>{
        const {op,path,value}=JSON.parse(request);calls.push({op,path,value});
        if(op==='marker-stat')return JSON.stringify({ok:true,value:{exists:files.has(path),size:0}});
        if(op==='marker-read')return JSON.stringify({ok:true,value:Buffer.from(files.get(path)).toString('base64')});
        if(op==='marker-open'){
            if(path==='denied')return JSON.stringify({ok:false,code:'EACCES',error:'permission denied'});
            if(files.has(path)&&value==='wx')return JSON.stringify({ok:false,code:'EEXIST',error:'exists'});
            files.set(path,'');return JSON.stringify({ok:true,value:true});
        }
        throw Error(op);
    };
    const script='const fs=require("fs"), name=Buffer.from("cGx1Z2luLW1hcmtlcg==","base64").toString("utf8"); if(fs.existsSync(name)) fs.statSync(name); else fs.closeSync(fs.openSync(name,"wx"));';
    vm.runInContext('{'+script+'}',t.sandbox);
    vm.runInContext('{'+script+'}',t.sandbox);
    assert.equal(files.get('plugin-marker'),'');
    assert.equal(calls.filter(c=>c.op==='marker-open').length,1);
    const f=t.sandbox.require('fs');
    assert.equal(f.statSync('./plugin-marker').isFile(),true);
    assert.equal(f.readFileSync('plugin-marker','utf8'),'');
    const fd=f.openSync('secondMarker','wx');f.closeSync(fd);
    assert.throws(()=>f.closeSync(fd),e=>e.code==='EBADF');
    assert.throws(()=>f.openSync('secondMarker','wx'),e=>e.code==='EEXIST');
    assert.throws(()=>f.openSync('denied','w'),e=>e.code==='EACCES');
    for(const path of ['../escape','/absolute','C:\\file','data/System.json','.hidden','index.html'])
        assert.throws(()=>f.openSync(path,'w'),e=>e.code==='EACCES');
    assert.throws(()=>f.openSync('marker','a'),e=>e.code==='EACCES');
});
test('marker checks reuse metadata across frames and refresh asynchronously without losing newer writes',async()=>{
    const t=setup(), files=new Map([['marker','']]);
    let now=0, sync=0, fail=false;const pending=[];
    t.sandbox.performance.now=()=>now;
    t.sandbox.PadPortHost.markerFile=request=>{
        const {op,path}=JSON.parse(request);sync++;
        if(op==='marker-stat')return JSON.stringify({ok:true,value:{exists:files.has(path),size:0}});
        if(op==='marker-open'){files.set(path,'');return JSON.stringify({ok:true,value:true});}
        throw Error(op);
    };
    t.sandbox.fetch=(url,options)=>{
        assert.equal(new URL(url).pathname,'/__padport__/marker-stat');
        assert.equal(new URL(url).searchParams.get('path'),'marker');
        assert.equal(options.cache,'no-store');
        const result=fail?{ok:false,code:'EACCES',error:'denied'}
            :{ok:true,value:{exists:files.has('marker'),size:0}};
        return new Promise(resolve=>pending.push(()=>resolve({ok:true,json:async()=>result})));
    };
    const flush=()=>new Promise(resolve=>setImmediate(resolve)),f=t.sandbox.require('fs');
    assert.equal(f.existsSync('marker'),true);
    for(let frame=0;frame<60;frame++){now=frame*16;assert.equal(f.existsSync('./marker'),true);}
    assert.equal(sync,1,'one native stat, rather than one per frame');
    now=1001;files.delete('marker');
    for(let frame=0;frame<100;frame++)assert.equal(f.existsSync('marker'),true);
    assert.equal(pending.length,1,'only one background refresh may be in flight');
    assert.equal(sync,1);pending.shift()();await flush();
    assert.equal(f.existsSync('marker'),false,'external deletion becomes visible');
    now=2002;f.existsSync('marker');
    f.closeSync(f.openSync('marker','w'));pending.shift()();await flush();
    assert.equal(f.existsSync('marker'),true,'old missing result cannot overwrite a completed create');
    assert.equal(f.existsSync('MARKER'),true,'case-insensitive checks share the cached metadata');
    now=3003;fail=true;f.existsSync('marker');pending.shift()();await flush();
    assert.throws(()=>f.existsSync('marker'),e=>e.code==='EACCES');
    fail=false;now=4004;assert.throws(()=>f.existsSync('marker'),e=>e.code==='EACCES');
    pending.shift()();await flush();assert.equal(f.existsSync('marker'),true);
    t.sandbox.PadPort.resume();f.existsSync('marker');
    assert.equal(pending.length,1,'resume refreshes external edits without blocking a frame');
    pending.shift()();await flush();
});

test('a stalled marker refresh times out and a later check can refresh again',async()=>{
    const t=setup();let now=0,attempts=0,expire;const timers=new Set();
    t.sandbox.performance.now=()=>now;
    t.sandbox.PadPortHost.markerFile=()=>JSON.stringify({ok:true,value:{exists:true,size:0}});
    t.sandbox.setTimeout=(callback,delay)=>{assert.equal(delay,5000);expire=callback;timers.add(callback);return callback;};
    t.sandbox.clearTimeout=timer=>timers.delete(timer);
    t.sandbox.fetch=(url,{signal})=>{
        attempts++;
        if(attempts===1)return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));
        return Promise.resolve({ok:true,json:async()=>({ok:true,value:{exists:false,size:0}})});
    };
    const flush=()=>new Promise(resolve=>setImmediate(resolve)),f=t.sandbox.require('fs');
    assert.equal(f.existsSync('marker'),true);now=1001;f.existsSync('marker');
    now=6001;expire();await flush();
    assert.equal(timers.size,0);assert.throws(()=>f.existsSync('marker'),e=>e.name==='AbortError');
    now=7002;assert.throws(()=>f.existsSync('marker'),e=>e.name==='AbortError');
    await flush();assert.equal(f.existsSync('marker'),false);
    assert.equal(attempts,2);assert.equal(timers.size,0);
});

test('path helpers used next to fs',()=>{
    const p=setup().sandbox.require('path');
    assert.equal(p.join('img/','enemies','a.png'),'img/enemies/a.png');
    assert.equal(p.dirname('img/enemies/a.png'),'img/enemies');
    assert.equal(p.basename('img/enemies/a.png','.png'),'a');
    assert.equal(p.extname('a.png_'),'.png_');
});
test('save export/import round trip covers MV localStorage and MZ localforage',async()=>{
    const t=setup();t.local.set('RPG File1','żółw\\n😀');t.forage.set('rmmzsave.123.file1','compressed==');
    const backup=await t.sandbox.PadPort.collectSaves();t.local.clear();t.forage.clear();
    await t.sandbox.PadPort.importSaves(backup);
    assert.equal(t.local.get('RPG File1'),'żółw\\n😀');assert.equal(t.forage.get('rmmzsave.123.file1'),'compressed==');
    await assert.rejects(t.sandbox.PadPort.importSaves({...backup,title:'Other game'}),/another game/);
});
test('a failed import restores the slots already written',async()=>{
    const t=setup();t.local.set('slot','original');t.forage.set('slot','old');
    const save=t.sandbox.localforage.setItem;
    t.sandbox.localforage.setItem=async(k,v)=>{if(v==='FAIL')throw Error('disk');return save(k,v);};
    await assert.rejects(t.sandbox.PadPort.importSaves({format:'PadPort saves',version:1,title:'Test Game',engine:'MZ',local:{slot:'new'},forage:{slot:'FAIL'}}));
    assert.equal(t.local.get('slot'),'original');assert.equal(t.forage.get('slot'),'old');
});

function graphics(t,width=816,height=624) {
    let updates=0;
    const g={_width:width,_height:height,_canvas:{},_stretchEnabled:false,_realScale:1,
        _updateRealScale(){this._realScale=.9;},
        _updateAllElements(){updates++;this._updateRealScale();this.drawWidth=this._width*this._realScale;this.drawHeight=this._height*this._realScale;}};
    t.sandbox.Graphics=g;
    return {g,updates:()=>updates};
}
test('game fills the available height without MZ mobile padding or aspect distortion',()=>{
    const t=setup(),{g,updates}=graphics(t);
    Object.assign(t.sandbox,{innerWidth:1920,innerHeight:1080});
    assert.equal(t.sandbox.PadPort.fitToViewport(),true);
    assert.equal(g.drawHeight,1080);
    assert.ok(g.drawWidth<1920);
    assert.equal(g.drawWidth/g.drawHeight,816/624);
    assert.equal(g._width,816);assert.equal(g._height,624);
    for(let i=0;i<10;i++)t.sandbox.navigator.getGamepads();
    assert.equal(updates(),1,'unchanged frames must not reset/reallocate the canvas');
});
test('fit scales up/down and reacts to viewport or game-resolution changes',()=>{
    const t=setup(),{g}=graphics(t,1280,720);
    for(const [width,height] of [[1920,1080],[640,480],[800,1280]]) {
        Object.assign(t.sandbox,{innerWidth:width,innerHeight:height});
        t.sandbox.PadPort.fitToViewport();
        assert.equal(g._realScale,Math.min(width/1280,height/720));
        assert.ok(g.drawWidth<=width+1e-9 && g.drawHeight<=height+1e-9);
        assert.ok(Math.abs(g.drawWidth-width)<1e-9 || Math.abs(g.drawHeight-height)<1e-9);
    }
    g._width=640;g._height=480;t.sandbox.PadPort.fitToViewport();
    assert.equal(g.drawWidth,800);assert.equal(g.drawHeight,600);
});
test('late plugin integer scaling cannot reintroduce unused screen margins',()=>{
    const t=setup(),{g}=graphics(t);
    Object.assign(t.sandbox,{innerWidth:1920,innerHeight:1080});
    t.sandbox.PadPort.fitToViewport();
    g._updateRealScale=function(){this._realScale=1.5;};g._updateAllElements();
    t.sandbox.PadPort.fitToViewport();assert.equal(g.drawHeight,1080);
});
test('English is the default WebView language; Polish localizes messages',()=>{
    const english=setup(),polish=setup('pl'),unknown=setup('fr');
    assert.equal(english.sandbox.PadPortI18n.language,'en');
    assert.equal(unknown.sandbox.PadPortI18n.language,'en');
    assert.equal(english.sandbox.PadPortI18n.text('tester_heading'),'What does the game see?');
    assert.equal(polish.sandbox.PadPortI18n.text('tester_heading'),'Co widzi gra?');
    assert.throws(()=>polish.sandbox.require('child_process'),/niedostępny moduł/);
});
test('changing app language preserves the backup format and game identity',async()=>{
    const english=setup('en'),polish=setup('pl');english.local.set('RPG File1','existing save');
    const backup=await english.sandbox.PadPort.collectSaves();
    await polish.sandbox.PadPort.importSaves(backup);
    assert.equal(polish.local.get('RPG File1'),'existing save');
    assert.equal(backup.format,'PadPort saves');
});
test('keyboard mode hides gamepads so a press is not delivered twice',()=>{
    const t=setup();t.set({revision:2,inputMode:'keyboard',paused:false,pads:[pad(7,{0:1})]});
    assert.equal(t.sandbox.navigator.getGamepads().filter(Boolean).length,0);
    assert.equal(t.sandbox.PadPort.inputMode(),'keyboard');
    assert.equal(t.events.length,0,'native WebView events, not this bridge, deliver keyboard input');
});
test('switching modes disconnects the old gamepad before the first keyboard listener',()=>{
    const t=setup();t.set({revision:2,inputMode:'gamepad',pads:[pad(7,{0:1})]});
    t.sandbox.navigator.getGamepads();
    t.set({revision:3,inputMode:'keyboard',pads:[pad(7,{0:1})]});t.fire('keydown');
    assert.equal(t.sandbox.PadPort.inputMode(),'keyboard');
    assert.deepEqual(t.events.map(e=>e.type),['gamepadconnected','gamepaddisconnected']);
    assert.equal(t.sandbox.navigator.getGamepads().filter(Boolean).length,0);
    t.set({revision:4,inputMode:'gamepad',pads:[pad(7,{0:1})]});
    assert.equal(t.sandbox.navigator.getGamepads()[0].buttons[0].pressed,true);
});
