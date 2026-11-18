"use strict";
function installMedia() {
  if (window.__PADPORT_MEDIA_INSTALLED__) return;
  window.__PADPORT_MEDIA_INSTALLED__ = true;
  (function() {
    console.warn("DecodeAudioData fix");
    const originalDecodeAudioData = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function(arrayBuffer, successCallback, errorCallback) {
      const context = this, maxRetries = 6, baseDelay = 150;
      let attempts = 0;
      const resolveSilent = (resolve, reject, error) => {
        console.error("decodeAudioData: all retries exhausted, returning silent fallback", error);
        try {
          const silent = context.createBuffer(1, 1, context.sampleRate || 44100);
          typeof successCallback == "function" && successCallback(silent), resolve(silent);
        } catch (e) {
          console.error("decodeAudioData: cannot create fallback buffer either", e), typeof errorCallback == "function" && errorCallback(error), reject(error);
        }
      };
      return !arrayBuffer || !(arrayBuffer instanceof ArrayBuffer) ? new Promise((resolve, reject) => {
        resolveSilent(resolve, reject, new Error("decodeAudioData: invalid ArrayBuffer input"));
      }) : new Promise((resolve, reject) => {
        const decode = () => {
          if (context.state === "closed") {
            resolveSilent(resolve, reject, new Error("decodeAudioData: AudioContext is closed"));
            return;
          }
          const bufferCopy = arrayBuffer.slice(0);
          attempts++;
          try {
            const originalPromise = originalDecodeAudioData.call(context, bufferCopy, (audioBuffer) => {
              typeof successCallback == "function" && successCallback(audioBuffer), resolve(audioBuffer);
            }, (error) => {
              if (attempts < maxRetries) {
                const delay = baseDelay * Math.pow(1.5, attempts - 1) * (0.7 + Math.random() * 0.6);
                console.warn("decodeAudioData retry " + attempts + "/" + maxRetries + ", next in " + Math.round(delay) + "ms"), setTimeout(decode, delay);
              } else
                resolveSilent(resolve, reject, error);
            });
            originalPromise && typeof originalPromise.catch == "function" && originalPromise.catch(() => {
            });
          } catch (e) {
            if (attempts < maxRetries) {
              const delay = baseDelay * Math.pow(1.5, attempts - 1) * (0.7 + Math.random() * 0.6);
              setTimeout(decode, delay);
            } else
              resolveSilent(resolve, reject, e);
          }
        };
        decode();
      });
    };
  })(), function() {
    console.warn("FullScreen fix");
    const originalStylesMap = /* @__PURE__ */ new WeakMap();
    let currentSimulatedFullscreenElement = null, exitKeyFunc = function(e) {
      e.key === "Escape" && currentSimulatedFullscreenElement && simulateExitFullscreen(currentSimulatedFullscreenElement);
    };
    function simulateFullscreen(el) {
      el && (!originalStylesMap.has(el) && originalStylesMap.set(el, el.style.cssText), el.style.position = "fixed", el.style.top = "0", el.style.left = "0", el.style.width = "100%", el.style.height = "100%", el.style.zIndex = "999999", el.style.backgroundColor = "#000", el.style.margin = "0", el.style.padding = "0", currentSimulatedFullscreenElement = el, document.removeEventListener("keydown", exitKeyFunc), document.addEventListener("keydown", exitKeyFunc));
    }
    function simulateExitFullscreen(el) {
      el && (originalStylesMap.has(el) && (el.style.cssText = originalStylesMap.get(el), originalStylesMap.delete(el)), currentSimulatedFullscreenElement === el && (currentSimulatedFullscreenElement = null));
    }
    function patchFullscreenMethod(proto, methodName) {
      if (!(!proto || typeof proto != "object")) {
        var original = proto[methodName];
        if (original && typeof original == "function") {
          if (original.padportPatched)
            return;
          proto[methodName] = function(options) {
            try {
              var result = original.call(this, options);
              return result && typeof result.catch == "function" ? result.catch(() => (simulateFullscreen(this), Promise.resolve(void 0))) : (simulateFullscreen(this), Promise.resolve(void 0));
            } catch {
              return simulateFullscreen(this), Promise.resolve(void 0);
            }
          }, proto[methodName].padportPatched = !0;
        }
      }
    }
    var candidates = [
      Element.prototype,
      HTMLElement.prototype,
      Document.prototype
    ], methods = [
      "requestFullscreen",
      "webkitRequestFullscreen",
      "mozRequestFullScreen",
      "msRequestFullscreen"
    ];
    candidates.forEach(function(proto) {
      methods.forEach(function(method) {
        patchFullscreenMethod(proto, method);
      });
    });
    function patchExitFullscreenMethod(proto, methodName) {
      if (!(!proto || typeof proto != "object")) {
        var original = proto[methodName];
        typeof original != "function" || original.padportPatched || (proto[methodName] = function() {
          currentSimulatedFullscreenElement && simulateExitFullscreen(currentSimulatedFullscreenElement);
          var result;
          try {
            result = original.apply(this, arguments);
          } catch {
            return Promise.resolve(void 0);
          }
          return result && typeof result.then == "function" ? result.then(void 0, function() {
          }) : result;
        }, proto[methodName].padportPatched = !0);
      }
    }
    [
      "exitFullscreen",
      "webkitExitFullscreen",
      "webkitCancelFullScreen",
      "mozCancelFullScreen",
      "msExitFullscreen",
      "cancelFullScreen"
    ].forEach(function(method) {
      patchExitFullscreenMethod(Document.prototype, method);
    }), window.simulateExitFullscreen = simulateExitFullscreen;
  }(), (() => {
    const mediaEls = /* @__PURE__ */ new Set(), audioContexts = /* @__PURE__ */ new Set(), metaMedia = /* @__PURE__ */ new WeakMap(), metaCtx = /* @__PURE__ */ new WeakMap();
    let pausedGlobal = !1;
    const SKIP_ATTR = "data-mediactl-skip", shouldSkip = (el) => el?.hasAttribute?.(SKIP_ATTR);
    function mediaState(el) {
      let meta = metaMedia.get(el);
      if (!meta) {
        meta = {pausedByCtl: false, prevMuted: el.muted};
        metaMedia.set(el, meta);
      }
      return meta;
    }
    function ensureRegisteredMedia(el) {
      if (shouldSkip(el)) return;
      mediaEls.add(el);
      mediaState(el);
    }
    function ensureRegisteredCtx(ctx) {
      if (shouldSkip(ctx) || audioContexts.has(ctx)) return;
      audioContexts.add(ctx);
      metaCtx.set(ctx, {suspendedByCtl: false, resuming: false, operation: 0});
      ctx.addEventListener('statechange', () => {
        if (ctx.state === 'closed') audioContexts.delete(ctx);
      });
    }
    function patchCtx(name) {
      const Orig = window[name];
      if (!Orig)
        return;
      function Wrapped(...args) {
        const ctx = new Orig(...args);
        return ensureRegisteredCtx(ctx), ctx;
      }
      Wrapped.prototype = Orig.prototype;
      Object.setPrototypeOf(Wrapped, Orig);
      window[name] = Wrapped;
    }
    patchCtx("AudioContext"), patchCtx("webkitAudioContext");
    async function pause() {
      if (pausedGlobal) return;
      pausedGlobal = true;
      document.querySelectorAll("audio,video").forEach(ensureRegisteredMedia);
      mediaEls.forEach(el => {
        if (shouldSkip(el))
          return;
        const meta = metaMedia.get(el);
        meta.prevMuted = el.muted;
        if (el.paused) return;
        el.pause();
        meta.pausedByCtl = true;
        el.muted = true;
      });
      await Promise.all([...audioContexts].map((ctx) => {
        if (shouldSkip(ctx))
          return null;
        const meta = metaCtx.get(ctx);
        if (ctx.state !== "running" && !meta.resuming) return null;
        const operation = ++meta.operation;
        meta.resuming = false;
        meta.suspendedByCtl = true;
        return ctx.suspend().catch(error => {
          if (meta.operation === operation) meta.suspendedByCtl = false;
          console.error("Audio suspend failed", error);
        });
      }));
    }
    async function resume() {
      if (!pausedGlobal) return;
      pausedGlobal = false;
      mediaEls.forEach((el) => {
        if (shouldSkip(el))
          return;
        const meta = metaMedia.get(el);
        if (meta.pausedByCtl) {
          try {
            el.muted = meta.prevMuted;
            if (el.paused) el.play().catch(error => console.error("Media resume failed", error));
          } catch (error) {
            console.error("Media resume failed", error);
          }
          meta.pausedByCtl = !1;
        } else
          el.muted = meta.prevMuted;
      });
      mediaEls.clear();
      await Promise.all([...audioContexts].map((ctx) => {
        if (shouldSkip(ctx))
          return null;
        const meta = metaCtx.get(ctx);
        if (!meta.suspendedByCtl || ctx.state === "closed") return null;
        const operation = ++meta.operation;
        meta.suspendedByCtl = false;
        meta.resuming = true;
        return ctx.resume().catch(error => {
          if (meta.operation === operation) meta.suspendedByCtl = true;
          console.error("Audio resume failed", error);
        }).finally(() => {
          if (meta.operation === operation) meta.resuming = false;
        });
      }));
    }
    window.__mediaCtl = {
      pause,
      resume
    };
    window.addEventListener('pagehide', event => {
      if (!event.persisted) {
        for (const ctx of audioContexts) {
          if (ctx.state !== 'closed') ctx.close().catch(error => console.error(error));
        }
        mediaEls.clear();
        audioContexts.clear();
      }
    });
  })();
}
module.exports = { installMedia };
