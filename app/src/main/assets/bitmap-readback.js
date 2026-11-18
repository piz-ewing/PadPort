/* Cache MV pixel reads and immutable Canvas draw sources. */
(() => {
    'use strict';
    if (window.__PADPORT_CONFIG__.engine !== 'MV') return;
    window.addEventListener('load', () => {
        const proto = window.Bitmap && window.Bitmap.prototype;
        if (!proto || typeof proto.getAlphaPixel !== 'function' || typeof proto._setDirty !== 'function') return;
        const originalRead = proto.getAlphaPixel;
        if (originalRead.padportCached) return;
        const canvasCaches = new WeakMap();
        const blocks = new Map();
        const tileSize = 64;
        const maxBlocks = 2048; // At most 8 MiB of alpha data across all bitmaps.
        const rendererProto = window.PIXI && window.PIXI.CanvasRenderer && window.PIXI.CanvasRenderer.prototype;
        const snapshotsEnabled = window.__PADPORT_CONFIG__.renderer === 'gecko'
            && typeof window.createImageBitmap === 'function' && rendererProto && typeof rendererProto.render === 'function';
        const snapshots = new Set();
        const maxSnapshotPixels = 16 * 1024 * 1024; // 64 MiB of RGBA pixels, including pending snapshots.
        let snapshotPixels = 0;
        let pendingSnapshots = 0;
        let frame = 0;
        let rendering = 0;
        let hidden = false;

        function releaseSnapshot(cache) {
            if (cache.snapshot) {
                cache.snapshot.close();
                cache.snapshot = null;
            }
            if (!cache.pending && snapshots.delete(cache)) snapshotPixels -= cache.width * cache.height;
        }

        function invalidate(cache) {
            if (!cache) return;
            for (const block of cache.tiles.values()) {
                blocks.delete(block);
                block.data = null;
            }
            cache.tiles.clear();
            cache.version++;
            cache.stableSince = frame;
            releaseSnapshot(cache);
        }

        function cacheFor(canvas) {
            let cache = canvasCaches.get(canvas);
            if (cache && (cache.width !== canvas.width || cache.height !== canvas.height)) {
                invalidate(cache);
                cache = null;
            }
            if (!cache) {
                cache = {width: canvas.width, height: canvas.height, tiles: new Map(),
                    version: 0, stableSince: frame, lastUsed: frame, snapshot: null, pending: false, failedVersion: -1};
                canvasCaches.set(canvas, cache);
            }
            return cache;
        }

        function drawSource(canvas) {
            const cache = cacheFor(canvas);
            cache.lastUsed = frame;
            if (snapshots.has(cache)) {
                snapshots.delete(cache);
                snapshots.add(cache);
            }
            if (cache.snapshot) return cache.snapshot;
            const pixels = cache.width * cache.height;
            // Wait for stability across frames; animated and tiny canvases keep their native path.
            if (frame - cache.stableSince < 2 || cache.pending || cache.failedVersion === cache.version
                || hidden || pendingSnapshots >= 2 || pixels < 256 * 256 || pixels > maxSnapshotPixels) return canvas;
            while (snapshotPixels + pixels > maxSnapshotPixels) {
                let oldest;
                for (const entry of snapshots) {
                    if (!entry.pending && frame - entry.lastUsed > 1) { oldest = entry; break; }
                }
                if (!oldest) return canvas;
                releaseSnapshot(oldest);
            }
            let promise;
            try { promise = window.createImageBitmap(canvas); }
            catch (e) { cache.failedVersion = cache.version; return canvas; }
            const version = cache.version;
            cache.pending = true;
            snapshots.add(cache);
            snapshotPixels += pixels;
            pendingSnapshots++;
            promise.then(snapshot => {
                if (cache.version === version) cache.snapshot = snapshot;
                else snapshot.close();
            }, () => {
                // A tainted or unsupported source must keep native drawImage semantics.
                if (cache.version === version) cache.failedVersion = version;
            }).finally(() => {
                cache.pending = false;
                pendingSnapshots--;
                if (!cache.snapshot) releaseSnapshot(cache);
            });
            return canvas;
        }
        const contextProto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
        const canvasProto = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
        if (!contextProto || !canvasProto) return;
        for (const name of ['clearRect', 'fillRect', 'strokeRect', 'drawImage', 'putImageData',
            'fill', 'stroke', 'fillText', 'strokeText', 'drawFocusIfNeeded', 'reset']) {
            const draw = contextProto[name];
            if (typeof draw !== 'function') continue;
            contextProto[name] = function() {
                invalidate(canvasCaches.get(this.canvas));
                if (name === 'drawImage' && snapshotsEnabled && rendering
                    && arguments[0] instanceof window.HTMLCanvasElement && arguments[0] !== this.canvas) {
                    const source = drawSource(arguments[0]);
                    if (source !== arguments[0]) {
                        const args = Array.from(arguments);
                        args[0] = source;
                        return draw.apply(this, args);
                    }
                }
                return draw.apply(this, arguments);
            };
        }
        for (const name of ['width', 'height']) {
            const dimension = Object.getOwnPropertyDescriptor(canvasProto, name);
            Object.defineProperty(canvasProto, name, {...dimension, set(value) {
                invalidate(canvasCaches.get(this));
                try { dimension.set.call(this, value); }
                finally { canvasCaches.delete(this); }
            }});
        }
        for (const name of ['setAttribute', 'setAttributeNS', 'removeAttribute', 'removeAttributeNS']) {
            const change = canvasProto[name];
            if (typeof change !== 'function') continue;
            const attributeIndex = name.endsWith('NS') ? 1 : 0;
            canvasProto[name] = function() {
                const attribute = arguments[attributeIndex];
                if (typeof attribute === 'string' && !/^(?:.*:)?(?:width|height)$/i.test(attribute)) {
                    return change.apply(this, arguments);
                }
                invalidate(canvasCaches.get(this));
                try { return change.apply(this, arguments); }
                finally { canvasCaches.delete(this); }
            };
        }
        if (snapshotsEnabled) {
            const render = rendererProto.render;
            rendererProto.render = function() {
                if (!rendering) {
                    frame++;
                    for (const cache of snapshots) {
                        if (frame - cache.lastUsed > 120) invalidate(cache);
                    }
                }
                rendering++;
                try { return render.apply(this, arguments); }
                finally { rendering--; }
            };
            window.addEventListener('pagehide', () => {
                hidden = true;
                for (const cache of snapshots) invalidate(cache);
            });
            window.addEventListener('pageshow', () => { hidden = false; });
        }
        function invalidateBitmap(bitmap) {
            // MV 1.6 getters allocate a canvas and call _setDirty themselves.
            const canvas = bitmap.__canvas || Object.getOwnPropertyDescriptor(bitmap, '_canvas')?.value
                || Object.getOwnPropertyDescriptor(bitmap, '_context')?.value?.canvas;
            invalidate(canvas && canvasCaches.get(canvas));
        }
        const dirty = proto._setDirty;
        proto._setDirty = function() {
            invalidateBitmap(this);
            return dirty.apply(this, arguments);
        };
        const resize = proto.resize;
        if (typeof resize === 'function') proto.resize = function() {
            invalidateBitmap(this);
            return resize.apply(this, arguments);
        };
        const destroy = proto.destroy;
        if (typeof destroy === 'function') proto.destroy = function() {
            invalidateBitmap(this);
            return destroy.apply(this, arguments);
        };

        function getAlphaPixel(x, y) {
            // Let Canvas handle unusual argument coercion and out-of-range reads.
            if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)
                || Math.abs(x) > 0x7fffffff || Math.abs(y) > 0x7fffffff) return originalRead.apply(this, arguments);
            const context = this._context;
            const canvas = context.canvas;
            x = Math.trunc(x); y = Math.trunc(y);
            if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return originalRead.apply(this, arguments);
            const cache = cacheFor(canvas);
            const left = Math.floor(x / tileSize) * tileSize;
            const top = Math.floor(y / tileSize) * tileSize;
            const key = top * canvas.width + left;
            let block = cache.tiles.get(key);
            if (!block || !block.data) {
                const pixels = context.getImageData(left, top, tileSize, tileSize).data;
                const data = new Uint8Array(tileSize * tileSize);
                for (let i = 0; i < data.length; i++) data[i] = pixels[i * 4 + 3];
                block = {data, tiles: cache.tiles, key};
                cache.tiles.set(key, block);
                if (blocks.size === maxBlocks) {
                    const oldest = blocks.keys().next().value;
                    blocks.delete(oldest);
                    oldest.tiles.delete(oldest.key);
                    oldest.data = null;
                }
            } else blocks.delete(block);
            blocks.set(block, true);
            return block.data[(y - top) * tileSize + x - left];
        }
        Object.defineProperty(getAlphaPixel, 'padportCached', {value: true});
        proto.getAlphaPixel = getAlphaPixel;
    }, {once: true});
})();
