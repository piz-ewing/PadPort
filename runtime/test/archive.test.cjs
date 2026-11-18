'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const asar = require('@electron/asar');
const {Pickle} = require('@electron/asar/lib/pickle');
const {GameFiles} = require('../src/files.cjs');

test('ASAR preserves package paths, resolves the declared page, and keeps executable files separate', async t => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-archive-'));
    t.after(() => fs.rmSync(folder, {recursive: true, force: true}));
    const source = path.join(folder, 'source'), game = path.join(folder, 'game');
    fs.mkdirSync(path.join(source, 'pages/js'), {recursive: true});
    fs.mkdirSync(path.join(source, 'shared'));
    fs.mkdirSync(path.join(game, 'resources'), {recursive: true});
    fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({main: 'pages/start.html'}));
    fs.writeFileSync(path.join(source, 'pages/start.html'), '<html><head></head></html>');
    fs.writeFileSync(path.join(source, 'pages/js/rpg_core.js'), '');
    fs.writeFileSync(path.join(source, 'shared/value.json'), '{"value":7}');
    fs.writeFileSync(path.join(game, 'external.txt'), 'outside');
    await asar.createPackageWithOptions(source, path.join(game, 'resources/app.asar'), {unpack: '**/value.json'});
    const files = new GameFiles(game);
    t.after(() => files.close());
    assert.equal(files.entry, 'resources/app.asar/pages/start.html');
    assert.equal(files.appRoot, '/game/resources/app.asar');
    assert.equal(files.engine, 'MV');
    assert.equal(files.read('/game/resources/app.asar/shared/value.json').toString(), '{"value":7}');
    assert.equal(files.read('/game/external.txt').toString(), 'outside');
    assert.ok(files.list('/game/resources/app.asar').includes('shared'));
    assert.equal(files.exists('/game/shared/value.json'), false);
    assert.throws(() => files.write('/game/resources/app.asar/shared/value.json', 'changed'), {code: 'EROFS'});
    files.mkdir('/game/save');
    files.write('/game/save/file1.rpgsave', 'raw');
    assert.equal(fs.readFileSync(path.join(game, 'save/file1.rpgsave'), 'utf8'), 'raw');
});

test('ASAR links retain canonical unpacked paths and invalid metadata fails before serving', t => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-archive-'));
    t.after(() => fs.rmSync(folder, {recursive: true, force: true}));
    const archive = path.join(folder, 'app.asar');
    fs.mkdirSync(archive + '.unpacked/shared', {recursive: true});
    fs.writeFileSync(archive + '.unpacked/shared/value.txt', 'value');
    function write(files) {
        const header = Pickle.createEmpty();
        header.writeString(JSON.stringify({files}));
        const size = Pickle.createEmpty();
        size.writeUInt32(header.toBuffer().length);
        fs.writeFileSync(archive, Buffer.concat([size.toBuffer(), header.toBuffer()]));
    }
    const base = {
        'index.html': {size: 0, offset: '0'},
        js: {files: {'rpg_core.js': {size: 0, offset: '0'}}},
        shared: {files: {'value.txt': {size: 5, unpacked: true}}},
        alias: {link: 'shared'},
        'copy.txt': {link: 'alias/value.txt'}
    };
    write(base);
    const files = new GameFiles(folder);
    try {
        assert.equal(files.read('app.asar/copy.txt').toString(), 'value');
        assert.equal(files.read('app.asar/ALIAS/VALUE.TXT').toString(), 'value');
        assert.deepEqual(files.list('app.asar/alias'), ['value.txt']);
        assert.throws(() => files.read('app.asar/copy.txt/child'), {code: 'ENOTDIR'});
    } finally { files.close(); }
    for (const [node, code] of [
        [{link: 'bad'}, 'ELOOP'],
        [{link: '../outside'}, 'EACCES'],
        [{link: '/game/index.html'}, 'EINVAL'],
        [{size: 1, offset: '0'}, 'EINVAL'],
        [{size: 1.5, offset: '0'}, 'EINVAL']
    ]) {
        write({...base, bad: node});
        assert.throws(() => new GameFiles(folder), {code});
    }
    for (const bytes of [Buffer.alloc(0), Buffer.from([4, 0, 0, 0, 255, 255, 255, 127])]) {
        fs.writeFileSync(archive, bytes);
        assert.throws(() => new GameFiles(folder), {code: 'EINVAL'});
    }
});
