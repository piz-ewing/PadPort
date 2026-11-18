'use strict';

function installResourceLoading() {
    if (window.__PADPORT_CONFIG__.engine !== 'MV') return;

    window.addEventListener('load', () => {
        const {WebAudio, Decrypter} = window;
        if (!WebAudio || typeof WebAudio.prototype._load !== 'function') return;
        const queue = [];
        let active = 0;

        function drain() {
            while (active < 8 && queue.length) {
                const {audio, url} = queue.shift();
                const xhr = new XMLHttpRequest();
                active++;
                xhr.addEventListener('loadend', () => { active--; drain(); }, {once: true});
                const fail = () => {
                    if (audio._loader) audio._loader();
                    else audio._hasError = true;
                };
                xhr.onload = () => {
                    if (xhr.status < 400) audio._onXhrLoad(xhr);
                    else fail();
                };
                xhr.onerror = fail;
                xhr.ontimeout = fail;
                try {
                    xhr.open('GET', Decrypter && Decrypter.hasEncryptedAudio ? Decrypter.extToEncryptExt(url) : url);
                    xhr.responseType = 'arraybuffer';
                    xhr.timeout = 30000;
                    xhr.send();
                } catch (error) {
                    active--;
                    fail();
                    console.error('Audio request failed', error);
                }
            }
        }

        // Some preloaders create thousands of audio buffers in one turn.
        // Dispatch before XHR.send so browser request limits are not exhausted.
        WebAudio.prototype._load = function(url) {
            if (!WebAudio._context) return;
            queue.push({audio: this, url});
            drain();
        };
    }, {capture: true, once: true});
}

module.exports = {installResourceLoading};
