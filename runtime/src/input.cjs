'use strict';

function clearInput() {
    if (window.Input && typeof window.Input.clear === 'function') window.Input.clear();
    if (window.TouchInput && typeof window.TouchInput.clear === 'function') window.TouchInput.clear();
}

function installInput(snapshot) {
    let revision = -1;
    let pads = [null, null, null, null];
    let lastPaused = false;
    let inputMode = 'gamepad';

    function event(name, pad) {
        const e = new Event(name);
        Object.defineProperty(e, 'gamepad', {value: pad});
        window.dispatchEvent(e);
    }
    function poll() {
        const data = snapshot();
        if (data.revision === revision) return pads.slice();
        revision = data.revision;
        const mode = data.inputMode === 'keyboard' ? 'keyboard' : 'gamepad';
        if (mode !== inputMode) clearInput();
        inputMode = mode;
        const next = [null, null, null, null];
        for (let i = 0; i < next.length; i++) {
            const raw = inputMode === 'keyboard' ? null : (data.pads || [])[i];
            const old = pads[i];
            if (old && (!raw || old._nativeId !== raw.nativeId)) {
                old.connected = false;
                old.buttons.forEach(b => {b.pressed = b.touched = false; b.value = 0;});
                old.axes.fill(0);
                event('gamepaddisconnected', old);
                clearInput(); // MV/MZ otherwise keep the last state of a removed pad.
            }
            if (!raw) continue;
            const same = old && old.connected && old._nativeId === raw.nativeId;
            const pad = same ? old : {
                id: 'PadPort · ' + raw.id, index: i, connected: true, mapping: 'standard',
                axes: [0, 0, 0, 0], buttons: Array.from({length: 17}, () => ({pressed: false, touched: false, value: 0})),
                timestamp: 0, _nativeId: raw.nativeId
            };
            for (let a = 0; a < 4; a++) pad.axes[a] = data.paused ? 0 : Math.max(-1, Math.min(1, Number(raw.axes[a]) || 0));
            for (let b = 0; b < 17; b++) {
                const value = data.paused ? 0 : Math.max(0, Math.min(1, Number(raw.buttons[b]) || 0));
                Object.assign(pad.buttons[b], {value, pressed: value > 0.5, touched: value > 0});
            }
            pad.timestamp = performance.now();
            next[i] = pad;
            if (!same) event('gamepadconnected', pad);
        }
        if (data.paused && !lastPaused) clearInput();
        lastPaused = Boolean(data.paused);
        pads = next;
        return pads.slice();
    }
    Object.defineProperty(navigator, 'getGamepads', {value: poll, configurable: true});
    Object.defineProperty(navigator, 'webkitGetGamepads', {value: poll, configurable: true});


    return {poll, inputMode: () => inputMode};
}

module.exports = {installInput, clearInput};
