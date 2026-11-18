function createNodeFsModules(ctx) {
  const globalScope = typeof window !== "undefined" && window || typeof globalThis !== "undefined" && globalThis || {};
  const fsOri = ctx && ctx.fsOri;
  const path = ctx && ctx.path || (typeof require === "function" ? require("path") : void 0);
  const util = ctx && ctx.util || (typeof require === "function" ? require("util") : void 0);
  const Buffer = ctx && ctx.Buffer || globalScope.Buffer;
  const process = ctx && ctx.process || globalScope.process;
  const packageData = ctx && ctx.packageData !== void 0 ? ctx.packageData : globalScope.packageData;
  const writeFile = ctx.writeFileSync;
  const warnLog = ctx && ctx.warnLog || function() {
    console.warn.apply(console, arguments);
  };
  class FakeFsSharedCache {
    static _createCacheMaps() {
      return {
        accessCache: /* @__PURE__ */ new Map(),
        statCache: /* @__PURE__ */ new Map(),
        existsCache: /* @__PURE__ */ new Map(),
        writeCache: /* @__PURE__ */ new Map()
      };
    }
    static ensureInfra(owner) {
      if (!FakeFsSharedCache._store) {
        FakeFsSharedCache._store = FakeFsSharedCache._createCacheMaps();
      }
      if (!FakeFsSharedCache._meta) {
        FakeFsSharedCache._meta = FakeFsSharedCache._createCacheMaps();
      }
      if (!FakeFsSharedCache._config) {
        FakeFsSharedCache._config = {
          accessCacheTtlMs: 5 * 1e3,
          statCacheTtlMs: 5 * 1e3,
          existsCacheTtlMs: 8 * 1e3,
          cleanWriteCacheRetentionMs: 5 * 1e3,
          flushIntervalMs: 500,
          cleanupIntervalMs: 1e3,
          maxEntries: 4096,
          maxFileBytes: 32 * 1024 * 1024
        };
      }
      if (!FakeFsSharedCache._timersStarted) {
        const flushTimer = setInterval(() => owner.flushWrites(), FakeFsSharedCache._config.flushIntervalMs);
        const cleanupTimer = setInterval(() => owner.cleanupExpiredCacheEntries(), FakeFsSharedCache._config.cleanupIntervalMs);
        ctx.onCleanup(() => {
          clearInterval(flushTimer);
          clearInterval(cleanupTimer);
          owner.flushWritesAndClearCaches();
        });
        FakeFsSharedCache._timersStarted = true;
      }
    }
    static bindOwner(owner) {
      FakeFsSharedCache.ensureInfra(owner);
      owner.accessCache = FakeFsSharedCache._store.accessCache;
      owner.statCache = FakeFsSharedCache._store.statCache;
      owner.existsCache = FakeFsSharedCache._store.existsCache;
      owner.writeCache = FakeFsSharedCache._store.writeCache;
    }
    static getMetaMap(cacheName) {
      return FakeFsSharedCache._meta[cacheName];
    }
    static touchEntry(owner, cacheName, key) {
      const cache = owner[cacheName];
      if (!cache.has(key)) {
        return false;
      }
      FakeFsSharedCache.getMetaMap(cacheName).set(key, Date.now());
      return true;
    }
    static hasEntry(owner, cacheName, key) {
      return FakeFsSharedCache.touchEntry(owner, cacheName, key);
    }
    static getEntry(owner, cacheName, key) {
      if (!FakeFsSharedCache.touchEntry(owner, cacheName, key)) {
        return void 0;
      }
      return owner[cacheName].get(key);
    }
    static setEntry(owner, cacheName, key, value) {
      if (cacheName === 'writeCache') {
        const cost = entry => entry && entry.data ? entry.data.byteLength : 0;
        if (value.isDirty || cost(value) <= FakeFsSharedCache._config.maxFileBytes) {
          let retained = cost(value);
          for (const [other, entry] of owner.writeCache) if (other !== key) retained += cost(entry);
          for (const [other, entry] of owner.writeCache) {
            if (retained <= FakeFsSharedCache._config.maxFileBytes) break;
            if (other === key || entry.isDirty) continue;
            retained -= cost(entry);
            FakeFsSharedCache.deleteEntry(owner, cacheName, other);
          }
        } else {
          FakeFsSharedCache.deleteEntry(owner, cacheName, key);
          return value;
        }
      }
      if (!owner[cacheName].has(key) && owner[cacheName].size >= FakeFsSharedCache._config.maxEntries) {
        const candidate = [...owner[cacheName]].find(([, entry]) => !entry || !entry.isDirty);
        if (candidate) FakeFsSharedCache.deleteEntry(owner, cacheName, candidate[0]);
      }
      owner[cacheName].set(key, value);
      FakeFsSharedCache.getMetaMap(cacheName).set(key, Date.now());
      return value;
    }
    static deleteEntry(owner, cacheName, key) {
      owner[cacheName].delete(key);
      FakeFsSharedCache.getMetaMap(cacheName).delete(key);
    }
    static clear(owner, cacheName) {
      owner[cacheName].clear();
      FakeFsSharedCache.getMetaMap(cacheName).clear();
    }
    static cleanupExpiredEntries(owner) {
      const now = Date.now();
      const volatileCacheNames = ["accessCache", "statCache", "existsCache"];
      for (const cacheName of volatileCacheNames) {
        const ttlMs = FakeFsSharedCache._getCacheTtlMs(cacheName);
        const expireBefore = now - ttlMs;
        const cache = owner[cacheName];
        const metaMap = FakeFsSharedCache.getMetaMap(cacheName);
        for (const [key, lastAccessAt] of metaMap) {
          if (lastAccessAt > expireBefore) {
            continue;
          }
          cache.delete(key);
          metaMap.delete(key);
        }
      }
      const writeMeta = FakeFsSharedCache.getMetaMap("writeCache");
      for (const [filePath, lastAccessAt] of writeMeta) {
        const data = owner.writeCache.get(filePath);
        if (data && data.isDirty) {
          continue;
        }
        const expireBefore = now - FakeFsSharedCache._config.cleanWriteCacheRetentionMs;
        if (lastAccessAt > expireBefore) {
          continue;
        }
        owner.writeCache.delete(filePath);
        writeMeta.delete(filePath);
      }
    }
    static _getCacheTtlMs(cacheName) {
      switch (cacheName) {
        case "accessCache":
          return FakeFsSharedCache._config.accessCacheTtlMs;
        case "statCache":
          return FakeFsSharedCache._config.statCacheTtlMs;
        case "existsCache":
          return FakeFsSharedCache._config.existsCacheTtlMs;
        default:
          return 0;
      }
    }
  }
  const S_IFMT = 61440;
  const S_IFIFO = 4096;
  const S_IFCHR = 8192;
  const S_IFDIR = 16384;
  const S_IFBLK = 24576;
  const S_IFREG = 32768;
  const S_IFLNK = 40960;
  const S_IFSOCK = 49152;
  const UV_DIRENT_FILE = 1;
  const UV_DIRENT_DIR = 2;
  const UV_DIRENT_LINK = 3;
  const UV_DIRENT_FIFO = 4;
  const UV_DIRENT_SOCKET = 5;
  const UV_DIRENT_CHAR = 6;
  const UV_DIRENT_BLOCK = 7;
  function matchFileMode(holder, formatBits) {
    const mode = holder && holder.mode;
    if (typeof mode !== "number") {
      return false;
    }
    return (mode & S_IFMT) === formatBits;
  }
  class RuntimeStats {
    isFile() {
      if (typeof this._isFile === "boolean") {
        return this._isFile;
      }
      return matchFileMode(this, S_IFREG);
    }
    isDirectory() {
      if (typeof this._isDirectory === "boolean") {
        return this._isDirectory;
      }
      return matchFileMode(this, S_IFDIR);
    }
    isBlockDevice() {
      return matchFileMode(this, S_IFBLK);
    }
    isCharacterDevice() {
      return matchFileMode(this, S_IFCHR);
    }
    isSymbolicLink() {
      return matchFileMode(this, S_IFLNK);
    }
    isFIFO() {
      return matchFileMode(this, S_IFIFO);
    }
    isSocket() {
      return matchFileMode(this, S_IFSOCK);
    }
  }
  class RuntimeDirent {
    constructor(name, type, parentPath) {
      this.name = name;
      this._direntType = type;
      if (parentPath !== void 0) {
        this.parentPath = parentPath;
        this.path = parentPath;
      }
    }
    isFile() {
      if (typeof this._isFile === "boolean") {
        return this._isFile;
      }
      return this._direntType === UV_DIRENT_FILE;
    }
    isDirectory() {
      if (typeof this._isDirectory === "boolean") {
        return this._isDirectory;
      }
      return this._direntType === UV_DIRENT_DIR;
    }
    isBlockDevice() {
      return this._direntType === UV_DIRENT_BLOCK;
    }
    isCharacterDevice() {
      return this._direntType === UV_DIRENT_CHAR;
    }
    isSymbolicLink() {
      return this._direntType === UV_DIRENT_LINK;
    }
    isFIFO() {
      return this._direntType === UV_DIRENT_FIFO;
    }
    isSocket() {
      return this._direntType === UV_DIRENT_SOCKET;
    }
  }
  function adoptLocalPrototype(obj, ctor) {
    if (!obj || typeof obj !== "object" || obj instanceof ctor) {
      return obj;
    }
    if (ctor === RuntimeDirent && typeof obj.isFile === "function") {
      const types = ["isFile", "isDirectory", "isSymbolicLink", "isFIFO", "isSocket", "isCharacterDevice", "isBlockDevice"];
      obj._direntType = types.findIndex(method => obj[method]()) + 1;
    }
    Object.setPrototypeOf(obj, ctor.prototype);
    return obj;
  }
  function createBaseFsPromiseMethods(owner) {
    return {
      rename: (oldPath, newPath) => Promise.resolve().then(() => owner.renameSync(oldPath, newPath)),
      access: (filePath, mode) => Promise.resolve().then(() => owner.accessSync(filePath, mode)),
      stat: (filePath, options) => Promise.resolve().then(() => owner.statSync(filePath, options)),
      lstat: (filePath, options) => Promise.resolve().then(() => owner.lstatSync(filePath, options)),
      realpath: (filePath, options) => Promise.resolve().then(() => owner.realpathSync(filePath, options)),
      readdir: (dirPath, options) => Promise.resolve().then(() => owner.readdirSync(dirPath, options)),
      exists: (filePath) => Promise.resolve().then(() => owner.existsSync(filePath)),
      writeFile: (filePath, data, options) => Promise.resolve().then(() => owner.writeFileSync(filePath, data, options)),
      appendFile: (filePath, data, options) => Promise.resolve().then(() => owner.appendFileSync(filePath, data, options)),
      copyFile: (src, dest, mode) => Promise.resolve().then(() => owner.copyFileSync(src, dest, mode)),
      unlink: (filePath) => Promise.resolve().then(() => owner.unlinkSync(filePath)),
      mkdir: (dirPath, options) => Promise.resolve().then(() => owner.mkdirSync(dirPath, options)),
      readFile: (filePath, options) => Promise.resolve().then(() => owner.readFileSync(filePath, options)),
      open: (filePath, flags, mode) => Promise.resolve().then(() => owner.openSync(filePath, flags, mode))
    };
  }
  function fillVirtualOwnDescriptor(target, prop, desc, currentValue) {
    if (Reflect.getOwnPropertyDescriptor(target, prop)) {
      return desc;
    }
    const full = Object.assign({}, desc);
    const isAccessor = "get" in full || "set" in full;
    if (!("configurable" in full)) {
      full.configurable = true;
    }
    if (!("enumerable" in full)) {
      full.enumerable = true;
    }
    if (!isAccessor) {
      if (!("writable" in full)) {
        full.writable = true;
      }
      if (!("value" in full)) {
        full.value = currentValue;
      }
    }
    return full;
  }
  function mergeNonConfigurableOwnKeys(target, keys) {
    const ret = [.../* @__PURE__ */ new Set([...keys, ...Reflect.ownKeys(target)])];
    for (const key of Reflect.ownKeys(target)) {
      const d = Reflect.getOwnPropertyDescriptor(target, key);
      if (d && !d.configurable && ret.indexOf(key) === -1) {
        ret.push(key);
      }
    }
    return ret;
  }
  function createFsPromisesProxy(owner, extraMethods) {
    const proxyTarget = {
      ...createBaseFsPromiseMethods(owner),
      ...extraMethods || {}
    };
    return new Proxy(proxyTarget, {
      ownKeys(target) {
        return mergeNonConfigurableOwnKeys(target, Reflect.ownKeys(owner.fsOri.promises));
      },
      getOwnPropertyDescriptor(target, prop) {
        const own = Reflect.getOwnPropertyDescriptor(target, prop);
        if (own) {
          return own;
        }
        return {
          enumerable: true,
          configurable: true,
          writable: true,
          value: owner.fsOri.promises[prop]
        };
      },
      defineProperty(target, prop, desc) {
        return Reflect.defineProperty(
          target,
          prop,
          fillVirtualOwnDescriptor(target, prop, desc, owner.fsOri.promises[prop])
        );
      },
      get: (target, prop) => {
        if (prop in target) {
          if (typeof target[prop] === "function") {
            return target[prop].bind(target);
          }
          return target[prop];
        }
        if (typeof owner.fsOri.promises[prop] === "function") {
          console.warn("called unCached fs.promises method: " + prop);
          owner.flushWritesAndClearCaches();
          return owner.fsOri.promises[prop];
        }
        console.warn("get un Cached fs.promises prop: " + prop);
        return owner.fsOri.promises[prop];
      }
    });
  }
  const UNBOUND_FS_EXPORTS = /* @__PURE__ */ new Set(["Dirent", "Stats"]);
  function createNativeFsProxyHandler(kindName) {
    return {
      ownKeys(target) {
        return mergeNonConfigurableOwnKeys(target, Reflect.ownKeys(target.fsOri));
      },
      getOwnPropertyDescriptor(target, prop) {
        const own = Reflect.getOwnPropertyDescriptor(target, prop);
        if (own) {
          return own;
        }
        return {
          enumerable: true,
          configurable: true,
          writable: true,
          value: prop in target ? this.get(target, prop) : target.fsOri[prop]
        };
      },
      defineProperty(target, prop, desc) {
        const current = prop in target ? target[prop] : target.fsOri[prop];
        return Reflect.defineProperty(
          target,
          prop,
          fillVirtualOwnDescriptor(target, prop, desc, current)
        );
      },
      get(target, prop) {
        const own = Reflect.getOwnPropertyDescriptor(target, prop);
        if (own && !own.configurable && 'value' in own && !own.writable) return own.value;
        if (prop === "exists") {
          let ret = target[prop].bind(target);
          ret[util.promisify.custom] = (path2) => {
            return new Promise((resolve) => target.exists(path2, resolve));
          };
          return ret;
        }
        if (prop === "realpathSync" || prop === "realpath") {
          let ret = target[prop].bind(target);
          ret.native = ret;
          return ret;
        }
        if (prop in target) {
          if (UNBOUND_FS_EXPORTS.has(prop)) {
            return target[prop];
          }
          if (typeof target[prop] === "function") {
            return target[prop].bind(target);
          }
          return target[prop];
        }
        if (typeof target.fsOri[prop] === "function") {
          console.warn("call Non cached " + kindName + " function: " + prop);
          target.flushWritesAndClearCaches();
          return target.fsOri[prop].bind(target.fsOri);
        }
        return target.fsOri[prop];
      }
    };
  }
  class FakeFsSync {
    constructor() {
      if (!fsOri) throw new TypeError("A host file system is required");
      this.fsOri = fsOri;
      FakeFsSharedCache.bindOwner(this);
      this._runtimeAdsDirName = ".__runtime_ads__";
      this._runtimeAdsMapAllStreams = true;
      this._rebaseRootless = true;
      this._rebaseLog = false;
      this._rebaseCaseInsensitive = true;
      this._gameRootCache = void 0;
      this._gameRootLcCache = void 0;
      this.Dirent = RuntimeDirent;
      this.Stats = RuntimeStats;
      this.exists[util.promisify.custom] = (path2) => {
        return new Promise((resolve) => this.exists(path2, resolve));
      };
      this.promises = createFsPromisesProxy(this);
    }
    _getCacheMetaMap(cacheName) {
      return FakeFsSharedCache.getMetaMap(cacheName);
    }
    _touchCacheEntry(cacheName, key) {
      return FakeFsSharedCache.touchEntry(this, cacheName, key);
    }
    _hasCacheEntry(cacheName, key) {
      return FakeFsSharedCache.hasEntry(this, cacheName, key);
    }
    _getCacheEntry(cacheName, key) {
      return FakeFsSharedCache.getEntry(this, cacheName, key);
    }
    _setCacheEntry(cacheName, key, value) {
      return FakeFsSharedCache.setEntry(this, cacheName, key, value);
    }
    _deleteCacheEntry(cacheName, key) {
      FakeFsSharedCache.deleteEntry(this, cacheName, key);
    }
    _clearCache(cacheName) {
      FakeFsSharedCache.clear(this, cacheName);
    }
    cleanupExpiredCacheEntries() {
      FakeFsSharedCache.cleanupExpiredEntries(this);
    }
    openSync(path2, flags, mode) {
      path2 = this.normalizePath(path2);
      if (this._hasCacheEntry("writeCache", path2)) {
        this.flushWrites();
      }
      return this.fsOri.openSync(path2, flags, mode);
    }
    writeSync(...args) {
      this.flushWritesAndClearCaches();
      return this.fsOri.writeSync(...args);
    }
    fstatSync(fd) {
      return adoptLocalPrototype(this.fsOri.fstatSync(fd), RuntimeStats);
    }
    open(path2, flags, mode, callback) {
      path2 = this.normalizePath(path2);
      if (this._hasCacheEntry("writeCache", path2)) {
        this.flushWrites();
      }
      callback(null, this.fsOri.openSync(path2, flags, mode));
    }
    normalizePath(path2) {
      if (typeof path2 !== "string") {
        return path2;
      }
      let p = path2.replace(/\\/g, "/");
      p = this._mapAdsPath(p);
      p = this._rebaseRootlessPath(p);
      return path.resolve(process.cwd(), p);
    }
    // 解析游戏根目录（= process.cwd() == packageData.gameCWD），结果缓存
    _getGameRoot() {
      if (this._gameRootCache !== void 0) {
        return this._gameRootCache;
      }
      let root = "";
      try {
        if (typeof packageData !== "undefined" && packageData && packageData.gameCWD) {
          root = packageData.gameCWD;
        } else if (typeof process !== "undefined" && typeof process.cwd === "function") {
          root = process.cwd();
        }
      } catch (e) {
        root = "";
      }
      root = (root || "").replace(/\\/g, "/").replace(/\/+$/, "");
      this._gameRootCache = root;
      this._gameRootLcCache = root.toLowerCase();
      return root;
    }
    // 把「绝对、但不在 gameRoot 下」的伪路径重定位到 gameRoot 下
    _rebaseRootlessPath(p) {
      if (!this._rebaseRootless || !p || typeof p !== "string") {
        return p;
      }
      if (p.charCodeAt(0) !== 47) {
        return p;
      }
      if (/^\/[a-zA-Z]:\//.test(p)) {
        return p;
      }
      const root = this._getGameRoot();
      if (!root) {
        return p;
      }
      const cmpP = this._rebaseCaseInsensitive ? p.toLowerCase() : p;
      const cmpRoot = this._rebaseCaseInsensitive ? this._gameRootLcCache : root;
      if (cmpP === cmpRoot || cmpP.startsWith(cmpRoot + "/")) {
        return p;
      }
      const execDir = packageData && packageData.gameExecDir;
      if (execDir) {
        const normalizedExecDir = execDir.replace(/\\/g, "/").replace(/\/+$/, "");
        const cmpExecDir = this._rebaseCaseInsensitive ? normalizedExecDir.toLowerCase() : normalizedExecDir;
        if (cmpP === cmpExecDir || cmpP.startsWith(cmpExecDir + "/")) {
          return p;
        }
      }
      const rebased = root + p;
      if (this._rebaseLog) {
        console.warn("[fs rebase] " + p + " -> " + rebased);
      }
      return rebased;
    }
    _mapAdsPath(p) {
      if (!p || typeof p !== "string") {
        return p;
      }
      if (p.indexOf(":") === -1) {
        return p;
      }
      if (/^[a-zA-Z]:[\\/]/.test(p)) {
        return p;
      }
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(p)) {
        return p;
      }
      const lastSlash = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
      const seg = p.slice(lastSlash + 1);
      const firstColonInSeg = seg.indexOf(":");
      if (firstColonInSeg <= 0) {
        return p;
      }
      const baseName = seg.slice(0, firstColonInSeg);
      const streamPart = seg.slice(firstColonInSeg + 1);
      if (!streamPart) {
        return p;
      }
      if (!this._runtimeAdsMapAllStreams) {
        const streamNameForDetect = streamPart.split(":")[0];
        if (!/^Zone(\.|$)/i.test(streamNameForDetect)) {
          return p;
        }
      }
      const dir = lastSlash >= 0 ? p.slice(0, lastSlash) : "";
      const encBase = encodeURIComponent(baseName);
      const encStream = encodeURIComponent(streamPart);
      const mapped = (dir ? dir + "/" : "") + this._runtimeAdsDirName + "/" + encBase + "/" + encStream;
      return mapped;
    }
    _ensureParentDirForFile(filePath) {
      if (!filePath || typeof filePath !== "string") {
        return;
      }
      const lastSlash = filePath.lastIndexOf("/");
      if (lastSlash <= 0) {
        return;
      }
      const dirPath = filePath.slice(0, lastSlash);
      try {
        if (!this.existsSync(dirPath)) {
          this.mkdirSync(dirPath, { recursive: true });
        }
      } catch (e) {
      }
    }
    renameSync(oldPath, newPath) {
      oldPath = this.normalizePath(oldPath);
      newPath = this.normalizePath(newPath);
      if (oldPath === newPath) {
        return;
      }
      let oldExists = this._hasCacheEntry("writeCache", oldPath) || this.existsSync(oldPath);
      if (!oldExists) {
        let err = new Error("ENOENT: no such file or directory, rename '" + oldPath + "' -> '" + newPath + "'");
        err.code = "ENOENT";
        err.errno = -2;
        throw err;
      }
      this.fsOri.renameSync(oldPath, newPath);
      if (this._hasCacheEntry("writeCache", oldPath)) {
        const data = this._getCacheEntry("writeCache", oldPath);
        this._deleteCacheEntry("writeCache", oldPath);
        this._setCacheEntry("writeCache", newPath, data);
      }
      this._setCacheEntry("existsCache", oldPath, false);
      this._setCacheEntry("existsCache", newPath, true);
      this._deleteCacheEntry("accessCache", oldPath);
      this._setCacheEntry("accessCache", newPath, true);
      this._deleteCacheEntry("statCache", oldPath);
      this._deleteCacheEntry("statCache", newPath);
    }
    rename(oldPath, newPath, callback) {
      try {
        this.renameSync(oldPath, newPath);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // 缓存并处理 accessSync 方法
    accessSync(filePath, mode) {
      filePath = this.normalizePath(filePath);
      if (this._hasCacheEntry("accessCache", filePath)) {
        let accessGet = this._getCacheEntry("accessCache", filePath);
        if (accessGet === true) {
          return void 0;
        } else {
          throw accessGet;
        }
      }
      if (this._hasCacheEntry("writeCache", filePath)) {
        return true;
      }
      try {
        this.fsOri.accessSync(filePath, mode);
        this._setCacheEntry("accessCache", filePath, true);
        this._setCacheEntry("existsCache", filePath, true);
        return true;
      } catch (err) {
        this._setCacheEntry("accessCache", filePath, err);
        throw err;
      }
    }
    access(filePath, mode, callback) {
      if (typeof mode === "function") {
        callback = mode;
        mode = void 0;
      }
      try {
        this.accessSync(filePath, mode);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // 缓存并处理 statSync 方法
    statSync(filePath, options) {
      filePath = this.normalizePath(filePath);
      if (this._hasCacheEntry("writeCache", filePath)) {
        this.flushWrites();
      }
      if (this._hasCacheEntry("statCache", filePath)) {
        let statCache = this._getCacheEntry("statCache", filePath);
        if (statCache instanceof Error) {
          if (options && options.throwIfNoEntry === false && statCache.code === 'ENOENT') return undefined;
          throw statCache;
        }
        return statCache;
      }
      try {
        const stats = adoptLocalPrototype(this.fsOri.statSync(filePath), RuntimeStats);
        this._setCacheEntry("statCache", filePath, stats);
        return stats;
      } catch (e) {
        this._setCacheEntry("statCache", filePath, e);
        if (options && options.throwIfNoEntry === false && e.code === 'ENOENT') return undefined;
        throw e;
      }
    }
    // 不缓存，只做原型 rebind：lstat 与 stat 对同一路径结果可能不同，共用 statCache 会串味
    lstatSync(filePath, options) {
      filePath = this.normalizePath(filePath);
      if (this._hasCacheEntry("writeCache", filePath)) {
        this.flushWrites();
      }
      return adoptLocalPrototype(this.fsOri.lstatSync(filePath, options), RuntimeStats);
    }
    lstat(filePath, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        const ret = this.lstatSync(filePath, options);
        if (callback) callback(null, ret);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    stat(filePath, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        const ret = this.statSync(filePath, options);
        if (callback) callback(null, ret);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    realpathSync(filePath, options) {
      filePath = this.normalizePath(filePath);
      if (this._hasCacheEntry("writeCache", filePath)) {
        this.flushWrites();
      }
      return this.fsOri.realpathSync(filePath, options);
    }
    realpath(filePath, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        const ret = this.realpathSync(filePath, options);
        if (callback) callback(null, ret);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // 缓存并处理 existsSync 方法
    existsSync(filePath) {
      filePath = this.normalizePath(filePath);
      if (this._hasCacheEntry("existsCache", filePath)) {
        return this._getCacheEntry("existsCache", filePath);
      } else {
        const exists = this.fsOri.existsSync(filePath);
        this._setCacheEntry("existsCache", filePath, exists);
        return exists;
      }
    }
    // 缓存并处理 existsSync 方法
    exists(filePath, cb) {
      filePath = this.normalizePath(filePath);
      if (this._hasCacheEntry("existsCache", filePath)) {
        cb(this._getCacheEntry("existsCache", filePath));
      } else {
        const exists = this.fsOri.existsSync(filePath);
        this._setCacheEntry("existsCache", filePath, exists);
        cb(exists);
      }
    }
    /*                readdir(filePath, cb) {
                        this.fsOri.readdir(filePath,cb);
                    }*/
    // 过滤内部 ADS 目录，避免游戏枚举时看到实现细节
    readdirSync(dirPath, options) {
      dirPath = this.normalizePath(dirPath);
      if (this._hasCacheEntry("writeCache", dirPath)) {
        this.flushWrites();
      }
      const entries = this.fsOri.readdirSync(dirPath, options);
      return this._filterAdsDirFromReaddir(entries);
    }
    readdir(dirPath, options, callback) {
      dirPath = this.normalizePath(dirPath);
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        const ret = this.readdirSync(dirPath, options);
        if (callback) callback(null, ret);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    _filterAdsDirFromReaddir(entries) {
      if (!Array.isArray(entries)) {
        return entries;
      }
      if (entries.length > 0 && typeof entries[0] === "object" && entries[0] && "name" in entries[0]) {
        return entries.filter((e) => e && e.name !== this._runtimeAdsDirName).map((e) => adoptLocalPrototype(e, RuntimeDirent));
      }
      return entries.filter((e) => {
        try {
          const name = Buffer.isBuffer(e) ? e.toString() : String(e);
          return name !== this._runtimeAdsDirName;
        } catch (err) {
          return true;
        }
      });
    }
    // 写入文件，支持 Uint8Array 和 字符串，并清除与文件相关的缓存
    writeFileSync(filePath, data, options) {
      filePath = this.normalizePath(filePath);
      this._ensureParentDirForFile(filePath);
      let buffer;
      if (typeof data === "string" || data instanceof String) {
        buffer = Buffer.from(data + "", typeof options === 'string' ? options : options && options.encoding || 'utf8');
      } else if (data instanceof Uint8Array) {
        buffer = Buffer.from(data);
      } else if (data instanceof Buffer) {
        buffer = data;
      } else {
        throw new TypeError("Data must be a string or Uint8Array(Buffer)");
      }
      let cache = {
        data: buffer,
        options,
        isDirty: true
      };
      this._setCacheEntry("writeCache", filePath, cache);
      this._deleteCacheEntry("statCache", filePath);
      let ret;
      try {
        ret = writeFile(filePath, buffer, options);
      } catch (error) {
        this._deleteCacheEntry("writeCache", filePath);
        throw error;
      }
      cache.isDirty = false;
      const flag = options && typeof options === 'object' && options.flag;
      if (buffer.byteLength > FakeFsSharedCache._config.maxFileBytes || flag && !['w', 'wx'].includes(flag)) this._deleteCacheEntry("writeCache", filePath);
      else this._touchCacheEntry("writeCache", filePath);
      this._setCacheEntry("existsCache", filePath, true);
      this._setCacheEntry("accessCache", filePath, true);
      return ret;
    }
    writeFile(filePath, data, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        this.writeFileSync(filePath, data, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // 追加写入文件，并清除与文件相关的缓存
    appendFileSync(filePath, data, options) {
      filePath = this.normalizePath(filePath);
      this._ensureParentDirForFile(filePath);
      let buffer;
      if (typeof data === "string" || data instanceof String) {
        buffer = Buffer.from(data, typeof options === 'string' ? options : options && options.encoding || 'utf8');
      } else if (data instanceof Uint8Array) {
        buffer = Buffer.from(data);
      } else if (data instanceof Buffer) {
        buffer = data;
      } else {
        throw new TypeError("Data must be a string or Uint8Array");
      }
      const writeCacheEntry = this._getCacheEntry("writeCache", filePath);
      let existingData;
      if (writeCacheEntry) {
        existingData = writeCacheEntry.data;
      } else if (this.existsSync(filePath)) {
        existingData = this.fsOri.readFileSync(filePath);
      } else {
        existingData = Buffer.alloc(0);
      }
      const newData = Buffer.alloc(existingData.length + buffer.length);
      newData.set(existingData);
      newData.set(buffer, existingData.length);
      const writeOptions = typeof options === 'string' ? {encoding: options} : {...options};
      delete writeOptions.flag;
      return this.writeFileSync(filePath, newData, writeOptions);
    }
    appendFile(filePath, data, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        this.appendFileSync(filePath, data, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    copyFileSync(src, dest, mode) {
      src = this.normalizePath(src);
      dest = this.normalizePath(dest);
      if (mode && mode & 1 && this.existsSync(dest)) {
        const err = new Error(`EEXIST: file already exists, copyfile '${src}' -> '${dest}'`);
        err.code = "EEXIST";
        throw err;
      }
      const data = this.readFileSync(src);
      this.writeFileSync(dest, data);
    }
    copyFile(src, dest, mode, callback) {
      if (typeof mode === "function") {
        callback = mode;
        mode = 0;
      }
      try {
        this.copyFileSync(src, dest, mode);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // 删除文件并清除相关缓存
    unlinkSync(filePath) {
      filePath = this.normalizePath(filePath);
      if (this._hasCacheEntry("writeCache", filePath)) {
        let data = this._getCacheEntry("writeCache", filePath);
        if (!data.isDirty) {
          this.fsOri.unlinkSync(filePath);
        }
        this._deleteCacheEntry("writeCache", filePath);
      } else {
        this.fsOri.unlinkSync(filePath);
      }
      this._deleteCacheEntry("statCache", filePath);
      this._deleteCacheEntry("accessCache", filePath);
      this._setCacheEntry("existsCache", filePath, false);
    }
    unlink(filePath, callback) {
      try {
        this.unlinkSync(filePath);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // 创建目录并处理 recursive 选项
    mkdirSync(dirPath, options = {}) {
      dirPath = this.normalizePath(dirPath);
      if (options == null) {
        options = {};
      }
      const { recursive } = options;
      if (recursive) {
        this.fsOri.mkdirSync(dirPath, options);
        this._setCacheEntry("existsCache", dirPath, true);
      } else {
        this.fsOri.mkdirSync(dirPath);
        this._setCacheEntry("existsCache", dirPath, true);
      }
    }
    mkdir(dirPath, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        this.mkdirSync(dirPath, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // 统一写入缓存中的文件
    flushWrites() {
      for (const [filePath, data] of this.writeCache) {
        if (!data.isDirty) {
          continue;
        }
        this._ensureParentDirForFile(filePath);
        this.fsOri.writeFileSync(filePath, data.data, data.options);
        data.isDirty = false;
        this._touchCacheEntry("writeCache", filePath);
        this._setCacheEntry("existsCache", filePath, true);
        this._setCacheEntry("accessCache", filePath, true);
      }
    }
    // 读取文件，根据 options.encoding 返回字符串或 Uint8Array
    readFileSync(filePath, options) {
      filePath = this.normalizePath(filePath);
      let encoding = null;
      if (typeof options === "string") {
        encoding = options;
        options = { encoding };
      } else if (options && typeof options === "object") {
        encoding = options.encoding || null;
      } else {
        options = {};
      }
      let fileData;
      if (this._hasCacheEntry("writeCache", filePath)) {
        fileData = this._getCacheEntry("writeCache", filePath).data;
      } else {
        fileData = this.fsOri.readFileSync(filePath);
        this._setCacheEntry("writeCache", filePath, {
          data: fileData,
          options: void 0,
          isDirty: false
        });
        this._setCacheEntry("existsCache", filePath, true);
        this._setCacheEntry("accessCache", filePath, true);
      }
      if (encoding) {
        return Buffer.from(fileData).toString(encoding);
      }
      return fileData;
    }
    readFile(filePath, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        const ret = this.readFileSync(filePath, options);
        if (callback) callback(null, ret);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    flushWritesAndClearCaches() {
      this.flushWrites();
      this._clearCache("statCache");
      this._clearCache("accessCache");
      this._clearCache("existsCache");
      this._clearCache("writeCache");
    }
  }
  const proxyHandler = createNativeFsProxyHandler("fs");
  let proxyFs = new Proxy(new FakeFsSync(), proxyHandler);
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("beforeunload", (ev) => {
      if (!ev.isTrusted) {
        return;
      }
      proxyFs.flushWrites();
    });
    window.addEventListener("pagehide", () => {
      proxyFs.flushWrites();
    });
    window.addEventListener("visibilitychange", () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        proxyFs.flushWrites();
      }
    });
  }
  class FakeFsExtra extends FakeFsSync {
    constructor() {
      super();
      this.promises = createFsPromisesProxy(this, {
        copy: (src, dest, options) => Promise.resolve().then(() => this.copySync(src, dest, options)),
        remove: (path2) => Promise.resolve().then(() => this.removeSync(path2)),
        ensureDir: (dir, options) => Promise.resolve().then(() => this.ensureDirSync(dir, options)),
        mkdirs: (dir, options) => Promise.resolve().then(() => this.ensureDirSync(dir, options)),
        mkdirp: (dir, options) => Promise.resolve().then(() => this.ensureDirSync(dir, options)),
        ensureFile: (file) => Promise.resolve().then(() => this.ensureFileSync(file)),
        ensureLink: (src, dest) => Promise.resolve().then(() => this.ensureLinkSync(src, dest)),
        ensureSymlink: (src, dest, type) => Promise.resolve().then(() => this.ensureSymlinkSync(src, dest, type)),
        emptyDir: (dir) => Promise.resolve().then(() => this.emptyDirSync(dir)),
        move: (src, dest, options) => Promise.resolve().then(() => this.moveSync(src, dest, options)),
        outputFile: (file, data, options) => Promise.resolve().then(() => this.outputFileSync(file, data, options)),
        outputJson: (file, data, options) => Promise.resolve().then(() => this.outputJsonSync(file, data, options)),
        outputJSON: (file, data, options) => Promise.resolve().then(() => this.outputJsonSync(file, data, options)),
        readJson: (file, options) => Promise.resolve().then(() => this.readJsonSync(file, options)),
        readJSON: (file, options) => Promise.resolve().then(() => this.readJsonSync(file, options)),
        writeJson: (file, obj, options) => Promise.resolve().then(() => this.writeJsonSync(file, obj, options)),
        writeJSON: (file, obj, options) => Promise.resolve().then(() => this.writeJsonSync(file, obj, options)),
        pathExists: (path2) => Promise.resolve().then(() => this.pathExistsSync(path2))
      });
    }
    // ==================== copy 方法 ====================
    copySync(src, dest, options = {}) {
      src = this.normalizePath(src);
      dest = this.normalizePath(dest);
      if (options == null) {
        options = {};
      }
      const {
        overwrite = true,
        errorOnExist = false,
        filter
      } = options;
      if (!this.existsSync(src)) {
        const err = new Error(`ENOENT: no such file or directory, copySync '${src}' -> '${dest}'`);
        err.code = "ENOENT";
        throw err;
      }
      if (this.existsSync(dest)) {
        if (!overwrite) {
          if (errorOnExist) {
            const err = new Error(`EEXIST: file already exists, copySync '${src}' -> '${dest}'`);
            err.code = "EEXIST";
            throw err;
          }
          return;
        }
      }
      const stats = this.statSync(src);
      if (stats.isDirectory()) {
        this._copyDirSync(src, dest, options);
      } else {
        this._copyFileSync(src, dest, options);
      }
    }
    _copyFileSync(src, dest, options) {
      const destDir = path.dirname(dest);
      this.ensureDirSync(destDir);
      const data = this.readFileSync(src);
      this.writeFileSync(dest, data, options);
      if (options.preserveTimestamps) {
        try {
          const stats = this.statSync(src);
          this.fsOri.utimesSync(dest, stats.atime, stats.mtime);
        } catch (e) {
        }
      }
    }
    _copyDirSync(src, dest, options) {
      this.ensureDirSync(dest);
      const items = this.fsOri.readdirSync(src);
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        if (options.filter && !options.filter(srcPath, destPath)) {
          continue;
        }
        const stats = this.statSync(srcPath);
        if (stats.isDirectory()) {
          this._copyDirSync(srcPath, destPath, options);
        } else {
          this._copyFileSync(srcPath, destPath, options);
        }
      }
    }
    copy(src, dest, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      try {
        this.copySync(src, dest, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // ==================== remove 方法 ====================
    removeSync(pathToRemove) {
      pathToRemove = this.normalizePath(pathToRemove);
      if (!this.existsSync(pathToRemove)) {
        return;
      }
      const stats = this.statSync(pathToRemove);
      if (stats.isDirectory()) {
        this._removeDirSync(pathToRemove);
      } else {
        this.unlinkSync(pathToRemove);
      }
    }
    _removeDirSync(dir) {
      const items = this.fsOri.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = this.statSync(itemPath);
        if (stats.isDirectory()) {
          this._removeDirSync(itemPath);
        } else {
          this.unlinkSync(itemPath);
        }
      }
      this.fsOri.rmdirSync(dir);
      this._setCacheEntry("existsCache", dir, false);
      this._deleteCacheEntry("accessCache", dir);
      this._deleteCacheEntry("statCache", dir);
    }
    remove(pathToRemove, callback) {
      try {
        this.removeSync(pathToRemove);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // ==================== ensureDir 方法 ====================
    ensureDirSync(dir, options) {
      dir = this.normalizePath(dir);
      if (this.existsSync(dir)) {
        const stats = this.statSync(dir);
        if (!stats.isDirectory()) {
          const err = new Error(`EEXIST: file already exists, ensureDir '${dir}'`);
          err.code = "EEXIST";
          throw err;
        }
        return;
      }
      this.mkdirSync(dir, { recursive: true, ...options });
    }
    ensureDir(dir, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      try {
        this.ensureDirSync(dir, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // aliases
    mkdirs(dir, options, callback) {
      return this.ensureDir(dir, options, callback);
    }
    mkdirsSync(dir, options) {
      return this.ensureDirSync(dir, options);
    }
    mkdirp(dir, options, callback) {
      return this.ensureDir(dir, options, callback);
    }
    mkdirpSync(dir, options) {
      return this.ensureDirSync(dir, options);
    }
    // ==================== ensureFile 方法 ====================
    ensureFileSync(file) {
      file = this.normalizePath(file);
      if (this.existsSync(file)) {
        const stats = this.statSync(file);
        if (!stats.isFile()) {
          const err = new Error(`EEXIST: path exists but is not a file, ensureFile '${file}'`);
          err.code = "EEXIST";
          throw err;
        }
        return;
      }
      const dir = path.dirname(file);
      this.ensureDirSync(dir);
      this.writeFileSync(file, "");
    }
    ensureFile(file, callback) {
      try {
        this.ensureFileSync(file);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // ==================== ensureLink 方法 ====================
    ensureLinkSync(src, dest) {
      src = this.normalizePath(src);
      dest = this.normalizePath(dest);
      if (this.existsSync(dest)) {
        return;
      }
      const dir = path.dirname(dest);
      this.ensureDirSync(dir);
      this.fsOri.linkSync(src, dest);
      this._setCacheEntry("existsCache", dest, true);
    }
    ensureLink(src, dest, callback) {
      try {
        this.ensureLinkSync(src, dest);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // ==================== ensureSymlink 方法 ====================
    ensureSymlinkSync(src, dest, type) {
      src = this.normalizePath(src);
      dest = this.normalizePath(dest);
      if (this.existsSync(dest)) {
        return;
      }
      const dir = path.dirname(dest);
      this.ensureDirSync(dir);
      this.fsOri.symlinkSync(src, dest, type);
      this._setCacheEntry("existsCache", dest, true);
    }
    ensureSymlink(src, dest, type, callback) {
      if (typeof type === "function") {
        callback = type;
        type = void 0;
      }
      try {
        this.ensureSymlinkSync(src, dest, type);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // ==================== emptyDir 方法 ====================
    emptyDirSync(dir) {
      dir = this.normalizePath(dir);
      if (!this.existsSync(dir)) {
        this.ensureDirSync(dir);
        return;
      }
      const items = this.fsOri.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        this.removeSync(itemPath);
      }
    }
    emptyDir(dir, callback) {
      try {
        this.emptyDirSync(dir);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // ==================== move 方法 ====================
    moveSync(src, dest, options = {}) {
      src = this.normalizePath(src);
      dest = this.normalizePath(dest);
      if (options == null) {
        options = {};
      }
      const { overwrite = true } = options;
      if (this.existsSync(dest) && !overwrite) {
        const err = new Error(`EEXIST: dest already exists, move '${src}' -> '${dest}'`);
        err.code = "EEXIST";
        throw err;
      }
      try {
        this.renameSync(src, dest);
      } catch (err) {
        if (err.code === "EXDEV") {
          this.copySync(src, dest, { overwrite });
          this.removeSync(src);
        } else {
          throw err;
        }
      }
    }
    move(src, dest, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      try {
        this.moveSync(src, dest, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // ==================== outputFile 方法 ====================
    outputFileSync(file, data, options) {
      file = this.normalizePath(file);
      const dir = path.dirname(file);
      this.ensureDirSync(dir);
      this.writeFileSync(file, data, options);
    }
    outputFile(file, data, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = void 0;
      }
      try {
        this.outputFileSync(file, data, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // ==================== JSON 方法 ====================
    readJsonSync(file, options = {}) {
      file = this.normalizePath(file);
      if (options == null) {
        options = {};
      }
      const {
        throws = true,
        encoding = "utf8",
        ...readOptions
      } = options;
      try {
        const data = this.readFileSync(file, { encoding, ...readOptions });
        return JSON.parse(data);
      } catch (err) {
        if (err instanceof SyntaxError && !throws) {
          return null;
        }
        throw err;
      }
    }
    readJson(file, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      try {
        const obj = this.readJsonSync(file, options);
        if (callback) callback(null, obj);
        return obj;
      } catch (err) {
        if (callback) callback(err);
        else throw err;
      }
    }
    // alias
    readJSONSync(file, options) {
      return this.readJsonSync(file, options);
    }
    readJSON(file, options, callback) {
      return this.readJson(file, options, callback);
    }
    writeJsonSync(file, obj, options = {}) {
      file = this.normalizePath(file);
      if (options == null) {
        options = {};
      }
      const {
        spaces,
        EOL = "\n",
        replacer,
        encoding = "utf8",
        ...writeOptions
      } = options;
      let data = JSON.stringify(obj, replacer, spaces);
      if (EOL !== "\n") {
        data = data.replace(/\n/g, EOL);
      }
      this.writeFileSync(file, data, { encoding, ...writeOptions });
    }
    writeJson(file, obj, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      try {
        this.writeJsonSync(file, obj, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // alias
    writeJSONSync(file, obj, options) {
      return this.writeJsonSync(file, obj, options);
    }
    writeJSON(file, obj, options, callback) {
      return this.writeJson(file, obj, options, callback);
    }
    outputJsonSync(file, data, options) {
      file = this.normalizePath(file);
      const dir = path.dirname(file);
      this.ensureDirSync(dir);
      this.writeJsonSync(file, data, options);
    }
    outputJson(file, data, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      try {
        this.outputJsonSync(file, data, options);
        if (callback) callback(null);
      } catch (err) {
        if (callback) callback(err);
      }
    }
    // alias
    outputJSONSync(file, data, options) {
      return this.outputJsonSync(file, data, options);
    }
    outputJSON(file, data, options, callback) {
      return this.outputJson(file, data, options, callback);
    }
    // ==================== pathExists 方法 ====================
    pathExistsSync(pathToCheck) {
      return this.existsSync(pathToCheck);
    }
    pathExists(pathToCheck, callback) {
      if (callback) {
        callback(null, this.existsSync(pathToCheck));
      } else {
        return Promise.resolve(this.existsSync(pathToCheck));
      }
    }
  }
  const proxyHandlerFsExtra = createNativeFsProxyHandler("fs-extra");
  let proxyFsExtra = new Proxy(new FakeFsExtra(), proxyHandlerFsExtra);
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("beforeunload", (ev) => {
      if (!ev.isTrusted) {
        return;
      }
      proxyFsExtra.flushWrites();
    });
  }
  return {
    proxyFs,
    proxyFsExtra,
    FakeFsSync,
    FakeFsExtra,
    FakeFsSharedCache
  };
}
module.exports = createNodeFsModules;
