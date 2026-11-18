'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('frame scheduler caps high refresh callbacks while preserving cancellation and 60 Hz jitter', () => {
    let next = 1;
    const pending = new Map();
    const sandbox = {module: {exports: {}}, setTimeout,
        requestAnimationFrame(callback) { const id = next++; pending.set(id, callback); return id; },
        cancelAnimationFrame(id) { pending.delete(id); }};
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/frame-scheduler.cjs'), 'utf8'), sandbox);
    sandbox.module.exports.installFrameScheduler();
    const step = time => {
        const batch = [...pending.values()]; pending.clear();
        for (const callback of batch) callback(time);
    };
    let frames = 0;
    const draw = () => { frames++; sandbox.requestAnimationFrame(draw); };
    sandbox.requestAnimationFrame(draw);
    const canceled = sandbox.requestAnimationFrame(() => assert.fail('canceled callback'));
    sandbox.cancelAnimationFrame(canceled);
    step(0); step(8.33); step(16.66); step(25); step(33.33); step(41.66); step(50);
    assert.equal(frames, 4);
    for (const time of [66.5, 83.2, 99.8, 116.5]) step(time);
    assert.equal(frames, 8, '60 Hz timestamp jitter must not halve the callback rate');
    let later;
    const first = sandbox.requestAnimationFrame(() => sandbox.cancelAnimationFrame(later));
    later = sandbox.requestAnimationFrame(() => assert.fail('callback canceled by earlier callback'));
    step(133.2);
    sandbox.cancelAnimationFrame(first);
});
