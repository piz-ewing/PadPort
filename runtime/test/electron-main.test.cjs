'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {startMainScope} = require('../src/electron-main.cjs');

test('main script readiness handlers and CommonJS scope follow the page launcher contract', async () => {
    const original = global.window;
    const listeners = new Map();
    global.window = {addEventListener: (name, handler) => listeners.set(name, handler),
        removeEventListener: (name, handler) => { if (listeners.get(name) === handler) listeners.delete(name); }};
    let loaded;
    try {
        const app = new EventEmitter(), electron = {app}, calls = [];
        loaded = startMainScope({app, filename: '/game/main.cjs', directory: '/game', electron,
            makeRequire: (filename, object) => {
                assert.equal(filename, '/game/main.cjs'); assert.equal(object, electron);
                return name => name === 'electron' ? electron : calls;
            }, script: 'const {app}=require("electron"), calls=require("calls");' +
                'exports.local=__dirname; calls.push(module.exports.local, __filename);' +
                'app.on("ready",()=>calls.push("ready"));' +
                'app.once("activate",()=>calls.push("activate"));' +
                'app.whenReady().then(()=>calls.push("promise"));'});
        await Promise.resolve();
        assert.deepEqual(calls, ['/game', '/game/main.cjs', 'ready', 'activate', 'promise']);
        assert.equal(app.requestSingleInstanceLock(), true);
        loaded();
        assert.equal(listeners.size, 0);
    } finally { if (loaded) loaded(); global.window = original; }
});
