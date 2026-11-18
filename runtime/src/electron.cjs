'use strict';

function launch({fs, path, process, EventEmitter, makeRequire, config, base, installGameHost, configurePage}) {
    require('./frame-scheduler.cjs').installFrameScheduler();
    path = path.posix;
    const app = new EventEmitter(), ipcMain = new EventEmitter(), ipcRenderer = new EventEmitter();
    const handlers = new Map(), windows = [];
    let activeWindow, mainPageLoaded;
    Object.assign(app, {isReady: () => true,
        getAppPath: () => config.appRoot, getName: () => 'PadPort',
        commandLine: {
            appendSwitch(name) { console.warn('Browser switches are managed by the host: ' + name); },
            hasSwitch: () => false, getSwitchValue: () => ''
        },
        quit: () => window.close(), exit: () => window.close()});
    ipcMain.handle = (channel, handler) => {
        if (handlers.has(channel)) throw new Error('Handler already registered: ' + channel);
        handlers.set(channel, handler);
    };
    ipcMain.handleOnce = (channel, handler) => ipcMain.handle(channel, (...args) => {
        handlers.delete(channel); return handler(...args);
    });
    ipcMain.removeHandler = channel => { handlers.delete(channel); };
    const mainEvent = () => ({sender: activeWindow.webContents,
        reply: (channel, ...args) => ipcRenderer.emit(channel, {}, ...args)});
    ipcRenderer.send = (channel, ...args) => { ipcMain.emit(channel, mainEvent(), ...args); };
    ipcRenderer.sendSync = (channel, ...args) => {
        const event = mainEvent(); ipcMain.emit(channel, event, ...args); return event.returnValue;
    };
    ipcRenderer.invoke = async (channel, ...args) => {
        if (!handlers.has(channel)) throw new Error('No handler registered for: ' + channel);
        return handlers.get(channel)(mainEvent(), ...args);
    };
    const renderer = {ipcRenderer, contextBridge: {exposeInMainWorld: (name, value) => { window[name] = value; }}};
    const globalShortcut = {
        register(accelerator) {
            console.warn('Global shortcuts are unavailable: ' + accelerator);
            return false;
        },
        registerAll(accelerators) { for (const accelerator of accelerators) this.register(accelerator); },
        isRegistered: () => false, unregister() {}, unregisterAll() {}
    };
    const main = {app, BrowserWindow, ipcMain, globalShortcut, Menu: {
        setApplicationMenu(menu) {
            if (menu !== null) console.warn('Native application menus are unavailable');
        }
    }};
    renderer.remote = main;
    process.platform = 'win32';
    process.resourcesPath = path.dirname(config.appRoot);
    process.argv = ['--appPath=' + config.appRoot];

    function localPage(value, options, isUrl) {
        let url;
        if (isUrl) {
            const parsed = new URL(value);
            if (parsed.protocol === 'file:') {
                const file = decodeURIComponent(parsed.pathname);
                if (parsed.host || !file.startsWith(config.root + '/')) throw new Error('Page is outside the game folder');
                url = new URL(file.slice(config.root.length + 1).split('/').map(encodeURIComponent).join('/'), base);
                url.search = parsed.search; url.hash = parsed.hash;
            } else url = parsed;
        } else {
            const file = path.resolve(config.appRoot, value);
            if (!file.startsWith(config.root + '/')) throw new Error('Page is outside the game folder');
            url = new URL(file.slice(config.root.length + 1).split('/').map(encodeURIComponent).join('/'), base);
            if (options && options.query) url.search = new URLSearchParams(options.query).toString();
            if (options && options.search) url.search = options.search;
            if (options && options.hash) url.hash = options.hash;
        }
        if (url.origin !== new URL(base).origin || !url.pathname.startsWith(new URL(base).pathname))
            throw new Error('Page is outside the game folder');
        return url;
    }

    async function loadPage(owner, value, options, isUrl) {
        try {
            if (activeWindow && activeWindow !== owner) throw new Error('Multiple game windows are unsupported');
            activeWindow = owner;
            if (mainPageLoaded) mainPageLoaded();
            const url = localPage(value, options, isUrl);
            const file = path.join(config.root, decodeURIComponent(url.pathname.slice(new URL(base).pathname.length)));
            const html = fs.readFileSync(file, 'utf8');
            configurePage(file);
            const preferences = owner.options.webPreferences || {};
            // Keep preload objects and IPC in the same realm as the game document.
            document.open();
            history.replaceState({}, '', url.href);
            Object.assign(window, {require: makeRequire(file, renderer), __filename: file, __dirname: path.dirname(file)});
            if (preferences.preload) {
                const originalOnce = process.once;
                try {
                    process.once = function(event, handler) {
                        if (event === 'loaded' && typeof handler === 'function') { handler(); return process; }
                        return originalOnce.apply(this, arguments);
                    };
                    makeRequire(file, renderer)(path.resolve(config.appRoot, preferences.preload));
                } finally { process.once = originalOnce; }
            }
            installGameHost();
            if (preferences.nodeIntegration === false) {
                for (const name of ['require', 'process', 'global', 'nw']) delete window[name];
            }
            const loaded = new Promise(resolve => window.addEventListener('load', resolve, {once: true}));
            document.write(html);
            document.close();
            owner.webContents.url = url.href;
            await loaded;
            owner.emit('ready-to-show');
            owner.webContents.emit('did-finish-load');
        } catch (error) {
            owner.webContents.emit('did-fail-load', {}, -2, error.message, String(value));
            throw error;
        }
    }

    function BrowserWindow(options = {}) {
        EventEmitter.call(this);
        this.options = options;
        this.webContents = new EventEmitter();
        Object.assign(this.webContents, {send: (channel, ...args) => ipcRenderer.emit(channel, {}, ...args),
            clearHistory() { console.warn('WebContents.clearHistory is managed by the host'); },
            getURL: () => this.webContents.url || '',
            executeJavaScript: async code => window.eval(code)});
        windows.push(this);
    }
    Object.setPrototypeOf(BrowserWindow.prototype, EventEmitter.prototype);
    Object.assign(BrowserWindow.prototype, {
        loadFile(value, options) { return loadPage(this, value, options, false); },
        loadURL(value, options) { return loadPage(this, value, options, true); },
        show() { window.focus(); this.emit('show'); },
        focus() { window.focus(); },
        close() { window.close(); },
        setTitle(title) { document.title = title; },
        getTitle() { return document.title; },
        setFullScreen(value) { return value ? document.documentElement.requestFullscreen() : document.exitFullscreen(); },
        isFullScreen() { return !!document.fullscreenElement; }
    });
    BrowserWindow.getAllWindows = () => windows.slice();
    BrowserWindow.getFocusedWindow = () => activeWindow || null;
    window.require = makeRequire(process.mainModule.filename, main);
    mainPageLoaded = require('./electron-main.cjs').startMainScope({app, filename: process.mainModule.filename,
        directory: path.dirname(process.mainModule.filename), makeRequire, electron: main,
        script: fs.readFileSync(process.mainModule.filename, 'utf8')});
    if (activeWindow) mainPageLoaded();
}

module.exports = {launch};
