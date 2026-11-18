'use strict';

function installFrameScheduler() {
    const rawRAF = window.requestAnimationFrame.bind(window);
    const rawCAF = window.cancelAnimationFrame.bind(window);

    const FPS = 60;
    const interval = 1000 / FPS;
    const frameTolerance = 1;

    let idSeed = 1;
    const scheduled = new Map();
    let driverId = 0;
    let lastExec = 0;
    let started = false;

    function resetDriverState() {
        driverId = 0;
        lastExec = 0;
        started = false;
    }

    function ensureDriver() {
        if (!driverId) {
            driverId = rawRAF(driverTick);
        }
    }

    function flush(ts) {
        const batchIds = Array.from(scheduled.keys());
        for (const fakeId of batchIds) {
            const cb = scheduled.get(fakeId);
            if (!cb) continue;
            scheduled.delete(fakeId);
            try {
                cb(ts);
            } catch (err) {
                setTimeout(() => {
                    throw err;
                }, 0);
            }
        }
    }

    function driverTick(ts) {
        driverId = 0;

        if (scheduled.size === 0) {
            resetDriverState();
            return;
        }

        if (!started) {
            started = true;
            lastExec = ts;
            flush(ts);
        } else {
            const delta = ts - lastExec;
            // Firefox/Windows 在 60Hz 下也可能出现轻微时间戳抖动，给一点容差避免误判成超采样。
            if (delta + frameTolerance < interval) {
                ensureDriver();
                return;
            }
            if (delta >= interval) {
                lastExec = ts - (delta % interval);
            } else {
                lastExec = ts;
            }
            flush(ts);
        }

        if (scheduled.size > 0) {
            ensureDriver();
        } else {
            resetDriverState();
        }
    }

    function hookedRAF(cb) {
        const fakeId = idSeed++;
        scheduled.set(fakeId, cb);
        ensureDriver();
        return fakeId;
    }

    function hookedCAF(fakeId) {
        if (!scheduled.delete(fakeId)) return;
        if (scheduled.size === 0 && driverId) {
            rawCAF(driverId);
            resetDriverState();
        }
    }

    window.requestAnimationFrame = hookedRAF;
    window.cancelAnimationFrame = hookedCAF;
}

module.exports = {installFrameScheduler};
