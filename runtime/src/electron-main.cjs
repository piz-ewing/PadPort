'use strict';

function startMainScope({app, filename, directory, makeRequire, electron, script}) {
    const mainRequire = makeRequire(filename, electron);
    let firstLoadPage = false;
    app.on = function(event, handler) {
        if (event === 'activate' || event === 'ready') handler();
        return app;
    };
    app.once = app.addListener = app.prependListener = app.prependOnceListener = app.on;
    app.off = app.removeListener = app.removeAllListeners = app.setMaxListeners = function() { return app; };
    app.emit = function() { return false; };
    app.whenReady = function() { return Promise.resolve(); };
    app.requestSingleInstanceLock = function() { return true; };
    app.quit = function() {};

    const reportMainScriptError = function(kind, error) {
        if (firstLoadPage) return;
        console.error(kind + ' in ' + filename + ' before the game page was loaded:');
        console.error(error && error.stack ? error.stack : String(error));
    };
    const onUnhandledRejection = event => reportMainScriptError('Unhandled rejection', event && event.reason);
    const onWindowError = event => reportMainScriptError('Uncaught error', event && (event.error || event.message));
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onWindowError);
    const noWindowTimer = setTimeout(function() {
        if (!firstLoadPage) console.error(filename + ' has not called BrowserWindow.loadFile/loadURL after 15s; the game page will not be loaded.');
    }, 15000);
    function loaded() {
        firstLoadPage = true;
        clearTimeout(noWindowTimer);
        window.removeEventListener('unhandledrejection', onUnhandledRejection);
        window.removeEventListener('error', onWindowError);
        window.removeEventListener('pagehide', loaded);
    }
    window.addEventListener('pagehide', loaded, {once: true});
    try {
        const mainModule = {exports: {}, filename, id: filename, loaded: false, require: mainRequire};
        new Function('require', 'module', 'exports', '__filename', '__dirname', script)
            (mainRequire, mainModule, mainModule.exports, filename, directory);
        mainModule.loaded = true;
    } catch (error) {
        reportMainScriptError('Exception', error);
        loaded();
        throw error;
    }
    return loaded;
}

module.exports = {startMainScope};
