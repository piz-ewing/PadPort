/* Bound Gecko's decoder usage when plugins preload many sounds at once. */
(() => {
    'use strict';
    if (window.__PADPORT_CONFIG__.renderer !== 'gecko') return;
    const proto = window.BaseAudioContext && window.BaseAudioContext.prototype;
    if (!proto || proto.decodeAudioData.padportQueued) return;
    const decode = proto.decodeAudioData;
    const queue = [];
    let active = 0;

    function drain() {
        while (active < 4 && queue.length) {
            const task = queue.shift();
            active++;
            let result;
            try { result = decode.apply(task.context, task.args); }
            catch (error) { active--; task.reject(error); continue; }
            Promise.resolve(result).then(buffer => {
                active--; task.resolve(buffer); drain();
            }, error => {
                active--; task.reject(error); drain();
            });
        }
    }

    function decodeAudioData(data, success, failure) {
        const args = Array.from(arguments);
        if (!(this instanceof window.BaseAudioContext) || !(data instanceof ArrayBuffer)
            || (success != null && typeof success !== 'function')
            || (failure != null && typeof failure !== 'function')) return decode.apply(this, args);
        // Native decodeAudioData detaches input immediately, including queued calls.
        try { args[0] = structuredClone(data, {transfer: [data]}); }
        catch (error) { return decode.apply(this, args); }
        return new Promise((resolve, reject) => {
            queue.push({context: this, args, resolve, reject});
            drain();
        });
    }
    Object.defineProperty(decodeAudioData, 'padportQueued', {value: true});
    proto.decodeAudioData = decodeAudioData;
})();
