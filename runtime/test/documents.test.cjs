'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const asar = require('@electron/asar');
const {GameFiles} = require('../src/files.cjs');
const {DocumentFiles} = require('../src/documents.cjs');
const {RuntimeServer} = require('../src/server.cjs');

test('document descriptors retain archive offsets, ranges and raw writable files', async t => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-documents-'));
    t.after(() => fs.rmSync(folder, {recursive: true, force: true}));
    const source = path.join(folder, 'source');
    fs.mkdirSync(path.join(source, 'www/js'), {recursive: true});
    fs.writeFileSync(path.join(source, 'www/js/rpg_core.js'), '');
    fs.writeFileSync(path.join(source, 'www/index.html'), '<html></html>');
    fs.writeFileSync(path.join(source, 'www/value.bin'), Buffer.from([1, 2, 3, 4, 5]));
    const archive = path.join(folder, 'archive');
    await asar.createPackage(source, archive);
    const bytes = fs.readFileSync(archive);
    const container = path.join(folder, 'container');
    fs.writeFileSync(container, Buffer.concat([Buffer.alloc(91, 7), bytes, Buffer.alloc(32, 9)]));
    const native = {request(json) {
        const command = JSON.parse(json), local = path.join(folder, command.file);
        try {
            let value;
            if (command.op === 'stat') {
                const stat = command.file === 'app.asar' ? {size: bytes.length, isDirectory: () => false} : fs.statSync(local);
                value = {size: stat.size, type: stat.isDirectory() ? 'directory' : 'file'};
            } else if (command.op === 'resource') {
                value = command.file === 'app.asar' ? {fd: fs.openSync(container, 'r'), offset: 91, size: bytes.length}
                    : {fd: fs.openSync(local, 'r'), offset: 0, size: fs.statSync(local).size};
            } else if (command.op === 'open') value = fs.openSync(local, command.flags);
            else if (command.op === 'mkdir') fs.mkdirSync(local, {recursive: command.recursive});
            else if (command.op === 'list') value = fs.readdirSync(local);
            else if (command.op === 'rename') fs.renameSync(local, path.join(folder, command.to));
            else throw new Error('Unexpected operation: ' + command.op);
            return JSON.stringify({value});
        } catch (error) { return JSON.stringify({error: {message: error.message, code: error.code}}); }
    }};
    const files = new GameFiles(new DocumentFiles(native));
    t.after(() => files.close());
    assert.equal(files.entry, 'app.asar/www/index.html');
    assert.deepEqual(files.read('/game/app.asar/www/value.bin'), Buffer.from([1, 2, 3, 4, 5]));
    const chunks = [];
    for await (const chunk of files.stream('app.asar/www/value.bin', 1, 3)) chunks.push(chunk);
    assert.deepEqual(Buffer.concat(chunks), Buffer.from([2, 3, 4]));
    files.mkdir('/game/save', {recursive: true});
    files.write('/game/save/current', '章节', 'utf16le');
    files.rename('/game/save/current', '/game/save/file1');
    assert.equal(files.read('/game/save/file1').toString('utf16le'), '章节');
    assert.throws(() => files.write('/game/app.asar/www/current', 'x'), {code: 'EROFS'});
});

test('HTTP resources use one provider descriptor and fresh sizes after writes', async t => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'padport-resource-'));
    t.after(() => fs.rmSync(folder, {recursive: true, force: true}));
    fs.mkdirSync(path.join(folder, 'js'));
    fs.writeFileSync(path.join(folder, 'js/rpg_core.js'), '');
    fs.writeFileSync(path.join(folder, 'index.html'), '<html></html>');
    fs.writeFileSync(path.join(folder, 'sample.bin'), Buffer.from([1, 2, 3, 4]));
    const operations = [], descriptors = [];
    const native = {request(json) {
        const command = JSON.parse(json), local = path.join(folder, command.file);
        operations.push(command.op);
        try {
            let value;
            if (command.op === 'stat') {
                const stat = fs.statSync(local);
                value = {type: stat.isDirectory() ? 'directory' : 'file', size: stat.size};
            } else if (command.op === 'resource') {
                const fd = fs.openSync(local, 'r');
                descriptors.push(fd);
                value = {fd, offset: 0, size: fs.fstatSync(fd).size};
            } else throw new Error('Unexpected operation: ' + command.op);
            return JSON.stringify({value});
        } catch (error) { return JSON.stringify({error: {message: error.message, code: error.code}}); }
    }};
    const files = new GameFiles(new DocumentFiles(native));
    const server = await new RuntimeServer({files, id: '0123456789abcdef'}).listen(0);
    t.after(() => server.close());
    async function request(options, status, length) {
        operations.length = 0; descriptors.length = 0;
        const response = await fetch(server.url('sample.bin'), options);
        await response.arrayBuffer();
        assert.equal(response.status, status);
        assert.equal(response.headers.get('content-length'), String(length));
        assert.deepEqual(operations, ['resource']);
        for (const fd of descriptors) assert.throws(() => fs.fstatSync(fd), {code: 'EBADF'});
    }
    await request({}, 200, 4);
    fs.writeFileSync(path.join(folder, 'sample.bin'), Buffer.alloc(19, 7));
    await request({}, 200, 19);
    await request({method: 'HEAD'}, 200, 19);
    await request({headers: {Range: 'bytes=1-3'}}, 206, 3);
    await request({headers: {Range: 'bytes=30-'}}, 416, 0);
});
