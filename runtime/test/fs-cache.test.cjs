'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const util = require('node:util');
const create = require('../src/fs-cache.cjs');

function fixture(t) {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-files-'));
    let cleanup;
    const modules = create({fsOri: fs, path, util, Buffer, process: {cwd: () => folder},
        packageData: {gameCWD: folder}, writeFileSync: fs.writeFileSync,
        onCleanup: callback => { cleanup = callback; }});
    t.after(() => { cleanup(); fs.rmSync(folder, {recursive: true, force: true}); });
    return {...modules, folder};
}

test('cached file APIs preserve immediate disk visibility, encodings and failed mutations', async t => {
    const {proxyFs: files, proxyFsExtra: extra, folder} = fixture(t);
    const file = path.join(folder, 'save/current');
    extra.outputFileSync(file, '章节', {encoding: 'utf16le'});
    assert.equal(fs.readFileSync(file, 'utf16le'), '章节');
    assert.equal(await files.promises.readFile(file, 'utf16le'), '章节');
    files.appendFileSync(file, '!', 'utf16le');
    assert.equal(files.readFileSync(file, 'utf16le'), '章节!');
    assert.throws(() => files.writeFileSync(file, 'replacement', {flag: 'wx'}), {code: 'EEXIST'});
    assert.equal(files.readFileSync(file, 'utf16le'), '章节!');
    assert.throws(() => files.renameSync(file, path.join(folder, 'missing', 'new')), {code: 'ENOENT'});
    assert.equal(files.readFileSync(file, 'utf16le'), '章节!');
    const fd = files.openSync(file, 'r+');
    files.writeSync(fd, Buffer.from('A\0'), 0, 2, 0);
    files.closeSync(fd);
    assert.equal(files.readFileSync(file, 'utf16le'), 'A节!');
    files.unlinkSync(file);
    assert.equal(files.existsSync(file), false);
    assert.equal(files.statSync(file, {throwIfNoEntry: false}), undefined);
});

test('file proxies preserve constructors and repeatable plugin method wrapping', t => {
    const {proxyFs: files, proxyFsExtra: extra, folder} = fixture(t);
    extra.outputJsonSync(path.join(folder, 'config.json'), {value: 7});
    const entry = files.readdirSync(folder, {withFileTypes: true})[0];
    assert.equal(entry instanceof files.Dirent, true);
    assert.equal(entry.isFile(), true);
    fs.mkdirSync(path.join(folder, 'save'));
    const directory = files.readdirSync(folder, {withFileTypes: true}).find(entry => entry.name === 'save');
    assert.equal(directory instanceof files.Dirent, true);
    assert.equal(directory.isDirectory(), true);
    assert.equal(directory.isFile(), false);
    assert.equal(files.statSync(path.join(folder, 'config.json')) instanceof files.Stats, true);
    const original = Object.getOwnPropertyDescriptor(files, 'readFileSync').value;
    let calls = 0;
    Object.defineProperty(files, 'readFileSync', {value: (...args) => { calls++; return original(...args); }});
    Object.defineProperty(files, 'readFileSync', {value: files.readFileSync});
    assert.equal(files.readFileSync(path.join(folder, 'config.json'), 'utf8'), '{"value":7}');
    assert.equal(calls, 1);
    assert.ok(Object.keys(files.promises).includes('readFile'));
});

test('read caches release idle and excess data while synchronous saves reach disk', t => {
    const {proxyFs: files, FakeFsSharedCache: cache, folder} = fixture(t);
    cache._config.maxEntries = 4;
    cache._config.maxFileBytes = 16;
    for (let i = 0; i < 12; i++) files.writeFileSync(path.join(folder, String(i)), Buffer.alloc(8, i));
    assert.ok(files.writeCache.size <= 2);
    assert.ok(files.existsCache.size <= 4);
    for (let i = 0; i < 12; i++) assert.deepEqual(fs.readFileSync(path.join(folder, String(i))), Buffer.alloc(8, i));
    for (const name of ['accessCache', 'statCache', 'existsCache', 'writeCache'])
        for (const key of cache._meta[name].keys()) cache._meta[name].set(key, 0);
    files.cleanupExpiredCacheEntries();
    assert.equal(files.writeCache.size, 0);
    assert.equal(files.existsCache.size, 0);
});
