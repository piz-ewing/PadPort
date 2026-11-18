'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const asar = require('@electron/asar');
const net = require('node:net');
const {once} = require('node:events');
const {GameFiles} = require('../src/files.cjs');
const {RuntimeServer, span, portFor} = require('../src/server.cjs');

function fixture(t, prefix = '') {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-runtime-'));
    t.after(() => fs.rmSync(folder, {recursive: true, force: true}));
    const root = path.join(folder, prefix);
    fs.mkdirSync(path.join(root, 'js'), {recursive: true});
    fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><html><head></head><body>Fixture</body></html>');
    fs.writeFileSync(path.join(root, 'js/rpg_core.js'), '');
    fs.mkdirSync(path.join(root, 'data'));
    fs.writeFileSync(path.join(root, 'data/value.json'), '{"value":7}');
    fs.writeFileSync(path.join(root, 'sample.bin'), Buffer.from([0, 1, 127, 128, 254, 255]));
    return {folder, root};
}

test('ordinary game files preserve raw saves and filesystem error behavior', t => {
    const {folder, root} = fixture(t, 'www'), files = new GameFiles(folder);
    assert.equal(files.engine, 'MV');
    assert.equal(files.read('/game/www/DATA/VALUE.JSON').toString(), '{"value":7}');
    assert.equal(files.stat('/game/www/data').type, 'directory');
    assert.deepEqual([...files.read('www/sample.bin')], [0, 1, 127, 128, 254, 255]);
    files.mkdir('/game/save', {recursive: true});
    const original = Buffer.from('chapter-title\u0000\u00ff');
    files.write('/game/save/file3.rpgsave', original);
    files.rename('save/file3.rpgsave', 'save/file5.rpgsave');
    assert.deepEqual(fs.readFileSync(path.join(folder, 'save/file5.rpgsave')), original);
    assert.deepEqual(new GameFiles(folder).read('save/file5.rpgsave'), original);
    files.unlink('save/file5.rpgsave');
    assert.equal(files.exists('save/file5.rpgsave'), false);
    assert.throws(() => files.read('missing'), {code: 'ENOENT'});
    assert.throws(() => files.read('../outside'), {code: 'EACCES'});
    assert.throws(() => files.write('/etc/value', 'x'), {code: 'EACCES'});
    assert.throws(() => files.read('C:/Windows/file'), {code: 'EACCES'});
    files.close();
});

test('ASAR reads packed/unpacked data and stores unconverted saves beside the archive', async t => {
    const {folder, root} = fixture(t, 'source/www');
    const game = path.join(folder, 'package'); fs.mkdirSync(game);
    await asar.createPackageWithOptions(path.join(folder, 'source'), path.join(game, 'app.asar'), {unpack: '**/sample.bin'});
    const files = new GameFiles(game); t.after(() => files.close());
    assert.equal(files.engine, 'MV');
    assert.equal(files.entry, 'app.asar/www/index.html');
    assert.equal(files.read('app.asar/www/DATA/value.json').toString(), '{"value":7}');
    assert.deepEqual(files.read('app.asar/www/sample.bin'), fs.readFileSync(path.join(root, 'sample.bin')));
    files.mkdir('save', {recursive: true}); files.write('save/global.rpgsave', 'metadata');
    assert.equal(fs.readFileSync(path.join(game, 'save/global.rpgsave'), 'utf8'), 'metadata');
    assert.throws(() => files.write('app.asar/www/data/value.json', 'changed'), {code: 'EROFS'});
    assert.equal(asar.extractFile(path.join(game, 'app.asar'), path.join('www', 'data', 'value.json')).toString(), '{"value":7}');
    assert.ok(files.list('app.asar/www/data').includes('value.json'));
});

test('loopback server authenticates requests and streams byte ranges without rewriting binary data', async t => {
    const {folder} = fixture(t), events = [];
    const server = await new RuntimeServer({folder, id: '0123456789abcdef', assets: path.resolve(__dirname, '../../app/src/main/assets'),
        onMessage: (...args) => events.push(args)}).listen(0);
    t.after(() => server.close());
    assert.equal((await fetch(server.origin + '/wrong/sample.bin')).status, 403);
    assert.equal((await fetch(server.url('missing.png'))).status, 404);
    const index = await (await fetch(server.url())).text();
    assert.ok(index.indexOf('__padport__/runtime.js') < index.indexOf('</head>'));
    const ranged = await fetch(server.url('sample.bin'), {headers: {Range: 'bytes=2-4'}});
    assert.equal(ranged.status, 206); assert.equal(ranged.headers.get('content-range'), 'bytes 2-4/6');
    assert.deepEqual([...new Uint8Array(await ranged.arrayBuffer())], [127, 128, 254]);
    assert.equal((await fetch(server.url('sample.bin'), {headers: {Range: 'bytes=7-'}})).status, 416);
    assert.equal((await fetch(server.url('sample.bin'), {method: 'HEAD'})).headers.get('content-length'), '6');
    const endpoint = server.url('__padport__/fs');
    assert.equal((await fetch(endpoint, {method: 'POST', body: '{}'})).status, 403);
    const rpc = async command => (await fetch(endpoint, {method: 'POST', headers: {Origin: server.origin}, body: JSON.stringify(command)})).json();
    assert.equal((await rpc({op: 'mkdir', file: '/game/save', options: {recursive: true}})).error, undefined);
    assert.equal((await rpc({op: 'write', file: '/game/save/file5.rpgsave', base64: Buffer.from('original').toString('base64')})).error, undefined);
    assert.equal(Buffer.from((await rpc({op: 'read', file: '/game/save/file5.rpgsave'})).value.base64, 'base64').toString(), 'original');
    assert.equal((await rpc({op: 'resolve', name: './data/value', basedir: '/game'})).value, '/game/data/value.json');
    assert.equal((await fetch(server.origin + '/__control__', {method: 'POST', body: '{}'})).status, 403);
    assert.equal(events.length, 0);
});

test('port and byte range rules match existing origins and reject invalid requests', () => {
    assert.equal(portFor('0123456789abcdef'), 20000 + (0x01234567 % 30000));
    assert.deepEqual(span('bytes=-2', 6), [4, 5]);
    assert.deepEqual(span('bytes=3-', 6), [3, 5]);
    for (const value of ['bytes=-0', 'bytes=-', 'bytes=6-', 'bytes=1-0', 'bytes=0-1,3-4', 'bytes=x-y'])
        assert.equal(span(value, 6), null);
});

test('occupied ports select a reusable assignment without disturbing the existing listener', async t => {
    const {folder} = fixture(t);
    const occupied = net.createServer(socket => socket.end('existing listener'));
    occupied.listen(0, '127.0.0.1');
    await once(occupied, 'listening');
    t.after(() => new Promise(resolve => occupied.close(resolve)));
    const port = occupied.address().port;
    let server = await new RuntimeServer({folder, id: '0123456789abcdef'}).listen(port);
    t.after(() => server.close());
    const assigned = new URL(server.origin).port;
    assert.notEqual(Number(assigned), port);
    assert.deepEqual([...new Uint8Array(await (await fetch(server.url('sample.bin'),
        {headers: {Connection: 'close'}})).arrayBuffer())], [0, 1, 127, 128, 254, 255]);
    const client = net.connect(port, '127.0.0.1');
    const [bytes] = await once(client, 'data');
    assert.equal(bytes.toString(), 'existing listener');
    client.destroy();
    const origin = server.origin;
    await server.close();
    server = await new RuntimeServer({folder, id: '0123456789abcdef', config: {port: Number(assigned)}}).listen();
    assert.equal(server.origin, origin);
    assert.deepEqual([...new Uint8Array(await (await fetch(server.url('sample.bin'),
        {headers: {Connection: 'close'}})).arrayBuffer())], [0, 1, 127, 128, 254, 255]);
});

test('repeated shutdown closes SSE clients and releases the listening port', async t => {
    const {folder} = fixture(t);
    const server = await new RuntimeServer({folder, id: '0123456789abcdef'}).listen(0);
    t.after(() => server.close());
    const response = await fetch(server.url('__padport__/events'));
    const reader = response.body.getReader();
    await reader.read();
    assert.equal(server.listeners.size, 1);
    const port = Number(new URL(server.origin).port);
    await Promise.all([server.close(), server.close()]);
    assert.equal(server.listeners.size, 0);
    assert.equal(server.handles.size, 0);
    await reader.cancel();
    const replacement = await new RuntimeServer({folder, id: '0123456789abcdef'}).listen(port);
    t.after(() => replacement.close());
    assert.equal(Number(new URL(replacement.origin).port), port);
});
