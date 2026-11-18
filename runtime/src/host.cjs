'use strict';

const {installInput, clearInput} = require('./input.cjs');

function installHost({base, client}) {
    let state = {revision: 0, paused: false, pads: []};
    const nativeLifecycle = typeof window.PadPortFiles?.request === 'function';
    let disposed = false, reportingFailure = false, mediaPaused = false;
    const endpoint = name => base + '__padport__/' + name;
    const post = async (name, body) => {
        if (disposed) return;
        try {
            const response = await fetch(endpoint(name), {method: 'POST', body: String(body == null ? '' : body)});
            if (!response.ok) throw new Error('Host request failed: ' + response.status);
            reportingFailure = false;
        } catch (error) {
            if (!reportingFailure) console.warn('Host request failed: ' + error.message);
            reportingFailure = true;
        }
    };
    const host = window.PadPortHost = {inputSnapshot: () => state, snapshot: () => JSON.stringify(state),
        log: value => post('log', value), debugState: value => post('debug-state', value)};
    let viewportGraphics = null;
    let viewportSignature = '';
    function log(message) {
        host.log(String(message).slice(0, 2000));
    }
    function viewportSize() {
        return [window.innerWidth || document.documentElement.clientWidth,
                window.innerHeight || document.documentElement.clientHeight];
    }
    function updateFitScale() {
        const [width, height] = viewportSize();
        if (width > 0 && height > 0 && this._width > 0 && this._height > 0) {
            this._stretchEnabled = true;
            this._realScale = Math.min(width / this._width, height / this._height);
        }
    }
    function fitToViewport() {
        const g = window.Graphics;
        if (!g || !g._canvas || !(g._width > 0 && g._height > 0) || typeof g._updateAllElements !== 'function') return false;
        const [width, height] = viewportSize();
        if (!(width > 0 && height > 0)) return false;
        const signature = [width, height, g._width, g._height].join(':');
        const expected = Math.min(width / g._width, height / g._height);
        // Fullscreen WebView has no browser toolbar. Bypass MZ's mobile 0.9
        // height allowance and plugin integer scaling, without resizing the map.
        const changed = viewportGraphics !== g || viewportSignature !== signature ||
            g._updateRealScale !== updateFitScale || !g._stretchEnabled ||
            Math.abs(g._realScale - expected) > 1e-9;
        g._updateRealScale = updateFitScale;
        if (changed) {
            viewportGraphics = g;
            viewportSignature = signature;
            // Use the engine's layout path: canvas, video and touch coordinates
            // must all agree on the same scale, not just a CSS transform.
            g._updateAllElements();
        }
        return true;
    }
    const {poll, inputMode} = installInput(() => state);

    const events = new EventSource(endpoint('events'));
    let mediaTransition = Promise.resolve();
    function setPaused(paused) {
        if (paused === mediaPaused) return mediaTransition;
        mediaPaused = paused;
        clearInput();
        return mediaTransition = (paused ? window.__mediaCtl.pause() : window.__mediaCtl.resume())
            .catch(error => log('Media: ' + error.message));
    }
    events.onmessage = event => {
        const next = JSON.parse(event.data);
        const changed = Boolean(next.paused) !== Boolean(state.paused);
        state = next;
        poll();
        if (changed && !nativeLifecycle) setPaused(Boolean(state.paused));
    };
    events.addEventListener('cmd', event => {
        const command = String(event.data);
        if (command === 'pause') setPaused(true);
        else if (command === 'resume') setPaused(false);
        else if (command === 'debug:true' || command === 'debug:false')
            window.PadPortDebug.setEnabled(command === 'debug:true');
    });
    const pressedKeys = new Set(), keyId = event => event.code || event.keyCode + ':' + event.location;
    window.addEventListener('keydown', event => {
        const key = keyId(event);
        if (pressedKeys.has(key) && !event.repeat)
            Object.defineProperty(event, 'repeat', {configurable: true, value: true});
        pressedKeys.add(key);
        poll();
    }, true);
    window.addEventListener('keyup', event => { pressedKeys.delete(keyId(event)); poll(); }, true);
    window.addEventListener('blur', () => { pressedKeys.clear(); clearInput(); });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { pressedKeys.clear(); clearInput(); }
    });
    window.addEventListener('resize', fitToViewport);
    let fitFrame = 0;
    const fit = () => {
        if (!disposed && !fitToViewport()) fitFrame = requestAnimationFrame(fit);
    };
    fitFrame = requestAnimationFrame(fit);
    window.addEventListener('pagehide', () => {
        disposed = true;
        cancelAnimationFrame(fitFrame);
        events.close();
        clearInput();
        fetch(endpoint('release'), {method: 'POST', body: client, keepalive: true}).catch(error => console.error(error));
    }, {once: true});
    window.addEventListener('error', event => log('ERROR ' + (event.error && event.error.stack || event.message + ' @ ' + event.filename + ':' + event.lineno)));
    window.addEventListener('unhandledrejection', event => log('PROMISE ' + (event.reason && event.reason.stack || String(event.reason))));
    window.PadPort = Object.freeze({poll, inputMode, clearInput, fitToViewport,
        pause: () => setPaused(true), resume: () => setPaused(false)});
}
module.exports = {installHost};
