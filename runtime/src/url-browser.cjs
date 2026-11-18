'use strict';

module.exports = function createUrl(sync) {
    const call = (method, args) => sync({op: 'url', method, args});
    function Url() {
        Object.assign(this, call('parse', ['']));
    }
    Url.prototype.parse = function(value, parseQueryString, slashesDenoteHost) {
        Object.assign(this, call('parse', [value, parseQueryString, slashesDenoteHost]));
        return this;
    };
    Url.prototype.format = function() { return call('format', [this]); };
    Url.prototype.resolve = function(value) { return call('resolve', [this.href, value]); };
    Url.prototype.resolveObject = function(value) {
        const result = call('resolveObject', [this, value]);
        return Object.assign(Object.create(Url.prototype), result);
    };
    const url = {URL, URLSearchParams, Url,
        parse(value, parseQueryString, slashesDenoteHost) {
            return value instanceof Url ? value : Object.assign(Object.create(Url.prototype),
                call('parse', [value, parseQueryString, slashesDenoteHost]));
        },
        format(value, options) {
            return sync({op: 'url', method: 'format', args: [value, options], whatwg: value instanceof URL});
        },
        resolve: (from, to) => call('resolve', [from, to]),
        resolveObject(from, to) {
            return Object.assign(Object.create(Url.prototype), call('resolveObject', [from, to]));
        },
        domainToASCII: value => call('domainToASCII', [value]),
        domainToUnicode: value => call('domainToUnicode', [value]),
        pathToFileURL: value => new URL(call('pathToFileURL', [value])),
        fileURLToPath: value => call('fileURLToPath', [value instanceof URL ? value.href : value]),
        urlToHttpOptions: value => call('urlToHttpOptions', [value.href])};
    return url;
};
