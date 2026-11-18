'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {RuntimeServer} = require('../src/server.cjs');

test('native JavaScript file interface preserves synchronous writes, bytes and filesystem errors', t => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-native-files-'));
    fs.mkdirSync(path.join(folder, 'js'));
    fs.writeFileSync(path.join(folder, 'js/rpg_core.js'), '');
    fs.writeFileSync(path.join(folder, 'index.html'), '<html></html>');
    fs.mkdirSync(path.join(folder, 'www/js/plugins'), {recursive: true});
    fs.writeFileSync(path.join(folder, 'www/js/plugins/Example.js'), 'plugin source');
    const server = new RuntimeServer({folder, id: '0123456789abcdef', assets: ''});
    t.after(() => { server.files.close(); fs.rmSync(folder, {recursive: true, force: true}); });
    const sandbox = {
        window: {
            __PADPORT_RUNTIME_CONFIG__: {root: '/game', appRoot: '/game', cwd: '/game/www', main: 'www/index.html',
                platform: 'linux', bridgeToken: 'test-token'},
            PadPortFiles: {request(token, command) {
                assert.equal(token, 'test-token');
                return JSON.stringify(server.fileReply(command));
            }}
        },
        require: name => name === 'path' ? process => ({...path.posix, resolve: (...args) => path.posix.resolve(process.cwd(), ...args)}) :
            name === 'process/browser' ? {env: {}} : require(name),
        URL, crypto: require('node:crypto').webcrypto,
        document: {currentScript: {src: 'http://127.0.0.1:23000/session/__padport__/runtime.js'}},
        XMLHttpRequest: class {constructor() { throw new Error('Native file calls must not use XMLHttpRequest'); }}
    };
    const source = fs.readFileSync(path.join(__dirname, '../src/client.cjs'), 'utf8');
    vm.createContext(sandbox);
    const files = vm.runInContext(source.slice(0, source.indexOf('const {proxyFs: fs,')) + '\nfsRemote;', sandbox);
    assert.equal(sandbox.window.process.cwd(), '/game/www');
    assert.deepEqual(Array.from(files.readdirSync('./js/plugins/')), ['Example.js']);
    assert.equal(files.statSync('./js/plugins/Example.js').isFile(), true);
    assert.equal(files.readFileSync('./js/plugins/Example.js', 'utf8'), 'plugin source');
    assert.throws(() => files.readdirSync('./js/missing'), {code: 'ENOENT'});
    files.mkdirSync('/game/save');
    files.writeFileSync('/game/save/slot', '章节标题', 'utf16le');
    assert.equal(fs.readFileSync(path.join(folder, 'save/slot'), 'utf16le'), '章节标题');
    files.appendFileSync('/game/save/slot', '!', 'utf16le');
    assert.equal(files.readFileSync('/game/save/slot', 'utf16le'), '章节标题!');
    const bytes = Uint8Array.from([255, 0, 128, 1, 254]).subarray(1, 4);
    files.writeFileSync('/game/save/raw', bytes);
    assert.deepEqual([...fs.readFileSync(path.join(folder, 'save/raw'))], [0, 128, 1]);
    files.renameSync('/game/save/raw', '/game/save/renamed');
    assert.deepEqual([...files.readFileSync('/game/save/renamed')], [0, 128, 1]);
    assert.throws(() => files.writeFileSync('/game/save/slot', 'replacement', {flag: 'wx'}), {code: 'EEXIST'});
    assert.equal(files.readFileSync('/game/save/slot', 'utf16le'), '章节标题!');
});
