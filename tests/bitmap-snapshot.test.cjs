const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/bitmap-readback.js'), 'utf8');

function setup({renderer = 'gecko', deferred = false, failure = null} = {}) {
    const events = new Map(), requests = [], draws = [];
    class HTMLCanvasElement {
        constructor(width = 512, height = 512) { this._width = width; this._height = height; this.version = 0; }
        get width() { return this._width; }
        set width(value) { this._width = value; this.version++; }
        get height() { return this._height; }
        set height(value) { this._height = value; this.version++; }
        setAttribute(name, value) {
            name = name.toLowerCase();
            if (name === 'width' || name === 'height') this[name] = Number(value);
        }
        removeAttribute(name) { if (name === 'width' || name === 'height') this[name] = 300; }
        setAttributeNS(namespace, name, value) { this.setAttribute(name, value); }
        removeAttributeNS(namespace, name) { this.removeAttribute(name); }
    }
    class CanvasRenderingContext2D {
        constructor(canvas = new HTMLCanvasElement()) { this.canvas = canvas; }
        drawImage(source, ...args) {
            if (source == null) throw new TypeError('invalid source');
            this.canvas.version++; draws.push({source, args}); return 'drawn';
        }
        clearRect() { this.canvas.version++; }
        fillRect() { this.canvas.version++; }
        putImageData() { this.canvas.version++; }
        reset() { this.canvas.version++; }
    }
    class Bitmap {
        constructor(width, height) { this._canvas = new HTMLCanvasElement(width, height); this._context = new CanvasRenderingContext2D(this._canvas); }
        getAlphaPixel() { return 0; }
        _setDirty() { return 'dirty'; }
        resize(w, h) { this._canvas.width = w; this._canvas.height = h; }
        destroy() { return 'destroyed'; }
    }
    class CanvasRenderer { render(callback) { return callback(); } }
    const sandbox = {Bitmap, HTMLCanvasElement, CanvasRenderingContext2D, PIXI: {CanvasRenderer},
        __PADPORT_CONFIG__: {engine: 'MV', renderer},
        addEventListener(name, listener) { if (!events.has(name)) events.set(name, []); events.get(name).push(listener); },
        createImageBitmap(canvas) {
            const request = {canvas, version: canvas.version, closed: 0}; requests.push(request);
            request.bitmap = {width: canvas.width, height: canvas.height, version: canvas.version, close() { request.closed++; }};
            if (failure === 'throw') throw new DOMException('unavailable', 'InvalidStateError');
            if (failure === 'reject') return Promise.reject(new DOMException('tainted', 'SecurityError'));
            if (deferred) return new Promise((resolve, reject) => { request.resolve = () => resolve(request.bitmap); request.reject = reject; });
            return Promise.resolve(request.bitmap);
        }};
    sandbox.window = sandbox; vm.createContext(sandbox); vm.runInContext(source, sandbox);
    const emit = name => { for (const listener of events.get(name) || []) listener(); };
    emit('load');
    const target = new CanvasRenderingContext2D(), canvasRenderer = new CanvasRenderer();
    const render = callback => canvasRenderer.render(callback);
    const draw = canvas => render(() => target.drawImage(canvas, 1, 2, 3, 4, 5, 6, 7, 8));
    const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
    return {sandbox, Bitmap, target, requests, draws, emit, render, draw, flush};
}

test('stable canvas sources reuse one immutable snapshot without changing draw arguments', async () => {
    const t = setup(), b = new t.Bitmap();
    for (let i = 0; i < 3; i++) t.draw(b._canvas);
    assert.equal(t.requests.length, 1); assert.equal(t.draws.at(-1).source, b._canvas);
    await t.flush();
    for (let i = 0; i < 1000; i++) t.draw(b._canvas);
    assert.equal(t.requests.length, 1); assert.equal(t.draws.at(-1).source, t.requests[0].bitmap);
    assert.deepEqual(t.draws.at(-1).args, [1, 2, 3, 4, 5, 6, 7, 8]);
    t.target.drawImage(b._canvas, 0, 0); assert.equal(t.draws.at(-1).source, b._canvas);
    assert.equal(b._canvas.width, 512);
});

test('all native writes and bitmap lifecycle changes close snapshots before the next draw', async () => {
    for (const edit of [b => b._context.fillRect(), b => b._context.clearRect(), b => b._context.putImageData(),
        b => b._context.reset(), b => b._context.drawImage({}), b => b._setDirty(), b => b.resize(512, 512),
        b => b.destroy(), b => { b._canvas.width = 512; }, b => { b._canvas.height = 512; },
        b => b._canvas.setAttribute('width', '512'), b => b._canvas.removeAttribute('height')]) {
        const t = setup(), b = new t.Bitmap();
        for (let i = 0; i < 3; i++) t.draw(b._canvas); await t.flush();
        t.draw(b._canvas); assert.equal(t.draws.at(-1).source, t.requests[0].bitmap);
        edit(b); assert.equal(t.requests[0].closed, 1);
        t.draw(b._canvas); assert.equal(t.draws.at(-1).source, b._canvas);
    }
});

test('canvas metadata changes preserve snapshots while namespaced dimension resets invalidate them', async () => {
    const t = setup(), b = new t.Bitmap();
    for (let i = 0; i < 3; i++) t.draw(b._canvas);
    await t.flush();
    for (const name of ['class', 'style', 'data-state']) {
        b._canvas.setAttribute(name, 'active');
        b._canvas.removeAttribute(name);
        b._canvas.setAttributeNS(null, name, 'active');
        b._canvas.removeAttributeNS(null, name);
        t.draw(b._canvas);
        assert.equal(t.draws.at(-1).source, t.requests[0].bitmap);
        assert.equal(t.requests[0].closed, 0);
    }
    b._canvas.setAttribute('WIDTH', '512');
    assert.equal(t.requests[0].closed, 1);
    for (let i = 0; i < 3; i++) t.draw(b._canvas);
    await t.flush();
    b._canvas.setAttributeNS(null, 'height', '512');
    assert.equal(t.requests[1].closed, 1);
});

test('animated canvases, small sources, self copies and non-Gecko rendering stay native', async () => {
    const t = setup(), b = new t.Bitmap(), small = new t.Bitmap(32, 32);
    for (let i = 0; i < 100; i++) { b._context.fillRect(); t.draw(b._canvas); t.draw(small._canvas); }
    for (let i = 0; i < 10; i++) t.render(() => b._context.drawImage(b._canvas, 0, 0));
    assert.equal(t.requests.length, 0);
    const web = setup({renderer: 'webview'}), other = new web.Bitmap();
    for (let i = 0; i < 10; i++) web.draw(other._canvas);
    assert.equal(web.requests.length, 0);
});

test('an in-flight snapshot is discarded after edits, resizing or page exit', async () => {
    for (const edit of [(t, b) => b._context.fillRect(), (t, b) => b.resize(512, 512), (t) => t.emit('pagehide')]) {
        const t = setup({deferred: true}), b = new t.Bitmap();
        for (let i = 0; i < 3; i++) t.draw(b._canvas);
        edit(t, b); t.requests[0].resolve(); await t.flush();
        assert.equal(t.requests[0].closed, 1);
        t.draw(b._canvas); assert.equal(t.draws.at(-1).source, b._canvas);
    }
});

test('creation failures keep native drawing and do not retry unchanged sources every frame', async () => {
    for (const failure of ['throw', 'reject']) {
        const t = setup({failure}), b = new t.Bitmap();
        for (let i = 0; i < 3; i++) t.draw(b._canvas); await t.flush();
        for (let i = 0; i < 100; i++) t.draw(b._canvas);
        assert.equal(t.requests.length, 1); assert.equal(t.draws.at(-1).source, b._canvas);
        assert.throws(() => t.render(() => t.target.drawImage(null)), /invalid source/);
        b._context.fillRect(); for (let i = 0; i < 3; i++) t.draw(b._canvas); await t.flush();
        assert.equal(t.requests.length, 2);
    }
});

test('pending creation is limited and rendering exceptions restore the render scope', async () => {
    const t = setup({deferred: true}), bs = Array.from({length: 5}, () => new t.Bitmap());
    for (let i = 0; i < 5; i++) t.render(() => bs.forEach(b => t.target.drawImage(b._canvas, 0, 0)));
    assert.equal(t.requests.length, 2);
    for (const request of t.requests) request.resolve(); await t.flush();
    t.render(() => bs.forEach(b => t.target.drawImage(b._canvas, 0, 0)));
    assert.equal(t.requests.length, 4);
    assert.throws(() => t.render(() => { throw new Error('render failed'); }), /render failed/);
    const extra = new t.Bitmap(); for (let i = 0; i < 10; i++) t.target.drawImage(extra._canvas, 0, 0);
    assert.equal(t.requests.length, 4);
});

test('snapshot capacity includes pending work and active sources do not evict each other', async () => {
    const t = setup(), bs = Array.from({length: 6}, () => new t.Bitmap(2048, 2048));
    for (let i = 0; i < 20; i++) {
        t.render(() => bs.forEach(b => t.target.drawImage(b._canvas, 0, 0))); await t.flush();
    }
    assert.equal(t.requests.length, 4);
    assert.equal(t.requests.filter(r => !r.closed).length, 4);
    const other = new t.Bitmap(2048, 2048);
    for (let i = 0; i < 4; i++) { t.draw(other._canvas); await t.flush(); }
    assert.equal(t.requests.length, 5); assert.equal(t.requests[0].closed, 1);
    t.emit('pagehide'); assert.ok(t.requests.every(r => r.closed === 1));
});

test('idle sources expire and page restoration permits fresh snapshots', async () => {
    const t = setup(), b = new t.Bitmap();
    for (let i = 0; i < 3; i++) t.draw(b._canvas); await t.flush();
    for (let i = 0; i < 122; i++) t.render(() => {});
    assert.equal(t.requests[0].closed, 1);
    for (let i = 0; i < 3; i++) t.draw(b._canvas); await t.flush();
    t.emit('pagehide'); assert.equal(t.requests[1].closed, 1);
    for (let i = 0; i < 5; i++) t.draw(b._canvas);
    assert.equal(t.requests.length, 2);
    t.emit('pageshow'); t.draw(b._canvas); await t.flush();
    assert.equal(t.requests.length, 3);
});
