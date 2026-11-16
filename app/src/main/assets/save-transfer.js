/* Manual copies between browser storage and the selected game's save folder. */
(() => {
    'use strict';
    const config = window.__PADPORT_CONFIG__ || {};
    const text = window.PadPortI18n.text;
    let pending = null, sequence = 0;

    function complete(id, result) {
        if (!pending || pending.id !== id) return;
        const request = pending;
        pending = null;
        if (result.ok) request.resolve(result.value);
        else request.reject(new Error(result.error));
    }
    async function request(command) {
        if (config.renderer === 'gecko') {
            const response = await fetch('__padport__/save-transfer', {method: 'POST',
                headers: {'Content-Type': 'application/json'}, body: JSON.stringify(command)});
            if (!response.ok) throw new Error('Save transfer HTTP ' + response.status);
            const result = await response.json();
            if (!result.ok) throw new Error(result.error);
            return result.value;
        }
        return new Promise((resolve, reject) => {
            const id = ++sequence;
            pending = {id, resolve, reject};
            try { window.PadPortHost.directoryTransfer(JSON.stringify(command), id); }
            catch (error) { pending = null; reject(error); }
        });
    }
    const observedIds = new Set(), observedMethods = new WeakSet();
    function observeMvStorage() {
        if (config.engine !== 'MV' || !window.StorageManager) return;
        for (const method of ['localFilePath', 'webStorageKey']) {
            const original = StorageManager[method];
            if (typeof original !== 'function' || observedMethods.has(original)) continue;
            const wrapped = function (id) {
                const value = original.apply(this, arguments);
                if (this === StorageManager && (typeof id === 'string' || Number.isSafeInteger(id))) observedIds.add(id);
                return value;
            };
            observedMethods.add(wrapped);
            StorageManager[method] = wrapped;
        }
    }
    // Engine boot can read plugin slots before the first game scene is ready.
    window.addEventListener('DOMContentLoaded', observeMvStorage);
    window.addEventListener('load', observeMvStorage);

    function mvPaths(files, local) {
        observeMvStorage();
        const storage = window.StorageManager;
        const receiver = Object.create(storage);
        receiver.localFileDirectoryPath = () => 'save/';
        const ids = new Set([-1, 0, ...observedIds]);
        for (let id = 1; id <= window.DataManager.maxSavefiles(); id++) ids.add(id);
        for (const name of Object.keys(files)) {
            const slot = /^file([1-9][0-9]*)\.rpgsave(?:\.bak)?$/i.exec(name);
            if (slot) ids.add(Number(slot[1]));
        }
        for (const key of Object.keys(local)) {
            const slot = /^RPG File([1-9][0-9]*)(?:bak)?$/.exec(key);
            if (slot) ids.add(Number(slot[1]));
        }
        const paths = new Map();
        function addPath(path, key, id) {
            if (!/^save\/[^/\\]+\.rpgsave$/i.test(path) || typeof key !== 'string' || !key)
                throw new Error(text('unsupported_save', path));
            const name = path.slice(5);
            for (const entry of [{name, key, id, backup: false}, {name: name + '.bak', key: key + 'bak', id, backup: true}]) {
                const previous = paths.get(entry.name.toLowerCase());
                if (previous && previous.key !== entry.key) throw new Error(text('unsupported_save', entry.name));
                paths.set(entry.name.toLowerCase(), entry);
            }
        }
        for (const id of ids) {
            const path = storage.localFilePath.call(receiver, id);
            addPath(path, storage.webStorageKey.call(receiver, id), id);
        }
        for (const name of Object.keys(files)) {
            if (paths.has(name.toLowerCase())) continue;
            const match = /^(.+)\.rpgsave(?:\.bak)?$/i.exec(name);
            if (!match) continue;
            const path = storage.localFilePath.call(receiver, match[1]);
            // A filename stem is a slot ID only when the engine confirms it.
            if (typeof path === 'string' && path.toLowerCase() === 'save/' + match[1].toLowerCase() + '.rpgsave') {
                addPath(path, storage.webStorageKey.call(receiver, match[1]), match[1]);
                observedIds.add(match[1]);
            }
        }
        return paths;
    }
    function convertMvIndex(local, paths) {
        const slots = new Set();
        for (const entry of paths.values()) {
            if (!entry.backup && Number.isSafeInteger(entry.id) && entry.id > 0 && Object.hasOwn(local, entry.key))
                slots.add(entry.id);
        }
        for (const entry of paths.values()) {
            if (entry.id !== 0 || !Object.hasOwn(local, entry.key)) continue;
            let info;
            try { info = JSON.parse(LZString.decompressFromBase64(local[entry.key])); }
            catch (error) { throw new Error(text('invalid_save_index')); }
            if (!Array.isArray(info)) throw new Error(text('invalid_save_index'));
            let changed = false;
            for (const id of slots) {
                const slot = info[id];
                if (slot == null) continue;
                if (typeof slot !== 'object' || Array.isArray(slot) || typeof slot.title !== 'string')
                    throw new Error(text('invalid_save_index'));
                if (slot.globalId !== DataManager._globalId) throw new Error(text('incompatible_save_index'));
                // Desktop MV skips the title check that browser MV applies to this metadata.
                if (slot.title !== $dataSystem.gameTitle) {
                    slot.title = $dataSystem.gameTitle;
                    changed = true;
                }
            }
            if (changed) local[entry.key] = LZString.compressToBase64(JSON.stringify(info));
        }
    }
    function backupFromFiles(files) {
        const local = Object.create(null), forage = Object.create(null), keys = new Set();
        const paths = config.engine === 'MV' ? mvPaths(files, {}) : null;
        for (const [name, value] of Object.entries(files)) {
            let key;
            if (paths) key = paths.get(name.toLowerCase())?.key;
            else {
                const match = /^([^/\\]+)\.rmmzsave$/i.exec(name);
                if (match) key = StorageManager.forageKey(match[1]);
            }
            if (!key || keys.has(key)) throw new Error(text('unsupported_save', name));
            if (typeof value !== 'string') throw new Error(text('invalid_backup'));
            keys.add(key);
            (paths ? local : forage)[key] = value;
        }
        if (!keys.size) throw new Error(text('no_directory_saves'));
        if (paths) convertMvIndex(local, paths);
        return {format: 'PadPort saves', version: 1, title: config.title, engine: config.engine, local, forage};
    }
    async function importSaves() {
        const files = await request({op: 'import'});
        await PadPort.importSaves(backupFromFiles(files));
        window.PadPortHost.importReady();
    }
    async function exportSaves() {
        const backup = await PadPort.collectSaves(), files = Object.create(null);
        if (config.engine === 'MV') {
            for (const {name, key} of mvPaths({}, backup.local).values()) {
                if (Object.hasOwn(backup.local, key)) files[name] = backup.local[key];
            }
        } else {
            const prefix = StorageManager.forageKey('');
            for (const [key, value] of Object.entries(backup.forage)) {
                if (key.startsWith(prefix) && key !== StorageManager.forageTestKey())
                    files[key.slice(prefix.length) + '.rmmzsave'] = value;
            }
        }
        if (!Object.keys(files).length) throw new Error(text('no_app_saves'));
        const count = await request({op: 'export', files});
        window.PadPortHost.directoryExportReady(count);
    }
    let busy = false;
    async function transfer(direction) {
        if (busy) return;
        busy = true;
        PadPort.pause();
        try {
            if (direction === 'import') await importSaves();
            else if (direction === 'export') await exportSaves();
            else throw new Error('Unknown save transfer');
        } catch (error) { window.PadPortHost.saveError(text(direction === 'import' ? 'import_error' : 'export_error', error.message)); }
        finally { busy = false; PadPort.resume(); }
    }
    window.PadPortSaveTransfer = Object.freeze({transfer, complete});
})();
