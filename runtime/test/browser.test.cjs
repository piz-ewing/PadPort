'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
const WebSocket = require('ws');
const LZString = require('lz-string');
const pako = require('pako');
const asar = require('@electron/asar');
const {RuntimeServer} = require('../src/server.cjs');
const {build} = require('../build.cjs');

const edge = process.env.CHROMIUM_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class Page {
    constructor(url) {
        this.socket = new WebSocket(url);
        this.ready = once(this.socket, 'open');
        this.pending = new Map();
        this.errors = [];
        this.sequence = 0;
        this.socket.on('message', data => {
            const message = JSON.parse(data);
            if (message.id) {
                const pending = this.pending.get(message.id);
                if (!pending) return;
                this.pending.delete(message.id);
                clearTimeout(pending.timeout);
                if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
                else pending.resolve(message.result);
            } else if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails);
        });
    }
    async call(method, params = {}, timeoutMs = 10000) {
        await this.ready;
        const id = ++this.sequence;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, timeoutMs);
            this.pending.set(id, {resolve, reject, timeout});
            this.socket.send(JSON.stringify({id, method, params}));
        });
    }
    async eval(expression) {
        const result = await this.call('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
        if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
        return result.result.value;
    }
    async navigate(url) {
        await this.call('Page.navigate', {url});
        for (let attempt = 0; attempt < 100; attempt++) {
            if (await this.eval('!!window.StorageManager && !!window.PadPortRuntime')) return;
            await delay(50);
        }
        throw new Error('Runtime did not load: ' + JSON.stringify(this.errors));
    }
}

test('Chromium uses the engine file storage, preserving saves across page and server restarts', {skip: !fs.existsSync(edge), timeout: 90000}, async t => {
    await build();
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-browser-'));
    const root = path.join(folder, 'game/www');
    fs.mkdirSync(path.join(root, 'js'), {recursive: true});
    fs.mkdirSync(path.join(root, 'modules'), {recursive: true});
    fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><html><head></head><body>' +
        '<script src="lz.js"></script><script src="js/rpg_core.js"></script>' +
        '<script src="storage.js"></script></body></html>');
    fs.writeFileSync(path.join(root, 'js/rpg_core.js'),
        'window.Utils={isNwjs:()=>typeof require==="function" && typeof process==="object"};' +
        'String.prototype.format=function(value){return this.replace("%1",value)};');
    fs.copyFileSync(require.resolve('lz-string/libs/lz-string.js'), path.join(root, 'lz.js'));
    fs.copyFileSync(path.join(__dirname, 'fixtures/mv-storage.js'), path.join(root, 'storage.js'));
    fs.writeFileSync(path.join(root, 'modules/value.json'), '{"value":7}');
    fs.writeFileSync(path.join(root, 'modules/main.js'), 'exports.value=require("./value").value; exports.local=__dirname;');
    const profile = path.join(folder, 'browser');
    const browser = spawn(edge, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
        '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], {stdio: 'ignore', windowsHide: true});
    let server, page;
    t.after(async () => {
        if (server) await server.close();
        if (page) {
            await page.call('Browser.close');
            page.socket.close();
        } else browser.kill();
        if (browser.exitCode === null) await once(browser, 'exit');
        await fs.promises.rm(folder, {recursive: true, force: true, maxRetries: 10, retryDelay: 200});
    });
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt++) await delay(50);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
    page = new Page(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await page.call('Runtime.enable');
    await page.call('Page.enable');
    const start = async folder => {
        server = await new RuntimeServer({folder, id: '0123456789abcdef',
            assets: path.resolve(__dirname, '../../app/src/main/assets')}).listen(0);
        await page.navigate(server.url());
    };
    await start(path.dirname(root));
    assert.equal(await page.eval('process.cwd()'), '/game/www');
    assert.deepEqual(await page.eval('require("fs").readdirSync("./js/")'), ['rpg_core.js']);
    assert.equal(await page.eval('require("fs").statSync("./js/rpg_core.js").isFile()'), true);
    assert.equal(await page.eval('require("fs").readFileSync("./modules/value.json","utf8")'), '{"value":7}');
    assert.equal(await page.eval('require("path").resolve("./js")'), '/game/www/js');
    assert.equal(await page.eval('StorageManager.isLocalMode()'), true);
    assert.deepEqual(await page.eval('[nw.App.argv.length, nw.App.fullArgv.length, require("nw.gui").App.argv.length]'), [0, 0, 0]);
    assert.equal(await page.eval('StorageManager.localFileDirectoryPath()'), '/game/www/save/');
    const json = JSON.stringify({title: 'Chapter 2', text: '章节标题', variables: [3, 5]});
    assert.equal(await page.eval('StorageManager.save(5,' + JSON.stringify(json) + '); StorageManager.load(5)'), json);
    assert.equal(fs.readFileSync(path.join(root, 'save/file5.rpgsave'), 'utf8'), LZString.compressToBase64(json));
    assert.equal(await page.eval('localStorage.length'), 0);
    assert.deepEqual(await page.eval(`(() => {
        const fs = require('fs'), extra = require('fs-extra');
        extra.outputJsonSync('/game/checks/config.json', {value:7});
        const entry = fs.readdirSync('/game/checks', {withFileTypes:true})[0];
        fs.writeFileSync('/game/checks/encoded', '章节', 'utf16le');
        fs.renameSync('/game/checks/encoded', '/game/checks/renamed');
        fs.appendFileSync('/game/checks/renamed', '!', 'utf16le');
        const output = fs.readFileSync('/game/checks/renamed', 'utf16le');
        const fd = fs.openSync('/game/checks/renamed', 'r');
        const buffer = Buffer.alloc(2); fs.readSync(fd,buffer,0,2,0); fs.closeSync(fd);
        return [extra.readJsonSync('/game/checks/config.json').value, entry instanceof fs.Dirent,
            entry.isFile(), fs.statSync('/game/checks/config.json') instanceof fs.Stats, output];
    })()`), [7, true, true, true, '章节!']);
    assert.equal(await page.eval(`(async () => {
        const fs = require('fs'); await fs.promises.writeFile('/game/checks/promise', 'first');
        fs.writeFileSync('/game/checks/promise','second'); return fs.promises.readFile('/game/checks/promise','utf8');
    })()`), 'second');
    let fileRequests = 0;
    const fileCommand = server.fileCommand.bind(server);
    server.fileCommand = command => { fileRequests++; return fileCommand(command); };
    assert.equal(await page.eval(`(() => {
        const fs = require('fs'); fs.readFileSync('/game/checks/promise');
        for(let i=0;i<36000;i++) { fs.existsSync('/game/checks/promise'); navigator.getGamepads(); }
        return fs.readFileSync('/game/checks/promise','utf8');
    })()`), 'second');
    assert.ok(fileRequests <= 2, 'repeated input and file probes must reuse delivered state and file cache');
    server.publish({revision:1, paused:false, pads:[{nativeId:7,id:'Controller',axes:[0.5,0,0,0],buttons:[1]}]});
    for(let i=0;i<100 && !await page.eval('navigator.getGamepads()[0]?.buttons[0].pressed');i++) await delay(10);
    assert.equal(await page.eval('navigator.getGamepads()[0].axes[0]'), 0.5);
    assert.equal(await page.eval(`(() => {
        const context = new AudioContext(); window.testAudioContext=context;
        return context.state;
    })()`), 'running');
    await page.eval('PadPort.pause()');
    assert.equal(await page.eval('testAudioContext.state'), 'suspended');
    await page.eval('PadPort.resume()');
    assert.equal(await page.eval('testAudioContext.state'), 'running');
    await page.eval('testAudioContext.close()');
    assert.deepEqual(await page.eval(`(async () => {
        const bytes=new ArrayBuffer(16044), view=new DataView(bytes);
        const text=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i))};
        text(0,"RIFF"); view.setUint32(4,16036,true); text(8,"WAVEfmt ");
        view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
        view.setUint32(24,8000,true); view.setUint32(28,16000,true);
        view.setUint16(32,2,true); view.setUint16(34,16,true); text(36,"data"); view.setUint32(40,16000,true);
        const url=URL.createObjectURL(new Blob([bytes],{type:"audio/wav"}));
        const audio=document.createElement("audio"); audio.loop=true; document.body.appendChild(audio);
        try {
            for(let i=0;i<4;i++) {
                audio.src=url;
                const playing=audio.play();
                const paused=PadPort.pause();
                await playing; await paused;
                if(!audio.paused || !audio.muted) throw new Error("Background media must be paused and muted");
                await PadPort.resume();
                if(audio.paused || audio.muted) throw new Error("Foreground media must resume with original mute state");
            }
            return [audio.paused,audio.muted];
        } finally { audio.pause(); audio.remove(); URL.revokeObjectURL(url); }
    })()`), [false,false]);
    assert.deepEqual(await page.eval(`(() => {
        const canvas = document.createElement('canvas'), gl = canvas.getContext('webgl');
        if (!gl) throw new Error('WebGL is required');
        const getParameter = gl.getParameter.bind(gl);
        gl.getParameter = name => name === gl.MAX_TEXTURE_SIZE ? 64 : getParameter(name);
        const source = document.createElement('canvas'); source.width=96; source.height=32;
        const ctx=source.getContext('2d'); ctx.fillStyle='#ff0000'; ctx.fillRect(0,0,96,32);
        const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
        const frame=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,frame);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
        const pixel=new Uint8Array(4); gl.readPixels(63,31,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
        const first=Array.from(pixel);
        ctx.fillStyle='#0000ff'; ctx.fillRect(0,0,96,32);
        gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);
        gl.readPixels(63,31,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
        const error=gl.getError(); gl.deleteFramebuffer(frame); gl.deleteTexture(texture);
        return [first,Array.from(pixel),error];
    })()`), [[255,0,0,255],[0,0,255,255],0]);
    assert.equal(await page.eval(`(() => {
        const gl=document.createElement('canvas').getContext('webgl');
        const vertex=gl.createShader(gl.VERTEX_SHADER), fragment=gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(vertex, '#version 300 es\\nin vec2 position;\\nout vec2 uv;\\nvoid main(){uv=position; gl_Position=vec4(position,0.0,1.0);}');
        gl.shaderSource(fragment,'#version 300 es\\nprecision mediump float;\\nin vec2 uv;\\nout vec4 color;\\nvoid main(){color=vec4(uv,0.0,1.0);}');
        gl.compileShader(vertex); gl.compileShader(fragment);
        const program=gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program);
        const success=gl.getProgramParameter(program,gl.LINK_STATUS);
        if(!success) throw new Error(gl.getProgramInfoLog(program)+' '+gl.getShaderInfoLog(fragment));
        gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); return success;
    })()`), true);
    assert.deepEqual(await page.eval(`(() => {
        const fs=require('fs'), bytes=Buffer.from('save payload');
        const file='/game/checks/current.rmmzsave', packed=require('zlib').deflateSync(bytes,{level:1});
        fs.writeFileSync(file,packed); const fd=fs.openSync(file,'r+');
        const stat=fs.fstatSync(fd); fs.closeSync(fd);
        return [require('zlib').inflateSync(fs.readFileSync(file)).toString(), stat instanceof fs.Stats,
            fs.statSync('/game/missing',{throwIfNoEntry:false}) === undefined];
    })()`), ['save payload',true,true]);
    await page.eval('StorageManager.backup(5); StorageManager.save(5,"changed"); StorageManager.restoreBackup(5)');
    assert.equal(await page.eval('StorageManager.load(5)'), json);
    assert.deepEqual(await page.eval('require("./modules/main")'), {value: 7, local: '/game/www/modules'});
    assert.equal(await page.eval('require("path").win32.normalize("C:/a/../b")'), 'C:\\b');
    assert.equal(await page.eval('require("zlib").inflateSync(require("zlib").deflateSync(Buffer.from("test 章节"))).toString()'), 'test 章节');
    const listenPort = new URL(server.origin).port;
    await page.eval('require("fs").openSync("/game/checks/promise","r")');
    assert.equal(server.handles.size, 1);
    await page.call('Page.navigate',{url:'about:blank'});
    for(let i=0;i<100 && server.handles.size;i++) await delay(10);
    assert.equal(server.handles.size,0);
    await server.close(); server = null;
    server = await new RuntimeServer({folder: path.dirname(root), id: '0123456789abcdef',
        assets: path.resolve(__dirname, '../../app/src/main/assets')}).listen(Number(listenPort));
    await page.navigate(server.url());
    assert.equal(await page.eval('StorageManager.load(5)'), json);
    await server.close(); server = null;
    const mz = path.join(folder, 'mz');
    fs.mkdirSync(path.join(mz, 'js'), {recursive: true});
    fs.writeFileSync(path.join(mz, 'js/rmmz_core.js'),
        'window.Utils={isNwjs:()=>typeof require==="function" && typeof process==="object"}; window.JsonEx=JSON;');
    fs.copyFileSync(require.resolve('pako/dist/pako.js'), path.join(mz, 'pako.js'));
    fs.copyFileSync(path.join(__dirname, 'fixtures/mz-storage.js'), path.join(mz, 'storage.js'));
    fs.writeFileSync(path.join(mz, 'index.html'), '<html><head></head><body>' +
        '<canvas id="scene" width="160" height="120"></canvas><script src="js/rmmz_core.js"></script>' +
        '<script src="pako.js"></script><script src="storage.js"></script><script>' +
        'window.Graphics={_canvas:document.getElementById("scene"),_width:160,_height:120,' +
        '_updateAllElements(){this._updateRealScale()}};</script></body></html>');
    await start(mz);
    assert.equal(await page.eval('StorageManager.isLocalMode()'), true);
    const object = JSON.parse(json);
    const saveObject = 'StorageManager.saveObject("file5",' + json + ')';
    await page.eval(saveObject);
    assert.deepEqual(await page.eval('StorageManager.loadObject("file5")'), object);
    assert.deepEqual(JSON.parse(pako.inflate(fs.readFileSync(path.join(mz, 'save/file5.rmmzsave'), 'utf8'), {to: 'string'})), object);
    await page.eval(saveObject);
    assert.equal(fs.existsSync(path.join(mz, 'save/file5.rmmzsave_')), false);
    const write = server.files.write.bind(server.files);
    let failWrite = true;
    server.files.write = (file, ...args) => {
        if (failWrite && file.endsWith('/file5.rmmzsave')) {
            failWrite = false;
            throw Object.assign(new Error('Injected write failure'), {code: 'ENOSPC'});
        }
        return write(file, ...args);
    };
    assert.equal(await page.eval('StorageManager.saveObject("file5",{value:"replacement"}).then(()=>"unexpected",error=>error.code)'), 'ENOSPC');
    assert.deepEqual(await page.eval('StorageManager.loadObject("file5")'), object);
    server.files.write = write;
    const waitReleased = async () => {
        for (let i = 0; i < 100 && (server.handles.size || server.listeners.size); i++) await delay(10);
        assert.equal(server.handles.size, 0);
        assert.equal(server.listeners.size, 0);
    };
    for (let iteration = 0; iteration < 8; iteration++) {
        await page.eval('require("fs").openSync(StorageManager.filePath("file5"),"r"); window.cycleAudio=new AudioContext()');
        assert.equal(await page.eval('Promise.all([PadPort.pause(),PadPort.resume(),PadPort.pause(),PadPort.resume()]).then(()=>cycleAudio.state)'), 'running');
        await page.call('Page.navigate', {url: 'about:blank'});
        await waitReleased();
        await page.navigate(server.url());
        assert.deepEqual(await page.eval('StorageManager.loadObject("file5")'), object);
    }
    let sceneRequests = 0;
    const sceneCommand = server.fileCommand.bind(server);
    server.fileCommand = command => { sceneRequests++; return sceneCommand(command); };
    await page.call('HeapProfiler.collectGarbage');
    const before = await page.call('Memory.getDOMCounters');
    const scene = await page.call('Runtime.evaluate', {awaitPromise: true, returnByValue: true, expression: `new Promise(resolve => {
        const canvas=document.getElementById('scene'), ctx=canvas.getContext('2d'), intervals=[];
        let started=performance.now(), previous=started, frames=0;
        function tick(now) {
            intervals.push(now-previous); previous=now;
            ctx.fillStyle=frames%2?'#004080':'#802000'; ctx.fillRect(0,0,160,120);
            navigator.getGamepads(); frames++;
            if(now-started<20000) requestAnimationFrame(tick);
            else {
                intervals.sort((a,b)=>a-b);
                resolve({frames,elapsed:now-started,p95:intervals[Math.floor(intervals.length*.95)]});
            }
        }
        requestAnimationFrame(tick);
    })`}, 30000);
    assert.equal(scene.exceptionDetails, undefined);
    assert.equal(sceneRequests, 0, 'rendering and input consumption must not issue filesystem commands');
    await page.call('HeapProfiler.collectGarbage');
    const after = await page.call('Memory.getDOMCounters');
    assert.equal(after.documents, before.documents);
    assert.equal(after.nodes, before.nodes);
    assert.equal(after.jsEventListeners, before.jsEventListeners);
    t.diagnostic('Synthetic Chromium scene: ' + JSON.stringify(scene.result.value));
    await page.call('Page.navigate', {url: 'about:blank'});
    await waitReleased();
    await server.close(); server = null;
    const packaged = path.join(folder, 'packed'); fs.mkdirSync(packaged);
    fs.mkdirSync(path.join(root, 'save'), {recursive: true});
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({main: 'main.cjs'}));
    fs.writeFileSync(path.join(root, 'preload.cjs'),
        'const {contextBridge,ipcRenderer}=require("electron");' +
        'contextBridge.exposeInMainWorld("preloaded", {directory:__dirname, filename:__filename,' +
        'kind:require("./modules/context.cjs"),' +
        'echo:value=>ipcRenderer.invoke("echo",value)});' +
        'process.once("loaded",()=>{window.preloadLoaded=true});');
    fs.writeFileSync(path.join(root, 'modules/context.cjs'),
        'module.exports=require("electron").ipcRenderer?"renderer":"main";');
    fs.writeFileSync(path.join(root, 'main.cjs'),
        'const {app,BrowserWindow,ipcMain}=require("electron"),path=require("path");' +
        'window.mainKind=require("./modules/context.cjs");' +
        'ipcMain.handle("echo",(event,value)=>value);' +
        'app.whenReady().then(()=>{' +
        'const win=new BrowserWindow({webPreferences:{preload:path.join(__dirname,"preload.cjs"),nodeIntegration:true}});' +
        'return win.loadFile(path.join(__dirname,"index.html"),{query:{entry:"declared"}})' +
        '}).catch(error=>{window.launchError=error.message; throw error});');
    fs.mkdirSync(path.join(packaged, 'resources'));
    await asar.createPackage(root, path.join(packaged, 'resources/app.asar'));
    await start(packaged);
    assert.equal(await page.eval('window.launchError'), undefined);
    assert.equal(await page.eval('preloaded.directory'), '/game/resources/app.asar');
    assert.equal(await page.eval('preloaded.kind'), 'renderer');
    assert.equal(await page.eval('window.mainKind'), 'main');
    assert.equal(await page.eval('window.preloadLoaded'), true);
    assert.equal(await page.eval('preloaded.echo("preload IPC")'), 'preload IPC');
    assert.equal(await page.eval('new URL(location.href).searchParams.get("entry")'), 'declared');
    assert.deepEqual(await page.eval('require("./modules/main")'), {value: 7, local: '/game/resources/app.asar/modules'});
    assert.equal(await page.eval('require("electron").remote.app.getAppPath()'), '/game/resources/app.asar');
    // The engine falls back to the writable parent when its package directory is read-only.
    assert.equal(await page.eval('StorageManager.localFileDirectoryPath()'), '/game/resources/save/');
    assert.equal(await page.eval('StorageManager.save(3,' + JSON.stringify(json) + '); StorageManager.load(3)'), json);
    assert.equal(fs.readFileSync(path.join(packaged, 'resources/save/file3.rpgsave'), 'utf8'), LZString.compressToBase64(json));
    await server.close(); server = null;
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({main: 'index.html'}));
    await asar.createPackage(root, path.join(packaged, 'resources/app.asar'));
    await start(packaged);
    assert.equal(await page.eval('StorageManager.localFileDirectoryPath()'), '/game/resources/save/');
    assert.equal(await page.eval('StorageManager.load(3)'), json);
    await server.close(); server = null;
    fs.mkdirSync(path.join(root, 'pages'), {recursive: true});
    fs.writeFileSync(path.join(root, 'pages/entry #1.html'), '<html><head></head><body><script>' +
        'window.rendererGlobals=[typeof require,typeof process,typeof global,typeof nw];' +
        'window.StorageManager={};</script></body></html>');
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({main: './main.cjs'}));
    fs.writeFileSync(path.join(root, 'main.cjs'),
        'const {app,BrowserWindow}=require("electron"),path=require("path");' +
        'app.whenReady().then(()=>new BrowserWindow({webPreferences:{nodeIntegration:false,' +
        'preload:path.join(__dirname,"preload.cjs")}})' +
        '.loadURL("file://"+__dirname+"/pages/entry%20%231.html?source=file#fragment"));');
    await asar.createPackage(root, path.join(packaged, 'resources/app.asar'));
    await start(packaged);
    assert.deepEqual(await page.eval('window.rendererGlobals'), ['undefined', 'undefined', 'undefined', 'undefined']);
    assert.equal(await page.eval('window.preloadLoaded'), true);
    assert.equal(await page.eval('preloaded.kind'), 'renderer');
    assert.equal(await page.eval('location.hash'), '#fragment');
    assert.equal(await page.eval('new URL(location.href).searchParams.get("source")'), 'file');
    assert.deepEqual(page.errors, []);
});
