'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function environment(AudioContext, media = [], native = false, HTMLMediaElement = class {}) {
    const sandbox = {AudioContext, HTMLMediaElement, Element: class {}, HTMLElement: class {}, Document: class {},
        document: {querySelectorAll: () => media, addEventListener() {}},
        console, module: {exports: {}}, EventSource: class {
            constructor() { sandbox.events = this; this.handlers = {}; }
            addEventListener(name, handler) { this.handlers[name] = handler; }
        },
        requestAnimationFrame: () => 1, addEventListener() {},
        require: () => ({installInput: () => ({poll() {}, inputMode() {}}), clearInput() {}})};
    sandbox.window = sandbox;
    if (native) sandbox.PadPortFiles = {request() {}};
    vm.createContext(sandbox);
    for (const name of ['media.cjs', 'host.cjs'])
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), sandbox);
    vm.runInContext('installMedia(); installHost({base:"http://127.0.0.1:23000/session/",client:"test"})', sandbox);
    return sandbox;
}

test('foreground resume reaches audio context while suspension is still pending', {timeout: 1000}, async () => {
    class AudioContext {
        constructor() { this.state = 'running'; this.resumes = 0; }
        addEventListener() {}
        suspend() {
            return new Promise(resolve => { this.completeSuspend = () => resolve(); });
        }
        resume() {
            this.resumes++; this.state = 'running'; this.completeSuspend(); return Promise.resolve();
        }
        decodeAudioData() {}
    }
    const sandbox = environment(AudioContext);
    const context = new sandbox.AudioContext();
    const paused = sandbox.PadPort.pause();
    await sandbox.PadPort.resume();
    await paused;
    assert.equal(context.state, 'running');
    assert.equal(context.resumes, 1);
    await sandbox.PadPort.resume();
    assert.equal(context.resumes, 1, 'repeated resume must not claim game-owned contexts');
});

test('host pause waits for pending playback and a quick resume cancels that pause', async () => {
    class AudioContext {decodeAudioData() {}}
    class Media {
        constructor() { this.paused = true; this.muted = false; this.pauses = 0; }
        play() {
            this.paused = false;
            return new Promise((resolve, reject) => { this.loaded = resolve; this.failed = reject; });
        }
        pause() { this.paused = true; this.pauses++; this.failed(new Error('play interrupted')); }
    }
    const sandbox = environment(AudioContext, [], false, Media);
    const media = new sandbox.HTMLMediaElement();
    sandbox.document.querySelectorAll = () => [media];
    const playback = media.play();
    const paused = sandbox.PadPort.pause();
    assert.equal(media.muted, true);
    assert.equal(media.pauses, 0);
    assert.equal(sandbox.PadPort.pause(), paused, 'native acknowledgement must await the original media transition');
    await sandbox.PadPort.resume();
    assert.equal(media.muted, false);
    media.loaded();
    await playback;
    await paused;
    assert.equal(media.pauses, 0);
    await sandbox.PadPort.pause();
    assert.equal(media.pauses, 1);
    const resumed = sandbox.PadPort.resume();
    assert.equal(media.paused, false);
    assert.equal(media.muted, false);
    media.loaded();
    await resumed;
});

test('playback errors remain visible to callers after media tracking', async () => {
    class AudioContext {decodeAudioData() {}}
    const failure = new Error('unsupported media');
    class Media {play() { return Promise.reject(failure); }}
    const sandbox = environment(AudioContext, [], false, Media);
    await assert.rejects(new sandbox.HTMLMediaElement().play(), error => error === failure);
});

test('input snapshots and native commands do not replay the same media transition', async () => {
    class AudioContext {decodeAudioData() {}}
    const sandbox = environment(AudioContext);
    let pauses = 0, resumes = 0;
    sandbox.__mediaCtl = {pause: async () => { pauses++; }, resume: async () => { resumes++; }};
    const deliver = paused => sandbox.events.onmessage({data: JSON.stringify({revision: 1, paused, pads: []})});
    deliver(true);
    await sandbox.PadPort.pause();
    sandbox.events.handlers.cmd({data: 'pause'});
    deliver(false);
    await sandbox.PadPort.resume();
    sandbox.events.handlers.cmd({data: 'resume'});
    assert.deepEqual([pauses, resumes], [1, 1]);
});

test('host restores only the media and audio contexts that it paused', async () => {
    class AudioContext {
        constructor() { this.state = 'running'; this.resumes = 0; }
        addEventListener() {}
        decodeAudioData() {}
        suspend() { this.state = 'suspended'; return Promise.resolve(); }
        resume() { this.state = 'running'; this.resumes++; return Promise.resolve(); }
    }
    const playing = {muted: false, paused: false, plays: 0,
        pause() { this.paused = true; }, play() { this.paused = false; this.plays++; return Promise.resolve(); }};
    const idle = {...playing, muted: true, paused: true};
    const sandbox = environment(AudioContext, [playing, idle]);
    const context = new sandbox.AudioContext(), ownedByGame = new sandbox.AudioContext();
    await ownedByGame.suspend();
    for (let i = 0; i < 5; i++) {
        await sandbox.PadPort.pause();
        await sandbox.PadPort.pause();
        await sandbox.PadPort.resume();
    }
    assert.equal(context.resumes, 5);
    assert.equal(ownedByGame.resumes, 0);
    assert.equal(playing.plays, 5);
    assert.equal(playing.muted, false);
    assert.equal(idle.plays, 0);
    assert.equal(idle.muted, true);
});

test('delayed controller snapshots cannot pause audio after native foreground resume', async () => {
    class AudioContext {decodeAudioData() {}}
    const sandbox = environment(AudioContext, [], true);
    let pauses = 0, resumes = 0;
    sandbox.__mediaCtl = {pause: async () => { pauses++; }, resume: async () => { resumes++; }};
    await sandbox.PadPort.pause();
    await sandbox.PadPort.resume();
    sandbox.events.onmessage({data: JSON.stringify({revision: 1, paused: true, pads: []})});
    sandbox.events.onmessage({data: JSON.stringify({revision: 2, paused: false, pads: []})});
    assert.deepEqual([pauses, resumes], [1, 1]);
});

test('late suspend rejection cannot release ownership of a newer pause', async () => {
    class AudioContext {
        constructor() { this.state = 'running'; this.suspends = []; this.resumes = 0; }
        addEventListener() {}
        decodeAudioData() {}
        suspend() { return new Promise((resolve, reject) => this.suspends.push({resolve, reject})); }
        resume() { this.resumes++; this.state = 'running'; return Promise.resolve(); }
    }
    const sandbox = environment(AudioContext);
    const context = new sandbox.AudioContext();
    const first = sandbox.PadPort.pause();
    await sandbox.PadPort.resume();
    const second = sandbox.PadPort.pause();
    context.suspends[0].reject(new Error('old suspension cancelled'));
    await first;
    await sandbox.PadPort.resume();
    context.suspends[1].resolve();
    await second;
    assert.equal(context.resumes, 2);
});

test('a new pause cancels a resume while the context still reports suspended', async () => {
    class AudioContext {
        constructor() { this.state = 'running'; this.suspends = 0; this.resumes = []; }
        addEventListener() {}
        decodeAudioData() {}
        suspend() { this.suspends++; this.state = 'suspended'; return Promise.resolve(); }
        resume() { return new Promise(resolve => this.resumes.push(resolve)); }
    }
    const sandbox = environment(AudioContext), context = new sandbox.AudioContext();
    await sandbox.PadPort.pause();
    const resume = sandbox.PadPort.resume();
    await sandbox.PadPort.pause();
    assert.equal(context.suspends, 2);
    context.resumes[0]();
    await resume;
    const final = sandbox.PadPort.resume();
    assert.equal(context.resumes.length, 2);
    context.state = 'running'; context.resumes[1]();
    await final;
    assert.equal(context.state, 'running');
});
