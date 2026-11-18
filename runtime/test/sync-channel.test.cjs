'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const {once} = require('node:events');
const {RuntimeServer} = require('../src/server.cjs');

test('native file channel shares filesystem semantics across fragmented requests and closes with runtime', {timeout: 10000}, async t => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-sync-'));
    fs.mkdirSync(path.join(folder, 'js'));
    fs.writeFileSync(path.join(folder, 'js/rpg_core.js'), '');
    fs.writeFileSync(path.join(folder, 'index.html'), '<html></html>');
    t.after(() => fs.rmSync(folder, {recursive: true, force: true}));
    const server = await new RuntimeServer({folder, id: '0123456789abcdef',
        config: {bridgeToken: 'test-auth-token'}, assets: ''}).listen(0);
    t.after(() => server.close());
    const connect = async token => {
        const socket = net.connect(new URL(server.origin).port, '127.0.0.1');
        await once(socket, 'connect');
        socket.write('GET ' + new URL(server.url('__padport__/sync')).pathname + ' HTTP/1.1\r\nHost: ' +
            new URL(server.origin).host + '\r\nConnection: Upgrade\r\nUpgrade: padport-sync\r\nAuthorization: Bearer ' + token + '\r\n\r\n');
        return socket;
    };
    const rejected = await connect('wrong-token');
    let denied = '';
    for await (const chunk of rejected) denied += chunk;
    assert.ok(denied.startsWith('HTTP/1.1 403 '));
    const socket = await connect('test-auth-token');
    t.after(() => socket.destroy());
    const chunks = socket[Symbol.asyncIterator]();
    let buffered = Buffer.alloc(0);
    const read = async size => {
        while (buffered.length < size) {
            const {value, done} = await chunks.next();
            assert.equal(done, false, 'connection must remain open until runtime exits');
            buffered = Buffer.concat([buffered, value]);
        }
        const value = buffered.subarray(0, size); buffered = buffered.subarray(size); return value;
    };
    let handshake = '';
    while (!handshake.endsWith('\r\n\r\n')) handshake += (await read(1)).toString();
    assert.ok(handshake.startsWith('HTTP/1.1 101 '));
    const frame = command => {
        const bytes = Buffer.from(JSON.stringify({client: 'native-client', ...command})), header = Buffer.alloc(8);
        header.writeUInt32LE(bytes.length, 0); header.writeUInt32LE(1, 4);
        return Buffer.concat([header, bytes]);
    };
    const reply = async () => {
        const header = await read(8);
        assert.equal(header.readUInt32LE(4), 1);
        return JSON.parse((await read(header.readUInt32LE(0))).toString());
    };
    const bytes = frame({op: 'write', file: '/game/save.rpgsave', base64: Buffer.from('save 章节').toString('base64')});
    socket.write(bytes.subarray(0, 3));
    await new Promise(resolve => setImmediate(resolve));
    socket.write(bytes.subarray(3, 9));
    socket.write(bytes.subarray(9));
    assert.equal((await reply()).error, undefined);
    assert.equal(fs.readFileSync(path.join(folder, 'save.rpgsave'), 'utf8'), 'save 章节');
    socket.write(Buffer.concat([frame({op: 'read', file: '/game/save.rpgsave'}),
        frame({op: 'read', file: '/game/missing'}), frame({op: 'open', file: '/game/save.rpgsave', flags: 'r'})]));
    assert.equal(Buffer.from((await reply()).value.base64, 'base64').toString(), 'save 章节');
    assert.equal((await reply()).error.code, 'ENOENT');
    assert.equal(typeof (await reply()).value, 'number');
    assert.equal(server.handles.size, 1);
    assert.equal(server.syncSockets.size, 1);
    const closed = once(socket, 'close');
    await server.close(); await closed;
    assert.equal(server.syncSockets.size, 0);
    assert.equal(server.handles.size, 0);
});
