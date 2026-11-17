(() => {
    'use strict';
    if (window.PadPortDebug) return;
    const host = window.PadPortHost;
    const pending = new Map();
    const requests = new WeakMap();
    const history = [];
    const failures = [];
    let timer = null;
    let previousFrame = null;
    let tracker = null;

    function record(error) {
        failures.push({at: Date.now(), error: String(error).slice(0, 2048)});
        if (failures.length > 10) failures.shift();
    }

    function failure(event) {
        const error = event.error || event.reason;
        record(error && error.stack || error || event.message);
    }

    function snapshot() {
        const manager = window.SceneManager;
        const scene = manager && manager._scene;
        const graphics = window.Graphics;
        const frame = graphics && graphics.frameCount;
        const interpreters = [];
        let interpreter = window.$gameMap && window.$gameMap._interpreter;
        while (interpreter && interpreters.length < 8) {
            const command = interpreter._list && interpreter._list[interpreter._index];
            interpreters.push({index: interpreter._index, command: command && command.code,
                waitMode: interpreter._waitMode, waitCount: interpreter._waitCount});
            interpreter = interpreter._childInterpreter;
        }
        const images = [];
        const imageManager = window.ImageManager;
        const caches = imageManager ? [imageManager._imageCache && imageManager._imageCache._items,
            imageManager._cache, imageManager._system] : [];
        for (const cache of caches) {
            if (!cache) continue;
            for (const entry of Object.values(cache)) {
                const bitmap = entry && (entry.bitmap || entry);
                if (bitmap && bitmap._loadingState && !['loaded', 'none'].includes(bitmap._loadingState)) {
                    images.push({url: String(bitmap._url).slice(0, 256), state: bitmap._loadingState});
                    if (images.length === 12) break;
                }
            }
            if (images.length === 12) break;
        }
        const audio = window.WebAudio && window.WebAudio._context;
        const input = window.Input;
        const native = JSON.parse(host.snapshot());
        const state = {at: Date.now(), visibility: document.visibilityState,
            frame, frameDelta: previousFrame == null || frame == null ? null : frame - previousFrame,
            scene: scene && scene.constructor.name, sceneStarted: manager && manager._sceneStarted,
            stopped: manager && manager._stopped, frozen: manager && manager._freeze,
            sceneActive: scene && scene._active, audio: audio && audio.state,
            native: {revision: native.revision, paused: native.paused, inputMode: native.inputMode},
            pressed: input && Object.keys(input._currentState || {}).filter(key => input._currentState[key]),
            interpreters, images, requests: Array.from(pending.values()).slice(0, 12).map(request =>
                ({method: request.method, url: request.url, elapsed: Date.now() - request.at}))};
        return state;
    }

    function sample() {
        const state = snapshot();
        previousFrame = state.frame;
        history.push(state);
        if (history.length > 10) history.shift();
        const report = {samples: history.slice(), errors: failures.slice()};
        let json = JSON.stringify(report);
        while (json.length > 8192 && report.samples.length > 1) {
            report.samples.shift();json = JSON.stringify(report);
        }
        while (json.length > 8192 && report.errors.length) {
            report.errors.shift();json = JSON.stringify(report);
        }
        host.debugState(json);
    }

    function setEnabled(enabled) {
        if (enabled === (timer !== null)) return;
        if (enabled) {
            const active = {enabled: true};
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            const trackedOpen = function(method, url) {
                const result = originalOpen.apply(this, arguments);
                if (active.enabled) requests.set(this, {method: String(method).slice(0, 16), url: String(url).slice(0, 256)});
                return result;
            };
            const trackedSend = function() {
                const request = active.enabled && requests.get(this);
                if (request) {
                    const key = {};
                    const stack = new Error('XHR ' + request.method + ' ' + request.url).stack;
                    if (pending.size < 100) pending.set(key, {...request, at: Date.now()});
                    this.addEventListener('loadend', () => {
                        pending.delete(key);
                        if (active.enabled && (this.status === 0 || this.status >= 400)) record('HTTP ' + this.status + ' ' + stack);
                    }, {once: true});
                    try { return originalSend.apply(this, arguments); }
                    catch (error) { pending.delete(key); throw error; }
                }
                return originalSend.apply(this, arguments);
            };
            XMLHttpRequest.prototype.open = trackedOpen;
            XMLHttpRequest.prototype.send = trackedSend;
            tracker = {active, originalOpen, originalSend, trackedOpen, trackedSend};
            window.addEventListener('error', failure);
            window.addEventListener('unhandledrejection', failure);
            timer = setInterval(sample, 1000);
            sample();
        } else {
            clearInterval(timer);timer = null;previousFrame = null;
            window.removeEventListener('error', failure);
            window.removeEventListener('unhandledrejection', failure);
            tracker.active.enabled = false;
            if (XMLHttpRequest.prototype.open === tracker.trackedOpen) XMLHttpRequest.prototype.open = tracker.originalOpen;
            if (XMLHttpRequest.prototype.send === tracker.trackedSend) XMLHttpRequest.prototype.send = tracker.originalSend;
            tracker = null;
            pending.clear();history.length = 0;failures.length = 0;
        }
    }

    window.PadPortDebug = Object.freeze({setEnabled, snapshot});
    if (window.__PADPORT_CONFIG__.debug === true) setEnabled(true);
})();
