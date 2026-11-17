const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = ['gecko-host.js', 'bridge.js'].map(name =>
    fs.readFileSync(path.join(__dirname, '../app/src/main/assets', name), 'utf8')).join('\n');

function setup() {
    let stream, parses = 0, clears = 0;
    const listeners = new Map();
    const sandbox = {
        __PADPORT_CONFIG__: {}, PadPortI18n: {text: key => key}, PadPortBuffer: {Buffer},
        EventSource: class {
            constructor() { stream = this; }
            addEventListener() {}
        },
        JSON: {parse(value) { parses++; return JSON.parse(value); }, stringify: JSON.stringify},
        Event: class { constructor(type) { this.type = type; } },
        navigator: {}, performance: {now: () => 42},
        Input: {clear() { clears++; }}, TouchInput: {clear() {}},
        addEventListener: (type, callback) => listeners.set(type, callback), dispatchEvent() {},
        fetch: async () => ({}),
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    return {sandbox, parses: () => parses, clears: () => clears,
        message: data => stream.onmessage({data}), fire: type => listeners.get(type)({type})};
}

test('Gecko input polls reuse the state parsed on SSE delivery', () => {
    const t = setup(), host = t.sandbox.PadPortHost;
    const initialParses = t.parses();
    for (let i = 0; i < 36000; i++) t.sandbox.navigator.getGamepads();
    assert.equal(t.parses(), initialParses, 'unchanged input must not be parsed each frame');

    const raw = JSON.stringify({revision: 1, paused: false, pads: [
        {nativeId: 7, id: 'Controller', axes: [0.5, 0, 0, 0], buttons: [1]}
    ]});
    t.message(raw);
    assert.equal(t.parses(), initialParses + 1);
    const state = host.inputSnapshot();
    for (let i = 0; i < 36000; i++) {
        const pad = t.sandbox.navigator.getGamepads()[0];
        assert.equal(pad.axes[0], 0.5);
        assert.equal(pad.buttons[0].pressed, true);
    }
    assert.equal(t.parses(), initialParses + 1);
    assert.equal(host.inputSnapshot(), state);
    assert.equal(host.snapshot(), raw, 'existing string snapshot consumers remain compatible');
    assert.equal(state.pads[0].buttons[0], 1, 'polling must not mutate the received state');
});

test('SSE updates still release held input and switch keyboard mode before key listeners', () => {
    const t = setup();
    t.message(JSON.stringify({revision: 1, paused: false, pads: [
        {nativeId: 7, id: 'Controller', axes: [1, 0, 0, 0], buttons: [1]}
    ]}));
    const old = t.sandbox.navigator.getGamepads()[0];
    t.message(JSON.stringify({revision: 2, paused: true, pads: [
        {nativeId: 7, id: 'Controller', axes: [1, 0, 0, 0], buttons: [1]}
    ]}));
    const paused = t.sandbox.navigator.getGamepads()[0];
    assert.equal(paused.buttons[0].pressed, false);
    assert.equal(paused.axes[0], 0);
    t.message(JSON.stringify({revision: 3, paused: false, inputMode: 'keyboard', pads: []}));
    t.fire('keydown');
    assert.equal(t.sandbox.PadPort.inputMode(), 'keyboard');
    assert.equal(old.connected, false);
    assert.equal(t.sandbox.navigator.getGamepads()[0], null);
    assert.ok(t.clears() > 0);
});

test('invalid SSE JSON leaves both snapshots at the last successfully received state', () => {
    const t = setup(), host = t.sandbox.PadPortHost;
    const raw = JSON.stringify({revision: 1, paused: false, pads: []});
    t.message(raw);
    const state = host.inputSnapshot();
    assert.throws(() => t.message('{'), SyntaxError);
    assert.equal(host.inputSnapshot(), state);
    assert.equal(host.snapshot(), raw);
});
