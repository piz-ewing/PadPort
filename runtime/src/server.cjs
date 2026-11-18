'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {randomBytes} = require('node:crypto');
const {pipeline} = require('node:stream/promises');
const resolveModule = require('resolve').sync;
const zlib = require('node:zlib');
const nodeUrl = require('node:url');
const {GameFiles, relative, fail} = require('./files.cjs');

const types = {html: 'text/html', js: 'application/javascript', json: 'application/json', css: 'text/css',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml',
    ogg: 'audio/ogg', m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'video/mp4', webm: 'video/webm',
    ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2', wasm: 'application/wasm'};
const idle = {revision: 0, paused: false, pads: []};

function portFor(id) {
    if (!/^[0-9a-f]{8,64}$/.test(id)) throw new TypeError('Invalid game id');
    return 20000 + (parseInt(id.slice(0, 8), 16) % 30000);
}

function span(header, size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(header);
    if (!match || size === 0) return null;
    let start, end;
    if (!match[1]) {
        const suffix = Number(match[2]);
        if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
        start = Math.max(0, size - suffix); end = size - 1;
    } else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1; }
    return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start < size && end >= start ? [start, end] : null;
}

function mime(file) {
    const value = types[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream';
    return /^(text\/|application\/(javascript|json))/.test(value) ? value + '; charset=utf-8' : value;
}

async function body(request, limit = 64 * 1024 * 1024) {
    let length = 0; const chunks = [];
    for await (const chunk of request) {
        length += chunk.length;
        if (length > limit) throw fail('EFBIG', 'request', request.url);
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

function send(response, status, value, type = 'application/json; charset=utf-8') {
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
    response.writeHead(status, {'Content-Type': type, 'Content-Length': bytes.length});
    response.end(bytes);
}

class RuntimeServer {
    constructor({folder, id, assets, files, config = {}, onMessage = () => {}}) {
        this.files = files || new GameFiles(folder);
        this.id = id;
        this.assets = assets;
        this.onMessage = onMessage;
        this.config = config;
        this.token = 't' + randomBytes(16).toString('hex');
        this.controlToken = randomBytes(32).toString('hex');
        this.snapshot = JSON.stringify(idle);
        this.listeners = new Set();
        this.syncSockets = new Set();
        this.handles = new Map();
        this.nextHandle = 1;
        this.closePromise = null;
        this.server = http.createServer((req, res) => this.handle(req, res).catch(error => {
            if (res.headersSent) { res.destroy(); return; }
            const status = {ENOENT: 404, EACCES: 403, EROFS: 403, EFBIG: 413, EINVAL: 400}[error.code] || 500;
            send(res, status, {error: {code: error.code || 'EIO', message: error.message}});
        }));
        this.server.requestTimeout = 30000;
        this.server.headersTimeout = 10000;
        this.server.on('upgrade', (request, socket, head) => this.openSync(request, socket, head));
    }

    openSync(request, socket, head) {
        socket.on('error', () => socket.destroy());
        if (!this.config.bridgeToken || request.method !== 'GET' ||
            request.url !== '/' + this.token + '/__padport__/sync' ||
            request.headers.host !== new URL(this.origin).host ||
            request.headers.upgrade !== 'padport-sync' ||
            request.headers.authorization !== 'Bearer ' + this.config.bridgeToken) {
            socket.end('HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
            return;
        }
        this.syncSockets.add(socket);
        socket.setNoDelay(true);
        socket.on('close', () => this.syncSockets.delete(socket));
        socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: padport-sync\r\n\r\n');
        const header = Buffer.alloc(8);
        let headerLength = 0, payload = null, offset = 0;
        const receive = chunk => {
            while (chunk.length && !socket.destroyed) {
                if (!payload) {
                    const length = Math.min(8 - headerLength, chunk.length);
                    chunk.copy(header, headerLength, 0, length);
                    headerLength += length; chunk = chunk.subarray(length);
                    if (headerLength !== 8) continue;
                    const size = header.readUInt32LE(0), type = header.readUInt32LE(4);
                    if (type !== 1 || !size || size > 64 * 1024 * 1024) { socket.destroy(); return; }
                    payload = Buffer.allocUnsafe(size); offset = 0;
                }
                const length = Math.min(payload.length - offset, chunk.length);
                chunk.copy(payload, offset, 0, length);
                offset += length; chunk = chunk.subarray(length);
                if (offset !== payload.length) continue;
                const reply = this.fileReply(payload.toString('utf8'));
                payload = null; headerLength = 0;
                const bytes = Buffer.from(JSON.stringify(reply));
                if (bytes.length > 64 * 1024 * 1024 || socket.writableLength > 64 * 1024 * 1024) { socket.destroy(); return; }
                const resultHeader = Buffer.alloc(8);
                resultHeader.writeUInt32LE(bytes.length, 0); resultHeader.writeUInt32LE(1, 4);
                socket.cork(); socket.write(resultHeader); socket.write(bytes); socket.uncork();
            }
        };
        socket.on('data', receive);
        if (head.length) receive(head);
    }

    fileReply(data) {
        try { return {value: this.fileCommand(JSON.parse(data))}; }
        catch (error) { return {error: {code: error.code || 'EIO', message: error.message,
            syscall: error.syscall, path: error.path}}; }
    }

    async listen(port = this.config.port || portFor(this.id)) {
        const initial = port;
        for (let attempt = 0; ; attempt++) {
            try {
                await new Promise((resolve, reject) => {
                    const error = value => { this.server.removeListener('listening', listening); reject(value); };
                    const listening = () => { this.server.removeListener('error', error); resolve(); };
                    this.server.once('error', error);
                    this.server.once('listening', listening);
                    this.server.listen(port, '127.0.0.1');
                });
                break;
            } catch (error) {
                if (error.code !== 'EADDRINUSE' || initial === 0 || attempt >= 63) {
                    await this.close();
                    throw error;
                }
                port = port === 65535 ? 20000 : port + 1;
            }
        }
        this.origin = 'http://127.0.0.1:' + this.server.address().port;
        return this;
    }

    url(file = this.files.mainIsJs ? '__padport__/launch' : this.files.entry || 'index.html') {
        return this.origin + '/' + this.token + '/' + file.split('/').map(encodeURIComponent).join('/');
    }

    broadcast(message) {
        for (const response of this.listeners) {
            if (!response.write(message)) response.destroy();
        }
    }

    publish(state) { this.snapshot = JSON.stringify(state); this.broadcast('data: ' + this.snapshot + '\n\n'); }
    command(value) { this.broadcast('event: cmd\ndata: ' + String(value).replace(/[\r\n]/g, ' ') + '\n\n'); }

    async close() {
        if (this.closePromise) return this.closePromise;
        this.closePromise = this.closeResources();
        return this.closePromise;
    }

    async closeResources() {
        for (const socket of this.syncSockets) socket.destroy();
        this.syncSockets.clear();
        for (const response of this.listeners) response.end();
        this.listeners.clear();
        try {
            if (this.server.listening) await new Promise((resolve, reject) => {
                this.server.close(error => error ? reject(error) : resolve());
                this.server.closeAllConnections();
            });
        } finally {
            for (const handle of this.handles.values()) fs.closeSync(handle.fd);
            this.handles.clear();
            this.files.close();
        }
    }

    events(request, response) {
        response.writeHead(200, {'Content-Type': 'text/event-stream', 'Connection': 'keep-alive'});
        response.write('retry: 500\ndata: ' + this.snapshot + '\n\n');
        this.listeners.add(response);
        const heartbeat = setInterval(() => { if (!response.write(': ping\n\n')) response.destroy(); }, 15000);
        response.on('close', () => { clearInterval(heartbeat); this.listeners.delete(response); });
    }

    fileCommand(command) {
        const {op, file, options} = command;
        switch (op) {
            case 'open': {
                if (this.handles.size >= 256) throw fail('EMFILE', 'open', file);
                const handle = this.files.open(file, command.flags, command.mode);
                const id = this.nextHandle++;
                this.handles.set(id, {...handle, position: 0, client: command.client,
                    append: typeof command.flags === 'string' && command.flags.startsWith('a')});
                return id;
            }
            case 'close': {
                const handle = this.handles.get(command.fd);
                if (!handle || handle.client !== command.client) throw fail('EBADF', 'close', command.fd);
                fs.closeSync(handle.fd); this.handles.delete(command.fd); return null;
            }
            case 'statHandle': {
                const handle = this.handles.get(command.fd);
                if (!handle || handle.client !== command.client) throw fail('EBADF', 'fstat', command.fd);
                const stat = fs.fstatSync(handle.fd);
                return {size: handle.size == null ? stat.size : handle.size, mode: stat.mode,
                    mtimeMs: stat.mtimeMs, atimeMs: stat.atimeMs, ctimeMs: stat.ctimeMs,
                    birthtimeMs: stat.birthtimeMs, type: stat.isDirectory() ? 'directory' : 'file'};
            }
            case 'release':
                for (const [id, handle] of this.handles) {
                    if (handle.client !== command.client) continue;
                    fs.closeSync(handle.fd); this.handles.delete(id);
                }
                return null;
            case 'readHandle': {
                const handle = this.handles.get(command.fd);
                if (!handle || handle.client !== command.client) throw fail('EBADF', 'read', command.fd);
                const position = command.position == null ? handle.position : command.position;
                if (!Number.isSafeInteger(position) || position < 0 || !Number.isSafeInteger(command.length)
                    || command.length < 0 || command.length > 64 * 1024 * 1024) throw fail('EINVAL', 'read', command.fd);
                const length = handle.size == null ? command.length : Math.min(command.length, Math.max(0, handle.size - position));
                const bytes = Buffer.alloc(length);
                const count = fs.readSync(handle.fd, bytes, 0, length, handle.offset + position);
                if (command.position == null) handle.position += count;
                return {base64: bytes.subarray(0, count).toString('base64'), count};
            }
            case 'writeHandle': {
                const handle = this.handles.get(command.fd);
                if (!handle || handle.client !== command.client) throw fail('EBADF', 'write', command.fd);
                if (handle.size != null) throw fail('EBADF', 'write', command.fd);
                const position = handle.append ? fs.fstatSync(handle.fd).size : command.position == null ? handle.position : command.position;
                if (!Number.isSafeInteger(position) || position < 0) throw fail('EINVAL', 'write', command.fd);
                const bytes = Buffer.from(command.base64, 'base64');
                const count = fs.writeSync(handle.fd, bytes, 0, bytes.length, position);
                if (command.position == null || handle.append) handle.position = position + count;
                return count;
            }
            case 'stat': return this.files.stat(file);
            case 'exists': return this.files.exists(file);
            case 'read': return {base64: this.files.read(file).toString('base64')};
            case 'list': return this.files.list(file);
            case 'engine': return this.files.engineAt(relative(file) + '/');
            case 'write':
                if (typeof command.base64 !== 'string') throw fail('EINVAL', 'write', file);
                this.files.write(file, Buffer.from(command.base64, 'base64'), options); return null;
            case 'copy': this.files.write(command.to, this.files.read(file), {flag: command.mode & 1 ? 'wx' : 'w'}); return null;
            case 'mkdir': this.files.mkdir(file, options); return null;
            case 'unlink': this.files.unlink(file); return null;
            case 'rename': this.files.rename(file, command.to); return null;
            case 'rmdir': this.files.rmdir(file); return null;
            case 'resolve': {
                const virtual = name => {
                    const rel = path.relative(this.files.root, name);
                    if (path.isAbsolute(rel) || rel === '..' || rel.startsWith('..' + path.sep))
                        return null;
                    return rel.split(path.sep).join('/');
                };
                const resolved = resolveModule(command.name.startsWith('/game/')
                    ? path.join(this.files.root, relative(command.name)) : command.name, {
                basedir: path.join(this.files.root, relative(command.basedir)),
                extensions: ['.js', '.json', '.cjs', '.node'], includeCoreModules: false,
                paths: [], preserveSymlinks: true,
                isFile: name => virtual(name) !== null && this.files.exists(virtual(name)) && this.files.stat(virtual(name)).type === 'file',
                isDirectory: name => virtual(name) !== null && this.files.exists(virtual(name)) && this.files.stat(virtual(name)).type === 'directory',
                readFileSync: name => this.files.read(virtual(name))
                });
                return '/game/' + virtual(resolved);
            }
            case 'url': {
                const {method, args} = command;
                if (!['parse', 'format', 'resolve', 'resolveObject', 'domainToASCII', 'domainToUnicode',
                    'pathToFileURL', 'fileURLToPath', 'urlToHttpOptions'].includes(method))
                    throw fail('ENOSYS', method, 'url');
                if (method === 'urlToHttpOptions' || (method === 'format' && command.whatwg))
                    args[0] = new URL(args[0]);
                const value = nodeUrl[method](...args);
                return method === 'pathToFileURL' ? value.href : value;
            }
            case 'zlib': {
                if (!['deflateSync', 'inflateSync', 'gzipSync', 'gunzipSync'].includes(command.method))
                    throw fail('ENOSYS', command.method, 'zlib');
                return {base64: zlib[command.method](Buffer.from(command.base64, 'base64'),
                    {...options, maxOutputLength: 64 * 1024 * 1024}).toString('base64')};
            }
            default: throw fail('ENOSYS', op, file);
        }
    }

    async handle(request, response) {
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        if (request.headers.host !== new URL(this.origin).host) throw fail('EACCES', 'host', '');
        const raw = request.url.split('?')[0];
        if (raw === '/__control__') {
            if (request.method !== 'POST' || request.headers.authorization !== 'Bearer ' + this.controlToken)
                throw fail('EACCES', 'control', '');
            const message = JSON.parse((await body(request, 1024 * 1024)).toString('utf8'));
            if (message.op === 'publish') this.publish(message.value);
            else if (message.op === 'command') this.command(message.value);
            else throw fail('ENOSYS', message.op, '');
            send(response, 200, {}); return;
        }
        const prefix = '/' + this.token + '/';
        if (!raw.startsWith(prefix)) throw fail('EACCES', 'session', '');
        const file = relative(decodeURIComponent(raw.slice(prefix.length))) || 'index.html';
        if (file.startsWith('__padport__/')) {
            const route = file.slice('__padport__/'.length);
            if (request.method === 'GET' && route === 'events') { this.events(request, response); return; }
            if ((request.method === 'GET' || request.method === 'HEAD') && route === 'fallback-font.ttf') {
                const font = fs.readFileSync(process.platform === 'android'
                    ? '/system/fonts/Roboto-Regular.ttf' : path.join(this.assets, 'fallback-font.ttf'));
                response.writeHead(200, {'Content-Type': mime('fallback-font.ttf'), 'Content-Length': font.length});
                response.end(request.method === 'HEAD' ? undefined : font); return;
            }
            if ((request.method === 'GET' || request.method === 'HEAD') && route === 'launch' && this.files.mainIsJs) {
                const html = '<!doctype html><html><head><meta charset="utf-8"><script src="' +
                    this.url('__padport__/runtime.js') + '"></script></head><body></body></html>';
                send(response, 200, request.method === 'HEAD' ? '' : html, mime('index.html')); return;
            }
            if (request.method === 'GET' && route === 'runtime.js') {
                const config = {root: '/game', engine: this.files.engine, platform: 'linux', arch: 'x64',
                    cwd: this.files.mainIsJs ? this.files.appRoot : path.posix.dirname('/game/' + this.files.entry),
                    nodeVersion: process.versions.node, runtimeBackend: 'node',
                    appRoot: this.files.appRoot || '/game', main: this.files.main || 'index.html',
                    entry: this.files.entry || 'index.html', mainIsJs: !!this.files.mainIsJs, ...this.config};
                send(response, 200, 'window.__PADPORT_RUNTIME_CONFIG__=' + JSON.stringify(config) + ';\n' +
                    fs.readFileSync(path.join(this.assets, 'runtime-client.js'), 'utf8'), mime('runtime.js')); return;
            }
            if (request.method !== 'POST' || request.headers.origin !== this.origin) throw fail('EACCES', 'request', file);
            const data = await body(request);
            if (route === 'fs') {
                send(response, 200, this.fileReply(data.toString('utf8')));
                return;
            }
            if (!['log', 'debug-state', 'release'].includes(route))
                throw fail('ENOENT', 'route', file);
            if (route === 'release') {
                this.fileCommand({op: 'release', client: data.toString('utf8')}); send(response, 200, {}); return;
            }
            this.onMessage(route, data.toString('utf8'));
            send(response, 200, {}); return;
        }
        if (request.method !== 'GET' && request.method !== 'HEAD') { send(response, 405, {error: 'Method Not Allowed'}); return; }
        if (/\.html?$/i.test(file)) {
            const html = this.files.read(file).toString('utf8');
            const script = '<script src="' + this.url('__padport__/runtime.js') + '"></script>';
            const match = /<head\b[^>]*>/i.exec(html);
            const offset = match ? match.index + match[0].length : 0;
            const bytes = Buffer.from(html.slice(0, offset) + script + html.slice(offset));
            response.writeHead(200, {'Content-Type': mime(file), 'Content-Length': bytes.length});
            response.end(request.method === 'HEAD' ? undefined : bytes); return;
        }
        let name = file, resource;
        try { resource = this.files.open(name); }
        catch (error) {
            if (error.code !== 'ENOENT') throw error;
            const fallback = name.replace(/\.m4a$/, '.ogg').replace(/\.m4a_$/, '.ogg_').replace(/\.rpgmvm$/, '.rpgmvo');
            if (fallback === name) throw error;
            name = fallback;
            resource = this.files.open(name);
        }
        try {
        response.setHeader('Accept-Ranges', 'bytes');
        let range = [0, resource.size < 0 ? undefined : resource.size - 1], status = 200;
        if (request.headers.range && resource.size >= 0) {
            range = span(request.headers.range, resource.size);
            if (!range) {
                response.writeHead(416, {'Content-Range': 'bytes */' + resource.size, 'Content-Length': 0});
                response.end(); return;
            }
            status = 206; response.setHeader('Content-Range', 'bytes ' + range[0] + '-' + range[1] + '/' + resource.size);
        }
        const headers = {'Content-Type': mime(name)};
        if (resource.size >= 0) headers['Content-Length'] = range[1] - range[0] + 1;
        response.writeHead(status, headers);
        if (request.method === 'HEAD' || !resource.size) { response.end(); return; }
        const source = this.files.stream(name, ...range, resource);
        resource = null;
        await pipeline(source, response);
        } finally { if (resource) fs.closeSync(resource.fd); }
    }
}

module.exports = {RuntimeServer, portFor, span};
