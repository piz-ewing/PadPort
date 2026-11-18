'use strict';

function installWebGLState() {
    const states = new WeakMap();
    for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
        if (!type || Object.hasOwn(type.prototype, '__padport_draw_state__')) continue;
        const proto = type.prototype;
        const getParameter = proto.getParameter, frontFace = proto.frontFace, colorMask = proto.colorMask;

        function stateFor(gl) {
            let state = states.get(gl);
            if (!state) {
                state = {};
                states.set(gl, state);
                for (const event of ['webglcontextlost', 'webglcontextrestored'])
                    gl.canvas.addEventListener(event, () => { delete state.face; delete state.mask; });
            }
            return state;
        }

        // Renderer integrations save these values around each draw. Chromium
        // otherwise synchronizes with the GPU even though setters own the state.
        proto.getParameter = function(parameter) {
            if (parameter !== this.FRONT_FACE && parameter !== this.COLOR_WRITEMASK)
                return getParameter.call(this, parameter);
            const state = stateFor(this);
            if (parameter === this.FRONT_FACE) {
                if (state.face === undefined) state.face = getParameter.call(this, parameter);
                return state.face;
            }
            if (state.mask === undefined) state.mask = getParameter.call(this, parameter);
            return state.mask && state.mask.slice();
        };
        proto.frontFace = function(mode) {
            const result = frontFace.call(this, mode), state = states.get(this);
            if (state) {
                if (mode === this.CW || mode === this.CCW) state.face = mode;
                else delete state.face;
            }
            return result;
        };
        proto.colorMask = function(red, green, blue, alpha) {
            const result = colorMask.call(this, red, green, blue, alpha), state = states.get(this);
            if (state) state.mask = [!!red, !!green, !!blue, !!alpha];
            return result;
        };
        Object.defineProperty(proto, '__padport_draw_state__', {value: true});
    }
}

module.exports = {installWebGLState};
