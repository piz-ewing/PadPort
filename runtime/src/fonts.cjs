'use strict';

function installFonts({base, onCleanup}) {
    if (!document.fonts) return;
    const OriginalFontFace = window.FontFace;
    const fallbackSource = 'url("' + base + '__padport__/fallback-font.ttf") format("truetype")';
    const faces = new WeakMap();
    const {add, has, delete: remove} = FontFaceSet.prototype;

    function sanitizeFamily(name) {
        if (typeof name !== 'string' || !name.trim()) return '"__ff_fallback__"';
        const family = name.trim();
        if (/^[a-zA-Z_][-a-zA-Z0-9_]*$/.test(family)) return family;
        return '"' + family.replace(/["\\]/g, character => String.fromCharCode(92) + character) + '"';
    }

    function PatchedFontFace(family, source, descriptors) {
        const safeFamily = sanitizeFamily(family);
        const unsupported = typeof source === 'string' && (!source.trim() || /\.ttc(\b|$)/i.test(source));
        const state = {face: new OriginalFontFace(safeFamily, unsupported ? fallbackSource : source, descriptors)};
        let loading;
        const load = () => {
            if (!loading) {
                loading = state.face.load().catch(async error => {
                    if (unsupported || source === fallbackSource) throw error;
                    const previous = state.face;
                    const registered = has.call(document.fonts, previous);
                    const fallback = new OriginalFontFace(safeFamily, fallbackSource, descriptors);
                    await fallback.load();
                    state.face = fallback;
                    if (registered) remove.call(document.fonts, previous);
                    add.call(document.fonts, fallback);
                    console.warn('Font load failed; using system fallback', family);
                    return fallback;
                });
            }
            return loading;
        };
        const proxy = new Proxy(state.face, {
            get(target, property) {
                if (property === 'load') return load;
                if (property === 'oriFontInstance') return state.face;
                const value = Reflect.get(state.face, property, state.face);
                return typeof value === 'function' ? value.bind(state.face) : value;
            },
            set(target, property, value) {
                return Reflect.set(state.face, property, value, state.face);
            }
        });
        faces.set(proxy, state);
        return proxy;
    }
    PatchedFontFace.prototype = OriginalFontFace.prototype;
    Object.setPrototypeOf(PatchedFontFace, OriginalFontFace);
    window.FontFace = PatchedFontFace;
    for (const [name, original] of [['add', add], ['has', has], ['delete', remove]]) {
        FontFaceSet.prototype[name] = function(font) {
            return original.call(this, faces.get(font)?.face || font);
        };
    }

    let timer;
    let disposed = false;
    async function completeFontCheck() {
        try {
            const fonts = document.fonts;
            if (fonts === await fonts.ready && !disposed) {
                fonts.check = () => true;
                return;
            }
        } catch (error) {
            console.error('Font completion check failed', error);
        }
        if (!disposed) timer = setTimeout(completeFontCheck, 3000);
    }
    timer = setTimeout(completeFontCheck, 3000);
    onCleanup(() => { disposed = true; clearTimeout(timer); });
}

module.exports = {installFonts};
