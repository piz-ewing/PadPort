"use strict";
const Shaderity = require("shaderity").default;
function installGraphics() {
  const textureCanvases = ["MV", "MZ"].includes(window.__PADPORT_CONFIG__.engine);
  const canvasProto = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
  if (textureCanvases && canvasProto && !canvasProto.__padport_texture_canvas__) {
    const getContext = canvasProto.getContext;
    let imageCanvas = false;
    canvasProto.getContext = function(type, options) {
      // Image-backed bitmaps feed CPU pixel operations; dynamic drawing stays
      // accelerated so a full-frame mask can be uploaded without a CPU copy.
      return getContext.call(this, type, type === "2d" && imageCanvas
        ? {...options, willReadFrequently: true} : options);
    };
    window.addEventListener('load', () => {
      const proto = window.Bitmap && window.Bitmap.prototype;
      if (!proto || typeof proto._createCanvas !== 'function') return;
      const createCanvas = proto._createCanvas;
      proto._createCanvas = function(...args) {
        const previous = imageCanvas;
        imageCanvas = !!this._image;
        try { return createCanvas.apply(this, args); }
        finally { imageCanvas = previous; }
      };
    }, {capture: true, once: true});
    canvasProto.__padport_texture_canvas__ = true;
  }
  require('./webgl-state.cjs').installWebGLState();
  const canvas = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
  if (textureCanvases && canvas && !canvas.__padport_source_pixels__) {
    const deferredSources = new WeakSet();
    const drawImage = canvas.drawImage;
    const getImageData = canvas.getImageData;
    const putImageData = canvas.putImageData;
    canvas.drawImage = function(source, ...args) {
      if (source !== this.canvas && deferredSources.has(source)) {
        const context = source.getContext("2d");
        if (context && source.width && source.height) {
          try {
            // Chromium can retain an accelerated image in a software canvas's
            // display list. Materialize it before another canvas records it,
            // otherwise every later texture upload reads the image back again.
            const rows = Math.max(1, Math.floor(1024 * 1024 / source.width));
            for (let y = 0; y < source.height; y += rows) {
              const pixels = getImageData.call(context, 0, y, source.width, Math.min(rows, source.height - y));
              putImageData.call(context, pixels, 0, y);
            }
          } catch (error) {
            if (error.name !== "SecurityError") throw error;
          }
        }
        deferredSources.delete(source);
      }
      const result = drawImage.call(this, source, ...args);
      if (!(source instanceof HTMLCanvasElement) || source === this.canvas ||
          !source.getContext("2d")) deferredSources.add(this.canvas);
      return result;
    };
    canvas.__padport_source_pixels__ = true;
  }
  if (canvas && !canvas.__padport_readback_patched__) {
    const getImageData = canvas.getImageData;
    canvas.getImageData = function(x, y, width, height, ...options) {
      return getImageData.call(this, !x || isNaN(x) ? 0 : x, !y || isNaN(y) ? 0 : y,
        !width || isNaN(width) ? 1 : width, !height || isNaN(height) ? 1 : height, ...options);
    };
    canvas.__padport_readback_patched__ = true;
  }
  (function() {
    try {
      let __dbgLogOnce = function(program, reason, extra) {
        if (__dbgEnabled && !(__dbgCount >= __dbgMax))
          try {
            if (program && __dbgLoggedProgram.get(program))
              return;
            program && __dbgLoggedProgram.set(program, !0), __dbgCount++, extra ? console.warn("[padport-webgl] attrloc-skip:", reason, extra) : console.warn("[padport-webgl] attrloc-skip:", reason);
          } catch {
          }
      }, stripComments = function(src) {
        return String(src || "").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n\r]*/g, " ");
      }, parseVertexAttributes = function(src) {
        src = stripComments(src);
        for (var hasExplicitLayout = /layout\s*\(\s*location\s*=\s*\d+\s*\)/.test(src), names = [], m, reAttr = /\battribute\s+(?:(?:lowp|mediump|highp)\s+)?\w+\s+([A-Za-z_]\w*)\b/g; m = reAttr.exec(src); )
          names.push(m[1]);
        for (var reIn = /\bin\s+(?:(?:lowp|mediump|highp)\s+)?\w+\s+([A-Za-z_]\w*)\b/g; m = reIn.exec(src); )
          names.push(m[1]);
        for (var seen = Object.create(null), out = [], j = 0; j < names.length; j++) {
          var n = names[j];
          !seen[n] && (seen[n] = !0, out.push(n));
        }
        return {
          names: out,
          hasExplicitLayout
        };
      }, patchProto = function(proto) {
        if (proto && !proto.__padport_attrloc_patched__) {
          proto.__padport_attrloc_patched__ = !0;
          var origShaderSource = proto.shaderSource, origAttachShader = proto.attachShader, origBindAttribLocation = proto.bindAttribLocation, origLinkProgram = proto.linkProgram;
          typeof origShaderSource == "function" && (proto.shaderSource = function(shader, source) {
            try {
              var src = String(source || ""), info = shaderInfo.get(shader) || {
                src: "",
                hasExplicitLayout: !1
              };
              info.src = src, info.hasExplicitLayout = /layout\s*\(\s*location\s*=\s*\d+\s*\)/.test(stripComments(src)), shaderInfo.set(shader, info);
            } catch {
            }
            return origShaderSource.call(this, shader, source);
          }), typeof origAttachShader == "function" && (proto.attachShader = function(program, shader) {
            try {
              var set = programShaders.get(program);
              !set && (set = /* @__PURE__ */ new Set(), programShaders.set(program, set)), set.add(shader);
            } catch {
            }
            return origAttachShader.call(this, program, shader);
          }), typeof origBindAttribLocation == "function" && (proto.bindAttribLocation = function(program, index, name) {
            try {
              __internalBindDepth <= 0 && programHasExplicitBind.set(program, !0);
            } catch {
            }
            return origBindAttribLocation.call(this, program, index, name);
          }), typeof origLinkProgram == "function" && (proto.linkProgram = function(program) {
            try {
              if (programHasExplicitBind.get(program))
                return __dbgLogOnce(program, "explicit bindAttribLocation() detected"), origLinkProgram.call(this, program);
              var set = programShaders.get(program);
              if (set && set.size) {
                var maxAttribs = 16;
                try {
                  maxAttribs = this.getParameter(this.MAX_VERTEX_ATTRIBS) | 0 || 16;
                } catch {
                }
                var attrs = [], hasExplicitLayout = !1;
                if (set.forEach(function(shader) {
                  try {
                    var st = null;
                    try {
                      st = this.getShaderParameter(shader, this.SHADER_TYPE);
                    } catch {
                    }
                    if (st !== this.VERTEX_SHADER)
                      return;
                    var info = shaderInfo.get(shader), src = info && info.src;
                    if (!src)
                      return;
                    info && info.hasExplicitLayout && (hasExplicitLayout = !0);
                    var parsed = parseVertexAttributes(src);
                    parsed && parsed.hasExplicitLayout && (hasExplicitLayout = !0), parsed && parsed.names && (attrs = attrs.concat(parsed.names));
                  } catch {
                  }
                }, this), hasExplicitLayout)
                  return __dbgLogOnce(program, "explicit layout(location=...) detected"), origLinkProgram.call(this, program);
                for (var seen = Object.create(null), uniq = [], i = 0; i < attrs.length; i++) {
                  var n = attrs[i];
                  !seen[n] && (seen[n] = !0, uniq.push(n));
                }
                __internalBindDepth++;
                try {
                  for (var loc = 0; loc < uniq.length && loc < maxAttribs; loc++)
                    try {
                      this.bindAttribLocation(program, loc, uniq[loc]);
                    } catch {
                    }
                } finally {
                  __internalBindDepth--;
                }
              }
            } catch {
            }
            return origLinkProgram.call(this, program);
          });
        }
      };
      if (typeof window > "u" || window.__padport_DETERMINISTIC_ATTR_LOC_OFF__ || window.__padport_DETERMINISTIC_ATTR_LOC__ || (window.__padport_DETERMINISTIC_ATTR_LOC__ = !0, typeof WeakMap > "u" || typeof Set > "u"))
        return;
      var shaderInfo = /* @__PURE__ */ new WeakMap(), programShaders = /* @__PURE__ */ new WeakMap(), programHasExplicitBind = /* @__PURE__ */ new WeakMap(), __internalBindDepth = 0, __dbgEnabled = !1;
      try {
        __dbgEnabled = !!window.__padport_DETERMINISTIC_ATTR_LOC_DEBUG__;
      } catch {
        __dbgEnabled = !1;
      }
      var __dbgCount = 0, __dbgMax = 20, __dbgLoggedProgram = /* @__PURE__ */ new WeakMap();
      patchProto(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype), patchProto(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
    } catch {
    }
  })(), function() {
    "use strict";
    const DESIRED_PRECISION = "highp";
    if (typeof Shaderity > "u") {
      console.error("[shader\u2011patch] Shaderity \u672A\u627E\u5230\uFF0C\u8BF7\u786E\u4FDD\u5148\u5F15\u5165 shaderity.min.js");
      return;
    }
    function fragHighpOK(gl) {
      const fmt = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      return fmt && fmt.precision !== 0;
    }
    const memo = /* @__PURE__ */ new Map();
    function patchSource(src, stage, gl, isGL2Ctx) {
      const cacheKey = src + "::" + stage + "::" + isGL2Ctx;
      if (memo.has(cacheKey))
        return memo.get(cacheKey);
      const targetVersion = 100;
      let transformed = src;
      const needDowngrade = targetVersion === 100 && /^\s*#version\s+300\s+es/m.test(src), needUpgrade = targetVersion === 300 && !/^\s*#version\s+300\s+es/m.test(src);
      if (needDowngrade || needUpgrade)
        try {
          Shaderity.Transpiler && Shaderity.Transpiler.transpile ? (transformed = Shaderity.Transpiler.transpile(src, {
            targetVersion: String(targetVersion),
            shaderStage: stage
          }), typeof transformed == "object" && (transformed = transformed.code)) : targetVersion === 100 && Shaderity.transformToGLSLES1 ? transformed = Shaderity.transformToGLSLES1({
            code: src,
            shaderStage: stage,
            isFragmentShader: stage === 'fragment'
          }).code : targetVersion === 300 && Shaderity.transformToGLSLES3 && (transformed = Shaderity.transformToGLSLES3({
            code: src,
            shaderStage: stage,
            isFragmentShader: stage === 'fragment'
          }).code);
        } catch {
        }
      if (DESIRED_PRECISION) {
        let want = DESIRED_PRECISION;
        stage === "fragment" && want === "highp" && !fragHighpOK(gl) && (want = "mediump");
        let fixed = transformed;
        fixed = fixed.replace(/precision\s+(?:lowp|mediump|highp)\s+float\s*;/g, "precision " + want + " float;"), fixed = fixed.replace(/uniform\s+(?:lowp|mediump|highp)\s+/g, "uniform " + want + " "), !/precision\s+(?:lowp|mediump|highp)\s+float/.test(fixed) && (fixed = fixed.replace(/(^\s*(?:#version.*\n)?)/, "$1precision " + want + ` float;
`)), transformed = fixed;
      }
      return memo.size >= 512 && memo.delete(memo.keys().next().value), memo.set(cacheKey, transformed), transformed;
    }
    const originalSrcMap = /* @__PURE__ */ new WeakMap();
    function isWebGL2(gl) {
      return typeof WebGL2RenderingContext < "u" && gl instanceof WebGL2RenderingContext;
    }
    function patchContext(proto, isGL2Ctx) {
      if (!proto || proto.__shaderPatchApplied)
        return;
      const origShaderSource = proto.shaderSource;
      proto.shaderSource = function(shader, src) {
        return originalSrcMap.set(shader, src), origShaderSource.call(this, shader, src);
      };
      const origCompile = proto.compileShader;
      proto.compileShader = function(shader) {
        const gl = this;
        if (origCompile.call(gl, shader), gl.getShaderParameter(shader, gl.COMPILE_STATUS) || shader.__patchedOnce)
          return;
        shader.__patchedOnce = !0;
        const src = originalSrcMap.get(shader);
        if (!src)
          return;
        const type = gl.getShaderParameter(shader, gl.SHADER_TYPE), stage = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
        try {
          const patched = patchSource(src, stage, gl, isGL2Ctx(gl));
          gl.shaderSource(shader, patched), origCompile.call(gl, shader);
        } catch {
        }
      };
      const origLink = proto.linkProgram;
      proto.linkProgram = function(program) {
        const gl = this;
        if (origLink.call(gl, program), gl.getProgramParameter(program, gl.LINK_STATUS))
          return;
        const shaders = gl.getAttachedShaders ? gl.getAttachedShaders(program) : [];
        let patchedAny = !1;
        shaders.forEach((shader) => {
          if (shader.__patchedOnce)
            return;
          const src = originalSrcMap.get(shader);
          if (!src)
            return;
          const type = gl.getShaderParameter(shader, gl.SHADER_TYPE), stage = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
          try {
            const patched = patchSource(src, stage, gl, isGL2Ctx(gl));
            gl.shaderSource(shader, patched), shader.__patchedOnce = !0, gl.compileShader(shader), patchedAny = !0;
          } catch {
          }
        }), patchedAny && origLink.call(gl, program);
      }, proto.__shaderPatchApplied = !0;
    }
    patchContext(window.WebGLRenderingContext && WebGLRenderingContext.prototype, isWebGL2), patchContext(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype, isWebGL2), window.__ShaderCompatPatch = {
      patchSource,
      memo
    };
  }(), function() {
    try {
      let getMaxTextureSize = function(gl) {
        var max = maxTexSizeCache.get(gl);
        if (!max) {
          try {
            max = gl.getParameter(gl.MAX_TEXTURE_SIZE) | 0;
          } catch {
            max = 0;
          }
          max > 0 && (!gl.isContextLost || !gl.isContextLost()) && maxTexSizeCache.set(gl, max);
        }
        return max;
      }, isDomTexSource = function(source) {
        return !source || typeof source != "object" ? !1 : typeof HTMLImageElement < "u" && source instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && source instanceof HTMLCanvasElement || typeof HTMLVideoElement < "u" && source instanceof HTMLVideoElement || typeof ImageBitmap < "u" && source instanceof ImageBitmap || typeof OffscreenCanvas < "u" && source instanceof OffscreenCanvas;
      }, getSourceSize = function(source) {
        var w = source.naturalWidth || source.videoWidth || source.width || 0, h = source.naturalHeight || source.videoHeight || source.height || 0;
        return {
          width: w | 0,
          height: h | 0
        };
      }, scaleDomSourceIfNeeded = function(source, maxSize, boundTex) {
        if (!maxSize || !isDomTexSource(source))
          return source;
        var size = getSourceSize(source), w = size.width, h = size.height;
        if (!(w > maxSize || h > maxSize))
          return source;
        var scaledW = Math.max(1, Math.min(w, maxSize)), scaledH = Math.max(1, Math.min(h, maxSize)), cacheKey = typeof HTMLImageElement < "u" && source instanceof HTMLImageElement ? source : boundTex || source, cache = sourceCanvasCache.get(cacheKey);
        if (!cache || cache.source !== source || cache.width !== scaledW || cache.height !== scaledH) {
          var canvas = document.createElement("canvas");
          canvas.width = scaledW, canvas.height = scaledH, cache = {
            source,
            canvas,
            width: scaledW,
            height: scaledH,
            drawnOnce: !1
          }, sourceCanvasCache.set(cacheKey, cache);
        }
        var isStaticImg = typeof HTMLImageElement < "u" && source instanceof HTMLImageElement;
        if (!isStaticImg || !cache.drawnOnce) {
          var ctx = cache.canvas.getContext("2d");
          ctx && (ctx.clearRect(0, 0, scaledW, scaledH), ctx.imageSmoothingEnabled = !0, ctx.imageSmoothingQuality = "high", ctx.drawImage(source, 0, 0, w, h, 0, 0, scaledW, scaledH), cache.drawnOnce = !0);
        }
        return cache.canvas;
      }, patchTexUploadProto = function(proto) {
        if (!(!proto || proto.__padportOversizedTexPatched)) {
          proto.__padportOversizedTexPatched = !0;
          var origTexImage2D = proto.texImage2D, origTexSubImage2D = proto.texSubImage2D;
          typeof origTexImage2D == "function" && (proto.texImage2D = function() {
            if (arguments.length === 6) {
              var source = arguments[5];
              if (isDomTexSource(source)) {
                var maxSize = getMaxTextureSize(this), size = getSourceSize(source);
                if (maxSize > 0 && (size.width > maxSize || size.height > maxSize)) {
                  var target = arguments[0], boundTex = null;
                  try {
                    target === this.TEXTURE_2D && (boundTex = this.getParameter(this.TEXTURE_BINDING_2D));
                  } catch {
                  }
                  var scaled = scaleDomSourceIfNeeded(source, maxSize, boundTex);
                  if (scaled !== source)
                    return boundTex && oversizedGlTextures.set(boundTex, {
                      scaledWidth: scaled.width,
                      scaledHeight: scaled.height
                    }), origTexImage2D.call(this, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], scaled);
                }
              }
            }
            return origTexImage2D.apply(this, arguments);
          }), typeof origTexSubImage2D == "function" && (proto.texSubImage2D = function() {
            if (arguments.length === 7 && arguments[2] === 0 && arguments[3] === 0) {
              var source = arguments[6];
              if (isDomTexSource(source)) {
                var maxSize = getMaxTextureSize(this), size = getSourceSize(source);
                if (maxSize > 0 && (size.width > maxSize || size.height > maxSize)) {
                  var target = arguments[0], boundTex = null;
                  try {
                    target === this.TEXTURE_2D && (boundTex = this.getParameter(this.TEXTURE_BINDING_2D));
                  } catch {
                  }
                  var scaled = scaleDomSourceIfNeeded(source, maxSize, boundTex);
                  if (scaled !== source) {
                    var meta = boundTex && oversizedGlTextures.get(boundTex);
                    return meta && meta.scaledWidth === scaled.width && meta.scaledHeight === scaled.height ? origTexSubImage2D.call(this, arguments[0], arguments[1], 0, 0, arguments[4], arguments[5], scaled) : (boundTex && oversizedGlTextures.set(boundTex, {
                      scaledWidth: scaled.width,
                      scaledHeight: scaled.height
                    }), origTexImage2D.call(this, arguments[0], arguments[1], arguments[4], arguments[4], arguments[5], scaled));
                  }
                }
              }
            }
            return origTexSubImage2D.apply(this, arguments);
          });
        }
      };
      if (typeof window > "u" || typeof WeakMap > "u" || window.__padport_WEBGL_OVERSIZED_TEX_PATCH__)
        return;
      window.__padport_WEBGL_OVERSIZED_TEX_PATCH__ = !0;
      var maxTexSizeCache = /* @__PURE__ */ new WeakMap(), sourceCanvasCache = /* @__PURE__ */ new WeakMap(), oversizedGlTextures = /* @__PURE__ */ new WeakMap();
      patchTexUploadProto(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype), patchTexUploadProto(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
    } catch {
    }
  }();
}
module.exports = { installGraphics };
