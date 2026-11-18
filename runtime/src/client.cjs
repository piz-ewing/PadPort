'use strict';

const {Buffer} = require('buffer/');
const EventEmitter = require('events/');
const process = require('process/browser');
const createPath = require('path');
const config = window.__PADPORT_RUNTIME_CONFIG__;
const processEvents = new EventEmitter();
for (const name of Object.getOwnPropertyNames(EventEmitter.prototype))
    if (name !== 'constructor' && typeof EventEmitter.prototype[name] === 'function')
        process[name] = processEvents[name].bind(processEvents);
process.cwd = () => config.cwd || config.root;
process.platform = config.platform;
process.arch = config.arch || 'arm64';
process.versions = {node: config.nodeVersion};
if (!config.mainIsJs) Object.assign(process.versions, {nw: '0.67.2', 'node-webkit': '0.67.2'});
process.execPath = config.root + '/Game.exe';
process.mainModule = {filename: config.appRoot + '/' + config.main, path: config.appRoot};
process.env.HOME = config.root;
process.env.OS = 'Windows_NT';
if (!window.setImmediate) {
    window.setImmediate = (callback, ...args) => setTimeout(() => callback(...args), 0);
    window.clearImmediate = id => clearTimeout(id);
}
process.nextTick = window.setImmediate;
window.process = process;
const util = require('util/');
const path = createPath(process);
const base = new URL('.', document.currentScript.src).href.replace(/__padport__\/$/, '');
const client = crypto.randomUUID();
const cleanups = new Set();
const nativeFiles = window.PadPortFiles;
const protocolJSON = require('./protocol-json.cjs').createProtocolJSON();

function errorFrom(error) { return Object.assign(new Error(error.message), error); }
function result(response) {
    if (response.error) throw errorFrom(response.error);
    return response.value;
}
function sync(command) {
    if (nativeFiles) return result(protocolJSON.parse(nativeFiles.request(config.bridgeToken, JSON.stringify({client, ...command}))));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', base + '__padport__/fs', false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({client, ...command}));
    if (xhr.status !== 200) throw new Error('File request failed: ' + xhr.status);
    return result(protocolJSON.parse(xhr.responseText));
}
async function asyncCall(command) {
    const response = await fetch(base + '__padport__/fs', {method: 'POST',
        headers: {'Content-Type': 'application/json'}, body: JSON.stringify({client, ...command})});
    if (!response.ok) throw new Error('File request failed: ' + response.status);
    return result(protocolJSON.parse(await response.text()));
}
const filename = value => value instanceof URL ? decodeURIComponent(value.pathname) : Buffer.isBuffer(value) ? value.toString() : value;
const encoding = options => typeof options === 'string' ? options : options && options.encoding;
const filePath = value => {
    const name = filename(value);
    if (typeof name !== 'string') throw new TypeError('The path argument must be a string, Buffer or URL');
    return path.resolve(process.cwd(), name);
};
class Stats {
    constructor(data) {
        Object.assign(this, data);
        for (const name of ['mtime', 'atime', 'ctime', 'birthtime']) this[name] = new Date(data[name + 'Ms']);
    }
    isFile() { return this.type === 'file'; }
    isDirectory() { return this.type === 'directory'; }
    isSymbolicLink() { return false; }
    isBlockDevice() { return false; }
    isCharacterDevice() { return false; }
    isFIFO() { return false; }
    isSocket() { return false; }
}
function statResult(file, options, call) {
    try { return new Stats(call({op: 'stat', file: filePath(file)})); }
    catch (error) { if (options && options.throwIfNoEntry === false && error.code === 'ENOENT') return undefined; throw error; }
}
function readResult(value, options) {
    const data = Buffer.from(value.base64, 'base64'), enc = encoding(options);
    return enc ? data.toString(enc) : data;
}
function writeCommand(file, data, options) {
    if (typeof data !== 'string' && !ArrayBuffer.isView(data)) throw new TypeError('Data must be a string, Buffer or TypedArray');
    const bytes = typeof data === 'string' ? Buffer.from(data, encoding(options) || 'utf8') : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    return {op: 'write', file: filePath(file), base64: bytes.toString('base64'), options};
}
const fsRemote = {
    Stats, constants: {F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1},
    existsSync: file => sync({op: 'exists', file: filePath(file)}),
    statSync: (file, options) => statResult(file, options, sync),
    lstatSync: (file, options) => statResult(file, options, sync),
    readFileSync: (file, options) => readResult(sync({op: 'read', file: filePath(file)}), options),
    writeFileSync: (file, data, options) => { sync(writeCommand(file, data, options)); },
    appendFileSync: (file, data, options) => { sync(writeCommand(file, data, {flag: 'a', ...(typeof options === 'string' ? {encoding: options} : options)})); },
    mkdirSync: (file, options) => sync({op: 'mkdir', file: filePath(file), options}),
    unlinkSync: file => { sync({op: 'unlink', file: filePath(file)}); },
    renameSync: (from, to) => { sync({op: 'rename', file: filePath(from), to: filePath(to)}); },
    rmdirSync: file => { sync({op: 'rmdir', file: filePath(file)}); },
    openSync: (file, flags, mode) => sync({op: 'open', file: filePath(file), flags, mode}),
    closeSync: fd => { sync({op: 'close', fd}); },
    fstatSync: fd => new Stats(sync({op: 'statHandle', fd})),
    readSync: (fd, buffer, offset, length, position) => {
        const value = sync({op: 'readHandle', fd, length, position});
        Buffer.from(value.base64, 'base64').copy(buffer, offset);
        return value.count;
    },
    writeSync: (fd, data, offset, length, position) => {
        const bytes = typeof data === 'string' ? Buffer.from(data, typeof length === 'string' ? length : 'utf8') :
            Buffer.from(data.buffer, data.byteOffset + (offset || 0), length == null ? data.byteLength - (offset || 0) : length);
        return sync({op: 'writeHandle', fd, base64: bytes.toString('base64'), position: typeof data === 'string' ? offset : position});
    },
    readdirSync: (file, options) => {
        const names = sync({op: 'list', file: filePath(file)});
        if (options && options.withFileTypes) return names.map(name => {
            const stats = fsRemote.statSync(path.join(filePath(file), name));
            return {name, mode: stats.mode, _isFile: stats.isFile(), _isDirectory: stats.isDirectory(), parentPath: filePath(file)};
        });
        return encoding(options) === 'buffer' ? names.map(name => Buffer.from(name)) : names;
    }
};
fsRemote.accessSync = file => { fsRemote.statSync(file); };
fsRemote.realpathSync = file => { fsRemote.statSync(file); return filePath(file); };
fsRemote.promises = {
    readFile: async (file, options) => readResult(await asyncCall({op: 'read', file: filePath(file)}), options),
    writeFile: async (file, data, options) => { await asyncCall(writeCommand(file, data, options)); },
    stat: async file => new Stats(await asyncCall({op: 'stat', file: filePath(file)})),
    mkdir: async (file, options) => asyncCall({op: 'mkdir', file: filePath(file), options}),
    unlink: async file => { await asyncCall({op: 'unlink', file: filePath(file)}); },
    rename: async (from, to) => { await asyncCall({op: 'rename', file: filePath(from), to: filePath(to)}); }
};
for (const name of ['readFile', 'writeFile', 'stat', 'mkdir', 'unlink', 'rename']) {
    fsRemote[name] = (...args) => {
        const callback = args.pop();
        if (typeof callback !== 'function') throw new TypeError('Callback must be a function');
        fsRemote.promises[name](...args).then(value => callback(null, value), error => callback(error));
    };
}
const {proxyFs: fs, proxyFsExtra} = require('./fs-cache.cjs')({fsOri: fsRemote, path,
    util, Buffer, process, packageData: {gameCWD: process.cwd(), gameExecDir: config.root},
    writeFileSync: (...args) => fsRemote.writeFileSync(...args),
    onCleanup: cleanup => cleanups.add(cleanup)});
const zlib = {};
for (const method of ['deflateSync', 'inflateSync', 'gzipSync', 'gunzipSync'])
    zlib[method] = (data, options) => Buffer.from(sync({op: 'zlib', method, options, base64: Buffer.from(data).toString('base64')}).base64, 'base64');

const guiWindow = new EventEmitter();
Object.assign(guiWindow, {show: () => window.focus(), focus: () => window.focus(), close: () => window.close(),
    enterFullscreen: () => document.documentElement.requestFullscreen(), leaveFullscreen: () => document.exitFullscreen(),
    moveTo: (x, y) => window.moveTo(x, y), resizeTo: (w, h) => window.resizeTo(w, h),
    isFullscreen: true, width: window.innerWidth, height: window.innerHeight});
const gui = {Window: {get: () => guiWindow}, App: {startPath: config.root, dataPath: config.root, argv: [], fullArgv: []},
    Shell: {openExternal: url => window.open(url, '_blank')}};
const builtin = {fs, 'fs/promises': fs.promises, 'fs-extra': proxyFsExtra, path, 'path/posix': path.posix, 'path/win32': path.win32,
    buffer: {Buffer}, events: EventEmitter, util, process, zlib, url: require('./url-browser.cjs')(sync), 'nw.gui': gui,
    os: {platform: () => process.platform, arch: () => process.arch, homedir: () => config.root,
        tmpdir: () => config.root + '/tmp', userInfo: () => ({username: 'Player', homedir: config.root})}};
const cache = Object.create(null);
const electronCaches = new WeakMap();

function makeRequire(parent, electron) {
    if (electron && !electronCaches.has(electron)) electronCaches.set(electron, Object.create(null));
    const modules = electron ? electronCaches.get(electron) : cache;
    function resolve(name) {
        const id = name.replace(/^node:/, '');
        if (id === 'electron' && electron) return id;
        return Object.hasOwn(builtin, id) ? id : sync({op: 'resolve', name, basedir: path.dirname(parent)});
    }
    function require(name) {
        const id = resolve(name);
        if (id === 'electron' && electron) return electron;
        if (Object.hasOwn(builtin, id)) return builtin[id];
        if (modules[id]) return modules[id].exports;
        if (id.endsWith('.node')) throw Object.assign(new Error('Native modules are unavailable in the game page'), {code: 'ERR_DLOPEN_DISABLED'});
        const module = {id, filename: id, exports: {}, loaded: false};
        modules[id] = module;
        try {
            const source = fs.readFileSync(id, 'utf8');
            if (id.endsWith('.json')) module.exports = JSON.parse(source.replace(/^\uFEFF/, ''));
            else new Function('exports', 'require', 'module', '__filename', '__dirname',
                source.replace(/^#![^\n]*\n/, '') + '\n//# sourceURL=' + base + id.slice(6))
                .call(module.exports, module.exports, makeRequire(id, electron), module, id, path.dirname(id));
            module.loaded = true;
        } catch (error) { delete modules[id]; throw error; }
        return module.exports;
    }
    require.resolve = resolve;
    require.cache = modules;
    require.main = process.mainModule;
    return require;
}

function installGameCompatibility() {
    if (window.__PADPORT_COMPAT_INSTALLED__) return;
    window.__PADPORT_COMPAT_INSTALLED__ = true;
    require('./fonts.cjs').installFonts({base, onCleanup: cleanup => cleanups.add(cleanup)});
    require('./bitmap-lifecycle.cjs').installBitmapLifecycle();
    require('./resource-loading.cjs').installResourceLoading();
    require("./graphics.cjs").installGraphics();
    require('../../app/src/main/assets/audio-decode.js');
    require("./media.cjs").installMedia();
}

const pagePath = decodeURIComponent(new URL(window.location.href).pathname.slice(new URL(base).pathname.length));
const pageFilename = config.mainIsJs ? process.mainModule.filename : path.join(config.root, pagePath);
Object.assign(window, {Buffer, process, global: window, require: makeRequire(pageFilename), nw: gui,
    __filename: pageFilename, __dirname: path.dirname(pageFilename)});
require('./platform.cjs').installPlatformModules({require: window.require, requireCache: builtin, Buffer, process});
window.PadPortRuntime = Object.freeze({fs, path, base});
window.__PADPORT_CONFIG__ = {...window.__PADPORT_CONFIG__, engine: config.engine,
    title: config.title, language: config.language, debug: config.debug};
window.PadPortBuffer = {Buffer};
function installGameHost() {
    installGameCompatibility();
    require('../../app/src/main/assets/ui-strings.js');
    require('./host.cjs').installHost({base, client});
    require('../../app/src/main/assets/runtime-debug.js');
    window.addEventListener('pagehide', () => {
        for (const cleanup of cleanups) cleanup();
        window.PadPortDebug.setEnabled(false);
    }, {once: true});
}
if (config.mainIsJs) {
    const {launch} = require('./electron.cjs');
    launch({fs, path, process, EventEmitter, makeRequire, config, base, installGameHost,
        configurePage(file) {
            const engine = sync({op: 'engine', file: path.dirname(file)});
            config.engine = engine;
            window.__PADPORT_CONFIG__.engine = engine;
        }});
} else installGameHost();
