const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/bitmap-readback.js'), 'utf8');

function setup(engine = 'MV') {
    const listeners = [];
    let reads = 0;
    class HTMLCanvasElement {
        constructor(width, height) { this._width = width; this._height = height; }
        get width() { return this._width; }
        set width(value) { this._width = value; }
        get height() { return this._height; }
        set height(value) { this._height = value; }
    }
    class CanvasRenderingContext2D {
        clearRect() { this.edited = 0; }
        fillRect() { this.edited = 73; }
        drawImage() { if (this.drawError) throw this.drawError; this.edited = 42; }
        putImageData() { this.edited = 61; }
        reset() { this.edited = 0; }
    }
    class Bitmap {
        constructor(width = 128, height = 128) {
            this.value = 19;
            this._context = Object.assign(new CanvasRenderingContext2D(), {canvas: new HTMLCanvasElement(width, height), getImageData: (x, y, w, h) => {
                reads++;
                if (this.error) throw this.error;
                const data = new Uint8ClampedArray(w * h * 4);
                for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) {
                    const px = Math.trunc(x) + col, py = Math.trunc(y) + row;
                    data[(row * w + col) * 4 + 3] = px >= 0 && py >= 0 && px < this._context.canvas.width && py < this._context.canvas.height
                        ? (this._context.edited ?? (px * 3 + py * 7 + this.value) % 256) : 0;
                }
                return {data};
            }});
        }
        getAlphaPixel(x, y) { return this._context.getImageData(x, y, 1, 1).data[3]; }
        _setDirty() { this.dirty = true; return 'dirty'; }
        resize(width, height) { this._context.canvas.width = width; this._context.canvas.height = height; return 'resized'; }
        destroy() { this.destroyed = true; }
    }
    const original = Bitmap.prototype.getAlphaPixel;
    const sandbox = {Bitmap, Uint8Array, CanvasRenderingContext2D, HTMLCanvasElement, __PADPORT_CONFIG__: {engine}, addEventListener(type, fn) {
        assert.equal(type, 'load'); listeners.push(fn);
    }};
    sandbox.window = sandbox;
    vm.createContext(sandbox); vm.runInContext(source, sandbox);
    for (const listener of listeners) listener();
    return {Bitmap, sandbox, original, reads: () => reads};
}

test('alpha hit tests return the original pixels while sharing tiled readbacks', () => {
    const t = setup(), bitmap = new t.Bitmap(97, 91);
    for (let y = 0; y < 91; y++) for (let x = 0; x < 97; x++)
        assert.equal(bitmap.getAlphaPixel(x, y), (x * 3 + y * 7 + 19) % 256);
    assert.equal(t.reads(), 4);
    for (let frame = 0; frame < 300; frame++) for (let picture = 0; picture < 100; picture++)
        assert.equal(bitmap.getAlphaPixel(5, 7), 83);
    assert.equal(t.reads(), 4);
});

test('bitmap edits, same-size resize and destruction discard cached pixels', () => {
    const t = setup(), bitmap = new t.Bitmap();
    assert.equal(bitmap.getAlphaPixel(0, 0), 19);
    bitmap.value = 87; assert.equal(bitmap._setDirty(), 'dirty');
    assert.equal(bitmap.getAlphaPixel(0, 0), 87);
    bitmap.value = 122; assert.equal(bitmap.resize(128, 128), 'resized');
    assert.equal(bitmap.getAlphaPixel(0, 0), 122);
    bitmap.destroy(); bitmap.value = 4;
    assert.equal(bitmap.destroyed, true); assert.equal(bitmap.getAlphaPixel(0, 0), 4);
    assert.equal(t.reads(), 4);
});

test('bitmap lifecycle hooks preserve deferred canvas creation', () => {
    const t = setup();
    const canvas = new t.sandbox.HTMLCanvasElement(128, 128);
    const context = Object.assign(new t.sandbox.CanvasRenderingContext2D(), {canvas});
    let creations = 0;
    const bitmap = Object.create(t.Bitmap.prototype);
    Object.defineProperties(bitmap, {
        _canvas: {get() { creations++; this.__canvas = canvas; return canvas; }},
        _context: {get() { creations++; this.__context = context; return context; }},
    });
    assert.equal(bitmap._setDirty(), 'dirty');
    bitmap.destroy();
    assert.equal(creations, 0, 'invalidation must not allocate a deferred canvas or context');
    assert.equal(bitmap.__canvas, undefined);
});

test('native Canvas writes and identical dimension resets invalidate alpha tiles', () => {
    const t = setup(), bitmap = new t.Bitmap(), context = bitmap._context;
    assert.equal(bitmap.getAlphaPixel(0, 0), 19);
    context.clearRect(0, 0, 1, 1); assert.equal(bitmap.getAlphaPixel(0, 0), 0);
    context.fillRect(0, 0, 1, 1); assert.equal(bitmap.getAlphaPixel(0, 0), 73);
    context.drawImage({}); assert.equal(bitmap.getAlphaPixel(0, 0), 42);
    context.putImageData({}); assert.equal(bitmap.getAlphaPixel(0, 0), 61);
    context.reset(); assert.equal(bitmap.getAlphaPixel(0, 0), 0);
    context.edited = 22; context.canvas.width = context.canvas.width;
    assert.equal(bitmap.getAlphaPixel(0, 0), 22);
    context.edited = 32; context.canvas.height = context.canvas.height;
    assert.equal(bitmap.getAlphaPixel(0, 0), 32);
    context.drawError = new TypeError('invalid source');
    assert.throws(() => context.drawImage(null), /invalid source/);
    context.drawError = null; context.edited = 55;
    assert.equal(bitmap.getAlphaPixel(0, 0), 55);
});

test('canvas/context replacement and changed dimensions invalidate previous tiles', () => {
    const t = setup(), bitmap = new t.Bitmap();
    bitmap.getAlphaPixel(0, 0); bitmap.value = 33; bitmap._context.canvas.width = 10;
    assert.equal(bitmap.getAlphaPixel(0, 0), 33);
    bitmap._context = {canvas: {width: 10, height: 10}, getImageData(x, y, w, h) {
        const data = new Uint8Array(w * h * 4); data.fill(99); return {data};
    }};
    assert.equal(bitmap.getAlphaPixel(0, 0), 99);
});

test('fractional and external coordinates preserve Canvas conversion and error behavior', () => {
    const t = setup(), bitmap = new t.Bitmap(3, 3);
    for (const [x, y] of [[-1, 0], [3, 3], [-0.8, 1.9], [2.8, 2.2], ['1', 2], [NaN, 1], [Infinity, 1]])
        assert.equal(bitmap.getAlphaPixel(x, y), t.original.call(bitmap, x, y));
    const blocked = new t.Bitmap(); blocked.error = new Error('SecurityError');
    assert.throws(() => blocked.getAlphaPixel(0, 0), /SecurityError/);
    blocked.error = null; assert.equal(blocked.getAlphaPixel(0, 0), 19);
});

test('cache capacity applies across bitmaps and evicted alpha data is read again', () => {
    const t = setup(), bitmaps = Array.from({length: 2049}, () => new t.Bitmap(1, 1));
    for (const bitmap of bitmaps) bitmap.getAlphaPixel(0, 0);
    assert.equal(t.reads(), 2049);
    bitmaps[2048].getAlphaPixel(0, 0); assert.equal(t.reads(), 2049);
    bitmaps[0].getAlphaPixel(0, 0); assert.equal(t.reads(), 2050);
    bitmaps[0]._setDirty(); bitmaps[0].value = 7;
    assert.equal(bitmaps[0].getAlphaPixel(0, 0), 7);
});

test('MZ retains its bitmap implementation and loading the bridge twice is harmless', () => {
    const mz = setup('MZ'); assert.equal(mz.Bitmap.prototype.getAlphaPixel, mz.original);
    const t = setup(), read = t.Bitmap.prototype.getAlphaPixel;
    vm.runInContext(source, t.sandbox);
    assert.equal(t.Bitmap.prototype.getAlphaPixel, read);
});
