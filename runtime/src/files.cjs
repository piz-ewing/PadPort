'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {Readable} = require('node:stream');
const {Pickle} = require('@electron/asar/lib/pickle');
const {Filesystem} = require('@electron/asar/lib/filesystem');

function fail(code, syscall, file) {
    return Object.assign(new Error(`${code}: ${syscall} '${file}'`), {code, syscall, path: file});
}

function relative(file) {
    if (typeof file !== 'string' || file.includes('\0')) throw fail('EINVAL', 'path', String(file));
    const normalized = file.split(String.fromCharCode(92)).join('/');
    if (normalized.startsWith('/') && normalized !== '/game' && !normalized.startsWith('/game/'))
        throw fail('EACCES', 'path', file);
    const value = normalized === '/game' ? '' : normalized.startsWith('/game/') ? normalized.slice(6) : normalized;
    const parts = [];
    for (const part of value.split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') {
            if (!parts.length) throw fail('EACCES', 'path', file);
            parts.pop();
        } else {
            if (part.includes(':')) throw fail('EACCES', 'path', file);
            parts.push(part);
        }
    }
    return parts.join('/');
}

function inside(root, file) {
    const rel = path.relative(root, file);
    return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}

function resolve(root, file, missing = false) {
    let current = root;
    const parts = relative(file).split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
        const requested = path.join(current, parts[i]);
        if (fs.existsSync(requested)) current = requested;
        else {
            const matches = fs.readdirSync(current).filter(name => name.toLowerCase() === parts[i].toLowerCase());
            if (matches.length > 1) throw fail('EEXIST', 'resolve', file);
            if (matches.length) current = path.join(current, matches[0]);
            else if (missing) return path.join(current, ...parts.slice(i));
            else throw fail('ENOENT', 'resolve', file);
        }
        current = fs.realpathSync(current);
        if (!inside(root, current)) throw fail('EACCES', 'resolve', file);
    }
    return current;
}

class GameFiles {
    constructor(folder) {
        this.storage = typeof folder === 'string' ? null : folder;
        this.folder = this.storage ? this.storage.root : fs.realpathSync(folder);
        this.root = this.folder;
        this.archive = null;
        this.archiveNodes = new Map();
        this.archiveCase = new Map();
        this.entry = 'index.html';
        this.appRoot = '/game';
        this.main = 'index.html';
        this.mainIsJs = false;
        try {
            if (!this.exists('package.json') && !this.exists('index.html') && !this.exists('www/index.html'))
                this.openArchive();
            this.selectEntry(this.archive ? this.mount + '/' : '');
            if (!this.engine && !this.mainIsJs) throw fail('ENOTSUP', 'engine', this.entry);
        } catch (error) { this.close(); throw error; }
    }

    engineAt(prefix) {
        return this.exists(prefix + 'js/rmmz_core.js') ? 'MZ' : this.exists(prefix + 'js/rpg_core.js') ? 'MV' : null;
    }

    openArchive() {
        const candidates = ['app.asar', 'resources/app.asar'].filter(name => this.exists(name));
        if (candidates.length !== 1) throw fail(candidates.length ? 'EEXIST' : 'ENOENT', 'archive', 'app.asar');
        this.mount = candidates[0];
        const resource = this.openPhysical(this.mount);
        this.archive = this.mount;
        this.appRoot = '/game/' + this.mount;
        const archiveSize = resource.size;
        const header = Buffer.alloc(8);
        let index, headerSize;
        try {
            if (fs.readSync(resource.fd, header, 0, 8, resource.offset) !== 8 || header.readUInt32LE(0) !== 4 ||
                header.readUInt32LE(4) < 8 || header.readUInt32LE(4) > 32 * 1024 * 1024 ||
                (archiveSize >= 0 && header.readUInt32LE(4) + 8 > archiveSize)) throw fail('EINVAL', 'header', this.mount);
            headerSize = Pickle.createFromBuffer(header).createIterator().readUInt32();
            const bytes = Buffer.alloc(headerSize);
            let read = 0;
            while (read < bytes.length) {
                const count = fs.readSync(resource.fd, bytes, read, bytes.length - read, resource.offset + 8 + read);
                if (!count) throw fail('EIO', 'header', this.mount);
                read += count;
            }
            index = new Filesystem(this.mount);
            index.setHeader(JSON.parse(Pickle.createFromBuffer(bytes).createIterator().readString()), headerSize);
        } finally { fs.closeSync(resource.fd); }
        this.archiveNodes.set('', {files: {}});
        const names = index.listFiles().map(name => name.slice(1).split(String.fromCharCode(92)).join('/'));
        this.headerSize = headerSize + 8;
        for (const name of names) {
            if (relative(name) !== name) throw fail('EINVAL', 'archive', name);
            const info = index.getFile(name.split('/').join(path.sep), false);
            if (info.link !== undefined) {
                if (typeof info.link !== 'string' || !info.link || relative(info.link) !== info.link)
                    throw fail('EINVAL', 'link', name);
            } else if (!info.files) {
                if (!Number.isSafeInteger(info.size) || info.size < 0 || (!info.unpacked &&
                    (!Number.isSafeInteger(Number(info.offset)) || Number(info.offset) < 0 ||
                    (archiveSize >= 0 && this.headerSize + Number(info.offset) + info.size > archiveSize))))
                    throw fail('EINVAL', 'archive', name);
            }
            this.archiveNodes.set(name, info);
            const folded = name.toLowerCase();
            this.archiveCase.set(folded, this.archiveCase.has(folded) ? null : name);
        }
        for (const [name, node] of this.archiveNodes) if (node.link !== undefined) this.member(this.mount + '/' + name);
    }

    selectEntry(prefix) {
        const manifest = prefix + 'package.json';
        if (this.exists(manifest)) {
            const data = JSON.parse(this.read(manifest).toString('utf8').replace(/^\uFEFF/, ''));
            if (typeof data.main !== 'string' || !data.main) throw fail('EINVAL', 'main', manifest);
            if (/^[\\/]/.test(data.main)) throw fail('EINVAL', 'main', manifest);
            this.main = relative(data.main);
        } else if (this.exists(prefix + 'index.html')) this.main = 'index.html';
        else if (this.exists(prefix + 'www/index.html')) this.main = 'www/index.html';
        else throw fail('ENOENT', 'entry', manifest);
        if (!this.main || this.main.startsWith('/')) throw fail('EINVAL', 'main', this.main);
        this.entry = prefix + this.main;
        if (!this.exists(this.entry)) throw fail('ENOENT', 'main', this.entry);
        this.mainIsJs = /\.(?:c?js)$/i.test(this.main);
        if (!this.mainIsJs && !/\.html?$/i.test(this.main)) throw fail('ENOTSUP', 'main', this.main);
        if (this.mainIsJs) {
            const engines = new Set(['', 'www/'].map(folder => this.engineAt(prefix + folder)).filter(Boolean));
            if (engines.size === 1) this.engine = [...engines][0];
        } else this.engine = this.engineAt(path.posix.dirname(this.entry) + '/');
    }

    member(file) {
        if (!this.archive) return null;
        const rel = relative(file), lower = rel.toLowerCase(), mount = this.mount.toLowerCase();
        if (lower !== mount && !lower.startsWith(mount + '/')) return null;
        const name = rel.slice(this.mount.length).replace(/^\//, '');
        if (!name) return {name: '', ...this.archiveNodes.get('')};
        let current = '';
        const pending = name.split('/'), links = new Set();
        while (pending.length) {
            const requested = (current ? current + '/' : '') + pending.shift();
            const actual = this.archiveNodes.has(requested) ? requested : this.archiveCase.get(requested.toLowerCase());
            if (actual === null) throw fail('EEXIST', 'resolve', file);
            if (actual === undefined) throw fail('ENOENT', 'resolve', file);
            const node = this.archiveNodes.get(actual);
            if (node.link !== undefined) {
                if (links.has(actual) || links.size >= 64) throw fail('ELOOP', 'resolve', file);
                links.add(actual);
                pending.unshift(...node.link.split('/'));
                current = '';
            } else {
                if (pending.length && !node.files) throw fail('ENOTDIR', 'resolve', file);
                current = actual;
            }
        }
        return {name: current, ...this.archiveNodes.get(current)};
    }

    writable(file) {
        const rel = relative(file);
        if (!rel) throw fail('EACCES', 'write', file);
        const lower = rel.toLowerCase();
        if (this.archive && (lower === this.mount.toLowerCase() || lower.startsWith(this.mount.toLowerCase() + '/')))
            throw fail('EROFS', 'write', file);
        return this.storage ? rel : resolve(this.root, rel, true);
    }

    local(file) {
        return resolve(this.root, file);
    }

    stat(file) {
        const rel = relative(file);
        const member = this.member(rel);
        if (member) return {size: member.files ? 0 : member.size, mode: member.files ? 0o40555 : 0o100444,
            mtimeMs: 0, atimeMs: 0, ctimeMs: 0, birthtimeMs: 0, type: member.files ? 'directory' : 'file'};
        if (this.storage) return this.storage.stat(rel);
        const st = fs.statSync(this.local(rel));
        return {size: st.size, mode: st.mode, mtimeMs: st.mtimeMs, atimeMs: st.atimeMs, ctimeMs: st.ctimeMs,
            birthtimeMs: st.birthtimeMs, type: st.isDirectory() ? 'directory' : 'file'};
    }

    exists(file) {
        try { this.stat(file); return true; } catch (error) { if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false; throw error; }
    }

    read(file) {
        const resource = this.open(file);
        try {
            if (resource.size > 64 * 1024 * 1024) throw fail('EFBIG', 'read', file);
            const chunks = [];
            let total = 0;
            while (resource.size < 0 || total < resource.size) {
                const data = Buffer.alloc(Math.min(65536, resource.size < 0 ? 65536 : resource.size - total));
                const count = fs.readSync(resource.fd, data, 0, data.length, resource.offset + total);
                if (!count) {
                    if (resource.size >= 0 && total < resource.size) throw fail('EIO', 'read', file);
                    break;
                }
                total += count;
                if (total > 64 * 1024 * 1024) throw fail('EFBIG', 'read', file);
                chunks.push(data.subarray(0, count));
            }
            return Buffer.concat(chunks, total);
        } finally { fs.closeSync(resource.fd); }
    }

    stream(file, start = 0, end, resource = this.open(file)) {
        if (!resource.size) { fs.closeSync(resource.fd); return Readable.from([]); }
        const options = {fd: resource.fd, autoClose: true, start: resource.offset + start};
        if (end !== undefined || resource.size >= 0)
            options.end = resource.offset + (end === undefined ? resource.size - 1 : end);
        return fs.createReadStream(null, options);
    }

    list(file) {
        const rel = relative(file);
        const entry = this.member(rel);
        if (!entry) return this.storage ? this.storage.list(rel) : fs.readdirSync(this.local(rel));
        if (!entry.files) throw fail('ENOTDIR', 'scandir', file);
        const prefix = entry.name ? entry.name + '/' : '';
        return [...this.archiveNodes.keys()].filter(name => name.startsWith(prefix) && name !== entry.name)
            .map(name => name.slice(prefix.length)).filter(name => !name.includes('/'));
    }

    write(file, data, options) {
        if (this.storage) this.storage.write(this.writable(file), data, options);
        else fs.writeFileSync(this.writable(file), data, options);
    }
    openPhysical(file, flags = 'r', mode) {
        if (this.storage) return this.storage.open(file, flags, mode);
        const physical = flags === 'r' || flags === 'rs' ? this.local(file) : this.writable(file);
        const fd = fs.openSync(physical, flags, mode);
        return {fd, offset: 0, size: flags === 'r' || flags === 'rs' ? fs.fstatSync(fd).size : null};
    }
    open(file, flags = 'r', mode) {
        const name = relative(file);
        if (flags === 'r' || flags === 'rs') {
            const entry = this.member(name);
            if (!entry) {
                if (!this.storage && this.stat(name).type !== 'file') throw fail('EISDIR', 'open', file);
                return this.openPhysical(name, flags, mode);
            }
            if (entry.files) throw fail('EISDIR', 'open', file);
            if (entry.unpacked) return this.openPhysical(this.mount + '.unpacked/' + entry.name, flags, mode);
            const resource = this.openPhysical(this.mount, flags, mode);
            return {...resource, offset: resource.offset + this.headerSize + Number(entry.offset), size: entry.size};
        }
        this.writable(name);
        return this.openPhysical(name, flags, mode);
    }
    mkdir(file, options) { return this.storage ? this.storage.mkdir(this.writable(file), options) : fs.mkdirSync(this.writable(file), options); }
    unlink(file) { return this.storage ? this.storage.unlink(this.writable(file)) : fs.unlinkSync(this.writable(file)); }
    rename(from, to) {
        const source = this.writable(from), target = this.writable(to);
        return this.storage ? this.storage.rename(source, target) : fs.renameSync(source, target);
    }
    rmdir(file) { return this.storage ? this.storage.rmdir(this.writable(file)) : fs.rmdirSync(this.writable(file)); }
    close() { if (this.storage) this.storage.close(); }
}

module.exports = {GameFiles, relative, fail};
