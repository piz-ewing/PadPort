'use strict';

const fs = require('node:fs');
const {relative, fail} = require('./files.cjs');

class DocumentFiles {
    constructor(native) {
        this.native = native;
        this.root = '/game';
    }
    request(command) {
        const response = JSON.parse(this.native.request(JSON.stringify(command)));
        if (response.error) throw Object.assign(new Error(response.error.message), response.error);
        return response.value;
    }
    stat(file) { return this.request({op: 'stat', file: relative(file)}); }
    exists(file) {
        try { this.stat(file); return true; }
        catch (error) { if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false; throw error; }
    }
    open(file, flags = 'r') {
        if (flags === 'r' || flags === 'rs') return this.request({op: 'resource', file: relative(file)});
        if (typeof flags !== 'string') throw fail('EINVAL', 'open', file);
        const fd = this.request({op: 'open', file: relative(file), flags});
        return {fd, offset: 0, size: null};
    }
    write(file, data, options) {
        const flags = options && typeof options === 'object' ? options.flag || 'w' : 'w';
        const {fd} = this.open(file, flags);
        try {
            const writeOptions = typeof options === 'string' ? {encoding: options} : options;
            fs.writeFileSync(fd, data, writeOptions);
        } finally { fs.closeSync(fd); }
    }
    list(file) { return this.request({op: 'list', file: relative(file)}); }
    mkdir(file, options) { this.request({op: 'mkdir', file: relative(file), recursive: Boolean(options && options.recursive)}); }
    unlink(file) { this.request({op: 'unlink', file: relative(file)}); }
    rename(file, to) { this.request({op: 'rename', file: relative(file), to: relative(to)}); }
    rmdir(file) { this.request({op: 'rmdir', file: relative(file)}); }
    close() {}
}

module.exports = {DocumentFiles};
