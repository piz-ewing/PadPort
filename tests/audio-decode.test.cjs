const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/audio-decode.js'),'utf8');

function setup(renderer='gecko') {
    const tasks=[];let active=0,peak=0;
    class BaseAudioContext {
        decodeAudioData(data,success,failure) {
            if(!(this instanceof BaseAudioContext))throw new TypeError('Invalid receiver');
            if(!(data instanceof ArrayBuffer))throw new TypeError('Invalid audio data');
            if(success!=null&&typeof success!=='function')throw new TypeError('Invalid callback');
            if(data.byteLength===0)return Promise.reject(new DOMException('Detached audio data','DataCloneError'));
            const content=structuredClone(data,{transfer:[data]});
            active++;peak=Math.max(peak,active);
            return new Promise((resolve,reject)=>tasks.push({context:this,content,
                finish(value) {active--;if(success)success(value);resolve(value);},
                fail(error) {active--;if(failure)failure(error);reject(error);}}));
        }
    }
    const original=BaseAudioContext.prototype.decodeAudioData;
    const sandbox={BaseAudioContext,ArrayBuffer,DOMException,structuredClone,__PADPORT_CONFIG__:{renderer}};
    sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox);
    return {sandbox,tasks,original,context:new BaseAudioContext(),peak:()=>peak,
        flush:async()=>{await Promise.resolve();await Promise.resolve();}};
}

test('audio bursts share four native decoder slots across contexts',async()=>{
    const t=setup(),other=new t.sandbox.BaseAudioContext();
    const buffers=Array.from({length:128},()=>new ArrayBuffer(16));
    const results=buffers.map((b,i)=>(i%2?t.context:other).decodeAudioData(b));
    assert.ok(buffers.every(b=>b.byteLength===0));
    assert.equal(t.tasks.length,4);
    let completed=0;
    while(completed<128) {
        const current=t.tasks.splice(0);assert.ok(current.length>0);
        for(const task of current)task.finish(completed++);
        await t.flush();
    }
    assert.equal(t.peak(),4);assert.equal((await Promise.all(results)).length,128);
});

test('callbacks retain their context and promise results',async()=>{
    const t=setup();let calls=0;const output={duration:2};
    const result=t.context.decodeAudioData(new ArrayBuffer(8),value=>{calls++;assert.equal(value,output);});
    assert.equal(t.tasks[0].context,t.context);
    t.tasks.shift().finish(output);assert.equal(await result,output);assert.equal(calls,1);
});

test('decode errors reject and notify the caller while queued work continues',async()=>{
    const t=setup();const error=new DOMException('Invalid audio','EncodingError');let failures=0;
    const first=t.context.decodeAudioData(new ArrayBuffer(8),null,e=>{assert.equal(e,error);failures++;});
    const rejected=assert.rejects(first,e=>e===error);
    const rest=Array.from({length:5},()=>t.context.decodeAudioData(new ArrayBuffer(8)));
    t.tasks.shift().fail(error);await rejected;await t.flush();
    while(t.tasks.length){for(const task of t.tasks.splice(0))task.finish('ok');await t.flush();}
    assert.deepEqual(await Promise.all(rest),Array(5).fill('ok'));assert.equal(failures,1);
});

test('invalid inputs preserve native validation and do not block later work',async()=>{
    const t=setup(),decode=t.sandbox.BaseAudioContext.prototype.decodeAudioData;
    assert.throws(()=>decode.call({},new ArrayBuffer(8)),TypeError);
    assert.throws(()=>t.context.decodeAudioData('invalid'),TypeError);
    assert.throws(()=>t.context.decodeAudioData(new ArrayBuffer(8),3),TypeError);
    const data=new ArrayBuffer(8);structuredClone(data,{transfer:[data]});
    await assert.rejects(t.context.decodeAudioData(data),{name:'DataCloneError'});
    const next=t.context.decodeAudioData(new ArrayBuffer(8));t.tasks.shift().finish('ok');
    assert.equal(await next,'ok');
});

test('wrapper installs once and leaves WebView decoder behavior intact',()=>{
    const t=setup(),installed=t.sandbox.BaseAudioContext.prototype.decodeAudioData;
    vm.runInContext(source,t.sandbox);assert.equal(t.sandbox.BaseAudioContext.prototype.decodeAudioData,installed);
    const webview=setup('webview');
    assert.equal(webview.sandbox.BaseAudioContext.prototype.decodeAudioData,webview.original);
});
