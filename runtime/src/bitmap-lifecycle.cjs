'use strict';

function installBitmapLifecycle() {
    if (window.__PADPORT_CONFIG__.engine !== 'MV') return;

    function patch() {
        const {Bitmap, Sprite, TilingSprite} = window;
        if (!Bitmap || !Sprite || Sprite.prototype._onBitmapLoad.length !== 0) return;

        // Early MV releases omit the loaded bitmap argument. Preserve its
        // identity through deferred listeners, as newer MV releases do.
        const addLoadListener = Bitmap.prototype.addLoadListener;
        Bitmap.prototype.addLoadListener = function(listener) {
            return addLoadListener.call(this, () => listener(this));
        };

        for (const type of [Sprite, TilingSprite]) {
            if (!type) continue;
            const onBitmapLoad = type.prototype._onBitmapLoad;
            type.prototype._onBitmapLoad = function(bitmap) {
                // The sprite may have been cleared, reassigned or destroyed
                // while its previous bitmap was still loading.
                if (bitmap !== this._bitmap || !this.texture) return;
                return onBitmapLoad.apply(this, arguments);
            };
        }
    }

    // Run after engine/plugins load and before main.js starts SceneManager.
    window.addEventListener('load', patch, {capture: true, once: true});
}

module.exports = {installBitmapLifecycle};
