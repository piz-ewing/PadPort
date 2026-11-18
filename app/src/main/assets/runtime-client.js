"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // runtime/node_modules/base64-js/index.js
  var require_base64_js = __commonJS({
    "runtime/node_modules/base64-js/index.js"(exports) {
      "use strict";
      exports.byteLength = byteLength;
      exports.toByteArray = toByteArray;
      exports.fromByteArray = fromByteArray;
      var lookup = [];
      var revLookup = [];
      var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
      var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      for (i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      }
      var i;
      var len;
      revLookup["-".charCodeAt(0)] = 62;
      revLookup["_".charCodeAt(0)] = 63;
      function getLens(b64) {
        var len2 = b64.length;
        if (len2 % 4 > 0) {
          throw new Error("Invalid string. Length must be a multiple of 4");
        }
        var validLen = b64.indexOf("=");
        if (validLen === -1) validLen = len2;
        var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
        return [validLen, placeHoldersLen];
      }
      function byteLength(b64) {
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function _byteLength(b64, validLen, placeHoldersLen) {
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function toByteArray(b64) {
        var tmp;
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
        var curByte = 0;
        var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
        var i2;
        for (i2 = 0; i2 < len2; i2 += 4) {
          tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
          arr[curByte++] = tmp >> 16 & 255;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 2) {
          tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 1) {
          tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        return arr;
      }
      function tripletToBase64(num) {
        return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
      }
      function encodeChunk(uint8, start, end) {
        var tmp;
        var output = [];
        for (var i2 = start; i2 < end; i2 += 3) {
          tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
          output.push(tripletToBase64(tmp));
        }
        return output.join("");
      }
      function fromByteArray(uint8) {
        var tmp;
        var len2 = uint8.length;
        var extraBytes = len2 % 3;
        var parts = [];
        var maxChunkLength = 16383;
        for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
          parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
        }
        if (extraBytes === 1) {
          tmp = uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
          );
        } else if (extraBytes === 2) {
          tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
          );
        }
        return parts.join("");
      }
    }
  });

  // runtime/node_modules/ieee754/index.js
  var require_ieee754 = __commonJS({
    "runtime/node_modules/ieee754/index.js"(exports) {
      /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
      exports.read = function(buffer, offset, isLE, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE ? nBytes - 1 : 0;
        var d = isLE ? -1 : 1;
        var s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        if (e === 0) {
          e = 1 - eBias;
        } else if (e === eMax) {
          return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
          m = m + Math.pow(2, mLen);
          e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      };
      exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE ? 0 : nBytes - 1;
        var d = isLE ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          if (e + eBias >= 1) {
            value += rt / c;
          } else {
            value += rt * Math.pow(2, 1 - eBias);
          }
          if (value * c >= 2) {
            e++;
            c /= 2;
          }
          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }
        for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
        }
        e = e << mLen | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
        }
        buffer[offset + i - d] |= s * 128;
      };
    }
  });

  // runtime/node_modules/buffer/index.js
  var require_buffer = __commonJS({
    "runtime/node_modules/buffer/index.js"(exports) {
      "use strict";
      /*!
       * The buffer module from node.js, for the browser.
       *
       * @author   Feross Aboukhadijeh <https://feross.org>
       * @license  MIT
       */
      var base64 = require_base64_js();
      var ieee754 = require_ieee754();
      var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
      exports.Buffer = Buffer2;
      exports.SlowBuffer = SlowBuffer;
      exports.INSPECT_MAX_BYTES = 50;
      var K_MAX_LENGTH = 2147483647;
      exports.kMaxLength = K_MAX_LENGTH;
      Buffer2.TYPED_ARRAY_SUPPORT = typedArraySupport();
      if (!Buffer2.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
        console.error(
          "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
        );
      }
      function typedArraySupport() {
        try {
          const arr = new Uint8Array(1);
          const proto = { foo: function() {
            return 42;
          } };
          Object.setPrototypeOf(proto, Uint8Array.prototype);
          Object.setPrototypeOf(arr, proto);
          return arr.foo() === 42;
        } catch (e) {
          return false;
        }
      }
      Object.defineProperty(Buffer2.prototype, "parent", {
        enumerable: true,
        get: function() {
          if (!Buffer2.isBuffer(this)) return void 0;
          return this.buffer;
        }
      });
      Object.defineProperty(Buffer2.prototype, "offset", {
        enumerable: true,
        get: function() {
          if (!Buffer2.isBuffer(this)) return void 0;
          return this.byteOffset;
        }
      });
      function createBuffer(length) {
        if (length > K_MAX_LENGTH) {
          throw new RangeError('The value "' + length + '" is invalid for option "size"');
        }
        const buf = new Uint8Array(length);
        Object.setPrototypeOf(buf, Buffer2.prototype);
        return buf;
      }
      function Buffer2(arg, encodingOrOffset, length) {
        if (typeof arg === "number") {
          if (typeof encodingOrOffset === "string") {
            throw new TypeError(
              'The "string" argument must be of type string. Received type number'
            );
          }
          return allocUnsafe(arg);
        }
        return from(arg, encodingOrOffset, length);
      }
      Buffer2.poolSize = 8192;
      function from(value, encodingOrOffset, length) {
        if (typeof value === "string") {
          return fromString(value, encodingOrOffset);
        }
        if (ArrayBuffer.isView(value)) {
          return fromArrayView(value);
        }
        if (value == null) {
          throw new TypeError(
            "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
          );
        }
        if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof value === "number") {
          throw new TypeError(
            'The "value" argument must not be of type number. Received type number'
          );
        }
        const valueOf = value.valueOf && value.valueOf();
        if (valueOf != null && valueOf !== value) {
          return Buffer2.from(valueOf, encodingOrOffset, length);
        }
        const b = fromObject(value);
        if (b) return b;
        if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
          return Buffer2.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
        }
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      Buffer2.from = function(value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length);
      };
      Object.setPrototypeOf(Buffer2.prototype, Uint8Array.prototype);
      Object.setPrototypeOf(Buffer2, Uint8Array);
      function assertSize(size) {
        if (typeof size !== "number") {
          throw new TypeError('"size" argument must be of type number');
        } else if (size < 0) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
      }
      function alloc(size, fill, encoding) {
        assertSize(size);
        if (size <= 0) {
          return createBuffer(size);
        }
        if (fill !== void 0) {
          return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
        }
        return createBuffer(size);
      }
      Buffer2.alloc = function(size, fill, encoding) {
        return alloc(size, fill, encoding);
      };
      function allocUnsafe(size) {
        assertSize(size);
        return createBuffer(size < 0 ? 0 : checked(size) | 0);
      }
      Buffer2.allocUnsafe = function(size) {
        return allocUnsafe(size);
      };
      Buffer2.allocUnsafeSlow = function(size) {
        return allocUnsafe(size);
      };
      function fromString(string, encoding) {
        if (typeof encoding !== "string" || encoding === "") {
          encoding = "utf8";
        }
        if (!Buffer2.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        const length = byteLength(string, encoding) | 0;
        let buf = createBuffer(length);
        const actual = buf.write(string, encoding);
        if (actual !== length) {
          buf = buf.slice(0, actual);
        }
        return buf;
      }
      function fromArrayLike(array) {
        const length = array.length < 0 ? 0 : checked(array.length) | 0;
        const buf = createBuffer(length);
        for (let i = 0; i < length; i += 1) {
          buf[i] = array[i] & 255;
        }
        return buf;
      }
      function fromArrayView(arrayView) {
        if (isInstance(arrayView, Uint8Array)) {
          const copy = new Uint8Array(arrayView);
          return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
        }
        return fromArrayLike(arrayView);
      }
      function fromArrayBuffer(array, byteOffset, length) {
        if (byteOffset < 0 || array.byteLength < byteOffset) {
          throw new RangeError('"offset" is outside of buffer bounds');
        }
        if (array.byteLength < byteOffset + (length || 0)) {
          throw new RangeError('"length" is outside of buffer bounds');
        }
        let buf;
        if (byteOffset === void 0 && length === void 0) {
          buf = new Uint8Array(array);
        } else if (length === void 0) {
          buf = new Uint8Array(array, byteOffset);
        } else {
          buf = new Uint8Array(array, byteOffset, length);
        }
        Object.setPrototypeOf(buf, Buffer2.prototype);
        return buf;
      }
      function fromObject(obj) {
        if (Buffer2.isBuffer(obj)) {
          const len = checked(obj.length) | 0;
          const buf = createBuffer(len);
          if (buf.length === 0) {
            return buf;
          }
          obj.copy(buf, 0, 0, len);
          return buf;
        }
        if (obj.length !== void 0) {
          if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
            return createBuffer(0);
          }
          return fromArrayLike(obj);
        }
        if (obj.type === "Buffer" && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data);
        }
      }
      function checked(length) {
        if (length >= K_MAX_LENGTH) {
          throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
        }
        return length | 0;
      }
      function SlowBuffer(length) {
        if (+length != length) {
          length = 0;
        }
        return Buffer2.alloc(+length);
      }
      Buffer2.isBuffer = function isBuffer(b) {
        return b != null && b._isBuffer === true && b !== Buffer2.prototype;
      };
      Buffer2.compare = function compare(a, b) {
        if (isInstance(a, Uint8Array)) a = Buffer2.from(a, a.offset, a.byteLength);
        if (isInstance(b, Uint8Array)) b = Buffer2.from(b, b.offset, b.byteLength);
        if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
          throw new TypeError(
            'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
          );
        }
        if (a === b) return 0;
        let x = a.length;
        let y = b.length;
        for (let i = 0, len = Math.min(x, y); i < len; ++i) {
          if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      Buffer2.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "latin1":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return true;
          default:
            return false;
        }
      };
      Buffer2.concat = function concat(list, length) {
        if (!Array.isArray(list)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        }
        if (list.length === 0) {
          return Buffer2.alloc(0);
        }
        let i;
        if (length === void 0) {
          length = 0;
          for (i = 0; i < list.length; ++i) {
            length += list[i].length;
          }
        }
        const buffer = Buffer2.allocUnsafe(length);
        let pos = 0;
        for (i = 0; i < list.length; ++i) {
          let buf = list[i];
          if (isInstance(buf, Uint8Array)) {
            if (pos + buf.length > buffer.length) {
              if (!Buffer2.isBuffer(buf)) buf = Buffer2.from(buf);
              buf.copy(buffer, pos);
            } else {
              Uint8Array.prototype.set.call(
                buffer,
                buf,
                pos
              );
            }
          } else if (!Buffer2.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
          } else {
            buf.copy(buffer, pos);
          }
          pos += buf.length;
        }
        return buffer;
      };
      function byteLength(string, encoding) {
        if (Buffer2.isBuffer(string)) {
          return string.length;
        }
        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
          return string.byteLength;
        }
        if (typeof string !== "string") {
          throw new TypeError(
            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
          );
        }
        const len = string.length;
        const mustMatch = arguments.length > 2 && arguments[2] === true;
        if (!mustMatch && len === 0) return 0;
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "ascii":
            case "latin1":
            case "binary":
              return len;
            case "utf8":
            case "utf-8":
              return utf8ToBytes(string).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return len * 2;
            case "hex":
              return len >>> 1;
            case "base64":
              return base64ToBytes(string).length;
            default:
              if (loweredCase) {
                return mustMatch ? -1 : utf8ToBytes(string).length;
              }
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer2.byteLength = byteLength;
      function slowToString(encoding, start, end) {
        let loweredCase = false;
        if (start === void 0 || start < 0) {
          start = 0;
        }
        if (start > this.length) {
          return "";
        }
        if (end === void 0 || end > this.length) {
          end = this.length;
        }
        if (end <= 0) {
          return "";
        }
        end >>>= 0;
        start >>>= 0;
        if (end <= start) {
          return "";
        }
        if (!encoding) encoding = "utf8";
        while (true) {
          switch (encoding) {
            case "hex":
              return hexSlice(this, start, end);
            case "utf8":
            case "utf-8":
              return utf8Slice(this, start, end);
            case "ascii":
              return asciiSlice(this, start, end);
            case "latin1":
            case "binary":
              return latin1Slice(this, start, end);
            case "base64":
              return base64Slice(this, start, end);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return utf16leSlice(this, start, end);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = (encoding + "").toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer2.prototype._isBuffer = true;
      function swap(b, n, m) {
        const i = b[n];
        b[n] = b[m];
        b[m] = i;
      }
      Buffer2.prototype.swap16 = function swap16() {
        const len = this.length;
        if (len % 2 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 16-bits");
        }
        for (let i = 0; i < len; i += 2) {
          swap(this, i, i + 1);
        }
        return this;
      };
      Buffer2.prototype.swap32 = function swap32() {
        const len = this.length;
        if (len % 4 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 32-bits");
        }
        for (let i = 0; i < len; i += 4) {
          swap(this, i, i + 3);
          swap(this, i + 1, i + 2);
        }
        return this;
      };
      Buffer2.prototype.swap64 = function swap64() {
        const len = this.length;
        if (len % 8 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 64-bits");
        }
        for (let i = 0; i < len; i += 8) {
          swap(this, i, i + 7);
          swap(this, i + 1, i + 6);
          swap(this, i + 2, i + 5);
          swap(this, i + 3, i + 4);
        }
        return this;
      };
      Buffer2.prototype.toString = function toString() {
        const length = this.length;
        if (length === 0) return "";
        if (arguments.length === 0) return utf8Slice(this, 0, length);
        return slowToString.apply(this, arguments);
      };
      Buffer2.prototype.toLocaleString = Buffer2.prototype.toString;
      Buffer2.prototype.equals = function equals(b) {
        if (!Buffer2.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        if (this === b) return true;
        return Buffer2.compare(this, b) === 0;
      };
      Buffer2.prototype.inspect = function inspect() {
        let str = "";
        const max = exports.INSPECT_MAX_BYTES;
        str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
        if (this.length > max) str += " ... ";
        return "<Buffer " + str + ">";
      };
      if (customInspectSymbol) {
        Buffer2.prototype[customInspectSymbol] = Buffer2.prototype.inspect;
      }
      Buffer2.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array)) {
          target = Buffer2.from(target, target.offset, target.byteLength);
        }
        if (!Buffer2.isBuffer(target)) {
          throw new TypeError(
            'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
          );
        }
        if (start === void 0) {
          start = 0;
        }
        if (end === void 0) {
          end = target ? target.length : 0;
        }
        if (thisStart === void 0) {
          thisStart = 0;
        }
        if (thisEnd === void 0) {
          thisEnd = this.length;
        }
        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
          throw new RangeError("out of range index");
        }
        if (thisStart >= thisEnd && start >= end) {
          return 0;
        }
        if (thisStart >= thisEnd) {
          return -1;
        }
        if (start >= end) {
          return 1;
        }
        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;
        if (this === target) return 0;
        let x = thisEnd - thisStart;
        let y = end - start;
        const len = Math.min(x, y);
        const thisCopy = this.slice(thisStart, thisEnd);
        const targetCopy = target.slice(start, end);
        for (let i = 0; i < len; ++i) {
          if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        if (buffer.length === 0) return -1;
        if (typeof byteOffset === "string") {
          encoding = byteOffset;
          byteOffset = 0;
        } else if (byteOffset > 2147483647) {
          byteOffset = 2147483647;
        } else if (byteOffset < -2147483648) {
          byteOffset = -2147483648;
        }
        byteOffset = +byteOffset;
        if (numberIsNaN(byteOffset)) {
          byteOffset = dir ? 0 : buffer.length - 1;
        }
        if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
        if (byteOffset >= buffer.length) {
          if (dir) return -1;
          else byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
          if (dir) byteOffset = 0;
          else return -1;
        }
        if (typeof val === "string") {
          val = Buffer2.from(val, encoding);
        }
        if (Buffer2.isBuffer(val)) {
          if (val.length === 0) {
            return -1;
          }
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        } else if (typeof val === "number") {
          val = val & 255;
          if (typeof Uint8Array.prototype.indexOf === "function") {
            if (dir) {
              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            } else {
              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
          }
          return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
        }
        throw new TypeError("val must be string, number or Buffer");
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        let indexSize = 1;
        let arrLength = arr.length;
        let valLength = val.length;
        if (encoding !== void 0) {
          encoding = String(encoding).toLowerCase();
          if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
            if (arr.length < 2 || val.length < 2) {
              return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
          }
        }
        function read(buf, i2) {
          if (indexSize === 1) {
            return buf[i2];
          } else {
            return buf.readUInt16BE(i2 * indexSize);
          }
        }
        let i;
        if (dir) {
          let foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) {
            if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
              if (foundIndex === -1) foundIndex = i;
              if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
            } else {
              if (foundIndex !== -1) i -= i - foundIndex;
              foundIndex = -1;
            }
          }
        } else {
          if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
          for (i = byteOffset; i >= 0; i--) {
            let found = true;
            for (let j = 0; j < valLength; j++) {
              if (read(arr, i + j) !== read(val, j)) {
                found = false;
                break;
              }
            }
            if (found) return i;
          }
        }
        return -1;
      }
      Buffer2.prototype.includes = function includes(val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1;
      };
      Buffer2.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer2.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        const remaining = buf.length - offset;
        if (!length) {
          length = remaining;
        } else {
          length = Number(length);
          if (length > remaining) {
            length = remaining;
          }
        }
        const strLen = string.length;
        if (length > strLen / 2) {
          length = strLen / 2;
        }
        let i;
        for (i = 0; i < length; ++i) {
          const parsed = parseInt(string.substr(i * 2, 2), 16);
          if (numberIsNaN(parsed)) return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
      }
      function asciiWrite(buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length);
      }
      function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
      }
      function ucs2Write(buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
      }
      Buffer2.prototype.write = function write(string, offset, length, encoding) {
        if (offset === void 0) {
          encoding = "utf8";
          length = this.length;
          offset = 0;
        } else if (length === void 0 && typeof offset === "string") {
          encoding = offset;
          length = this.length;
          offset = 0;
        } else if (isFinite(offset)) {
          offset = offset >>> 0;
          if (isFinite(length)) {
            length = length >>> 0;
            if (encoding === void 0) encoding = "utf8";
          } else {
            encoding = length;
            length = void 0;
          }
        } else {
          throw new Error(
            "Buffer.write(string, encoding, offset[, length]) is no longer supported"
          );
        }
        const remaining = this.length - offset;
        if (length === void 0 || length > remaining) length = remaining;
        if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
          throw new RangeError("Attempt to write outside buffer bounds");
        }
        if (!encoding) encoding = "utf8";
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "hex":
              return hexWrite(this, string, offset, length);
            case "utf8":
            case "utf-8":
              return utf8Write(this, string, offset, length);
            case "ascii":
            case "latin1":
            case "binary":
              return asciiWrite(this, string, offset, length);
            case "base64":
              return base64Write(this, string, offset, length);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return ucs2Write(this, string, offset, length);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      };
      Buffer2.prototype.toJSON = function toJSON() {
        return {
          type: "Buffer",
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      function base64Slice(buf, start, end) {
        if (start === 0 && end === buf.length) {
          return base64.fromByteArray(buf);
        } else {
          return base64.fromByteArray(buf.slice(start, end));
        }
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        const res = [];
        let i = start;
        while (i < end) {
          const firstByte = buf[i];
          let codePoint = null;
          let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
          if (i + bytesPerSequence <= end) {
            let secondByte, thirdByte, fourthByte, tempCodePoint;
            switch (bytesPerSequence) {
              case 1:
                if (firstByte < 128) {
                  codePoint = firstByte;
                }
                break;
              case 2:
                secondByte = buf[i + 1];
                if ((secondByte & 192) === 128) {
                  tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                  if (tempCodePoint > 127) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 3:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                  if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 4:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                fourthByte = buf[i + 3];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                  if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                    codePoint = tempCodePoint;
                  }
                }
            }
          }
          if (codePoint === null) {
            codePoint = 65533;
            bytesPerSequence = 1;
          } else if (codePoint > 65535) {
            codePoint -= 65536;
            res.push(codePoint >>> 10 & 1023 | 55296);
            codePoint = 56320 | codePoint & 1023;
          }
          res.push(codePoint);
          i += bytesPerSequence;
        }
        return decodeCodePointsArray(res);
      }
      var MAX_ARGUMENTS_LENGTH = 4096;
      function decodeCodePointsArray(codePoints) {
        const len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) {
          return String.fromCharCode.apply(String, codePoints);
        }
        let res = "";
        let i = 0;
        while (i < len) {
          res += String.fromCharCode.apply(
            String,
            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
          );
        }
        return res;
      }
      function asciiSlice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i] & 127);
        }
        return ret;
      }
      function latin1Slice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i]);
        }
        return ret;
      }
      function hexSlice(buf, start, end) {
        const len = buf.length;
        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;
        let out = "";
        for (let i = start; i < end; ++i) {
          out += hexSliceLookupTable[buf[i]];
        }
        return out;
      }
      function utf16leSlice(buf, start, end) {
        const bytes = buf.slice(start, end);
        let res = "";
        for (let i = 0; i < bytes.length - 1; i += 2) {
          res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
        }
        return res;
      }
      Buffer2.prototype.slice = function slice(start, end) {
        const len = this.length;
        start = ~~start;
        end = end === void 0 ? len : ~~end;
        if (start < 0) {
          start += len;
          if (start < 0) start = 0;
        } else if (start > len) {
          start = len;
        }
        if (end < 0) {
          end += len;
          if (end < 0) end = 0;
        } else if (end > len) {
          end = len;
        }
        if (end < start) end = start;
        const newBuf = this.subarray(start, end);
        Object.setPrototypeOf(newBuf, Buffer2.prototype);
        return newBuf;
      };
      function checkOffset(offset, ext, length) {
        if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
      }
      Buffer2.prototype.readUintLE = Buffer2.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        return val;
      };
      Buffer2.prototype.readUintBE = Buffer2.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          checkOffset(offset, byteLength2, this.length);
        }
        let val = this[offset + --byteLength2];
        let mul = 1;
        while (byteLength2 > 0 && (mul *= 256)) {
          val += this[offset + --byteLength2] * mul;
        }
        return val;
      };
      Buffer2.prototype.readUint8 = Buffer2.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        return this[offset];
      };
      Buffer2.prototype.readUint16LE = Buffer2.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] | this[offset + 1] << 8;
      };
      Buffer2.prototype.readUint16BE = Buffer2.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] << 8 | this[offset + 1];
      };
      Buffer2.prototype.readUint32LE = Buffer2.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
      };
      Buffer2.prototype.readUint32BE = Buffer2.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      };
      Buffer2.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
        const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
        return BigInt(lo) + (BigInt(hi) << BigInt(32));
      });
      Buffer2.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
        return (BigInt(hi) << BigInt(32)) + BigInt(lo);
      });
      Buffer2.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer2.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let i = byteLength2;
        let mul = 1;
        let val = this[offset + --i];
        while (i > 0 && (mul *= 256)) {
          val += this[offset + --i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer2.prototype.readInt8 = function readInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        if (!(this[offset] & 128)) return this[offset];
        return (255 - this[offset] + 1) * -1;
      };
      Buffer2.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset] | this[offset + 1] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer2.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset + 1] | this[offset] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer2.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
      };
      Buffer2.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      };
      Buffer2.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
        return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
      });
      Buffer2.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = (first << 24) + // Overflow
        this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
      });
      Buffer2.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, true, 23, 4);
      };
      Buffer2.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, false, 23, 4);
      };
      Buffer2.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, true, 52, 8);
      };
      Buffer2.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, false, 52, 8);
      };
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer2.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
      }
      Buffer2.prototype.writeUintLE = Buffer2.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let mul = 1;
        let i = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer2.prototype.writeUintBE = Buffer2.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer2.prototype.writeUint8 = Buffer2.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer2.prototype.writeUint16LE = Buffer2.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer2.prototype.writeUint16BE = Buffer2.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer2.prototype.writeUint32LE = Buffer2.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset + 3] = value >>> 24;
        this[offset + 2] = value >>> 16;
        this[offset + 1] = value >>> 8;
        this[offset] = value & 255;
        return offset + 4;
      };
      Buffer2.prototype.writeUint32BE = Buffer2.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      function wrtBigUInt64LE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        return offset;
      }
      function wrtBigUInt64BE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset + 7] = lo;
        lo = lo >> 8;
        buf[offset + 6] = lo;
        lo = lo >> 8;
        buf[offset + 5] = lo;
        lo = lo >> 8;
        buf[offset + 4] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset + 3] = hi;
        hi = hi >> 8;
        buf[offset + 2] = hi;
        hi = hi >> 8;
        buf[offset + 1] = hi;
        hi = hi >> 8;
        buf[offset] = hi;
        return offset + 8;
      }
      Buffer2.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer2.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer2.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = 0;
        let mul = 1;
        let sub = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer2.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        let sub = 0;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer2.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
        if (value < 0) value = 255 + value + 1;
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer2.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer2.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer2.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        this[offset + 2] = value >>> 16;
        this[offset + 3] = value >>> 24;
        return offset + 4;
      };
      Buffer2.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        if (value < 0) value = 4294967295 + value + 1;
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      Buffer2.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      Buffer2.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
        }
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
      }
      Buffer2.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer2.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
      };
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
        }
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
      }
      Buffer2.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer2.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
      };
      Buffer2.prototype.copy = function copy(target, targetStart, start, end) {
        if (!Buffer2.isBuffer(target)) throw new TypeError("argument should be a Buffer");
        if (!start) start = 0;
        if (!end && end !== 0) end = this.length;
        if (targetStart >= target.length) targetStart = target.length;
        if (!targetStart) targetStart = 0;
        if (end > 0 && end < start) end = start;
        if (end === start) return 0;
        if (target.length === 0 || this.length === 0) return 0;
        if (targetStart < 0) {
          throw new RangeError("targetStart out of bounds");
        }
        if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");
        if (end > this.length) end = this.length;
        if (target.length - targetStart < end - start) {
          end = target.length - targetStart + start;
        }
        const len = end - start;
        if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
          this.copyWithin(targetStart, start, end);
        } else {
          Uint8Array.prototype.set.call(
            target,
            this.subarray(start, end),
            targetStart
          );
        }
        return len;
      };
      Buffer2.prototype.fill = function fill(val, start, end, encoding) {
        if (typeof val === "string") {
          if (typeof start === "string") {
            encoding = start;
            start = 0;
            end = this.length;
          } else if (typeof end === "string") {
            encoding = end;
            end = this.length;
          }
          if (encoding !== void 0 && typeof encoding !== "string") {
            throw new TypeError("encoding must be a string");
          }
          if (typeof encoding === "string" && !Buffer2.isEncoding(encoding)) {
            throw new TypeError("Unknown encoding: " + encoding);
          }
          if (val.length === 1) {
            const code = val.charCodeAt(0);
            if (encoding === "utf8" && code < 128 || encoding === "latin1") {
              val = code;
            }
          }
        } else if (typeof val === "number") {
          val = val & 255;
        } else if (typeof val === "boolean") {
          val = Number(val);
        }
        if (start < 0 || this.length < start || this.length < end) {
          throw new RangeError("Out of range index");
        }
        if (end <= start) {
          return this;
        }
        start = start >>> 0;
        end = end === void 0 ? this.length : end >>> 0;
        if (!val) val = 0;
        let i;
        if (typeof val === "number") {
          for (i = start; i < end; ++i) {
            this[i] = val;
          }
        } else {
          const bytes = Buffer2.isBuffer(val) ? val : Buffer2.from(val, encoding);
          const len = bytes.length;
          if (len === 0) {
            throw new TypeError('The value "' + val + '" is invalid for argument "value"');
          }
          for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len];
          }
        }
        return this;
      };
      var errors = {};
      function E(sym, getMessage, Base) {
        errors[sym] = class NodeError extends Base {
          constructor() {
            super();
            Object.defineProperty(this, "message", {
              value: getMessage.apply(this, arguments),
              writable: true,
              configurable: true
            });
            this.name = `${this.name} [${sym}]`;
            this.stack;
            delete this.name;
          }
          get code() {
            return sym;
          }
          set code(value) {
            Object.defineProperty(this, "code", {
              configurable: true,
              enumerable: true,
              value,
              writable: true
            });
          }
          toString() {
            return `${this.name} [${sym}]: ${this.message}`;
          }
        };
      }
      E(
        "ERR_BUFFER_OUT_OF_BOUNDS",
        function(name) {
          if (name) {
            return `${name} is outside of buffer bounds`;
          }
          return "Attempt to access memory outside buffer bounds";
        },
        RangeError
      );
      E(
        "ERR_INVALID_ARG_TYPE",
        function(name, actual) {
          return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
        },
        TypeError
      );
      E(
        "ERR_OUT_OF_RANGE",
        function(str, range, input) {
          let msg = `The value of "${str}" is out of range.`;
          let received = input;
          if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
          } else if (typeof input === "bigint") {
            received = String(input);
            if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
              received = addNumericalSeparator(received);
            }
            received += "n";
          }
          msg += ` It must be ${range}. Received ${received}`;
          return msg;
        },
        RangeError
      );
      function addNumericalSeparator(val) {
        let res = "";
        let i = val.length;
        const start = val[0] === "-" ? 1 : 0;
        for (; i >= start + 4; i -= 3) {
          res = `_${val.slice(i - 3, i)}${res}`;
        }
        return `${val.slice(0, i)}${res}`;
      }
      function checkBounds(buf, offset, byteLength2) {
        validateNumber(offset, "offset");
        if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
          boundsError(offset, buf.length - (byteLength2 + 1));
        }
      }
      function checkIntBI(value, min, max, buf, offset, byteLength2) {
        if (value > max || value < min) {
          const n = typeof min === "bigint" ? "n" : "";
          let range;
          if (byteLength2 > 3) {
            if (min === 0 || min === BigInt(0)) {
              range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
            } else {
              range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
            }
          } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
          }
          throw new errors.ERR_OUT_OF_RANGE("value", range, value);
        }
        checkBounds(buf, offset, byteLength2);
      }
      function validateNumber(value, name) {
        if (typeof value !== "number") {
          throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
        }
      }
      function boundsError(value, length, type) {
        if (Math.floor(value) !== value) {
          validateNumber(value, type);
          throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
        }
        if (length < 0) {
          throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
        }
        throw new errors.ERR_OUT_OF_RANGE(
          type || "offset",
          `>= ${type ? 1 : 0} and <= ${length}`,
          value
        );
      }
      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
      function base64clean(str) {
        str = str.split("=")[0];
        str = str.trim().replace(INVALID_BASE64_RE, "");
        if (str.length < 2) return "";
        while (str.length % 4 !== 0) {
          str = str + "=";
        }
        return str;
      }
      function utf8ToBytes(string, units) {
        units = units || Infinity;
        let codePoint;
        const length = string.length;
        let leadSurrogate = null;
        const bytes = [];
        for (let i = 0; i < length; ++i) {
          codePoint = string.charCodeAt(i);
          if (codePoint > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
              if (codePoint > 56319) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              } else if (i + 1 === length) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              }
              leadSurrogate = codePoint;
              continue;
            }
            if (codePoint < 56320) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              leadSurrogate = codePoint;
              continue;
            }
            codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
          } else if (leadSurrogate) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
          }
          leadSurrogate = null;
          if (codePoint < 128) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
          } else if (codePoint < 2048) {
            if ((units -= 2) < 0) break;
            bytes.push(
              codePoint >> 6 | 192,
              codePoint & 63 | 128
            );
          } else if (codePoint < 65536) {
            if ((units -= 3) < 0) break;
            bytes.push(
              codePoint >> 12 | 224,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else if (codePoint < 1114112) {
            if ((units -= 4) < 0) break;
            bytes.push(
              codePoint >> 18 | 240,
              codePoint >> 12 & 63 | 128,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else {
            throw new Error("Invalid code point");
          }
        }
        return bytes;
      }
      function asciiToBytes(str) {
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          byteArray.push(str.charCodeAt(i) & 255);
        }
        return byteArray;
      }
      function utf16leToBytes(str, units) {
        let c, hi, lo;
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0) break;
          c = str.charCodeAt(i);
          hi = c >> 8;
          lo = c % 256;
          byteArray.push(lo);
          byteArray.push(hi);
        }
        return byteArray;
      }
      function base64ToBytes(str) {
        return base64.toByteArray(base64clean(str));
      }
      function blitBuffer(src, dst, offset, length) {
        let i;
        for (i = 0; i < length; ++i) {
          if (i + offset >= dst.length || i >= src.length) break;
          dst[i + offset] = src[i];
        }
        return i;
      }
      function isInstance(obj, type) {
        return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
      }
      function numberIsNaN(obj) {
        return obj !== obj;
      }
      var hexSliceLookupTable = function() {
        const alphabet = "0123456789abcdef";
        const table = new Array(256);
        for (let i = 0; i < 16; ++i) {
          const i16 = i * 16;
          for (let j = 0; j < 16; ++j) {
            table[i16 + j] = alphabet[i] + alphabet[j];
          }
        }
        return table;
      }();
      function defineBigIntMethod(fn) {
        return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
      }
      function BufferBigIntNotDefined() {
        throw new Error("BigInt not supported");
      }
    }
  });

  // runtime/node_modules/events/events.js
  var require_events = __commonJS({
    "runtime/node_modules/events/events.js"(exports, module) {
      "use strict";
      var R = typeof Reflect === "object" ? Reflect : null;
      var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
      var ReflectOwnKeys;
      if (R && typeof R.ownKeys === "function") {
        ReflectOwnKeys = R.ownKeys;
      } else if (Object.getOwnPropertySymbols) {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
        };
      } else {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target);
        };
      }
      function ProcessEmitWarning(warning) {
        if (console && console.warn) console.warn(warning);
      }
      var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
        return value !== value;
      };
      function EventEmitter() {
        EventEmitter.init.call(this);
      }
      module.exports = EventEmitter;
      module.exports.once = once;
      EventEmitter.EventEmitter = EventEmitter;
      EventEmitter.prototype._events = void 0;
      EventEmitter.prototype._eventsCount = 0;
      EventEmitter.prototype._maxListeners = void 0;
      var defaultMaxListeners = 10;
      function checkListener(listener) {
        if (typeof listener !== "function") {
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
        }
      }
      Object.defineProperty(EventEmitter, "defaultMaxListeners", {
        enumerable: true,
        get: function() {
          return defaultMaxListeners;
        },
        set: function(arg) {
          if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
          }
          defaultMaxListeners = arg;
        }
      });
      EventEmitter.init = function() {
        if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        }
        this._maxListeners = this._maxListeners || void 0;
      };
      EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
        if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
        }
        this._maxListeners = n;
        return this;
      };
      function _getMaxListeners(that) {
        if (that._maxListeners === void 0)
          return EventEmitter.defaultMaxListeners;
        return that._maxListeners;
      }
      EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
        return _getMaxListeners(this);
      };
      EventEmitter.prototype.emit = function emit(type) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var doError = type === "error";
        var events = this._events;
        if (events !== void 0)
          doError = doError && events.error === void 0;
        else if (!doError)
          return false;
        if (doError) {
          var er;
          if (args.length > 0)
            er = args[0];
          if (er instanceof Error) {
            throw er;
          }
          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
          err.context = er;
          throw err;
        }
        var handler = events[type];
        if (handler === void 0)
          return false;
        if (typeof handler === "function") {
          ReflectApply(handler, this, args);
        } else {
          var len = handler.length;
          var listeners = arrayClone(handler, len);
          for (var i = 0; i < len; ++i)
            ReflectApply(listeners[i], this, args);
        }
        return true;
      };
      function _addListener(target, type, listener, prepend) {
        var m;
        var events;
        var existing;
        checkListener(listener);
        events = target._events;
        if (events === void 0) {
          events = target._events = /* @__PURE__ */ Object.create(null);
          target._eventsCount = 0;
        } else {
          if (events.newListener !== void 0) {
            target.emit(
              "newListener",
              type,
              listener.listener ? listener.listener : listener
            );
            events = target._events;
          }
          existing = events[type];
        }
        if (existing === void 0) {
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === "function") {
            existing = events[type] = prepend ? [listener, existing] : [existing, listener];
          } else if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
          m = _getMaxListeners(target);
          if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            w.name = "MaxListenersExceededWarning";
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
          }
        }
        return target;
      }
      EventEmitter.prototype.addListener = function addListener(type, listener) {
        return _addListener(this, type, listener, false);
      };
      EventEmitter.prototype.on = EventEmitter.prototype.addListener;
      EventEmitter.prototype.prependListener = function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
      function onceWrapper() {
        if (!this.fired) {
          this.target.removeListener(this.type, this.wrapFn);
          this.fired = true;
          if (arguments.length === 0)
            return this.listener.call(this.target);
          return this.listener.apply(this.target, arguments);
        }
      }
      function _onceWrap(target, type, listener) {
        var state = { fired: false, wrapFn: void 0, target, type, listener };
        var wrapped = onceWrapper.bind(state);
        wrapped.listener = listener;
        state.wrapFn = wrapped;
        return wrapped;
      }
      EventEmitter.prototype.once = function once2(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.removeListener = function removeListener(type, listener) {
        var list, events, position, i, originalListener;
        checkListener(listener);
        events = this._events;
        if (events === void 0)
          return this;
        list = events[type];
        if (list === void 0)
          return this;
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit("removeListener", type, list.listener || listener);
          }
        } else if (typeof list !== "function") {
          position = -1;
          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }
          if (position < 0)
            return this;
          if (position === 0)
            list.shift();
          else {
            spliceOne(list, position);
          }
          if (list.length === 1)
            events[type] = list[0];
          if (events.removeListener !== void 0)
            this.emit("removeListener", type, originalListener || listener);
        }
        return this;
      };
      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
      EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
        var listeners, events, i;
        events = this._events;
        if (events === void 0)
          return this;
        if (events.removeListener === void 0) {
          if (arguments.length === 0) {
            this._events = /* @__PURE__ */ Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== void 0) {
            if (--this._eventsCount === 0)
              this._events = /* @__PURE__ */ Object.create(null);
            else
              delete events[type];
          }
          return this;
        }
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === "removeListener") continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners("removeListener");
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
          return this;
        }
        listeners = events[type];
        if (typeof listeners === "function") {
          this.removeListener(type, listeners);
        } else if (listeners !== void 0) {
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }
        return this;
      };
      function _listeners(target, type, unwrap) {
        var events = target._events;
        if (events === void 0)
          return [];
        var evlistener = events[type];
        if (evlistener === void 0)
          return [];
        if (typeof evlistener === "function")
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];
        return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
      }
      EventEmitter.prototype.listeners = function listeners(type) {
        return _listeners(this, type, true);
      };
      EventEmitter.prototype.rawListeners = function rawListeners(type) {
        return _listeners(this, type, false);
      };
      EventEmitter.listenerCount = function(emitter, type) {
        if (typeof emitter.listenerCount === "function") {
          return emitter.listenerCount(type);
        } else {
          return listenerCount.call(emitter, type);
        }
      };
      EventEmitter.prototype.listenerCount = listenerCount;
      function listenerCount(type) {
        var events = this._events;
        if (events !== void 0) {
          var evlistener = events[type];
          if (typeof evlistener === "function") {
            return 1;
          } else if (evlistener !== void 0) {
            return evlistener.length;
          }
        }
        return 0;
      }
      EventEmitter.prototype.eventNames = function eventNames() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };
      function arrayClone(arr, n) {
        var copy = new Array(n);
        for (var i = 0; i < n; ++i)
          copy[i] = arr[i];
        return copy;
      }
      function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
          list[index] = list[index + 1];
        list.pop();
      }
      function unwrapListeners(arr) {
        var ret = new Array(arr.length);
        for (var i = 0; i < ret.length; ++i) {
          ret[i] = arr[i].listener || arr[i];
        }
        return ret;
      }
      function once(emitter, name) {
        return new Promise(function(resolve, reject) {
          function errorListener(err) {
            emitter.removeListener(name, resolver);
            reject(err);
          }
          function resolver() {
            if (typeof emitter.removeListener === "function") {
              emitter.removeListener("error", errorListener);
            }
            resolve([].slice.call(arguments));
          }
          ;
          eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
          if (name !== "error") {
            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
          }
        });
      }
      function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
        if (typeof emitter.on === "function") {
          eventTargetAgnosticAddListener(emitter, "error", handler, flags);
        }
      }
      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
        if (typeof emitter.on === "function") {
          if (flags.once) {
            emitter.once(name, listener);
          } else {
            emitter.on(name, listener);
          }
        } else if (typeof emitter.addEventListener === "function") {
          emitter.addEventListener(name, function wrapListener(arg) {
            if (flags.once) {
              emitter.removeEventListener(name, wrapListener);
            }
            listener(arg);
          });
        } else {
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
        }
      }
    }
  });

  // runtime/node_modules/process/browser.js
  var require_browser = __commonJS({
    "runtime/node_modules/process/browser.js"(exports, module) {
      var process2 = module.exports = {};
      var cachedSetTimeout;
      var cachedClearTimeout;
      function defaultSetTimout() {
        throw new Error("setTimeout has not been defined");
      }
      function defaultClearTimeout() {
        throw new Error("clearTimeout has not been defined");
      }
      (function() {
        try {
          if (typeof setTimeout === "function") {
            cachedSetTimeout = setTimeout;
          } else {
            cachedSetTimeout = defaultSetTimout;
          }
        } catch (e) {
          cachedSetTimeout = defaultSetTimout;
        }
        try {
          if (typeof clearTimeout === "function") {
            cachedClearTimeout = clearTimeout;
          } else {
            cachedClearTimeout = defaultClearTimeout;
          }
        } catch (e) {
          cachedClearTimeout = defaultClearTimeout;
        }
      })();
      function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
          return setTimeout(fun, 0);
        }
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
        }
        try {
          return cachedSetTimeout(fun, 0);
        } catch (e) {
          try {
            return cachedSetTimeout.call(null, fun, 0);
          } catch (e2) {
            return cachedSetTimeout.call(this, fun, 0);
          }
        }
      }
      function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
          return clearTimeout(marker);
        }
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
        }
        try {
          return cachedClearTimeout(marker);
        } catch (e) {
          try {
            return cachedClearTimeout.call(null, marker);
          } catch (e2) {
            return cachedClearTimeout.call(this, marker);
          }
        }
      }
      var queue = [];
      var draining = false;
      var currentQueue;
      var queueIndex = -1;
      function cleanUpNextTick() {
        if (!draining || !currentQueue) {
          return;
        }
        draining = false;
        if (currentQueue.length) {
          queue = currentQueue.concat(queue);
        } else {
          queueIndex = -1;
        }
        if (queue.length) {
          drainQueue();
        }
      }
      function drainQueue() {
        if (draining) {
          return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;
        var len = queue.length;
        while (len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
            if (currentQueue) {
              currentQueue[queueIndex].run();
            }
          }
          queueIndex = -1;
          len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
      }
      process2.nextTick = function(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
          }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
        }
      };
      function Item(fun, array) {
        this.fun = fun;
        this.array = array;
      }
      Item.prototype.run = function() {
        this.fun.apply(null, this.array);
      };
      process2.title = "browser";
      process2.browser = true;
      process2.env = {};
      process2.argv = [];
      process2.version = "";
      process2.versions = {};
      function noop() {
      }
      process2.on = noop;
      process2.addListener = noop;
      process2.once = noop;
      process2.off = noop;
      process2.removeListener = noop;
      process2.removeAllListeners = noop;
      process2.emit = noop;
      process2.prependListener = noop;
      process2.prependOnceListener = noop;
      process2.listeners = function(name) {
        return [];
      };
      process2.binding = function(name) {
        throw new Error("process.binding is not supported");
      };
      process2.cwd = function() {
        return "/";
      };
      process2.chdir = function(dir) {
        throw new Error("process.chdir is not supported");
      };
      process2.umask = function() {
        return 0;
      };
    }
  });

  // runtime/build/path.cjs
  var require_path = __commonJS({
    "runtime/build/path.cjs"(exports, module) {
      "use strict";
      var uncurry = (fn) => Function.call.bind(fn);
      var primordials = { FunctionPrototypeBind: uncurry(Function.prototype.bind) };
      for (const name of ["charCodeAt", "indexOf", "lastIndexOf", "replace", "slice", "toLowerCase"])
        primordials["StringPrototype" + name[0].toUpperCase() + name.slice(1)] = uncurry(String.prototype[name]);
      function invalid(name, expected) {
        return Object.assign(new TypeError('The "' + name + '" argument must be of type ' + expected), { code: "ERR_INVALID_ARG_TYPE" });
      }
      var constants = {};
      for (const [name, char] of Object.entries({
        UPPERCASE_A: "A",
        LOWERCASE_A: "a",
        UPPERCASE_Z: "Z",
        LOWERCASE_Z: "z",
        DOT: ".",
        FORWARD_SLASH: "/",
        BACKWARD_SLASH: String.fromCharCode(92),
        COLON: ":",
        QUESTION_MARK: "?"
      }))
        constants["CHAR_" + name] = char.charCodeAt(0);
      var validators = {
        validateString(value, name) {
          if (typeof value !== "string") throw invalid(name, "string");
        },
        validateObject(value, name) {
          if (value === null || typeof value !== "object" || Array.isArray(value)) throw invalid(name, "object");
        }
      };
      module.exports = function createPath(process2) {
        const module2 = { exports: {} };
        runPath(module2, (name) => {
          if (name === "internal/constants") return constants;
          if (name === "internal/validators") return validators;
          throw new Error("Unknown path dependency: " + name);
        }, primordials, process2);
        return module2.exports;
      };
      function runPath(module2, require2, primordials2, process2) {
        "use strict";
        const {
          FunctionPrototypeBind,
          StringPrototypeCharCodeAt,
          StringPrototypeIndexOf,
          StringPrototypeLastIndexOf,
          StringPrototypeReplace,
          StringPrototypeSlice,
          StringPrototypeToLowerCase
        } = primordials2;
        const {
          CHAR_UPPERCASE_A,
          CHAR_LOWERCASE_A,
          CHAR_UPPERCASE_Z,
          CHAR_LOWERCASE_Z,
          CHAR_DOT,
          CHAR_FORWARD_SLASH,
          CHAR_BACKWARD_SLASH,
          CHAR_COLON,
          CHAR_QUESTION_MARK
        } = require2("internal/constants");
        const {
          validateObject,
          validateString
        } = require2("internal/validators");
        const platformIsWin32 = process2.platform === "win32";
        function isPathSeparator(code) {
          return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
        }
        function isPosixPathSeparator(code) {
          return code === CHAR_FORWARD_SLASH;
        }
        function isWindowsDeviceRoot(code) {
          return code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z || code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z;
        }
        function normalizeString(path, allowAboveRoot, separator, isPathSeparator2) {
          let res = "";
          let lastSegmentLength = 0;
          let lastSlash = -1;
          let dots = 0;
          let code = 0;
          for (let i = 0; i <= path.length; ++i) {
            if (i < path.length)
              code = StringPrototypeCharCodeAt(path, i);
            else if (isPathSeparator2(code))
              break;
            else
              code = CHAR_FORWARD_SLASH;
            if (isPathSeparator2(code)) {
              if (lastSlash === i - 1 || dots === 1) {
              } else if (dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || StringPrototypeCharCodeAt(res, res.length - 1) !== CHAR_DOT || StringPrototypeCharCodeAt(res, res.length - 2) !== CHAR_DOT) {
                  if (res.length > 2) {
                    const lastSlashIndex = StringPrototypeLastIndexOf(res, separator);
                    if (lastSlashIndex === -1) {
                      res = "";
                      lastSegmentLength = 0;
                    } else {
                      res = StringPrototypeSlice(res, 0, lastSlashIndex);
                      lastSegmentLength = res.length - 1 - StringPrototypeLastIndexOf(res, separator);
                    }
                    lastSlash = i;
                    dots = 0;
                    continue;
                  } else if (res.length !== 0) {
                    res = "";
                    lastSegmentLength = 0;
                    lastSlash = i;
                    dots = 0;
                    continue;
                  }
                }
                if (allowAboveRoot) {
                  res += res.length > 0 ? `${separator}..` : "..";
                  lastSegmentLength = 2;
                }
              } else {
                if (res.length > 0)
                  res += `${separator}${StringPrototypeSlice(path, lastSlash + 1, i)}`;
                else
                  res = StringPrototypeSlice(path, lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
              }
              lastSlash = i;
              dots = 0;
            } else if (code === CHAR_DOT && dots !== -1) {
              ++dots;
            } else {
              dots = -1;
            }
          }
          return res;
        }
        function _format(sep, pathObject) {
          validateObject(pathObject, "pathObject");
          const dir = pathObject.dir || pathObject.root;
          const base = pathObject.base || `${pathObject.name || ""}${pathObject.ext || ""}`;
          if (!dir) {
            return base;
          }
          return dir === pathObject.root ? `${dir}${base}` : `${dir}${sep}${base}`;
        }
        const win32 = {
          /**
           * path.resolve([from ...], to)
           * @param {...string} args
           * @returns {string}
           */
          resolve(...args) {
            let resolvedDevice = "";
            let resolvedTail = "";
            let resolvedAbsolute = false;
            for (let i = args.length - 1; i >= -1; i--) {
              let path;
              if (i >= 0) {
                path = args[i];
                validateString(path, `paths[${i}]`);
                if (path.length === 0) {
                  continue;
                }
              } else if (resolvedDevice.length === 0) {
                path = process2.cwd();
              } else {
                path = process2.env[`=${resolvedDevice}`] || process2.cwd();
                if (path === void 0 || StringPrototypeToLowerCase(StringPrototypeSlice(path, 0, 2)) !== StringPrototypeToLowerCase(resolvedDevice) && StringPrototypeCharCodeAt(path, 2) === CHAR_BACKWARD_SLASH) {
                  path = `${resolvedDevice}\\`;
                }
              }
              const len = path.length;
              let rootEnd = 0;
              let device = "";
              let isAbsolute = false;
              const code = StringPrototypeCharCodeAt(path, 0);
              if (len === 1) {
                if (isPathSeparator(code)) {
                  rootEnd = 1;
                  isAbsolute = true;
                }
              } else if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(StringPrototypeCharCodeAt(path, 1))) {
                  let j = 2;
                  let last = j;
                  while (j < len && !isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                    j++;
                  }
                  if (j < len && j !== last) {
                    const firstPart = StringPrototypeSlice(path, last, j);
                    last = j;
                    while (j < len && isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                      j++;
                    }
                    if (j < len && j !== last) {
                      last = j;
                      while (j < len && !isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                        j++;
                      }
                      if (j === len || j !== last) {
                        device = `\\\\${firstPart}\\${StringPrototypeSlice(path, last, j)}`;
                        rootEnd = j;
                      }
                    }
                  }
                } else {
                  rootEnd = 1;
                }
              } else if (isWindowsDeviceRoot(code) && StringPrototypeCharCodeAt(path, 1) === CHAR_COLON) {
                device = StringPrototypeSlice(path, 0, 2);
                rootEnd = 2;
                if (len > 2 && isPathSeparator(StringPrototypeCharCodeAt(path, 2))) {
                  isAbsolute = true;
                  rootEnd = 3;
                }
              }
              if (device.length > 0) {
                if (resolvedDevice.length > 0) {
                  if (StringPrototypeToLowerCase(device) !== StringPrototypeToLowerCase(resolvedDevice))
                    continue;
                } else {
                  resolvedDevice = device;
                }
              }
              if (resolvedAbsolute) {
                if (resolvedDevice.length > 0)
                  break;
              } else {
                resolvedTail = `${StringPrototypeSlice(path, rootEnd)}\\${resolvedTail}`;
                resolvedAbsolute = isAbsolute;
                if (isAbsolute && resolvedDevice.length > 0) {
                  break;
                }
              }
            }
            resolvedTail = normalizeString(
              resolvedTail,
              !resolvedAbsolute,
              "\\",
              isPathSeparator
            );
            return resolvedAbsolute ? `${resolvedDevice}\\${resolvedTail}` : `${resolvedDevice}${resolvedTail}` || ".";
          },
          /**
           * @param {string} path
           * @returns {string}
           */
          normalize(path) {
            validateString(path, "path");
            const len = path.length;
            if (len === 0)
              return ".";
            let rootEnd = 0;
            let device;
            let isAbsolute = false;
            const code = StringPrototypeCharCodeAt(path, 0);
            if (len === 1) {
              return isPosixPathSeparator(code) ? "\\" : path;
            }
            if (isPathSeparator(code)) {
              isAbsolute = true;
              if (isPathSeparator(StringPrototypeCharCodeAt(path, 1))) {
                let j = 2;
                let last = j;
                while (j < len && !isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                  j++;
                }
                if (j < len && j !== last) {
                  const firstPart = StringPrototypeSlice(path, last, j);
                  last = j;
                  while (j < len && isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                    j++;
                  }
                  if (j < len && j !== last) {
                    last = j;
                    while (j < len && !isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                      j++;
                    }
                    if (j === len) {
                      return `\\\\${firstPart}\\${StringPrototypeSlice(path, last)}\\`;
                    }
                    if (j !== last) {
                      device = `\\\\${firstPart}\\${StringPrototypeSlice(path, last, j)}`;
                      rootEnd = j;
                    }
                  }
                }
              } else {
                rootEnd = 1;
              }
            } else if (isWindowsDeviceRoot(code) && StringPrototypeCharCodeAt(path, 1) === CHAR_COLON) {
              device = StringPrototypeSlice(path, 0, 2);
              rootEnd = 2;
              if (len > 2 && isPathSeparator(StringPrototypeCharCodeAt(path, 2))) {
                isAbsolute = true;
                rootEnd = 3;
              }
            }
            let tail = rootEnd < len ? normalizeString(
              StringPrototypeSlice(path, rootEnd),
              !isAbsolute,
              "\\",
              isPathSeparator
            ) : "";
            if (tail.length === 0 && !isAbsolute)
              tail = ".";
            if (tail.length > 0 && isPathSeparator(StringPrototypeCharCodeAt(path, len - 1)))
              tail += "\\";
            if (device === void 0) {
              return isAbsolute ? `\\${tail}` : tail;
            }
            return isAbsolute ? `${device}\\${tail}` : `${device}${tail}`;
          },
          /**
           * @param {string} path
           * @returns {boolean}
           */
          isAbsolute(path) {
            validateString(path, "path");
            const len = path.length;
            if (len === 0)
              return false;
            const code = StringPrototypeCharCodeAt(path, 0);
            return isPathSeparator(code) || // Possible device root
            len > 2 && isWindowsDeviceRoot(code) && StringPrototypeCharCodeAt(path, 1) === CHAR_COLON && isPathSeparator(StringPrototypeCharCodeAt(path, 2));
          },
          /**
           * @param {...string} args
           * @returns {string}
           */
          join(...args) {
            if (args.length === 0)
              return ".";
            let joined;
            let firstPart;
            for (let i = 0; i < args.length; ++i) {
              const arg = args[i];
              validateString(arg, "path");
              if (arg.length > 0) {
                if (joined === void 0)
                  joined = firstPart = arg;
                else
                  joined += `\\${arg}`;
              }
            }
            if (joined === void 0)
              return ".";
            let needsReplace = true;
            let slashCount = 0;
            if (isPathSeparator(StringPrototypeCharCodeAt(firstPart, 0))) {
              ++slashCount;
              const firstLen = firstPart.length;
              if (firstLen > 1 && isPathSeparator(StringPrototypeCharCodeAt(firstPart, 1))) {
                ++slashCount;
                if (firstLen > 2) {
                  if (isPathSeparator(StringPrototypeCharCodeAt(firstPart, 2)))
                    ++slashCount;
                  else {
                    needsReplace = false;
                  }
                }
              }
            }
            if (needsReplace) {
              while (slashCount < joined.length && isPathSeparator(StringPrototypeCharCodeAt(joined, slashCount))) {
                slashCount++;
              }
              if (slashCount >= 2)
                joined = `\\${StringPrototypeSlice(joined, slashCount)}`;
            }
            return win32.normalize(joined);
          },
          /**
           * It will solve the relative path from `from` to `to`, for instance
           * from = 'C:\\orandea\\test\\aaa'
           * to = 'C:\\orandea\\impl\\bbb'
           * The output of the function should be: '..\\..\\impl\\bbb'
           * @param {string} from
           * @param {string} to
           * @returns {string}
           */
          relative(from, to) {
            validateString(from, "from");
            validateString(to, "to");
            if (from === to)
              return "";
            const fromOrig = win32.resolve(from);
            const toOrig = win32.resolve(to);
            if (fromOrig === toOrig)
              return "";
            from = StringPrototypeToLowerCase(fromOrig);
            to = StringPrototypeToLowerCase(toOrig);
            if (from === to)
              return "";
            let fromStart = 0;
            while (fromStart < from.length && StringPrototypeCharCodeAt(from, fromStart) === CHAR_BACKWARD_SLASH) {
              fromStart++;
            }
            let fromEnd = from.length;
            while (fromEnd - 1 > fromStart && StringPrototypeCharCodeAt(from, fromEnd - 1) === CHAR_BACKWARD_SLASH) {
              fromEnd--;
            }
            const fromLen = fromEnd - fromStart;
            let toStart = 0;
            while (toStart < to.length && StringPrototypeCharCodeAt(to, toStart) === CHAR_BACKWARD_SLASH) {
              toStart++;
            }
            let toEnd = to.length;
            while (toEnd - 1 > toStart && StringPrototypeCharCodeAt(to, toEnd - 1) === CHAR_BACKWARD_SLASH) {
              toEnd--;
            }
            const toLen = toEnd - toStart;
            const length = fromLen < toLen ? fromLen : toLen;
            let lastCommonSep = -1;
            let i = 0;
            for (; i < length; i++) {
              const fromCode = StringPrototypeCharCodeAt(from, fromStart + i);
              if (fromCode !== StringPrototypeCharCodeAt(to, toStart + i))
                break;
              else if (fromCode === CHAR_BACKWARD_SLASH)
                lastCommonSep = i;
            }
            if (i !== length) {
              if (lastCommonSep === -1)
                return toOrig;
            } else {
              if (toLen > length) {
                if (StringPrototypeCharCodeAt(to, toStart + i) === CHAR_BACKWARD_SLASH) {
                  return StringPrototypeSlice(toOrig, toStart + i + 1);
                }
                if (i === 2) {
                  return StringPrototypeSlice(toOrig, toStart + i);
                }
              }
              if (fromLen > length) {
                if (StringPrototypeCharCodeAt(from, fromStart + i) === CHAR_BACKWARD_SLASH) {
                  lastCommonSep = i;
                } else if (i === 2) {
                  lastCommonSep = 3;
                }
              }
              if (lastCommonSep === -1)
                lastCommonSep = 0;
            }
            let out = "";
            for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
              if (i === fromEnd || StringPrototypeCharCodeAt(from, i) === CHAR_BACKWARD_SLASH) {
                out += out.length === 0 ? ".." : "\\..";
              }
            }
            toStart += lastCommonSep;
            if (out.length > 0)
              return `${out}${StringPrototypeSlice(toOrig, toStart, toEnd)}`;
            if (StringPrototypeCharCodeAt(toOrig, toStart) === CHAR_BACKWARD_SLASH)
              ++toStart;
            return StringPrototypeSlice(toOrig, toStart, toEnd);
          },
          /**
           * @param {string} path
           * @returns {string}
           */
          toNamespacedPath(path) {
            if (typeof path !== "string" || path.length === 0)
              return path;
            const resolvedPath = win32.resolve(path);
            if (resolvedPath.length <= 2)
              return path;
            if (StringPrototypeCharCodeAt(resolvedPath, 0) === CHAR_BACKWARD_SLASH) {
              if (StringPrototypeCharCodeAt(resolvedPath, 1) === CHAR_BACKWARD_SLASH) {
                const code = StringPrototypeCharCodeAt(resolvedPath, 2);
                if (code !== CHAR_QUESTION_MARK && code !== CHAR_DOT) {
                  return `\\\\?\\UNC\\${StringPrototypeSlice(resolvedPath, 2)}`;
                }
              }
            } else if (isWindowsDeviceRoot(StringPrototypeCharCodeAt(resolvedPath, 0)) && StringPrototypeCharCodeAt(resolvedPath, 1) === CHAR_COLON && StringPrototypeCharCodeAt(resolvedPath, 2) === CHAR_BACKWARD_SLASH) {
              return `\\\\?\\${resolvedPath}`;
            }
            return path;
          },
          /**
           * @param {string} path
           * @returns {string}
           */
          dirname(path) {
            validateString(path, "path");
            const len = path.length;
            if (len === 0)
              return ".";
            let rootEnd = -1;
            let offset = 0;
            const code = StringPrototypeCharCodeAt(path, 0);
            if (len === 1) {
              return isPathSeparator(code) ? path : ".";
            }
            if (isPathSeparator(code)) {
              rootEnd = offset = 1;
              if (isPathSeparator(StringPrototypeCharCodeAt(path, 1))) {
                let j = 2;
                let last = j;
                while (j < len && !isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                  j++;
                }
                if (j < len && j !== last) {
                  last = j;
                  while (j < len && isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                    j++;
                  }
                  if (j < len && j !== last) {
                    last = j;
                    while (j < len && !isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                      j++;
                    }
                    if (j === len) {
                      return path;
                    }
                    if (j !== last) {
                      rootEnd = offset = j + 1;
                    }
                  }
                }
              }
            } else if (isWindowsDeviceRoot(code) && StringPrototypeCharCodeAt(path, 1) === CHAR_COLON) {
              rootEnd = len > 2 && isPathSeparator(StringPrototypeCharCodeAt(path, 2)) ? 3 : 2;
              offset = rootEnd;
            }
            let end = -1;
            let matchedSlash = true;
            for (let i = len - 1; i >= offset; --i) {
              if (isPathSeparator(StringPrototypeCharCodeAt(path, i))) {
                if (!matchedSlash) {
                  end = i;
                  break;
                }
              } else {
                matchedSlash = false;
              }
            }
            if (end === -1) {
              if (rootEnd === -1)
                return ".";
              end = rootEnd;
            }
            return StringPrototypeSlice(path, 0, end);
          },
          /**
           * @param {string} path
           * @param {string} [suffix]
           * @returns {string}
           */
          basename(path, suffix) {
            if (suffix !== void 0)
              validateString(suffix, "ext");
            validateString(path, "path");
            let start = 0;
            let end = -1;
            let matchedSlash = true;
            if (path.length >= 2 && isWindowsDeviceRoot(StringPrototypeCharCodeAt(path, 0)) && StringPrototypeCharCodeAt(path, 1) === CHAR_COLON) {
              start = 2;
            }
            if (suffix !== void 0 && suffix.length > 0 && suffix.length <= path.length) {
              if (suffix === path)
                return "";
              let extIdx = suffix.length - 1;
              let firstNonSlashEnd = -1;
              for (let i = path.length - 1; i >= start; --i) {
                const code = StringPrototypeCharCodeAt(path, i);
                if (isPathSeparator(code)) {
                  if (!matchedSlash) {
                    start = i + 1;
                    break;
                  }
                } else {
                  if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                  }
                  if (extIdx >= 0) {
                    if (code === StringPrototypeCharCodeAt(suffix, extIdx)) {
                      if (--extIdx === -1) {
                        end = i;
                      }
                    } else {
                      extIdx = -1;
                      end = firstNonSlashEnd;
                    }
                  }
                }
              }
              if (start === end)
                end = firstNonSlashEnd;
              else if (end === -1)
                end = path.length;
              return StringPrototypeSlice(path, start, end);
            }
            for (let i = path.length - 1; i >= start; --i) {
              if (isPathSeparator(StringPrototypeCharCodeAt(path, i))) {
                if (!matchedSlash) {
                  start = i + 1;
                  break;
                }
              } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
            }
            if (end === -1)
              return "";
            return StringPrototypeSlice(path, start, end);
          },
          /**
           * @param {string} path
           * @returns {string}
           */
          extname(path) {
            validateString(path, "path");
            let start = 0;
            let startDot = -1;
            let startPart = 0;
            let end = -1;
            let matchedSlash = true;
            let preDotState = 0;
            if (path.length >= 2 && StringPrototypeCharCodeAt(path, 1) === CHAR_COLON && isWindowsDeviceRoot(StringPrototypeCharCodeAt(path, 0))) {
              start = startPart = 2;
            }
            for (let i = path.length - 1; i >= start; --i) {
              const code = StringPrototypeCharCodeAt(path, i);
              if (isPathSeparator(code)) {
                if (!matchedSlash) {
                  startPart = i + 1;
                  break;
                }
                continue;
              }
              if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
              if (code === CHAR_DOT) {
                if (startDot === -1)
                  startDot = i;
                else if (preDotState !== 1)
                  preDotState = 1;
              } else if (startDot !== -1) {
                preDotState = -1;
              }
            }
            if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
            preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
            preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
              return "";
            }
            return StringPrototypeSlice(path, startDot, end);
          },
          format: FunctionPrototypeBind(_format, null, "\\"),
          /**
           * @param {string} path
           * @returns {{
           *  dir: string;
           *  root: string;
           *  base: string;
           *  name: string;
           *  ext: string;
           *  }}
           */
          parse(path) {
            validateString(path, "path");
            const ret = { root: "", dir: "", base: "", ext: "", name: "" };
            if (path.length === 0)
              return ret;
            const len = path.length;
            let rootEnd = 0;
            let code = StringPrototypeCharCodeAt(path, 0);
            if (len === 1) {
              if (isPathSeparator(code)) {
                ret.root = ret.dir = path;
                return ret;
              }
              ret.base = ret.name = path;
              return ret;
            }
            if (isPathSeparator(code)) {
              rootEnd = 1;
              if (isPathSeparator(StringPrototypeCharCodeAt(path, 1))) {
                let j = 2;
                let last = j;
                while (j < len && !isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                  j++;
                }
                if (j < len && j !== last) {
                  last = j;
                  while (j < len && isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                    j++;
                  }
                  if (j < len && j !== last) {
                    last = j;
                    while (j < len && !isPathSeparator(StringPrototypeCharCodeAt(path, j))) {
                      j++;
                    }
                    if (j === len) {
                      rootEnd = j;
                    } else if (j !== last) {
                      rootEnd = j + 1;
                    }
                  }
                }
              }
            } else if (isWindowsDeviceRoot(code) && StringPrototypeCharCodeAt(path, 1) === CHAR_COLON) {
              if (len <= 2) {
                ret.root = ret.dir = path;
                return ret;
              }
              rootEnd = 2;
              if (isPathSeparator(StringPrototypeCharCodeAt(path, 2))) {
                if (len === 3) {
                  ret.root = ret.dir = path;
                  return ret;
                }
                rootEnd = 3;
              }
            }
            if (rootEnd > 0)
              ret.root = StringPrototypeSlice(path, 0, rootEnd);
            let startDot = -1;
            let startPart = rootEnd;
            let end = -1;
            let matchedSlash = true;
            let i = path.length - 1;
            let preDotState = 0;
            for (; i >= rootEnd; --i) {
              code = StringPrototypeCharCodeAt(path, i);
              if (isPathSeparator(code)) {
                if (!matchedSlash) {
                  startPart = i + 1;
                  break;
                }
                continue;
              }
              if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
              if (code === CHAR_DOT) {
                if (startDot === -1)
                  startDot = i;
                else if (preDotState !== 1)
                  preDotState = 1;
              } else if (startDot !== -1) {
                preDotState = -1;
              }
            }
            if (end !== -1) {
              if (startDot === -1 || // We saw a non-dot character immediately before the dot
              preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
              preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                ret.base = ret.name = StringPrototypeSlice(path, startPart, end);
              } else {
                ret.name = StringPrototypeSlice(path, startPart, startDot);
                ret.base = StringPrototypeSlice(path, startPart, end);
                ret.ext = StringPrototypeSlice(path, startDot, end);
              }
            }
            if (startPart > 0 && startPart !== rootEnd)
              ret.dir = StringPrototypeSlice(path, 0, startPart - 1);
            else
              ret.dir = ret.root;
            return ret;
          },
          sep: "\\",
          delimiter: ";",
          win32: null,
          posix: null
        };
        const posixCwd = (() => {
          if (platformIsWin32) {
            const regexp = /\\/g;
            return () => {
              const cwd = StringPrototypeReplace(process2.cwd(), regexp, "/");
              return StringPrototypeSlice(cwd, StringPrototypeIndexOf(cwd, "/"));
            };
          }
          return () => process2.cwd();
        })();
        const posix = {
          /**
           * path.resolve([from ...], to)
           * @param {...string} args
           * @returns {string}
           */
          resolve(...args) {
            let resolvedPath = "";
            let resolvedAbsolute = false;
            for (let i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
              const path = i >= 0 ? args[i] : posixCwd();
              validateString(path, `paths[${i}]`);
              if (path.length === 0) {
                continue;
              }
              resolvedPath = `${path}/${resolvedPath}`;
              resolvedAbsolute = StringPrototypeCharCodeAt(path, 0) === CHAR_FORWARD_SLASH;
            }
            resolvedPath = normalizeString(
              resolvedPath,
              !resolvedAbsolute,
              "/",
              isPosixPathSeparator
            );
            if (resolvedAbsolute) {
              return `/${resolvedPath}`;
            }
            return resolvedPath.length > 0 ? resolvedPath : ".";
          },
          /**
           * @param {string} path
           * @returns {string}
           */
          normalize(path) {
            validateString(path, "path");
            if (path.length === 0)
              return ".";
            const isAbsolute = StringPrototypeCharCodeAt(path, 0) === CHAR_FORWARD_SLASH;
            const trailingSeparator = StringPrototypeCharCodeAt(path, path.length - 1) === CHAR_FORWARD_SLASH;
            path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
            if (path.length === 0) {
              if (isAbsolute)
                return "/";
              return trailingSeparator ? "./" : ".";
            }
            if (trailingSeparator)
              path += "/";
            return isAbsolute ? `/${path}` : path;
          },
          /**
           * @param {string} path
           * @returns {boolean}
           */
          isAbsolute(path) {
            validateString(path, "path");
            return path.length > 0 && StringPrototypeCharCodeAt(path, 0) === CHAR_FORWARD_SLASH;
          },
          /**
           * @param {...string} args
           * @returns {string}
           */
          join(...args) {
            if (args.length === 0)
              return ".";
            let joined;
            for (let i = 0; i < args.length; ++i) {
              const arg = args[i];
              validateString(arg, "path");
              if (arg.length > 0) {
                if (joined === void 0)
                  joined = arg;
                else
                  joined += `/${arg}`;
              }
            }
            if (joined === void 0)
              return ".";
            return posix.normalize(joined);
          },
          /**
           * @param {string} from
           * @param {string} to
           * @returns {string}
           */
          relative(from, to) {
            validateString(from, "from");
            validateString(to, "to");
            if (from === to)
              return "";
            from = posix.resolve(from);
            to = posix.resolve(to);
            if (from === to)
              return "";
            const fromStart = 1;
            const fromEnd = from.length;
            const fromLen = fromEnd - fromStart;
            const toStart = 1;
            const toLen = to.length - toStart;
            const length = fromLen < toLen ? fromLen : toLen;
            let lastCommonSep = -1;
            let i = 0;
            for (; i < length; i++) {
              const fromCode = StringPrototypeCharCodeAt(from, fromStart + i);
              if (fromCode !== StringPrototypeCharCodeAt(to, toStart + i))
                break;
              else if (fromCode === CHAR_FORWARD_SLASH)
                lastCommonSep = i;
            }
            if (i === length) {
              if (toLen > length) {
                if (StringPrototypeCharCodeAt(to, toStart + i) === CHAR_FORWARD_SLASH) {
                  return StringPrototypeSlice(to, toStart + i + 1);
                }
                if (i === 0) {
                  return StringPrototypeSlice(to, toStart + i);
                }
              } else if (fromLen > length) {
                if (StringPrototypeCharCodeAt(from, fromStart + i) === CHAR_FORWARD_SLASH) {
                  lastCommonSep = i;
                } else if (i === 0) {
                  lastCommonSep = 0;
                }
              }
            }
            let out = "";
            for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
              if (i === fromEnd || StringPrototypeCharCodeAt(from, i) === CHAR_FORWARD_SLASH) {
                out += out.length === 0 ? ".." : "/..";
              }
            }
            return `${out}${StringPrototypeSlice(to, toStart + lastCommonSep)}`;
          },
          /**
           * @param {string} path
           * @returns {string}
           */
          toNamespacedPath(path) {
            return path;
          },
          /**
           * @param {string} path
           * @returns {string}
           */
          dirname(path) {
            validateString(path, "path");
            if (path.length === 0)
              return ".";
            const hasRoot = StringPrototypeCharCodeAt(path, 0) === CHAR_FORWARD_SLASH;
            let end = -1;
            let matchedSlash = true;
            for (let i = path.length - 1; i >= 1; --i) {
              if (StringPrototypeCharCodeAt(path, i) === CHAR_FORWARD_SLASH) {
                if (!matchedSlash) {
                  end = i;
                  break;
                }
              } else {
                matchedSlash = false;
              }
            }
            if (end === -1)
              return hasRoot ? "/" : ".";
            if (hasRoot && end === 1)
              return "//";
            return StringPrototypeSlice(path, 0, end);
          },
          /**
           * @param {string} path
           * @param {string} [suffix]
           * @returns {string}
           */
          basename(path, suffix) {
            if (suffix !== void 0)
              validateString(suffix, "ext");
            validateString(path, "path");
            let start = 0;
            let end = -1;
            let matchedSlash = true;
            if (suffix !== void 0 && suffix.length > 0 && suffix.length <= path.length) {
              if (suffix === path)
                return "";
              let extIdx = suffix.length - 1;
              let firstNonSlashEnd = -1;
              for (let i = path.length - 1; i >= 0; --i) {
                const code = StringPrototypeCharCodeAt(path, i);
                if (code === CHAR_FORWARD_SLASH) {
                  if (!matchedSlash) {
                    start = i + 1;
                    break;
                  }
                } else {
                  if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                  }
                  if (extIdx >= 0) {
                    if (code === StringPrototypeCharCodeAt(suffix, extIdx)) {
                      if (--extIdx === -1) {
                        end = i;
                      }
                    } else {
                      extIdx = -1;
                      end = firstNonSlashEnd;
                    }
                  }
                }
              }
              if (start === end)
                end = firstNonSlashEnd;
              else if (end === -1)
                end = path.length;
              return StringPrototypeSlice(path, start, end);
            }
            for (let i = path.length - 1; i >= 0; --i) {
              if (StringPrototypeCharCodeAt(path, i) === CHAR_FORWARD_SLASH) {
                if (!matchedSlash) {
                  start = i + 1;
                  break;
                }
              } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
            }
            if (end === -1)
              return "";
            return StringPrototypeSlice(path, start, end);
          },
          /**
           * @param {string} path
           * @returns {string}
           */
          extname(path) {
            validateString(path, "path");
            let startDot = -1;
            let startPart = 0;
            let end = -1;
            let matchedSlash = true;
            let preDotState = 0;
            for (let i = path.length - 1; i >= 0; --i) {
              const code = StringPrototypeCharCodeAt(path, i);
              if (code === CHAR_FORWARD_SLASH) {
                if (!matchedSlash) {
                  startPart = i + 1;
                  break;
                }
                continue;
              }
              if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
              if (code === CHAR_DOT) {
                if (startDot === -1)
                  startDot = i;
                else if (preDotState !== 1)
                  preDotState = 1;
              } else if (startDot !== -1) {
                preDotState = -1;
              }
            }
            if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
            preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
            preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
              return "";
            }
            return StringPrototypeSlice(path, startDot, end);
          },
          format: FunctionPrototypeBind(_format, null, "/"),
          /**
           * @param {string} path
           * @returns {{
           *   dir: string;
           *   root: string;
           *   base: string;
           *   name: string;
           *   ext: string;
           *   }}
           */
          parse(path) {
            validateString(path, "path");
            const ret = { root: "", dir: "", base: "", ext: "", name: "" };
            if (path.length === 0)
              return ret;
            const isAbsolute = StringPrototypeCharCodeAt(path, 0) === CHAR_FORWARD_SLASH;
            let start;
            if (isAbsolute) {
              ret.root = "/";
              start = 1;
            } else {
              start = 0;
            }
            let startDot = -1;
            let startPart = 0;
            let end = -1;
            let matchedSlash = true;
            let i = path.length - 1;
            let preDotState = 0;
            for (; i >= start; --i) {
              const code = StringPrototypeCharCodeAt(path, i);
              if (code === CHAR_FORWARD_SLASH) {
                if (!matchedSlash) {
                  startPart = i + 1;
                  break;
                }
                continue;
              }
              if (end === -1) {
                matchedSlash = false;
                end = i + 1;
              }
              if (code === CHAR_DOT) {
                if (startDot === -1)
                  startDot = i;
                else if (preDotState !== 1)
                  preDotState = 1;
              } else if (startDot !== -1) {
                preDotState = -1;
              }
            }
            if (end !== -1) {
              const start2 = startPart === 0 && isAbsolute ? 1 : startPart;
              if (startDot === -1 || // We saw a non-dot character immediately before the dot
              preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
              preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                ret.base = ret.name = StringPrototypeSlice(path, start2, end);
              } else {
                ret.name = StringPrototypeSlice(path, start2, startDot);
                ret.base = StringPrototypeSlice(path, start2, end);
                ret.ext = StringPrototypeSlice(path, startDot, end);
              }
            }
            if (startPart > 0)
              ret.dir = StringPrototypeSlice(path, 0, startPart - 1);
            else if (isAbsolute)
              ret.dir = "/";
            return ret;
          },
          sep: "/",
          delimiter: ":",
          win32: null,
          posix: null
        };
        posix.win32 = win32.win32 = win32;
        posix.posix = win32.posix = posix;
        win32._makeLong = win32.toNamespacedPath;
        posix._makeLong = posix.toNamespacedPath;
        module2.exports = platformIsWin32 ? win32 : posix;
      }
    }
  });

  // runtime/node_modules/has-symbols/shams.js
  var require_shams = __commonJS({
    "runtime/node_modules/has-symbols/shams.js"(exports, module) {
      "use strict";
      module.exports = function hasSymbols() {
        if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
          return false;
        }
        if (typeof Symbol.iterator === "symbol") {
          return true;
        }
        var obj = {};
        var sym = Symbol("test");
        var symObj = Object(sym);
        if (typeof sym === "string") {
          return false;
        }
        if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
          return false;
        }
        if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
          return false;
        }
        var symVal = 42;
        obj[sym] = symVal;
        for (var _ in obj) {
          return false;
        }
        if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
          return false;
        }
        if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
          return false;
        }
        var syms = Object.getOwnPropertySymbols(obj);
        if (syms.length !== 1 || syms[0] !== sym) {
          return false;
        }
        if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
          return false;
        }
        if (typeof Object.getOwnPropertyDescriptor === "function") {
          var descriptor = (
            /** @type {PropertyDescriptor} */
            Object.getOwnPropertyDescriptor(obj, sym)
          );
          if (descriptor.value !== symVal || descriptor.enumerable !== true) {
            return false;
          }
        }
        return true;
      };
    }
  });

  // runtime/node_modules/has-tostringtag/shams.js
  var require_shams2 = __commonJS({
    "runtime/node_modules/has-tostringtag/shams.js"(exports, module) {
      "use strict";
      var hasSymbols = require_shams();
      module.exports = function hasToStringTagShams() {
        return hasSymbols() && !!Symbol.toStringTag;
      };
    }
  });

  // runtime/node_modules/es-object-atoms/index.js
  var require_es_object_atoms = __commonJS({
    "runtime/node_modules/es-object-atoms/index.js"(exports, module) {
      "use strict";
      module.exports = Object;
    }
  });

  // runtime/node_modules/es-errors/index.js
  var require_es_errors = __commonJS({
    "runtime/node_modules/es-errors/index.js"(exports, module) {
      "use strict";
      module.exports = Error;
    }
  });

  // runtime/node_modules/es-errors/eval.js
  var require_eval = __commonJS({
    "runtime/node_modules/es-errors/eval.js"(exports, module) {
      "use strict";
      module.exports = EvalError;
    }
  });

  // runtime/node_modules/es-errors/range.js
  var require_range = __commonJS({
    "runtime/node_modules/es-errors/range.js"(exports, module) {
      "use strict";
      module.exports = RangeError;
    }
  });

  // runtime/node_modules/es-errors/ref.js
  var require_ref = __commonJS({
    "runtime/node_modules/es-errors/ref.js"(exports, module) {
      "use strict";
      module.exports = ReferenceError;
    }
  });

  // runtime/node_modules/es-errors/syntax.js
  var require_syntax = __commonJS({
    "runtime/node_modules/es-errors/syntax.js"(exports, module) {
      "use strict";
      module.exports = SyntaxError;
    }
  });

  // runtime/node_modules/es-errors/type.js
  var require_type = __commonJS({
    "runtime/node_modules/es-errors/type.js"(exports, module) {
      "use strict";
      module.exports = TypeError;
    }
  });

  // runtime/node_modules/es-errors/uri.js
  var require_uri = __commonJS({
    "runtime/node_modules/es-errors/uri.js"(exports, module) {
      "use strict";
      module.exports = URIError;
    }
  });

  // runtime/node_modules/math-intrinsics/abs.js
  var require_abs = __commonJS({
    "runtime/node_modules/math-intrinsics/abs.js"(exports, module) {
      "use strict";
      module.exports = Math.abs;
    }
  });

  // runtime/node_modules/math-intrinsics/floor.js
  var require_floor = __commonJS({
    "runtime/node_modules/math-intrinsics/floor.js"(exports, module) {
      "use strict";
      module.exports = Math.floor;
    }
  });

  // runtime/node_modules/math-intrinsics/max.js
  var require_max = __commonJS({
    "runtime/node_modules/math-intrinsics/max.js"(exports, module) {
      "use strict";
      module.exports = Math.max;
    }
  });

  // runtime/node_modules/math-intrinsics/min.js
  var require_min = __commonJS({
    "runtime/node_modules/math-intrinsics/min.js"(exports, module) {
      "use strict";
      module.exports = Math.min;
    }
  });

  // runtime/node_modules/math-intrinsics/pow.js
  var require_pow = __commonJS({
    "runtime/node_modules/math-intrinsics/pow.js"(exports, module) {
      "use strict";
      module.exports = Math.pow;
    }
  });

  // runtime/node_modules/math-intrinsics/round.js
  var require_round = __commonJS({
    "runtime/node_modules/math-intrinsics/round.js"(exports, module) {
      "use strict";
      module.exports = Math.round;
    }
  });

  // runtime/node_modules/math-intrinsics/isNaN.js
  var require_isNaN = __commonJS({
    "runtime/node_modules/math-intrinsics/isNaN.js"(exports, module) {
      "use strict";
      module.exports = Number.isNaN || function isNaN2(a) {
        return a !== a;
      };
    }
  });

  // runtime/node_modules/math-intrinsics/sign.js
  var require_sign = __commonJS({
    "runtime/node_modules/math-intrinsics/sign.js"(exports, module) {
      "use strict";
      var $isNaN = require_isNaN();
      module.exports = function sign(number) {
        if ($isNaN(number) || number === 0) {
          return number;
        }
        return number < 0 ? -1 : 1;
      };
    }
  });

  // runtime/node_modules/gopd/gOPD.js
  var require_gOPD = __commonJS({
    "runtime/node_modules/gopd/gOPD.js"(exports, module) {
      "use strict";
      module.exports = Object.getOwnPropertyDescriptor;
    }
  });

  // runtime/node_modules/gopd/index.js
  var require_gopd = __commonJS({
    "runtime/node_modules/gopd/index.js"(exports, module) {
      "use strict";
      var $gOPD = require_gOPD();
      if ($gOPD) {
        try {
          $gOPD([], "length");
        } catch (e) {
          $gOPD = null;
        }
      }
      module.exports = $gOPD;
    }
  });

  // runtime/node_modules/es-define-property/index.js
  var require_es_define_property = __commonJS({
    "runtime/node_modules/es-define-property/index.js"(exports, module) {
      "use strict";
      var $defineProperty = Object.defineProperty || false;
      if ($defineProperty) {
        try {
          $defineProperty({}, "a", { value: 1 });
        } catch (e) {
          $defineProperty = false;
        }
      }
      module.exports = $defineProperty;
    }
  });

  // runtime/node_modules/has-symbols/index.js
  var require_has_symbols = __commonJS({
    "runtime/node_modules/has-symbols/index.js"(exports, module) {
      "use strict";
      var origSymbol = typeof Symbol !== "undefined" && Symbol;
      var hasSymbolSham = require_shams();
      module.exports = function hasNativeSymbols() {
        if (typeof origSymbol !== "function") {
          return false;
        }
        if (typeof Symbol !== "function") {
          return false;
        }
        if (typeof origSymbol("foo") !== "symbol") {
          return false;
        }
        if (typeof Symbol("bar") !== "symbol") {
          return false;
        }
        return hasSymbolSham();
      };
    }
  });

  // runtime/node_modules/get-proto/Reflect.getPrototypeOf.js
  var require_Reflect_getPrototypeOf = __commonJS({
    "runtime/node_modules/get-proto/Reflect.getPrototypeOf.js"(exports, module) {
      "use strict";
      module.exports = typeof Reflect !== "undefined" && Reflect.getPrototypeOf || null;
    }
  });

  // runtime/node_modules/get-proto/Object.getPrototypeOf.js
  var require_Object_getPrototypeOf = __commonJS({
    "runtime/node_modules/get-proto/Object.getPrototypeOf.js"(exports, module) {
      "use strict";
      var $Object = require_es_object_atoms();
      module.exports = $Object.getPrototypeOf || null;
    }
  });

  // runtime/node_modules/function-bind/implementation.js
  var require_implementation = __commonJS({
    "runtime/node_modules/function-bind/implementation.js"(exports, module) {
      "use strict";
      var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
      var toStr = Object.prototype.toString;
      var max = Math.max;
      var funcType = "[object Function]";
      var concatty = function concatty2(a, b) {
        var arr = [];
        for (var i = 0; i < a.length; i += 1) {
          arr[i] = a[i];
        }
        for (var j = 0; j < b.length; j += 1) {
          arr[j + a.length] = b[j];
        }
        return arr;
      };
      var slicy = function slicy2(arrLike, offset) {
        var arr = [];
        for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
          arr[j] = arrLike[i];
        }
        return arr;
      };
      var joiny = function(arr, joiner) {
        var str = "";
        for (var i = 0; i < arr.length; i += 1) {
          str += arr[i];
          if (i + 1 < arr.length) {
            str += joiner;
          }
        }
        return str;
      };
      module.exports = function bind(that) {
        var target = this;
        if (typeof target !== "function" || toStr.apply(target) !== funcType) {
          throw new TypeError(ERROR_MESSAGE + target);
        }
        var args = slicy(arguments, 1);
        var bound;
        var binder = function() {
          if (this instanceof bound) {
            var result = target.apply(
              this,
              concatty(args, arguments)
            );
            if (Object(result) === result) {
              return result;
            }
            return this;
          }
          return target.apply(
            that,
            concatty(args, arguments)
          );
        };
        var boundLength = max(0, target.length - args.length);
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
          boundArgs[i] = "$" + i;
        }
        bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
        if (target.prototype) {
          var Empty = function Empty2() {
          };
          Empty.prototype = target.prototype;
          bound.prototype = new Empty();
          Empty.prototype = null;
        }
        return bound;
      };
    }
  });

  // runtime/node_modules/function-bind/index.js
  var require_function_bind = __commonJS({
    "runtime/node_modules/function-bind/index.js"(exports, module) {
      "use strict";
      var implementation = require_implementation();
      module.exports = Function.prototype.bind || implementation;
    }
  });

  // runtime/node_modules/call-bind-apply-helpers/functionCall.js
  var require_functionCall = __commonJS({
    "runtime/node_modules/call-bind-apply-helpers/functionCall.js"(exports, module) {
      "use strict";
      module.exports = Function.prototype.call;
    }
  });

  // runtime/node_modules/call-bind-apply-helpers/functionApply.js
  var require_functionApply = __commonJS({
    "runtime/node_modules/call-bind-apply-helpers/functionApply.js"(exports, module) {
      "use strict";
      module.exports = Function.prototype.apply;
    }
  });

  // runtime/node_modules/call-bind-apply-helpers/reflectApply.js
  var require_reflectApply = __commonJS({
    "runtime/node_modules/call-bind-apply-helpers/reflectApply.js"(exports, module) {
      "use strict";
      module.exports = typeof Reflect !== "undefined" && Reflect && Reflect.apply;
    }
  });

  // runtime/node_modules/call-bind-apply-helpers/actualApply.js
  var require_actualApply = __commonJS({
    "runtime/node_modules/call-bind-apply-helpers/actualApply.js"(exports, module) {
      "use strict";
      var bind = require_function_bind();
      var $apply = require_functionApply();
      var $call = require_functionCall();
      var $reflectApply = require_reflectApply();
      module.exports = $reflectApply || bind.call($call, $apply);
    }
  });

  // runtime/node_modules/call-bind-apply-helpers/index.js
  var require_call_bind_apply_helpers = __commonJS({
    "runtime/node_modules/call-bind-apply-helpers/index.js"(exports, module) {
      "use strict";
      var bind = require_function_bind();
      var $TypeError = require_type();
      var $call = require_functionCall();
      var $actualApply = require_actualApply();
      module.exports = function callBindBasic(args) {
        if (args.length < 1 || typeof args[0] !== "function") {
          throw new $TypeError("a function is required");
        }
        return $actualApply(bind, $call, args);
      };
    }
  });

  // runtime/node_modules/dunder-proto/get.js
  var require_get = __commonJS({
    "runtime/node_modules/dunder-proto/get.js"(exports, module) {
      "use strict";
      var callBind = require_call_bind_apply_helpers();
      var gOPD = require_gopd();
      var hasProtoAccessor;
      try {
        hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */
        [].__proto__ === Array.prototype;
      } catch (e) {
        if (!e || typeof e !== "object" || !("code" in e) || e.code !== "ERR_PROTO_ACCESS") {
          throw e;
        }
      }
      var desc = !!hasProtoAccessor && gOPD && gOPD(
        Object.prototype,
        /** @type {keyof typeof Object.prototype} */
        "__proto__"
      );
      var $Object = Object;
      var $getPrototypeOf = $Object.getPrototypeOf;
      module.exports = desc && typeof desc.get === "function" ? callBind([desc.get]) : typeof $getPrototypeOf === "function" ? (
        /** @type {import('./get')} */
        function getDunder(value) {
          return $getPrototypeOf(value == null ? value : $Object(value));
        }
      ) : false;
    }
  });

  // runtime/node_modules/get-proto/index.js
  var require_get_proto = __commonJS({
    "runtime/node_modules/get-proto/index.js"(exports, module) {
      "use strict";
      var reflectGetProto = require_Reflect_getPrototypeOf();
      var originalGetProto = require_Object_getPrototypeOf();
      var getDunderProto = require_get();
      module.exports = reflectGetProto ? function getProto(O) {
        return reflectGetProto(O);
      } : originalGetProto ? function getProto(O) {
        if (!O || typeof O !== "object" && typeof O !== "function") {
          throw new TypeError("getProto: not an object");
        }
        return originalGetProto(O);
      } : getDunderProto ? function getProto(O) {
        return getDunderProto(O);
      } : null;
    }
  });

  // runtime/node_modules/hasown/index.js
  var require_hasown = __commonJS({
    "runtime/node_modules/hasown/index.js"(exports, module) {
      "use strict";
      var call = Function.prototype.call;
      var $hasOwn = Object.prototype.hasOwnProperty;
      var bind = require_function_bind();
      module.exports = bind.call(call, $hasOwn);
    }
  });

  // runtime/node_modules/get-intrinsic/index.js
  var require_get_intrinsic = __commonJS({
    "runtime/node_modules/get-intrinsic/index.js"(exports, module) {
      "use strict";
      var undefined2;
      var $Object = require_es_object_atoms();
      var $Error = require_es_errors();
      var $EvalError = require_eval();
      var $RangeError = require_range();
      var $ReferenceError = require_ref();
      var $SyntaxError = require_syntax();
      var $TypeError = require_type();
      var $URIError = require_uri();
      var abs = require_abs();
      var floor = require_floor();
      var max = require_max();
      var min = require_min();
      var pow = require_pow();
      var round = require_round();
      var sign = require_sign();
      var $Function = Function;
      var getEvalledConstructor = function(expressionSyntax) {
        try {
          return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
        } catch (e) {
        }
      };
      var $gOPD = require_gopd();
      var $defineProperty = require_es_define_property();
      var throwTypeError = function() {
        throw new $TypeError();
      };
      var ThrowTypeError = $gOPD ? function() {
        try {
          arguments.callee;
          return throwTypeError;
        } catch (calleeThrows) {
          try {
            return $gOPD(arguments, "callee").get;
          } catch (gOPDthrows) {
            return throwTypeError;
          }
        }
      }() : throwTypeError;
      var hasSymbols = require_has_symbols()();
      var getProto = require_get_proto();
      var $ObjectGPO = require_Object_getPrototypeOf();
      var $ReflectGPO = require_Reflect_getPrototypeOf();
      var $apply = require_functionApply();
      var $call = require_functionCall();
      var needsEval = {};
      var TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined2 : getProto(Uint8Array);
      var INTRINSICS = {
        __proto__: null,
        "%AggregateError%": typeof AggregateError === "undefined" ? undefined2 : AggregateError,
        "%Array%": Array,
        "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined2 : ArrayBuffer,
        "%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2,
        "%AsyncFromSyncIteratorPrototype%": undefined2,
        "%AsyncFunction%": needsEval,
        "%AsyncGenerator%": needsEval,
        "%AsyncGeneratorFunction%": needsEval,
        "%AsyncIteratorPrototype%": needsEval,
        "%Atomics%": typeof Atomics === "undefined" ? undefined2 : Atomics,
        "%BigInt%": typeof BigInt === "undefined" ? undefined2 : BigInt,
        "%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined2 : BigInt64Array,
        "%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined2 : BigUint64Array,
        "%Boolean%": Boolean,
        "%DataView%": typeof DataView === "undefined" ? undefined2 : DataView,
        "%Date%": Date,
        "%decodeURI%": decodeURI,
        "%decodeURIComponent%": decodeURIComponent,
        "%encodeURI%": encodeURI,
        "%encodeURIComponent%": encodeURIComponent,
        "%Error%": $Error,
        "%eval%": eval,
        // eslint-disable-line no-eval
        "%EvalError%": $EvalError,
        "%Float16Array%": typeof Float16Array === "undefined" ? undefined2 : Float16Array,
        "%Float32Array%": typeof Float32Array === "undefined" ? undefined2 : Float32Array,
        "%Float64Array%": typeof Float64Array === "undefined" ? undefined2 : Float64Array,
        "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined2 : FinalizationRegistry,
        "%Function%": $Function,
        "%GeneratorFunction%": needsEval,
        "%Int8Array%": typeof Int8Array === "undefined" ? undefined2 : Int8Array,
        "%Int16Array%": typeof Int16Array === "undefined" ? undefined2 : Int16Array,
        "%Int32Array%": typeof Int32Array === "undefined" ? undefined2 : Int32Array,
        "%isFinite%": isFinite,
        "%isNaN%": isNaN,
        "%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2,
        "%JSON%": typeof JSON === "object" ? JSON : undefined2,
        "%Map%": typeof Map === "undefined" ? undefined2 : Map,
        "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Map())[Symbol.iterator]()),
        "%Math%": Math,
        "%Number%": Number,
        "%Object%": $Object,
        "%Object.getOwnPropertyDescriptor%": $gOPD,
        "%parseFloat%": parseFloat,
        "%parseInt%": parseInt,
        "%Promise%": typeof Promise === "undefined" ? undefined2 : Promise,
        "%Proxy%": typeof Proxy === "undefined" ? undefined2 : Proxy,
        "%RangeError%": $RangeError,
        "%ReferenceError%": $ReferenceError,
        "%Reflect%": typeof Reflect === "undefined" ? undefined2 : Reflect,
        "%RegExp%": RegExp,
        "%Set%": typeof Set === "undefined" ? undefined2 : Set,
        "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Set())[Symbol.iterator]()),
        "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined2 : SharedArrayBuffer,
        "%String%": String,
        "%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined2,
        "%Symbol%": hasSymbols ? Symbol : undefined2,
        "%SyntaxError%": $SyntaxError,
        "%ThrowTypeError%": ThrowTypeError,
        "%TypedArray%": TypedArray,
        "%TypeError%": $TypeError,
        "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined2 : Uint8Array,
        "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined2 : Uint8ClampedArray,
        "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined2 : Uint16Array,
        "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined2 : Uint32Array,
        "%URIError%": $URIError,
        "%WeakMap%": typeof WeakMap === "undefined" ? undefined2 : WeakMap,
        "%WeakRef%": typeof WeakRef === "undefined" ? undefined2 : WeakRef,
        "%WeakSet%": typeof WeakSet === "undefined" ? undefined2 : WeakSet,
        "%Function.prototype.call%": $call,
        "%Function.prototype.apply%": $apply,
        "%Object.defineProperty%": $defineProperty,
        "%Object.getPrototypeOf%": $ObjectGPO,
        "%Math.abs%": abs,
        "%Math.floor%": floor,
        "%Math.max%": max,
        "%Math.min%": min,
        "%Math.pow%": pow,
        "%Math.round%": round,
        "%Math.sign%": sign,
        "%Reflect.getPrototypeOf%": $ReflectGPO
      };
      if (getProto) {
        try {
          null.error;
        } catch (e) {
          errorProto = getProto(getProto(e));
          INTRINSICS["%Error.prototype%"] = errorProto;
        }
      }
      var errorProto;
      var doEval = function doEval2(name) {
        var value;
        if (name === "%AsyncFunction%") {
          value = getEvalledConstructor("async function () {}");
        } else if (name === "%GeneratorFunction%") {
          value = getEvalledConstructor("function* () {}");
        } else if (name === "%AsyncGeneratorFunction%") {
          value = getEvalledConstructor("async function* () {}");
        } else if (name === "%AsyncGenerator%") {
          var fn = doEval2("%AsyncGeneratorFunction%");
          if (fn) {
            value = fn.prototype;
          }
        } else if (name === "%AsyncIteratorPrototype%") {
          var gen = doEval2("%AsyncGenerator%");
          if (gen && getProto) {
            value = getProto(gen.prototype);
          }
        }
        INTRINSICS[name] = value;
        return value;
      };
      var LEGACY_ALIASES = {
        __proto__: null,
        "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
        "%ArrayPrototype%": ["Array", "prototype"],
        "%ArrayProto_entries%": ["Array", "prototype", "entries"],
        "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
        "%ArrayProto_keys%": ["Array", "prototype", "keys"],
        "%ArrayProto_values%": ["Array", "prototype", "values"],
        "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
        "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
        "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
        "%BooleanPrototype%": ["Boolean", "prototype"],
        "%DataViewPrototype%": ["DataView", "prototype"],
        "%DatePrototype%": ["Date", "prototype"],
        "%ErrorPrototype%": ["Error", "prototype"],
        "%EvalErrorPrototype%": ["EvalError", "prototype"],
        "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
        "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
        "%FunctionPrototype%": ["Function", "prototype"],
        "%Generator%": ["GeneratorFunction", "prototype"],
        "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
        "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
        "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
        "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
        "%JSONParse%": ["JSON", "parse"],
        "%JSONStringify%": ["JSON", "stringify"],
        "%MapPrototype%": ["Map", "prototype"],
        "%NumberPrototype%": ["Number", "prototype"],
        "%ObjectPrototype%": ["Object", "prototype"],
        "%ObjProto_toString%": ["Object", "prototype", "toString"],
        "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
        "%PromisePrototype%": ["Promise", "prototype"],
        "%PromiseProto_then%": ["Promise", "prototype", "then"],
        "%Promise_all%": ["Promise", "all"],
        "%Promise_reject%": ["Promise", "reject"],
        "%Promise_resolve%": ["Promise", "resolve"],
        "%RangeErrorPrototype%": ["RangeError", "prototype"],
        "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
        "%RegExpPrototype%": ["RegExp", "prototype"],
        "%SetPrototype%": ["Set", "prototype"],
        "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
        "%StringPrototype%": ["String", "prototype"],
        "%SymbolPrototype%": ["Symbol", "prototype"],
        "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
        "%TypedArrayPrototype%": ["TypedArray", "prototype"],
        "%TypeErrorPrototype%": ["TypeError", "prototype"],
        "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
        "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
        "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
        "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
        "%URIErrorPrototype%": ["URIError", "prototype"],
        "%WeakMapPrototype%": ["WeakMap", "prototype"],
        "%WeakSetPrototype%": ["WeakSet", "prototype"]
      };
      var bind = require_function_bind();
      var hasOwn = require_hasown();
      var $concat = bind.call($call, Array.prototype.concat);
      var $spliceApply = bind.call($apply, Array.prototype.splice);
      var $replace = bind.call($call, String.prototype.replace);
      var $strSlice = bind.call($call, String.prototype.slice);
      var $exec = bind.call($call, RegExp.prototype.exec);
      var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
      var reEscapeChar = /\\(\\)?/g;
      var stringToPath = function stringToPath2(string) {
        var first = $strSlice(string, 0, 1);
        var last = $strSlice(string, -1);
        if (first === "%" && last !== "%") {
          throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
        } else if (last === "%" && first !== "%") {
          throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
        }
        var result = [];
        $replace(string, rePropName, function(match, number, quote, subString) {
          result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match;
        });
        return result;
      };
      var getBaseIntrinsic = function getBaseIntrinsic2(name, allowMissing) {
        var intrinsicName = name;
        var alias;
        if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
          alias = LEGACY_ALIASES[intrinsicName];
          intrinsicName = "%" + alias[0] + "%";
        }
        if (hasOwn(INTRINSICS, intrinsicName)) {
          var value = INTRINSICS[intrinsicName];
          if (value === needsEval) {
            value = doEval(intrinsicName);
          }
          if (typeof value === "undefined" && !allowMissing) {
            throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
          }
          return {
            alias,
            name: intrinsicName,
            value
          };
        }
        throw new $SyntaxError("intrinsic " + name + " does not exist!");
      };
      module.exports = function GetIntrinsic(name, allowMissing) {
        if (typeof name !== "string" || name.length === 0) {
          throw new $TypeError("intrinsic name must be a non-empty string");
        }
        if (arguments.length > 1 && typeof allowMissing !== "boolean") {
          throw new $TypeError('"allowMissing" argument must be a boolean');
        }
        if ($exec(/^%?[^%]*%?$/, name) === null) {
          throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
        }
        var parts = stringToPath(name);
        var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
        var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
        var intrinsicRealName = intrinsic.name;
        var value = intrinsic.value;
        var skipFurtherCaching = false;
        var alias = intrinsic.alias;
        if (alias) {
          intrinsicBaseName = alias[0];
          $spliceApply(parts, $concat([0, 1], alias));
        }
        for (var i = 1, isOwn = true; i < parts.length; i += 1) {
          var part = parts[i];
          var first = $strSlice(part, 0, 1);
          var last = $strSlice(part, -1);
          if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last) {
            throw new $SyntaxError("property names with quotes must have matching quotes");
          }
          if (part === "constructor" || !isOwn) {
            skipFurtherCaching = true;
          }
          intrinsicBaseName += "." + part;
          intrinsicRealName = "%" + intrinsicBaseName + "%";
          if (hasOwn(INTRINSICS, intrinsicRealName)) {
            value = INTRINSICS[intrinsicRealName];
          } else if (value != null) {
            if (!(part in value)) {
              if (!allowMissing) {
                throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
              }
              return void undefined2;
            }
            if ($gOPD && i + 1 >= parts.length) {
              var desc = $gOPD(value, part);
              isOwn = !!desc;
              if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
                value = desc.get;
              } else {
                value = value[part];
              }
            } else {
              isOwn = hasOwn(value, part);
              value = value[part];
            }
            if (isOwn && !skipFurtherCaching) {
              INTRINSICS[intrinsicRealName] = value;
            }
          }
        }
        return value;
      };
    }
  });

  // runtime/node_modules/call-bound/index.js
  var require_call_bound = __commonJS({
    "runtime/node_modules/call-bound/index.js"(exports, module) {
      "use strict";
      var GetIntrinsic = require_get_intrinsic();
      var callBindBasic = require_call_bind_apply_helpers();
      var $indexOf = callBindBasic([GetIntrinsic("%String.prototype.indexOf%")]);
      module.exports = function callBoundIntrinsic(name, allowMissing) {
        var intrinsic = (
          /** @type {(this: unknown, ...args: unknown[]) => unknown} */
          GetIntrinsic(name, !!allowMissing)
        );
        if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) {
          return callBindBasic(
            /** @type {const} */
            [intrinsic]
          );
        }
        return intrinsic;
      };
    }
  });

  // runtime/node_modules/is-arguments/index.js
  var require_is_arguments = __commonJS({
    "runtime/node_modules/is-arguments/index.js"(exports, module) {
      "use strict";
      var hasToStringTag = require_shams2()();
      var callBound = require_call_bound();
      var $toString = callBound("Object.prototype.toString");
      var isStandardArguments = function isArguments(value) {
        if (hasToStringTag && value && typeof value === "object" && Symbol.toStringTag in value) {
          return false;
        }
        return $toString(value) === "[object Arguments]";
      };
      var isLegacyArguments = function isArguments(value) {
        if (isStandardArguments(value)) {
          return true;
        }
        return value !== null && typeof value === "object" && "length" in value && typeof value.length === "number" && value.length >= 0 && $toString(value) !== "[object Array]" && "callee" in value && $toString(value.callee) === "[object Function]";
      };
      var supportsStandardArguments = function() {
        return isStandardArguments(arguments);
      }();
      isStandardArguments.isLegacyArguments = isLegacyArguments;
      module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;
    }
  });

  // runtime/node_modules/is-regex/index.js
  var require_is_regex = __commonJS({
    "runtime/node_modules/is-regex/index.js"(exports, module) {
      "use strict";
      var callBound = require_call_bound();
      var hasToStringTag = require_shams2()();
      var hasOwn = require_hasown();
      var gOPD = require_gopd();
      var fn;
      if (hasToStringTag) {
        $exec = callBound("RegExp.prototype.exec");
        isRegexMarker = {};
        throwRegexMarker = function() {
          throw isRegexMarker;
        };
        badStringifier = {
          toString: throwRegexMarker,
          valueOf: throwRegexMarker
        };
        if (typeof Symbol.toPrimitive === "symbol") {
          badStringifier[Symbol.toPrimitive] = throwRegexMarker;
        }
        fn = function isRegex(value) {
          if (!value || typeof value !== "object") {
            return false;
          }
          var descriptor = (
            /** @type {NonNullable<typeof gOPD>} */
            gOPD(
              /** @type {{ lastIndex?: unknown }} */
              value,
              "lastIndex"
            )
          );
          var hasLastIndexDataProperty = descriptor && hasOwn(descriptor, "value");
          if (!hasLastIndexDataProperty) {
            return false;
          }
          try {
            $exec(
              value,
              /** @type {string} */
              /** @type {unknown} */
              badStringifier
            );
          } catch (e) {
            return e === isRegexMarker;
          }
        };
      } else {
        $toString = callBound("Object.prototype.toString");
        regexClass = "[object RegExp]";
        fn = function isRegex(value) {
          if (!value || typeof value !== "object" && typeof value !== "function") {
            return false;
          }
          return $toString(value) === regexClass;
        };
      }
      var $exec;
      var isRegexMarker;
      var throwRegexMarker;
      var badStringifier;
      var $toString;
      var regexClass;
      module.exports = fn;
    }
  });

  // runtime/node_modules/safe-regex-test/index.js
  var require_safe_regex_test = __commonJS({
    "runtime/node_modules/safe-regex-test/index.js"(exports, module) {
      "use strict";
      var callBound = require_call_bound();
      var isRegex = require_is_regex();
      var $exec = callBound("RegExp.prototype.exec");
      var $TypeError = require_type();
      module.exports = function regexTester(regex) {
        if (!isRegex(regex)) {
          throw new $TypeError("`regex` must be a RegExp");
        }
        return function test(s) {
          return $exec(regex, s) !== null;
        };
      };
    }
  });

  // runtime/node_modules/generator-function/index.js
  var require_generator_function = __commonJS({
    "runtime/node_modules/generator-function/index.js"(exports, module) {
      "use strict";
      var cached = (
        /** @type {GeneratorFunctionConstructor} */
        function* () {
        }.constructor
      );
      module.exports = () => cached;
    }
  });

  // runtime/node_modules/is-generator-function/index.js
  var require_is_generator_function = __commonJS({
    "runtime/node_modules/is-generator-function/index.js"(exports, module) {
      "use strict";
      var callBound = require_call_bound();
      var safeRegexTest = require_safe_regex_test();
      var isFnRegex = safeRegexTest(/^\s*(?:function)?\*/);
      var hasToStringTag = require_shams2()();
      var getProto = require_get_proto();
      var toStr = callBound("Object.prototype.toString");
      var fnToStr = callBound("Function.prototype.toString");
      var getGeneratorFunction = require_generator_function();
      module.exports = function isGeneratorFunction(fn) {
        if (typeof fn !== "function") {
          return false;
        }
        if (isFnRegex(fnToStr(fn))) {
          return true;
        }
        if (!hasToStringTag) {
          var str = toStr(fn);
          return str === "[object GeneratorFunction]";
        }
        if (!getProto) {
          return false;
        }
        var GeneratorFunction = getGeneratorFunction();
        return GeneratorFunction && getProto(fn) === GeneratorFunction.prototype;
      };
    }
  });

  // runtime/node_modules/is-callable/index.js
  var require_is_callable = __commonJS({
    "runtime/node_modules/is-callable/index.js"(exports, module) {
      "use strict";
      var fnToStr = Function.prototype.toString;
      var reflectApply = typeof Reflect === "object" && Reflect !== null && Reflect.apply;
      var badArrayLike;
      var isCallableMarker;
      if (typeof reflectApply === "function" && typeof Object.defineProperty === "function") {
        try {
          badArrayLike = Object.defineProperty({}, "length", {
            get: function() {
              throw isCallableMarker;
            }
          });
          isCallableMarker = {};
          reflectApply(function() {
            throw 42;
          }, null, badArrayLike);
        } catch (_) {
          if (_ !== isCallableMarker) {
            reflectApply = null;
          }
        }
      } else {
        reflectApply = null;
      }
      var constructorRegex = /^\s*class\b/;
      var isES6ClassFn = function isES6ClassFunction(value) {
        try {
          var fnStr = fnToStr.call(value);
          return constructorRegex.test(fnStr);
        } catch (e) {
          return false;
        }
      };
      var tryFunctionObject = function tryFunctionToStr(value) {
        try {
          if (isES6ClassFn(value)) {
            return false;
          }
          fnToStr.call(value);
          return true;
        } catch (e) {
          return false;
        }
      };
      var toStr = Object.prototype.toString;
      var objectClass = "[object Object]";
      var fnClass = "[object Function]";
      var genClass = "[object GeneratorFunction]";
      var ddaClass = "[object HTMLAllCollection]";
      var ddaClass2 = "[object HTML document.all class]";
      var ddaClass3 = "[object HTMLCollection]";
      var hasToStringTag = typeof Symbol === "function" && !!Symbol.toStringTag;
      var isIE68 = !(0 in [,]);
      var isDDA = function isDocumentDotAll() {
        return false;
      };
      if (typeof document === "object") {
        all = document.all;
        if (toStr.call(all) === toStr.call(document.all)) {
          isDDA = function isDocumentDotAll(value) {
            if ((isIE68 || !value) && (typeof value === "undefined" || typeof value === "object")) {
              try {
                var str = toStr.call(value);
                return (str === ddaClass || str === ddaClass2 || str === ddaClass3 || str === objectClass) && value("") == null;
              } catch (e) {
              }
            }
            return false;
          };
        }
      }
      var all;
      module.exports = reflectApply ? function isCallable(value) {
        if (isDDA(value)) {
          return true;
        }
        if (!value) {
          return false;
        }
        if (typeof value !== "function" && typeof value !== "object") {
          return false;
        }
        try {
          reflectApply(value, null, badArrayLike);
        } catch (e) {
          if (e !== isCallableMarker) {
            return false;
          }
        }
        return !isES6ClassFn(value) && tryFunctionObject(value);
      } : function isCallable(value) {
        if (isDDA(value)) {
          return true;
        }
        if (!value) {
          return false;
        }
        if (typeof value !== "function" && typeof value !== "object") {
          return false;
        }
        if (hasToStringTag) {
          return tryFunctionObject(value);
        }
        if (isES6ClassFn(value)) {
          return false;
        }
        var strClass = toStr.call(value);
        if (strClass !== fnClass && strClass !== genClass && !/^\[object HTML/.test(strClass)) {
          return false;
        }
        return tryFunctionObject(value);
      };
    }
  });

  // runtime/node_modules/for-each/index.js
  var require_for_each = __commonJS({
    "runtime/node_modules/for-each/index.js"(exports, module) {
      "use strict";
      var isCallable = require_is_callable();
      var toStr = Object.prototype.toString;
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var forEachArray = function forEachArray2(array, iterator, receiver) {
        for (var i = 0, len = array.length; i < len; i++) {
          if (hasOwnProperty.call(array, i)) {
            if (receiver == null) {
              iterator(array[i], i, array);
            } else {
              iterator.call(receiver, array[i], i, array);
            }
          }
        }
      };
      var forEachString = function forEachString2(string, iterator, receiver) {
        for (var i = 0, len = string.length; i < len; i++) {
          if (receiver == null) {
            iterator(string.charAt(i), i, string);
          } else {
            iterator.call(receiver, string.charAt(i), i, string);
          }
        }
      };
      var forEachObject = function forEachObject2(object, iterator, receiver) {
        for (var k in object) {
          if (hasOwnProperty.call(object, k)) {
            if (receiver == null) {
              iterator(object[k], k, object);
            } else {
              iterator.call(receiver, object[k], k, object);
            }
          }
        }
      };
      function isArray(x) {
        return toStr.call(x) === "[object Array]";
      }
      module.exports = function forEach(list, iterator, thisArg) {
        if (!isCallable(iterator)) {
          throw new TypeError("iterator must be a function");
        }
        var receiver;
        if (arguments.length >= 3) {
          receiver = thisArg;
        }
        if (isArray(list)) {
          forEachArray(list, iterator, receiver);
        } else if (typeof list === "string") {
          forEachString(list, iterator, receiver);
        } else {
          forEachObject(list, iterator, receiver);
        }
      };
    }
  });

  // runtime/node_modules/possible-typed-array-names/index.js
  var require_possible_typed_array_names = __commonJS({
    "runtime/node_modules/possible-typed-array-names/index.js"(exports, module) {
      "use strict";
      module.exports = [
        "Float16Array",
        "Float32Array",
        "Float64Array",
        "Int8Array",
        "Int16Array",
        "Int32Array",
        "Uint8Array",
        "Uint8ClampedArray",
        "Uint16Array",
        "Uint32Array",
        "BigInt64Array",
        "BigUint64Array"
      ];
    }
  });

  // runtime/node_modules/available-typed-arrays/index.js
  var require_available_typed_arrays = __commonJS({
    "runtime/node_modules/available-typed-arrays/index.js"(exports, module) {
      "use strict";
      var possibleNames = require_possible_typed_array_names();
      var g = typeof globalThis === "undefined" ? global : globalThis;
      module.exports = function availableTypedArrays() {
        var out = [];
        for (var i = 0; i < possibleNames.length; i++) {
          if (typeof g[possibleNames[i]] === "function") {
            out[out.length] = possibleNames[i];
          }
        }
        return out;
      };
    }
  });

  // runtime/node_modules/define-data-property/index.js
  var require_define_data_property = __commonJS({
    "runtime/node_modules/define-data-property/index.js"(exports, module) {
      "use strict";
      var $defineProperty = require_es_define_property();
      var $SyntaxError = require_syntax();
      var $TypeError = require_type();
      var gopd = require_gopd();
      module.exports = function defineDataProperty(obj, property, value) {
        if (!obj || typeof obj !== "object" && typeof obj !== "function") {
          throw new $TypeError("`obj` must be an object or a function`");
        }
        if (typeof property !== "string" && typeof property !== "symbol") {
          throw new $TypeError("`property` must be a string or a symbol`");
        }
        if (arguments.length > 3 && typeof arguments[3] !== "boolean" && arguments[3] !== null) {
          throw new $TypeError("`nonEnumerable`, if provided, must be a boolean or null");
        }
        if (arguments.length > 4 && typeof arguments[4] !== "boolean" && arguments[4] !== null) {
          throw new $TypeError("`nonWritable`, if provided, must be a boolean or null");
        }
        if (arguments.length > 5 && typeof arguments[5] !== "boolean" && arguments[5] !== null) {
          throw new $TypeError("`nonConfigurable`, if provided, must be a boolean or null");
        }
        if (arguments.length > 6 && typeof arguments[6] !== "boolean") {
          throw new $TypeError("`loose`, if provided, must be a boolean");
        }
        var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
        var nonWritable = arguments.length > 4 ? arguments[4] : null;
        var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
        var loose = arguments.length > 6 ? arguments[6] : false;
        var desc = !!gopd && gopd(obj, property);
        if ($defineProperty) {
          $defineProperty(obj, property, {
            configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
            enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
            value,
            writable: nonWritable === null && desc ? desc.writable : !nonWritable
          });
        } else if (loose || !nonEnumerable && !nonWritable && !nonConfigurable) {
          obj[property] = value;
        } else {
          throw new $SyntaxError("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
        }
      };
    }
  });

  // runtime/node_modules/has-property-descriptors/index.js
  var require_has_property_descriptors = __commonJS({
    "runtime/node_modules/has-property-descriptors/index.js"(exports, module) {
      "use strict";
      var $defineProperty = require_es_define_property();
      var hasPropertyDescriptors = function hasPropertyDescriptors2() {
        return !!$defineProperty;
      };
      hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
        if (!$defineProperty) {
          return null;
        }
        try {
          return $defineProperty([], "length", { value: 1 }).length !== 1;
        } catch (e) {
          return true;
        }
      };
      module.exports = hasPropertyDescriptors;
    }
  });

  // runtime/node_modules/set-function-length/index.js
  var require_set_function_length = __commonJS({
    "runtime/node_modules/set-function-length/index.js"(exports, module) {
      "use strict";
      var GetIntrinsic = require_get_intrinsic();
      var define = require_define_data_property();
      var hasDescriptors = require_has_property_descriptors()();
      var gOPD = require_gopd();
      var $TypeError = require_type();
      var $floor = GetIntrinsic("%Math.floor%");
      module.exports = function setFunctionLength(fn, length) {
        if (typeof fn !== "function") {
          throw new $TypeError("`fn` is not a function");
        }
        if (typeof length !== "number" || length < 0 || length > 4294967295 || $floor(length) !== length) {
          throw new $TypeError("`length` must be a positive 32-bit integer");
        }
        var loose = arguments.length > 2 && !!arguments[2];
        var functionLengthIsConfigurable = true;
        var functionLengthIsWritable = true;
        if ("length" in fn && gOPD) {
          var desc = gOPD(fn, "length");
          if (desc && !desc.configurable) {
            functionLengthIsConfigurable = false;
          }
          if (desc && !desc.writable) {
            functionLengthIsWritable = false;
          }
        }
        if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
          if (hasDescriptors) {
            define(
              /** @type {Parameters<define>[0]} */
              fn,
              "length",
              length,
              true,
              true
            );
          } else {
            define(
              /** @type {Parameters<define>[0]} */
              fn,
              "length",
              length
            );
          }
        }
        return fn;
      };
    }
  });

  // runtime/node_modules/call-bind-apply-helpers/applyBind.js
  var require_applyBind = __commonJS({
    "runtime/node_modules/call-bind-apply-helpers/applyBind.js"(exports, module) {
      "use strict";
      var bind = require_function_bind();
      var $apply = require_functionApply();
      var actualApply = require_actualApply();
      module.exports = function applyBind() {
        return actualApply(bind, $apply, arguments);
      };
    }
  });

  // runtime/node_modules/call-bind/index.js
  var require_call_bind = __commonJS({
    "runtime/node_modules/call-bind/index.js"(exports, module) {
      "use strict";
      var setFunctionLength = require_set_function_length();
      var $defineProperty = require_es_define_property();
      var callBindBasic = require_call_bind_apply_helpers();
      var applyBind = require_applyBind();
      module.exports = function callBind(originalFunction) {
        var func = callBindBasic(arguments);
        var adjustedLength = 1 + originalFunction.length - (arguments.length - 1);
        return setFunctionLength(
          func,
          adjustedLength > 0 ? adjustedLength : 0,
          true
        );
      };
      if ($defineProperty) {
        $defineProperty(module.exports, "apply", { value: applyBind });
      } else {
        module.exports.apply = applyBind;
      }
    }
  });

  // runtime/node_modules/which-typed-array/index.js
  var require_which_typed_array = __commonJS({
    "runtime/node_modules/which-typed-array/index.js"(exports, module) {
      "use strict";
      var forEach = require_for_each();
      var availableTypedArrays = require_available_typed_arrays();
      var callBind = require_call_bind();
      var callBound = require_call_bound();
      var gOPD = require_gopd();
      var getProto = require_get_proto();
      var $toString = callBound("Object.prototype.toString");
      var hasToStringTag = require_shams2()();
      var g = typeof globalThis === "undefined" ? global : globalThis;
      var typedArrays = availableTypedArrays();
      var $slice = callBound("String.prototype.slice");
      var $indexOf = callBound("Array.prototype.indexOf", true) || function indexOf(array, value) {
        for (var i = 0; i < array.length; i += 1) {
          if (array[i] === value) {
            return i;
          }
        }
        return -1;
      };
      var cache = { __proto__: null };
      if (hasToStringTag && gOPD && getProto) {
        forEach(typedArrays, function(typedArray) {
          var arr = new g[typedArray]();
          if (Symbol.toStringTag in arr && getProto) {
            var proto = getProto(arr);
            var descriptor = gOPD(proto, Symbol.toStringTag);
            if (!descriptor && proto) {
              var superProto = getProto(proto);
              descriptor = gOPD(superProto, Symbol.toStringTag);
            }
            if (descriptor && descriptor.get) {
              var bound = callBind(descriptor.get);
              cache[
                /** @type {`$${TypedArrayName}`} */
                "$" + typedArray
              ] = bound;
            }
          }
        });
      } else {
        forEach(typedArrays, function(typedArray) {
          var arr = new g[typedArray]();
          var fn = arr.slice || arr.set;
          if (fn) {
            var bound = (
              /** @type {typeof BoundSlice | typeof BoundSet} */
              // @ts-expect-error TODO FIXME
              callBind(fn)
            );
            cache[
              /** @type {`$${TypedArrayName}`} */
              "$" + typedArray
            ] = bound;
          }
        });
      }
      function tryTypedArrays(value) {
        var found = false;
        forEach(
          /** @type {Record<`$${TypedArrayName}`, Getter>} */
          cache,
          /** @param {Getter} getter @param {`$${TypedArrayName}`} typedArray */
          function(getter, typedArray) {
            if (!found) {
              try {
                if ("$" + getter(value) === typedArray) {
                  found = /** @type {TypedArrayName} */
                  $slice(typedArray, 1);
                }
              } catch (e) {
              }
            }
          }
        );
        return found;
      }
      function trySlices(value) {
        var found = false;
        forEach(
          /** @type {Record<`$${TypedArrayName}`, Getter>} */
          cache,
          /** @param {Getter} getter @param {`$${TypedArrayName}`} name */
          function(getter, name) {
            if (!found) {
              try {
                getter(value);
                found = /** @type {TypedArrayName} */
                $slice(name, 1);
              } catch (e) {
              }
            }
          }
        );
        return found;
      }
      function isTATag(tag) {
        return $indexOf(typedArrays, tag) > -1;
      }
      function whichTypedArray(value) {
        if (!value || typeof value !== "object") {
          return false;
        }
        if (!hasToStringTag) {
          var tag = $slice($toString(value), 8, -1);
          if (isTATag(tag)) {
            return tag;
          }
          if (tag !== "Object") {
            return false;
          }
          return trySlices(value);
        }
        if (!gOPD) {
          return null;
        }
        return tryTypedArrays(value);
      }
      module.exports = whichTypedArray;
    }
  });

  // runtime/node_modules/is-typed-array/index.js
  var require_is_typed_array = __commonJS({
    "runtime/node_modules/is-typed-array/index.js"(exports, module) {
      "use strict";
      var whichTypedArray = require_which_typed_array();
      module.exports = function isTypedArray(value) {
        return !!whichTypedArray(value);
      };
    }
  });

  // runtime/node_modules/util/support/types.js
  var require_types = __commonJS({
    "runtime/node_modules/util/support/types.js"(exports) {
      "use strict";
      var isArgumentsObject = require_is_arguments();
      var isGeneratorFunction = require_is_generator_function();
      var whichTypedArray = require_which_typed_array();
      var isTypedArray = require_is_typed_array();
      function uncurryThis(f) {
        return f.call.bind(f);
      }
      var BigIntSupported = typeof BigInt !== "undefined";
      var SymbolSupported = typeof Symbol !== "undefined";
      var ObjectToString = uncurryThis(Object.prototype.toString);
      var numberValue = uncurryThis(Number.prototype.valueOf);
      var stringValue = uncurryThis(String.prototype.valueOf);
      var booleanValue = uncurryThis(Boolean.prototype.valueOf);
      if (BigIntSupported) {
        bigIntValue = uncurryThis(BigInt.prototype.valueOf);
      }
      var bigIntValue;
      if (SymbolSupported) {
        symbolValue = uncurryThis(Symbol.prototype.valueOf);
      }
      var symbolValue;
      function checkBoxedPrimitive(value, prototypeValueOf) {
        if (typeof value !== "object") {
          return false;
        }
        try {
          prototypeValueOf(value);
          return true;
        } catch (e) {
          return false;
        }
      }
      exports.isArgumentsObject = isArgumentsObject;
      exports.isGeneratorFunction = isGeneratorFunction;
      exports.isTypedArray = isTypedArray;
      function isPromise(input) {
        return typeof Promise !== "undefined" && input instanceof Promise || input !== null && typeof input === "object" && typeof input.then === "function" && typeof input.catch === "function";
      }
      exports.isPromise = isPromise;
      function isArrayBufferView(value) {
        if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
          return ArrayBuffer.isView(value);
        }
        return isTypedArray(value) || isDataView(value);
      }
      exports.isArrayBufferView = isArrayBufferView;
      function isUint8Array(value) {
        return whichTypedArray(value) === "Uint8Array";
      }
      exports.isUint8Array = isUint8Array;
      function isUint8ClampedArray(value) {
        return whichTypedArray(value) === "Uint8ClampedArray";
      }
      exports.isUint8ClampedArray = isUint8ClampedArray;
      function isUint16Array(value) {
        return whichTypedArray(value) === "Uint16Array";
      }
      exports.isUint16Array = isUint16Array;
      function isUint32Array(value) {
        return whichTypedArray(value) === "Uint32Array";
      }
      exports.isUint32Array = isUint32Array;
      function isInt8Array(value) {
        return whichTypedArray(value) === "Int8Array";
      }
      exports.isInt8Array = isInt8Array;
      function isInt16Array(value) {
        return whichTypedArray(value) === "Int16Array";
      }
      exports.isInt16Array = isInt16Array;
      function isInt32Array(value) {
        return whichTypedArray(value) === "Int32Array";
      }
      exports.isInt32Array = isInt32Array;
      function isFloat32Array(value) {
        return whichTypedArray(value) === "Float32Array";
      }
      exports.isFloat32Array = isFloat32Array;
      function isFloat64Array(value) {
        return whichTypedArray(value) === "Float64Array";
      }
      exports.isFloat64Array = isFloat64Array;
      function isBigInt64Array(value) {
        return whichTypedArray(value) === "BigInt64Array";
      }
      exports.isBigInt64Array = isBigInt64Array;
      function isBigUint64Array(value) {
        return whichTypedArray(value) === "BigUint64Array";
      }
      exports.isBigUint64Array = isBigUint64Array;
      function isMapToString(value) {
        return ObjectToString(value) === "[object Map]";
      }
      isMapToString.working = typeof Map !== "undefined" && isMapToString(/* @__PURE__ */ new Map());
      function isMap(value) {
        if (typeof Map === "undefined") {
          return false;
        }
        return isMapToString.working ? isMapToString(value) : value instanceof Map;
      }
      exports.isMap = isMap;
      function isSetToString(value) {
        return ObjectToString(value) === "[object Set]";
      }
      isSetToString.working = typeof Set !== "undefined" && isSetToString(/* @__PURE__ */ new Set());
      function isSet(value) {
        if (typeof Set === "undefined") {
          return false;
        }
        return isSetToString.working ? isSetToString(value) : value instanceof Set;
      }
      exports.isSet = isSet;
      function isWeakMapToString(value) {
        return ObjectToString(value) === "[object WeakMap]";
      }
      isWeakMapToString.working = typeof WeakMap !== "undefined" && isWeakMapToString(/* @__PURE__ */ new WeakMap());
      function isWeakMap(value) {
        if (typeof WeakMap === "undefined") {
          return false;
        }
        return isWeakMapToString.working ? isWeakMapToString(value) : value instanceof WeakMap;
      }
      exports.isWeakMap = isWeakMap;
      function isWeakSetToString(value) {
        return ObjectToString(value) === "[object WeakSet]";
      }
      isWeakSetToString.working = typeof WeakSet !== "undefined" && isWeakSetToString(/* @__PURE__ */ new WeakSet());
      function isWeakSet(value) {
        return isWeakSetToString(value);
      }
      exports.isWeakSet = isWeakSet;
      function isArrayBufferToString(value) {
        return ObjectToString(value) === "[object ArrayBuffer]";
      }
      isArrayBufferToString.working = typeof ArrayBuffer !== "undefined" && isArrayBufferToString(new ArrayBuffer());
      function isArrayBuffer(value) {
        if (typeof ArrayBuffer === "undefined") {
          return false;
        }
        return isArrayBufferToString.working ? isArrayBufferToString(value) : value instanceof ArrayBuffer;
      }
      exports.isArrayBuffer = isArrayBuffer;
      function isDataViewToString(value) {
        return ObjectToString(value) === "[object DataView]";
      }
      isDataViewToString.working = typeof ArrayBuffer !== "undefined" && typeof DataView !== "undefined" && isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1));
      function isDataView(value) {
        if (typeof DataView === "undefined") {
          return false;
        }
        return isDataViewToString.working ? isDataViewToString(value) : value instanceof DataView;
      }
      exports.isDataView = isDataView;
      var SharedArrayBufferCopy = typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : void 0;
      function isSharedArrayBufferToString(value) {
        return ObjectToString(value) === "[object SharedArrayBuffer]";
      }
      function isSharedArrayBuffer(value) {
        if (typeof SharedArrayBufferCopy === "undefined") {
          return false;
        }
        if (typeof isSharedArrayBufferToString.working === "undefined") {
          isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
        }
        return isSharedArrayBufferToString.working ? isSharedArrayBufferToString(value) : value instanceof SharedArrayBufferCopy;
      }
      exports.isSharedArrayBuffer = isSharedArrayBuffer;
      function isAsyncFunction(value) {
        return ObjectToString(value) === "[object AsyncFunction]";
      }
      exports.isAsyncFunction = isAsyncFunction;
      function isMapIterator(value) {
        return ObjectToString(value) === "[object Map Iterator]";
      }
      exports.isMapIterator = isMapIterator;
      function isSetIterator(value) {
        return ObjectToString(value) === "[object Set Iterator]";
      }
      exports.isSetIterator = isSetIterator;
      function isGeneratorObject(value) {
        return ObjectToString(value) === "[object Generator]";
      }
      exports.isGeneratorObject = isGeneratorObject;
      function isWebAssemblyCompiledModule(value) {
        return ObjectToString(value) === "[object WebAssembly.Module]";
      }
      exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;
      function isNumberObject(value) {
        return checkBoxedPrimitive(value, numberValue);
      }
      exports.isNumberObject = isNumberObject;
      function isStringObject(value) {
        return checkBoxedPrimitive(value, stringValue);
      }
      exports.isStringObject = isStringObject;
      function isBooleanObject(value) {
        return checkBoxedPrimitive(value, booleanValue);
      }
      exports.isBooleanObject = isBooleanObject;
      function isBigIntObject(value) {
        return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
      }
      exports.isBigIntObject = isBigIntObject;
      function isSymbolObject(value) {
        return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
      }
      exports.isSymbolObject = isSymbolObject;
      function isBoxedPrimitive(value) {
        return isNumberObject(value) || isStringObject(value) || isBooleanObject(value) || isBigIntObject(value) || isSymbolObject(value);
      }
      exports.isBoxedPrimitive = isBoxedPrimitive;
      function isAnyArrayBuffer(value) {
        return typeof Uint8Array !== "undefined" && (isArrayBuffer(value) || isSharedArrayBuffer(value));
      }
      exports.isAnyArrayBuffer = isAnyArrayBuffer;
      ["isProxy", "isExternal", "isModuleNamespaceObject"].forEach(function(method) {
        Object.defineProperty(exports, method, {
          enumerable: false,
          value: function() {
            throw new Error(method + " is not supported in userland");
          }
        });
      });
    }
  });

  // runtime/node_modules/util/support/isBufferBrowser.js
  var require_isBufferBrowser = __commonJS({
    "runtime/node_modules/util/support/isBufferBrowser.js"(exports, module) {
      module.exports = function isBuffer(arg) {
        return arg && typeof arg === "object" && typeof arg.copy === "function" && typeof arg.fill === "function" && typeof arg.readUInt8 === "function";
      };
    }
  });

  // runtime/node_modules/inherits/inherits_browser.js
  var require_inherits_browser = __commonJS({
    "runtime/node_modules/inherits/inherits_browser.js"(exports, module) {
      if (typeof Object.create === "function") {
        module.exports = function inherits(ctor, superCtor) {
          if (superCtor) {
            ctor.super_ = superCtor;
            ctor.prototype = Object.create(superCtor.prototype, {
              constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true
              }
            });
          }
        };
      } else {
        module.exports = function inherits(ctor, superCtor) {
          if (superCtor) {
            ctor.super_ = superCtor;
            var TempCtor = function() {
            };
            TempCtor.prototype = superCtor.prototype;
            ctor.prototype = new TempCtor();
            ctor.prototype.constructor = ctor;
          }
        };
      }
    }
  });

  // runtime/node_modules/util/util.js
  var require_util = __commonJS({
    "runtime/node_modules/util/util.js"(exports) {
      var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors2(obj) {
        var keys = Object.keys(obj);
        var descriptors = {};
        for (var i = 0; i < keys.length; i++) {
          descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
        }
        return descriptors;
      };
      var formatRegExp = /%[sdj%]/g;
      exports.format = function(f) {
        if (!isString(f)) {
          var objects = [];
          for (var i = 0; i < arguments.length; i++) {
            objects.push(inspect(arguments[i]));
          }
          return objects.join(" ");
        }
        var i = 1;
        var args = arguments;
        var len = args.length;
        var str = String(f).replace(formatRegExp, function(x2) {
          if (x2 === "%%") return "%";
          if (i >= len) return x2;
          switch (x2) {
            case "%s":
              return String(args[i++]);
            case "%d":
              return Number(args[i++]);
            case "%j":
              try {
                return JSON.stringify(args[i++]);
              } catch (_) {
                return "[Circular]";
              }
            default:
              return x2;
          }
        });
        for (var x = args[i]; i < len; x = args[++i]) {
          if (isNull(x) || !isObject(x)) {
            str += " " + x;
          } else {
            str += " " + inspect(x);
          }
        }
        return str;
      };
      exports.deprecate = function(fn, msg) {
        if (typeof process !== "undefined" && process.noDeprecation === true) {
          return fn;
        }
        if (typeof process === "undefined") {
          return function() {
            return exports.deprecate(fn, msg).apply(this, arguments);
          };
        }
        var warned = false;
        function deprecated() {
          if (!warned) {
            if (process.throwDeprecation) {
              throw new Error(msg);
            } else if (process.traceDeprecation) {
              console.trace(msg);
            } else {
              console.error(msg);
            }
            warned = true;
          }
          return fn.apply(this, arguments);
        }
        return deprecated;
      };
      var debugs = {};
      var debugEnvRegex = /^$/;
      if (process.env.NODE_DEBUG) {
        debugEnv = process.env.NODE_DEBUG;
        debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase();
        debugEnvRegex = new RegExp("^" + debugEnv + "$", "i");
      }
      var debugEnv;
      exports.debuglog = function(set) {
        set = set.toUpperCase();
        if (!debugs[set]) {
          if (debugEnvRegex.test(set)) {
            var pid = process.pid;
            debugs[set] = function() {
              var msg = exports.format.apply(exports, arguments);
              console.error("%s %d: %s", set, pid, msg);
            };
          } else {
            debugs[set] = function() {
            };
          }
        }
        return debugs[set];
      };
      function inspect(obj, opts) {
        var ctx = {
          seen: [],
          stylize: stylizeNoColor
        };
        if (arguments.length >= 3) ctx.depth = arguments[2];
        if (arguments.length >= 4) ctx.colors = arguments[3];
        if (isBoolean(opts)) {
          ctx.showHidden = opts;
        } else if (opts) {
          exports._extend(ctx, opts);
        }
        if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
        if (isUndefined(ctx.depth)) ctx.depth = 2;
        if (isUndefined(ctx.colors)) ctx.colors = false;
        if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
        if (ctx.colors) ctx.stylize = stylizeWithColor;
        return formatValue(ctx, obj, ctx.depth);
      }
      exports.inspect = inspect;
      inspect.colors = {
        "bold": [1, 22],
        "italic": [3, 23],
        "underline": [4, 24],
        "inverse": [7, 27],
        "white": [37, 39],
        "grey": [90, 39],
        "black": [30, 39],
        "blue": [34, 39],
        "cyan": [36, 39],
        "green": [32, 39],
        "magenta": [35, 39],
        "red": [31, 39],
        "yellow": [33, 39]
      };
      inspect.styles = {
        "special": "cyan",
        "number": "yellow",
        "boolean": "yellow",
        "undefined": "grey",
        "null": "bold",
        "string": "green",
        "date": "magenta",
        // "name": intentionally not styling
        "regexp": "red"
      };
      function stylizeWithColor(str, styleType) {
        var style = inspect.styles[styleType];
        if (style) {
          return "\x1B[" + inspect.colors[style][0] + "m" + str + "\x1B[" + inspect.colors[style][1] + "m";
        } else {
          return str;
        }
      }
      function stylizeNoColor(str, styleType) {
        return str;
      }
      function arrayToHash(array) {
        var hash = {};
        array.forEach(function(val, idx) {
          hash[val] = true;
        });
        return hash;
      }
      function formatValue(ctx, value, recurseTimes) {
        if (ctx.customInspect && value && isFunction(value.inspect) && // Filter out the util module, it's inspect function is special
        value.inspect !== exports.inspect && // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
          var ret = value.inspect(recurseTimes, ctx);
          if (!isString(ret)) {
            ret = formatValue(ctx, ret, recurseTimes);
          }
          return ret;
        }
        var primitive = formatPrimitive(ctx, value);
        if (primitive) {
          return primitive;
        }
        var keys = Object.keys(value);
        var visibleKeys = arrayToHash(keys);
        if (ctx.showHidden) {
          keys = Object.getOwnPropertyNames(value);
        }
        if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
          return formatError(value);
        }
        if (keys.length === 0) {
          if (isFunction(value)) {
            var name = value.name ? ": " + value.name : "";
            return ctx.stylize("[Function" + name + "]", "special");
          }
          if (isRegExp(value)) {
            return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
          }
          if (isDate(value)) {
            return ctx.stylize(Date.prototype.toString.call(value), "date");
          }
          if (isError(value)) {
            return formatError(value);
          }
        }
        var base = "", array = false, braces = ["{", "}"];
        if (isArray(value)) {
          array = true;
          braces = ["[", "]"];
        }
        if (isFunction(value)) {
          var n = value.name ? ": " + value.name : "";
          base = " [Function" + n + "]";
        }
        if (isRegExp(value)) {
          base = " " + RegExp.prototype.toString.call(value);
        }
        if (isDate(value)) {
          base = " " + Date.prototype.toUTCString.call(value);
        }
        if (isError(value)) {
          base = " " + formatError(value);
        }
        if (keys.length === 0 && (!array || value.length == 0)) {
          return braces[0] + base + braces[1];
        }
        if (recurseTimes < 0) {
          if (isRegExp(value)) {
            return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
          } else {
            return ctx.stylize("[Object]", "special");
          }
        }
        ctx.seen.push(value);
        var output;
        if (array) {
          output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
        } else {
          output = keys.map(function(key) {
            return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
          });
        }
        ctx.seen.pop();
        return reduceToSingleString(output, base, braces);
      }
      function formatPrimitive(ctx, value) {
        if (isUndefined(value))
          return ctx.stylize("undefined", "undefined");
        if (isString(value)) {
          var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
          return ctx.stylize(simple, "string");
        }
        if (isNumber(value))
          return ctx.stylize("" + value, "number");
        if (isBoolean(value))
          return ctx.stylize("" + value, "boolean");
        if (isNull(value))
          return ctx.stylize("null", "null");
      }
      function formatError(value) {
        return "[" + Error.prototype.toString.call(value) + "]";
      }
      function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
        var output = [];
        for (var i = 0, l = value.length; i < l; ++i) {
          if (hasOwnProperty(value, String(i))) {
            output.push(formatProperty(
              ctx,
              value,
              recurseTimes,
              visibleKeys,
              String(i),
              true
            ));
          } else {
            output.push("");
          }
        }
        keys.forEach(function(key) {
          if (!key.match(/^\d+$/)) {
            output.push(formatProperty(
              ctx,
              value,
              recurseTimes,
              visibleKeys,
              key,
              true
            ));
          }
        });
        return output;
      }
      function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
        var name, str, desc;
        desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
        if (desc.get) {
          if (desc.set) {
            str = ctx.stylize("[Getter/Setter]", "special");
          } else {
            str = ctx.stylize("[Getter]", "special");
          }
        } else {
          if (desc.set) {
            str = ctx.stylize("[Setter]", "special");
          }
        }
        if (!hasOwnProperty(visibleKeys, key)) {
          name = "[" + key + "]";
        }
        if (!str) {
          if (ctx.seen.indexOf(desc.value) < 0) {
            if (isNull(recurseTimes)) {
              str = formatValue(ctx, desc.value, null);
            } else {
              str = formatValue(ctx, desc.value, recurseTimes - 1);
            }
            if (str.indexOf("\n") > -1) {
              if (array) {
                str = str.split("\n").map(function(line) {
                  return "  " + line;
                }).join("\n").slice(2);
              } else {
                str = "\n" + str.split("\n").map(function(line) {
                  return "   " + line;
                }).join("\n");
              }
            }
          } else {
            str = ctx.stylize("[Circular]", "special");
          }
        }
        if (isUndefined(name)) {
          if (array && key.match(/^\d+$/)) {
            return str;
          }
          name = JSON.stringify("" + key);
          if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
            name = name.slice(1, -1);
            name = ctx.stylize(name, "name");
          } else {
            name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
            name = ctx.stylize(name, "string");
          }
        }
        return name + ": " + str;
      }
      function reduceToSingleString(output, base, braces) {
        var numLinesEst = 0;
        var length = output.reduce(function(prev, cur) {
          numLinesEst++;
          if (cur.indexOf("\n") >= 0) numLinesEst++;
          return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
        }, 0);
        if (length > 60) {
          return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
        }
        return braces[0] + base + " " + output.join(", ") + " " + braces[1];
      }
      exports.types = require_types();
      function isArray(ar) {
        return Array.isArray(ar);
      }
      exports.isArray = isArray;
      function isBoolean(arg) {
        return typeof arg === "boolean";
      }
      exports.isBoolean = isBoolean;
      function isNull(arg) {
        return arg === null;
      }
      exports.isNull = isNull;
      function isNullOrUndefined(arg) {
        return arg == null;
      }
      exports.isNullOrUndefined = isNullOrUndefined;
      function isNumber(arg) {
        return typeof arg === "number";
      }
      exports.isNumber = isNumber;
      function isString(arg) {
        return typeof arg === "string";
      }
      exports.isString = isString;
      function isSymbol(arg) {
        return typeof arg === "symbol";
      }
      exports.isSymbol = isSymbol;
      function isUndefined(arg) {
        return arg === void 0;
      }
      exports.isUndefined = isUndefined;
      function isRegExp(re) {
        return isObject(re) && objectToString(re) === "[object RegExp]";
      }
      exports.isRegExp = isRegExp;
      exports.types.isRegExp = isRegExp;
      function isObject(arg) {
        return typeof arg === "object" && arg !== null;
      }
      exports.isObject = isObject;
      function isDate(d) {
        return isObject(d) && objectToString(d) === "[object Date]";
      }
      exports.isDate = isDate;
      exports.types.isDate = isDate;
      function isError(e) {
        return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
      }
      exports.isError = isError;
      exports.types.isNativeError = isError;
      function isFunction(arg) {
        return typeof arg === "function";
      }
      exports.isFunction = isFunction;
      function isPrimitive(arg) {
        return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || // ES6 symbol
        typeof arg === "undefined";
      }
      exports.isPrimitive = isPrimitive;
      exports.isBuffer = require_isBufferBrowser();
      function objectToString(o) {
        return Object.prototype.toString.call(o);
      }
      function pad(n) {
        return n < 10 ? "0" + n.toString(10) : n.toString(10);
      }
      var months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
      function timestamp() {
        var d = /* @__PURE__ */ new Date();
        var time = [
          pad(d.getHours()),
          pad(d.getMinutes()),
          pad(d.getSeconds())
        ].join(":");
        return [d.getDate(), months[d.getMonth()], time].join(" ");
      }
      exports.log = function() {
        console.log("%s - %s", timestamp(), exports.format.apply(exports, arguments));
      };
      exports.inherits = require_inherits_browser();
      exports._extend = function(origin, add) {
        if (!add || !isObject(add)) return origin;
        var keys = Object.keys(add);
        var i = keys.length;
        while (i--) {
          origin[keys[i]] = add[keys[i]];
        }
        return origin;
      };
      function hasOwnProperty(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
      }
      var kCustomPromisifiedSymbol = typeof Symbol !== "undefined" ? Symbol("util.promisify.custom") : void 0;
      exports.promisify = function promisify(original) {
        if (typeof original !== "function")
          throw new TypeError('The "original" argument must be of type Function');
        if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
          var fn = original[kCustomPromisifiedSymbol];
          if (typeof fn !== "function") {
            throw new TypeError('The "util.promisify.custom" argument must be of type Function');
          }
          Object.defineProperty(fn, kCustomPromisifiedSymbol, {
            value: fn,
            enumerable: false,
            writable: false,
            configurable: true
          });
          return fn;
        }
        function fn() {
          var promiseResolve, promiseReject;
          var promise = new Promise(function(resolve, reject) {
            promiseResolve = resolve;
            promiseReject = reject;
          });
          var args = [];
          for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
          }
          args.push(function(err, value) {
            if (err) {
              promiseReject(err);
            } else {
              promiseResolve(value);
            }
          });
          try {
            original.apply(this, args);
          } catch (err) {
            promiseReject(err);
          }
          return promise;
        }
        Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
        if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
          value: fn,
          enumerable: false,
          writable: false,
          configurable: true
        });
        return Object.defineProperties(
          fn,
          getOwnPropertyDescriptors(original)
        );
      };
      exports.promisify.custom = kCustomPromisifiedSymbol;
      function callbackifyOnRejected(reason, cb) {
        if (!reason) {
          var newReason = new Error("Promise was rejected with a falsy value");
          newReason.reason = reason;
          reason = newReason;
        }
        return cb(reason);
      }
      function callbackify(original) {
        if (typeof original !== "function") {
          throw new TypeError('The "original" argument must be of type Function');
        }
        function callbackified() {
          var args = [];
          for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
          }
          var maybeCb = args.pop();
          if (typeof maybeCb !== "function") {
            throw new TypeError("The last argument must be of type Function");
          }
          var self = this;
          var cb = function() {
            return maybeCb.apply(self, arguments);
          };
          original.apply(this, args).then(
            function(ret) {
              process.nextTick(cb.bind(null, null, ret));
            },
            function(rej) {
              process.nextTick(callbackifyOnRejected.bind(null, rej, cb));
            }
          );
        }
        Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
        Object.defineProperties(
          callbackified,
          getOwnPropertyDescriptors(original)
        );
        return callbackified;
      }
      exports.callbackify = callbackify;
    }
  });

  // runtime/src/protocol-json.cjs
  var require_protocol_json = __commonJS({
    "runtime/src/protocol-json.cjs"(exports, module) {
      "use strict";
      function createProtocolJSON() {
        const frame = document.createElement("iframe");
        frame.style.display = "none";
        try {
          document.documentElement.appendChild(frame);
          const realm = frame.contentWindow;
          const parser = realm.JSON;
          const array = parser.parse("[1,2]");
          const object = parser.parse('{"value":1}');
          const derived = array.filter(() => true).map((value) => value);
          const keys = (value) => {
            const names = [];
            for (const key in value) names.push(key);
            return names.join(",");
          };
          if (realm.Array.prototype === Array.prototype || realm.Object.prototype === Object.prototype || Object.getPrototypeOf(derived) !== realm.Array.prototype || Object.getPrototypeOf(object) !== realm.Object.prototype || keys(array) !== "0,1" || keys(derived) !== "0,1" || keys(object) !== "value")
            throw new Error("Protocol realm has modified prototypes");
          return { parse: parser.parse.bind(parser) };
        } catch (error) {
          console.warn("Protocol realm initialization failed", error);
          return { parse: JSON.parse.bind(JSON) };
        } finally {
          frame.remove();
        }
      }
      module.exports = { createProtocolJSON };
    }
  });

  // runtime/src/fs-cache.cjs
  var require_fs_cache = __commonJS({
    "runtime/src/fs-cache.cjs"(exports, module) {
      function createNodeFsModules(ctx) {
        const globalScope = typeof window !== "undefined" && window || typeof globalThis !== "undefined" && globalThis || {};
        const fsOri = ctx && ctx.fsOri;
        const path = ctx && ctx.path || (typeof __require === "function" ? require_path() : void 0);
        const util = ctx && ctx.util || (typeof __require === "function" ? require_util() : void 0);
        const Buffer2 = ctx && ctx.Buffer || globalScope.Buffer;
        const process2 = ctx && ctx.process || globalScope.process;
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
            if (cacheName === "writeCache") {
              const cost = (entry) => entry && entry.data ? entry.data.byteLength : 0;
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
            obj._direntType = types.findIndex((method) => obj[method]()) + 1;
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
              if (own && !own.configurable && "value" in own && !own.writable) return own.value;
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
            return path.resolve(process2.cwd(), p);
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
              } else if (typeof process2 !== "undefined" && typeof process2.cwd === "function") {
                root = process2.cwd();
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
                if (options && options.throwIfNoEntry === false && statCache.code === "ENOENT") return void 0;
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
              if (options && options.throwIfNoEntry === false && e.code === "ENOENT") return void 0;
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
                const name = Buffer2.isBuffer(e) ? e.toString() : String(e);
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
              buffer = Buffer2.from(data + "", typeof options === "string" ? options : options && options.encoding || "utf8");
            } else if (data instanceof Uint8Array) {
              buffer = Buffer2.from(data);
            } else if (data instanceof Buffer2) {
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
            const flag = options && typeof options === "object" && options.flag;
            if (buffer.byteLength > FakeFsSharedCache._config.maxFileBytes || flag && !["w", "wx"].includes(flag)) this._deleteCacheEntry("writeCache", filePath);
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
              buffer = Buffer2.from(data, typeof options === "string" ? options : options && options.encoding || "utf8");
            } else if (data instanceof Uint8Array) {
              buffer = Buffer2.from(data);
            } else if (data instanceof Buffer2) {
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
              existingData = Buffer2.alloc(0);
            }
            const newData = Buffer2.alloc(existingData.length + buffer.length);
            newData.set(existingData);
            newData.set(buffer, existingData.length);
            const writeOptions = typeof options === "string" ? { encoding: options } : { ...options };
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
              return Buffer2.from(fileData).toString(encoding);
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
    }
  });

  // runtime/src/url-browser.cjs
  var require_url_browser = __commonJS({
    "runtime/src/url-browser.cjs"(exports, module) {
      "use strict";
      module.exports = function createUrl(sync) {
        const call = (method, args) => sync({ op: "url", method, args });
        function Url() {
          Object.assign(this, call("parse", [""]));
        }
        Url.prototype.parse = function(value, parseQueryString, slashesDenoteHost) {
          Object.assign(this, call("parse", [value, parseQueryString, slashesDenoteHost]));
          return this;
        };
        Url.prototype.format = function() {
          return call("format", [this]);
        };
        Url.prototype.resolve = function(value) {
          return call("resolve", [this.href, value]);
        };
        Url.prototype.resolveObject = function(value) {
          const result = call("resolveObject", [this, value]);
          return Object.assign(Object.create(Url.prototype), result);
        };
        const url = {
          URL,
          URLSearchParams,
          Url,
          parse(value, parseQueryString, slashesDenoteHost) {
            return value instanceof Url ? value : Object.assign(
              Object.create(Url.prototype),
              call("parse", [value, parseQueryString, slashesDenoteHost])
            );
          },
          format(value, options) {
            return sync({ op: "url", method: "format", args: [value, options], whatwg: value instanceof URL });
          },
          resolve: (from, to) => call("resolve", [from, to]),
          resolveObject(from, to) {
            return Object.assign(Object.create(Url.prototype), call("resolveObject", [from, to]));
          },
          domainToASCII: (value) => call("domainToASCII", [value]),
          domainToUnicode: (value) => call("domainToUnicode", [value]),
          pathToFileURL: (value) => new URL(call("pathToFileURL", [value])),
          fileURLToPath: (value) => call("fileURLToPath", [value instanceof URL ? value.href : value]),
          urlToHttpOptions: (value) => call("urlToHttpOptions", [value.href])
        };
        return url;
      };
    }
  });

  // runtime/src/fonts.cjs
  var require_fonts = __commonJS({
    "runtime/src/fonts.cjs"(exports, module) {
      "use strict";
      function installFonts({ base, onCleanup }) {
        if (!document.fonts) return;
        const OriginalFontFace = window.FontFace;
        const fallbackSource = 'url("' + base + '__padport__/fallback-font.ttf") format("truetype")';
        const faces = /* @__PURE__ */ new WeakMap();
        const { add, has, delete: remove } = FontFaceSet.prototype;
        function sanitizeFamily(name) {
          if (typeof name !== "string" || !name.trim()) return '"__ff_fallback__"';
          const family = name.trim();
          if (/^[a-zA-Z_][-a-zA-Z0-9_]*$/.test(family)) return family;
          return '"' + family.replace(/["\\]/g, (character) => String.fromCharCode(92) + character) + '"';
        }
        function PatchedFontFace(family, source, descriptors) {
          const safeFamily = sanitizeFamily(family);
          const unsupported = typeof source === "string" && (!source.trim() || /\.ttc(\b|$)/i.test(source));
          const state = { face: new OriginalFontFace(safeFamily, unsupported ? fallbackSource : source, descriptors) };
          let loading;
          const load = () => {
            if (!loading) {
              loading = state.face.load().catch(async (error) => {
                if (unsupported || source === fallbackSource) throw error;
                const previous = state.face;
                const registered = has.call(document.fonts, previous);
                const fallback = new OriginalFontFace(safeFamily, fallbackSource, descriptors);
                await fallback.load();
                state.face = fallback;
                if (registered) remove.call(document.fonts, previous);
                add.call(document.fonts, fallback);
                console.warn("Font load failed; using system fallback", family);
                return fallback;
              });
            }
            return loading;
          };
          const proxy = new Proxy(state.face, {
            get(target, property) {
              if (property === "load") return load;
              if (property === "oriFontInstance") return state.face;
              const value = Reflect.get(state.face, property, state.face);
              return typeof value === "function" ? value.bind(state.face) : value;
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
        for (const [name, original] of [["add", add], ["has", has], ["delete", remove]]) {
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
            console.error("Font completion check failed", error);
          }
          if (!disposed) timer = setTimeout(completeFontCheck, 3e3);
        }
        timer = setTimeout(completeFontCheck, 3e3);
        onCleanup(() => {
          disposed = true;
          clearTimeout(timer);
        });
      }
      module.exports = { installFonts };
    }
  });

  // runtime/src/bitmap-lifecycle.cjs
  var require_bitmap_lifecycle = __commonJS({
    "runtime/src/bitmap-lifecycle.cjs"(exports, module) {
      "use strict";
      function installBitmapLifecycle() {
        if (window.__PADPORT_CONFIG__.engine !== "MV") return;
        function patch() {
          const { Bitmap, Sprite, TilingSprite } = window;
          if (!Bitmap || !Sprite || Sprite.prototype._onBitmapLoad.length !== 0) return;
          const addLoadListener = Bitmap.prototype.addLoadListener;
          Bitmap.prototype.addLoadListener = function(listener) {
            return addLoadListener.call(this, () => listener(this));
          };
          for (const type of [Sprite, TilingSprite]) {
            if (!type) continue;
            const onBitmapLoad = type.prototype._onBitmapLoad;
            type.prototype._onBitmapLoad = function(bitmap) {
              if (bitmap !== this._bitmap || !this.texture) return;
              return onBitmapLoad.apply(this, arguments);
            };
          }
        }
        window.addEventListener("load", patch, { capture: true, once: true });
      }
      module.exports = { installBitmapLifecycle };
    }
  });

  // runtime/src/resource-loading.cjs
  var require_resource_loading = __commonJS({
    "runtime/src/resource-loading.cjs"(exports, module) {
      "use strict";
      function installResourceLoading() {
        if (window.__PADPORT_CONFIG__.engine !== "MV") return;
        window.addEventListener("load", () => {
          const { WebAudio, Decrypter } = window;
          if (!WebAudio || typeof WebAudio.prototype._load !== "function") return;
          const queue = [];
          let active = 0;
          function drain() {
            while (active < 8 && queue.length) {
              const { audio, url } = queue.shift();
              const xhr = new XMLHttpRequest();
              active++;
              xhr.addEventListener("loadend", () => {
                active--;
                drain();
              }, { once: true });
              const fail = () => {
                if (audio._loader) audio._loader();
                else audio._hasError = true;
              };
              xhr.onload = () => {
                if (xhr.status < 400) audio._onXhrLoad(xhr);
                else fail();
              };
              xhr.onerror = fail;
              xhr.ontimeout = fail;
              try {
                xhr.open("GET", Decrypter && Decrypter.hasEncryptedAudio ? Decrypter.extToEncryptExt(url) : url);
                xhr.responseType = "arraybuffer";
                xhr.timeout = 3e4;
                xhr.send();
              } catch (error) {
                active--;
                fail();
                console.error("Audio request failed", error);
              }
            }
          }
          WebAudio.prototype._load = function(url) {
            if (!WebAudio._context) return;
            queue.push({ audio: this, url });
            drain();
          };
        }, { capture: true, once: true });
      }
      module.exports = { installResourceLoading };
    }
  });

  // runtime/node_modules/shaderity/dist/esm/index.js
  var require_esm = __commonJS({
    "runtime/node_modules/shaderity/dist/esm/index.js"(exports, module) {
      (() => {
        "use strict";
        var __webpack_modules__ = {
          /***/
          "./src/index.ts": (
            /*!**********************!*\
              !*** ./src/index.ts ***!
              \**********************/
            /***/
            function(__unused_webpack_module, exports2, __webpack_require__2) {
              var __importDefault = this && this.__importDefault || function(mod) {
                return mod && mod.__esModule ? mod : { "default": mod };
              };
              Object.defineProperty(exports2, "__esModule", { value: true });
              const Shaderity_1 = __importDefault(__webpack_require__2(
                /*! ./main/Shaderity */
                "./src/main/Shaderity.ts"
              ));
              exports2["default"] = Shaderity_1.default;
            }
          ),
          /***/
          "./src/main/PreProcessor.ts": (
            /*!**********************************!*\
              !*** ./src/main/PreProcessor.ts ***!
              \**********************************/
            /***/
            (__unused_webpack_module, exports2) => {
              Object.defineProperty(exports2, "__esModule", { value: true });
              class PreProcessor {
                static evaluateCondition(condition) {
                  const numericComparison = /(\w+)\s*(==|!=|>|<|>=|<=)\s*(\d+)/g;
                  const definedCheck = /defined\s*\(\s*(\w+)\s*\)/g;
                  const notDefinedCheck = /!\s*defined\s*\(\s*(\w+)\s*\)/g;
                  let evaluatableCondition = condition;
                  evaluatableCondition = evaluatableCondition.replace(definedCheck, (_, name) => {
                    return this.definitions.has(name) ? "true" : "false";
                  });
                  evaluatableCondition = evaluatableCondition.replace(notDefinedCheck, (_, name) => {
                    return this.definitions.has(name) ? "false" : "true";
                  });
                  evaluatableCondition = evaluatableCondition.replace(numericComparison, (match, varName, operator, valueStr) => {
                    const definedValue = this.definitions.get(varName);
                    if (definedValue === void 0)
                      return "false";
                    const value1 = parseInt(definedValue);
                    const value2 = parseInt(valueStr);
                    switch (operator) {
                      case "==":
                        return value1 === value2 ? "true" : "false";
                      case "!=":
                        return value1 !== value2 ? "true" : "false";
                      case ">":
                        return value1 > value2 ? "true" : "false";
                      case "<":
                        return value1 < value2 ? "true" : "false";
                      case ">=":
                        return value1 >= value2 ? "true" : "false";
                      case "<=":
                        return value1 <= value2 ? "true" : "false";
                      default:
                        return "false";
                    }
                  });
                  try {
                    if (!/^[a-zA-Z0-9\s\(\)!&|]+$/.test(evaluatableCondition)) {
                      throw new Error("Invalid condition");
                    }
                    evaluatableCondition = evaluatableCondition.replace(/&&/g, " && ").replace(/\|\|/g, " || ").replace(/!/g, " ! ").replace(/\s+/g, " ").trim();
                    return Function(`return ${evaluatableCondition}`)();
                  } catch (error) {
                    console.error("Error evaluating condition:", error);
                    return false;
                  }
                }
                static process(splittedLines, remainDefine, definitions = [], startLineStr, endLineStr) {
                  const define = /#define[\t ]+(\w+)(?:[\t ]+(\S+))?/;
                  const ifdef = /#ifdef[\t ]+(\w+)/;
                  const ifndef = /#ifndef[\t ]+(\w+)/;
                  const _if = /#if(?:\s+|(?=\())(.*)/;
                  const elif = /#elif(?:\s+|(?=\())(.*)/;
                  const _else = /#else/;
                  const endif = /#endif/;
                  const previousOutputStates = [];
                  let outputFlg = true;
                  const ifdefs = [];
                  const ifdefMatched = [];
                  const outputLines = [];
                  this.definitions.clear();
                  for (const definition of definitions) {
                    this.definitions.set(definition, "1");
                  }
                  let startLine = 0;
                  let endLine = splittedLines.length;
                  if (startLineStr) {
                    startLine = splittedLines.findIndex((line) => line.includes(startLineStr));
                    if (startLine === -1) {
                      return splittedLines;
                    }
                  }
                  if (endLineStr) {
                    endLine = splittedLines.findIndex((line) => line.includes(endLineStr));
                    if (endLine === -1) {
                      return splittedLines;
                    }
                  }
                  for (let i = 0; i < startLine; i++) {
                    const line = splittedLines[i];
                    outputLines.push(line);
                  }
                  for (let i = startLine; i < endLine; i++) {
                    const line = splittedLines[i];
                    let isPragma = false;
                    {
                      const re = line.match(define);
                      if (re != null) {
                        if (outputFlg) {
                          const [_, name, value = "1"] = re;
                          this.definitions.set(name, value);
                        }
                        if (!remainDefine) {
                          isPragma = true;
                        }
                      }
                    }
                    {
                      const reIfdef = line.match(ifdef);
                      const reIfndef = line.match(ifndef);
                      const reIf = line.match(_if);
                      if (reIfdef || reIfndef || reIf) {
                        previousOutputStates.push(outputFlg);
                        let condition = "";
                        if (reIfdef) {
                          condition = `defined(${reIfdef[1]})`;
                        } else if (reIfndef) {
                          condition = `!defined(${reIfndef[1]})`;
                        } else if (reIf) {
                          condition = reIf[1];
                        }
                        ifdefs.push([condition]);
                        if (outputFlg) {
                          outputFlg = this.evaluateCondition(condition);
                          ifdefMatched.push(outputFlg);
                        } else {
                          ifdefMatched.push(false);
                        }
                        isPragma = true;
                      }
                    }
                    {
                      const re = line.match(elif);
                      if (re != null) {
                        const condition = re[1];
                        const currentIfdefs = ifdefs[ifdefs.length - 1];
                        if (previousOutputStates[previousOutputStates.length - 1] && !ifdefMatched[ifdefMatched.length - 1]) {
                          outputFlg = this.evaluateCondition(condition);
                          if (outputFlg) {
                            ifdefMatched[ifdefMatched.length - 1] = true;
                          }
                        } else {
                          outputFlg = false;
                        }
                        currentIfdefs.push(condition);
                        isPragma = true;
                      }
                    }
                    {
                      const re = line.match(_else);
                      if (re != null) {
                        if (previousOutputStates[previousOutputStates.length - 1]) {
                          outputFlg = !ifdefMatched[ifdefMatched.length - 1];
                        } else {
                          outputFlg = false;
                        }
                        isPragma = true;
                      }
                    }
                    {
                      const re = line.match(endif);
                      if (re != null) {
                        outputFlg = previousOutputStates[previousOutputStates.length - 1];
                        isPragma = true;
                        ifdefs.pop();
                        ifdefMatched.pop();
                        previousOutputStates.pop();
                      }
                    }
                    if (outputFlg && !isPragma) {
                      outputLines.push(line);
                    }
                  }
                  for (let i = endLine; i < splittedLines.length; i++) {
                    const line = splittedLines[i];
                    outputLines.push(line);
                  }
                  return outputLines;
                }
              }
              PreProcessor.definitions = /* @__PURE__ */ new Map();
              exports2["default"] = PreProcessor;
            }
          ),
          /***/
          "./src/main/Reflection.ts": (
            /*!********************************!*\
              !*** ./src/main/Reflection.ts ***!
              \********************************/
            /***/
            (__unused_webpack_module, exports2) => {
              Object.defineProperty(exports2, "__esModule", { value: true });
              class Reflection {
                constructor(splittedShaderityShaderCode, shaderStage) {
                  this.__attributeSemanticsMap = /* @__PURE__ */ new Map();
                  this.__uniformSemanticsMap = /* @__PURE__ */ new Map();
                  this.__attributes = [];
                  this.__varyings = [];
                  this.__uniforms = [];
                  this.__splittedShaderCode = splittedShaderityShaderCode;
                  this.__shaderStage = shaderStage;
                  this.__setDefaultAttributeAndUniformSemanticsMap();
                }
                /**
                 * Gets all attribute variable information in the shader code.
                 * Before calling this method, you need to call the reflect method of this instance.
                 * @returns Array of ReflectionAttribute object
                 */
                get attributes() {
                  return this.__attributes;
                }
                /**
                 * Gets all varying variable information in the shader code.
                 * Before calling this method, you need to call the reflect method of this instance.
                 * @returns Array of ReflectionVarying object
                 */
                get varyings() {
                  return this.__varyings;
                }
                /**
                 * Gets all uniform variable information in the shader code.
                 * Before calling this method, you need to call the reflect method of this instance.
                 * @returns Array of ReflectionUniform object
                 */
                get uniforms() {
                  return this.__uniforms;
                }
                /**
                 * Get the names of all attributes included in the shader.
                 * Before calling this method, you need to call the reflect method of this instance.
                 * @returns Array of string
                 */
                get attributesNames() {
                  return this.__attributes.map((attribute) => {
                    return attribute.name;
                  });
                }
                /**
                 * Get the attribute semantic (e.g. 'POSITION') of all attributes included in the shader.
                 * Before calling this method, you need to call the reflect method of this instance.
                 * @returns Array of AttributeSemantics object
                 */
                get attributesSemantics() {
                  return this.__attributes.map((attribute) => {
                    return attribute.semantic;
                  });
                }
                /**
                 * Get the variable type (e.g. 'vec4') of all attributes included in the shader.
                 * Before calling this method, you need to call the reflect method of this instance.
                 * @returns Array of VarType object
                 */
                get attributesTypes() {
                  return this.__attributes.map((attribute) => {
                    return attribute.type;
                  });
                }
                /**
                 * Add an attributeSemantics.
                 * The attributeSemantics is used in the ReflectionAttribute.semantics
                 * (See reflect method of this class)
                 */
                addAttributeSemanticsMap(map) {
                  this.__attributeSemanticsMap = new Map([...this.__attributeSemanticsMap, ...map]);
                }
                /**
                 * Add a uniformSemantics.
                 * The attributeSemantics is used in the ReflectionAttribute.semantics
                 * (See reflect method of this class)
                 */
                addUniformSemanticsMap(map) {
                  this.__uniformSemanticsMap = new Map([...this.__uniformSemanticsMap, ...map]);
                }
                /**
                 * Add an attributeSemantics.
                 * The attributeSemantics is used in the ReflectionAttribute.semantics
                 * (See reflect method of this class)
                 */
                addAttributeSemantics(key, value) {
                  this.__attributeSemanticsMap.set(key, value);
                }
                /**
                 * Add a uniformSemantics.
                 * The attributeSemantics is used in the ReflectionAttribute.semantics
                 * (See reflect method of this class)
                 */
                addUniformSemantics(key, value) {
                  this.__uniformSemanticsMap.set(key, value);
                }
                /**
                 * Initialize attributeSemantics
                 */
                resetAttributeSemantics() {
                  this.__attributeSemanticsMap = /* @__PURE__ */ new Map();
                }
                /**
                 * Initialize uniformSemantics
                 */
                resetUniformSemantics() {
                  this.__uniformSemanticsMap = /* @__PURE__ */ new Map();
                }
                /**
                 * Analyze shader code of the shaderity and get information of attribute, varying and uniform.
                 * The information can be retrieved from the get method of this instance.
                 *
                 * The semantic property of the ReflectionAttribute is assigned to the value of the semantic if
                 * it is specified in the attribute line of the shader code. If not, the AttributeSemanticsMap
                 * is searched for matching semantics, or UNKNOWN. The same applies to the semantic property of
                 * ReflectionUniform.
                 */
                reflect() {
                  const splittedShaderCode = this.__splittedShaderCode;
                  const shaderStage = this.__shaderStage;
                  for (const shaderCodeLine of splittedShaderCode) {
                    const isAttributeLine = this.__matchAttribute(shaderCodeLine, shaderStage);
                    if (isAttributeLine) {
                      this.__addAttribute(shaderCodeLine);
                      continue;
                    }
                    const isVaryingLine = this.__matchVarying(shaderCodeLine, shaderStage);
                    if (isVaryingLine) {
                      this.__addVarying(shaderCodeLine, shaderStage);
                      continue;
                    }
                    const isUniformLine = shaderCodeLine.match(/^(?![\/])[\t ]*uniform[\t ]+/);
                    if (isUniformLine) {
                      this.__addUniform(shaderCodeLine);
                      continue;
                    }
                  }
                }
                __setDefaultAttributeAndUniformSemanticsMap() {
                  this.__attributeSemanticsMap.set("position", "POSITION");
                  this.__attributeSemanticsMap.set("color$", "COLOR_0");
                  this.__attributeSemanticsMap.set("color_?0", "COLOR_0");
                  this.__attributeSemanticsMap.set("texcoord$", "TEXCOORD_0");
                  this.__attributeSemanticsMap.set("texcoord_?0", "TEXCOORD_0");
                  this.__attributeSemanticsMap.set("texcoord_?1", "TEXCOORD_1");
                  this.__attributeSemanticsMap.set("texcoord_?2", "TEXCOORD_2");
                  this.__attributeSemanticsMap.set("normal", "NORMAL");
                  this.__attributeSemanticsMap.set("tangent", "TANGENT");
                  this.__attributeSemanticsMap.set("joint$", "JOINTS_0");
                  this.__attributeSemanticsMap.set("bone$", "JOINTS_0");
                  this.__attributeSemanticsMap.set("joint_?0", "JOINTS_0");
                  this.__attributeSemanticsMap.set("bone_?0", "JOINTS_0");
                  this.__attributeSemanticsMap.set("weight$", "WEIGHTS_0");
                  this.__attributeSemanticsMap.set("weight_?0", "WEIGHTS_0");
                  this.__uniformSemanticsMap.set("worldmatrix", "WorldMatrix");
                  this.__uniformSemanticsMap.set("normalmatrix", "NormalMatrix");
                  this.__uniformSemanticsMap.set("viewmatrix", "ViewMatrix");
                  this.__uniformSemanticsMap.set("projectionmatrix", "ProjectionMatrix");
                  this.__uniformSemanticsMap.set("modelviewmatrix", "ModelViewMatrix");
                }
                __matchAttribute(shaderCodeLine, shaderStage) {
                  if (shaderStage !== "vertex") {
                    return false;
                  }
                  return shaderCodeLine.match(/^(?![\/])[\t ]*(attribute|in)[\t ]+.+;/);
                }
                __addAttribute(shaderCodeLine) {
                  const reflectionAttribute = {
                    name: "",
                    type: "float",
                    semantic: "UNKNOWN"
                  };
                  const matchType = shaderCodeLine.match(Reflection.attributeAndVaryingTypeRegExp);
                  if (matchType) {
                    const type = matchType[1];
                    reflectionAttribute.type = type;
                    const name = matchType[2];
                    reflectionAttribute.name = name;
                    const matchSemantic = shaderCodeLine.match(Reflection.semanticRegExp);
                    if (matchSemantic) {
                      reflectionAttribute.semantic = matchSemantic[1];
                    } else {
                      for (let [key, value] of this.__attributeSemanticsMap) {
                        if (name.match(new RegExp(key, "i"))) {
                          reflectionAttribute.semantic = value;
                        }
                      }
                    }
                  }
                  this.__attributes.push(reflectionAttribute);
                }
                __matchVarying(shaderCodeLine, shaderStage) {
                  if (shaderStage === "vertex") {
                    return shaderCodeLine.match(/^(?![\/])[\t ]*(varying|out)[\t ]+.+;/);
                  } else {
                    return shaderCodeLine.match(/^(?![\/])[\t ]*(varying|in)[\t ]+.+;/);
                  }
                }
                __addVarying(shaderCodeLine, shaderStage) {
                  const reflectionVarying = {
                    name: "",
                    type: "float",
                    inout: "in"
                  };
                  const matchType = shaderCodeLine.match(Reflection.attributeAndVaryingTypeRegExp);
                  if (matchType) {
                    const type = matchType[1];
                    reflectionVarying.type = type;
                    const name = matchType[2];
                    reflectionVarying.name = name;
                    reflectionVarying.inout = shaderStage === "vertex" ? "out" : "in";
                  }
                  this.__varyings.push(reflectionVarying);
                }
                __addUniform(shaderCodeLine) {
                  const reflectionUniform = {
                    name: "",
                    type: "float",
                    semantic: "UNKNOWN"
                  };
                  const matchType = shaderCodeLine.match(Reflection.uniformTypeRegExp);
                  if (matchType) {
                    const type = matchType[1];
                    reflectionUniform.type = type;
                    const name = matchType[2];
                    reflectionUniform.name = name;
                    const matchSemantics = shaderCodeLine.match(Reflection.semanticRegExp);
                    if (matchSemantics) {
                      reflectionUniform.semantic = matchSemantics[1];
                    } else {
                      for (let [key, value] of this.__uniformSemanticsMap) {
                        if (name.match(new RegExp(key, "i"))) {
                          reflectionUniform.semantic = value;
                        }
                      }
                    }
                  }
                  this.__uniforms.push(reflectionUniform);
                }
              }
              Reflection.attributeAndVaryingTypeRegExp = /[\t ]+(float|int|uint|vec2|vec3|vec4|mat2|mat3|mat4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4)[\t ]+(\w+);/;
              Reflection.uniformTypeRegExp = /[\t ]+(float|int|uint|vec2|vec3|vec4|mat2|mat3|mat4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4|sampler2D|samplerCube|sampler3D)[\t ]+(\w+);/;
              Reflection.semanticRegExp = /<.*semantic[\t ]*=[\t ]*(\w+).*>/;
              exports2["default"] = Reflection;
              ;
            }
          ),
          /***/
          "./src/main/ShaderEditor.ts": (
            /*!**********************************!*\
              !*** ./src/main/ShaderEditor.ts ***!
              \**********************************/
            /***/
            (__unused_webpack_module, exports2) => {
              Object.defineProperty(exports2, "__esModule", { value: true });
              class ShaderEditor {
                static _insertDefinition(splittedShaderCode, definition) {
                  const defStr = definition.replace(/#define[\t ]+/, "");
                  splittedShaderCode.unshift(`#define ${defStr}`);
                }
                static _fillTemplate(shaderCode, templateObject) {
                  const templateString = shaderCode.replace(/\/\*[\t ]*shaderity:[\t ]*(@{[\t ]*)(\S+)([\t ]*})[\t ]*\*\//g, "${this.$2}");
                  const resultCode = new Function("return `" + templateString + "`;").call(templateObject);
                  return resultCode;
                }
              }
              exports2["default"] = ShaderEditor;
            }
          ),
          /***/
          "./src/main/ShaderTransformer.ts": (
            /*!***************************************!*\
              !*** ./src/main/ShaderTransformer.ts ***!
              \***************************************/
            /***/
            (__unused_webpack_module, exports2) => {
              Object.defineProperty(exports2, "__esModule", { value: true });
              class ShaderTransformer {
                /**
                 * @private
                 * Translate a GLSL ES3 shader code to a GLSL ES1 shader code
                 */
                static _transformToGLSLES1(splittedShaderCode, isFragmentShader, embedErrorsInOutput) {
                  this.__convertOrInsertVersionGLSLES1(splittedShaderCode);
                  this.__removeES3Qualifier(splittedShaderCode, embedErrorsInOutput);
                  this.__convertIn(splittedShaderCode, isFragmentShader);
                  this.__convertOut(splittedShaderCode, isFragmentShader, embedErrorsInOutput);
                  this.__removePrecisionForES3(splittedShaderCode);
                  this.__convertTextureFunctionToES1(splittedShaderCode, isFragmentShader, embedErrorsInOutput);
                  const transformedSplittedShaderCode = splittedShaderCode;
                  return transformedSplittedShaderCode;
                }
                /**
                 * @private
                 * Translate a GLSL ES1 shader code to a GLSL ES3 shader code
                 */
                static _transformToGLSLES3(splittedShaderCode, isFragmentShader) {
                  this.__convertOrInsertVersionGLSLES3(splittedShaderCode);
                  this.__convertAttribute(splittedShaderCode, isFragmentShader);
                  this.__convertVarying(splittedShaderCode, isFragmentShader);
                  this.__convertTextureCube(splittedShaderCode);
                  this.__convertTexture2D(splittedShaderCode);
                  this.__convertTexture2DProd(splittedShaderCode);
                  this.__convertTexture3D(splittedShaderCode);
                  this.__convertTexture3DProd(splittedShaderCode);
                  const transformedSplittedShaderCode = splittedShaderCode;
                  return transformedSplittedShaderCode;
                }
                /**
                 * @private
                 * Translate a GLSL shader code to a shader code of specified GLSL version
                 */
                static _transformTo(version, splittedShaderCode, isFragmentShader, embedErrorsInOutput) {
                  if (version.match(/webgl2|es3/i)) {
                    return this._transformToGLSLES3(splittedShaderCode, isFragmentShader);
                  } else if (version.match(/webgl1|es1/i)) {
                    return this._transformToGLSLES1(splittedShaderCode, isFragmentShader, embedErrorsInOutput);
                  } else {
                    console.error("Invalid Version");
                    return splittedShaderCode;
                  }
                }
                /**
                 * @private
                 * If the first line contains version information, overwrite the first line with '#version 100'.
                 * If not, add '#version 100' to the first line.
                 *
                 * Note: If the first line is commented out and the version information is written in the second or later line,
                 * the appropriate version information will be added to the first line and the user-defined version information
                 * in the second or later line will be removed.
                 */
                static __convertOrInsertVersionGLSLES1(splittedShaderCode) {
                  const reg = /^(?![\/])[\t ]*#[\t ]*version[\t ]+.*/;
                  this.__removeFirstMatchingLine(splittedShaderCode, reg);
                  splittedShaderCode.unshift("#version 100");
                }
                /**
                 * @private
                 * If the first line contains version information, overwrite the first line with '#version 300 es'.
                 * If not, add '#version 300 es' to the first line.
                 * In both cases, '#define GLSL_ES3' will be inserted in the second line.
                 * Use the '#define GLSL_ES3' directive if you want to write a shader code that will only run in the case of webgl2.
                 *
                 * Note: If the first line is commented out and the version information is written in the second or later line,
                 * the appropriate version information will be added to the first line and the user-defined version information
                 * in the second or later line will be removed.
                 */
                static __convertOrInsertVersionGLSLES3(splittedShaderCode) {
                  const reg = /^(?![\/])[\t ]*#[\t ]*version[\t ]+.*/;
                  this.__removeFirstMatchingLine(splittedShaderCode, reg);
                  splittedShaderCode.unshift("#define GLSL_ES3");
                  splittedShaderCode.unshift("#version 300 es");
                }
                /**
                 * @private
                 * Find the 'in' qualifier in the shader code and replace it with the GLSL ES1 qualifier('attribute' or 'varying')
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertIn(splittedShaderCode, isFragmentShader) {
                  const reg = /^(?![\/])[\t ]*in[\t ]+((highp|mediump|lowp|)[\t ]*\w+[\t ]*\w+[\t ]*;)/;
                  let replaceFunc;
                  if (isFragmentShader) {
                    replaceFunc = function(match, p1) {
                      return "varying " + p1;
                    };
                  } else {
                    replaceFunc = function(match, p1) {
                      return "attribute " + p1;
                    };
                  }
                  this.__replaceLine(splittedShaderCode, reg, replaceFunc);
                }
                /**
                 * @private
                 * Find the "out" qualifier in the shader code and modify the shader code.
                 * If the shader stage is vertex, the "out" qualifiers will be replaced by "varying" qualifier.
                 * If the shader stage is fragment and the shader has "out" qualifiers, the "out" qualifiers will
                 * be deleted and the variable is used to assign a value to gl_FragColor.
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertOut(splittedShaderCode, isFragmentShader, embedErrorsInOutput) {
                  if (isFragmentShader) {
                    const variableName = this.__removeOutQualifier(splittedShaderCode, embedErrorsInOutput);
                    if (variableName == null) {
                      return;
                    }
                    this.__addGLFragColor(variableName, splittedShaderCode, embedErrorsInOutput);
                  } else {
                    const reg = /^(?![\/])[\t ]*out[\t ]+((highp|mediump|lowp|)[\t ]*\w+[\t ]*\w+[\t ]*;)/;
                    const replaceFunc = function(match, p1) {
                      return "varying " + p1;
                    };
                    this.__replaceLine(splittedShaderCode, reg, replaceFunc);
                  }
                }
                /**
                 * @private
                 * This method is a part of __convertOut method.
                 * This method deletes the "out" qualifiers and adds the line for assigning to gl_FragColor.
                 * If the shader does not have the "out" qualifiers, this method does nothing.
                 */
                static __removeOutQualifier(splittedShaderCode, embedErrorsInOutput) {
                  const reg = /^(?![\/])[\t ]*out[\t ]+((highp|mediump|lowp|)[\t ]*\w+[\t ]*(\w+)[\t ]*;)/;
                  let variableName;
                  for (let i = 0; i < splittedShaderCode.length; i++) {
                    const match = splittedShaderCode[i].match(reg);
                    if (match) {
                      splittedShaderCode[i] = match[1];
                      variableName = match[3];
                      break;
                    }
                  }
                  return variableName;
                }
                static __addGLFragColor(variableName, splittedShaderCode, embedErrorsInOutput) {
                  const closeBracketReg = /(.*)\}[\n\t ]*$/;
                  const returnReg = /[\n\t ]*return[\n\t ]*;/;
                  const mainFuncStartReg = /(^|^(?![\/])[\t\n ]+)void[\t\n ]+main([\t\n ]|\(|$)/;
                  const fragColorCode = `  gl_FragColor = ${variableName};`;
                  let setGlFragColorInLastLine = false;
                  for (let i = splittedShaderCode.length - 1; i >= 0; i--) {
                    const line = splittedShaderCode[i];
                    if (!setGlFragColorInLastLine && line.match(closeBracketReg)) {
                      splittedShaderCode[i] = line.replace(closeBracketReg, `$1
${fragColorCode}
}
`);
                      setGlFragColorInLastLine = true;
                    }
                    if (line.match(returnReg)) {
                      splittedShaderCode.splice(i, 0, fragColorCode);
                    }
                    if (line.match(mainFuncStartReg)) {
                      break;
                    }
                  }
                  if (!setGlFragColorInLastLine) {
                    const errorMessage = "__removeOutQualifier: Not found the closing brackets for the main function";
                    this.__outError(splittedShaderCode, splittedShaderCode.length, errorMessage, embedErrorsInOutput);
                  }
                }
                /**
                 * @private
                 * Find the qualifier for es3 only in the shader code and remove it
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __removeES3Qualifier(splittedShaderCode, embedErrorsInOutput) {
                  this.__removeVaryingQualifier(splittedShaderCode, embedErrorsInOutput);
                  this.__removeLayout(splittedShaderCode);
                }
                /**
                 * @private
                 * Find the "flat" and "smooth" qualifier in the shader code and remove it
                 */
                static __removeVaryingQualifier(splittedShaderCode, embedErrorsInOutput) {
                  const reg = /^(?![\/])[\t ]*(flat|smooth)[\t ]*((in|out)[\t ]+.*)/;
                  const errorMessage = "__removeVaryingQualifier: glsl es1 does not support flat qualifier";
                  for (let i = 0; i < splittedShaderCode.length; i++) {
                    splittedShaderCode[i] = splittedShaderCode[i].replace(reg, (match, p1, p2) => {
                      if (p1 === "flat") {
                        this.__outError(splittedShaderCode, i + 1, errorMessage, embedErrorsInOutput);
                        return match;
                      }
                      return p2;
                    });
                  }
                }
                /**
                 * @private
                 * Find the "layout" qualifier in the shader code and remove it
                 */
                static __removeLayout(splittedShaderCode) {
                  const reg = /^(?![\/])[\t ]*layout[\t ]*\([\t ]*location[\t ]*\=[\t ]*\d[\t ]*\)[\t ]+/g;
                  this.__replaceLine(splittedShaderCode, reg, "");
                }
                /**
                 * @private
                 * Find the "precision" qualifier in the shader code and remove it if the "precision" qualifier is valid for only GLSL ES3
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __removePrecisionForES3(splittedShaderCode) {
                  const reg = /^(?![\/])[\t ]*precision[\t ]+(highp|mediump|lowp)[\t ]+(\w+)[\t ]*;/;
                  for (let i = 0; i < splittedShaderCode.length; i++) {
                    const match = splittedShaderCode[i].match(reg);
                    if (match != null) {
                      if (match[2] === "int" || match[2] === "float" || match[2] === "sampler2D" || match[2] === "samplerCube") {
                        continue;
                      } else {
                        splittedShaderCode.splice(i--, 1);
                      }
                    }
                  }
                }
                /**
                 * @private
                 * Find the "texture" and "textureProj" method in the shader code and
                 * replace it with the GLSL ES1 method('texture2D', 'texture2D', and so on)
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertTextureFunctionToES1(splittedShaderCode, isFragmentShader, embedErrorsInOutput) {
                  var _a, _b;
                  const sbl = this.__regSymbols();
                  const regTextureProj = new RegExp(`(${sbl}+)textureProj(Lod|)(${sbl}+)`, "g");
                  const regTexture = new RegExp(`(${sbl}+)texture(Lod|)(${sbl}+)`, "g");
                  let argumentSamplerMap;
                  const uniformSamplerMap = this.__createUniformSamplerMap(splittedShaderCode, embedErrorsInOutput);
                  for (let i = 0; i < splittedShaderCode.length; i++) {
                    const line = splittedShaderCode[i];
                    const matchTextureProj = line.match(/textureProj(Lod|)[\t ]*\([\t ]*(\w+),/);
                    if (matchTextureProj) {
                      argumentSamplerMap = argumentSamplerMap !== null && argumentSamplerMap !== void 0 ? argumentSamplerMap : this.__createArgumentSamplerMap(splittedShaderCode, i, embedErrorsInOutput);
                      const isLodMethod = matchTextureProj[1] === "Lod";
                      const extensionStr = isFragmentShader && isLodMethod ? `EXT` : ``;
                      const variableName = matchTextureProj[2];
                      const samplerType = (_a = argumentSamplerMap === null || argumentSamplerMap === void 0 ? void 0 : argumentSamplerMap.get(variableName)) !== null && _a !== void 0 ? _a : uniformSamplerMap.get(variableName);
                      if (samplerType != null) {
                        if (samplerType === "sampler2D") {
                          splittedShaderCode[i] = splittedShaderCode[i].replace(regTextureProj, `$1texture2DProj$2${extensionStr}$3`);
                        } else {
                          const errorMessage = "__convertTextureFunctionToES1: do not support " + samplerType + " type";
                          this.__outError(splittedShaderCode, i, errorMessage, embedErrorsInOutput);
                        }
                      }
                      continue;
                    }
                    const matchTexture = line.match(/texture(Lod|)[\t ]*\([\t ]*(\w+),/);
                    if (matchTexture) {
                      argumentSamplerMap = argumentSamplerMap !== null && argumentSamplerMap !== void 0 ? argumentSamplerMap : this.__createArgumentSamplerMap(splittedShaderCode, i, embedErrorsInOutput);
                      const isLodMethod = matchTexture[1] === "Lod";
                      const extensionStr = isFragmentShader && isLodMethod ? `EXT` : ``;
                      const variableName = matchTexture[2];
                      const samplerType = (_b = argumentSamplerMap === null || argumentSamplerMap === void 0 ? void 0 : argumentSamplerMap.get(variableName)) !== null && _b !== void 0 ? _b : uniformSamplerMap.get(variableName);
                      if (samplerType != null) {
                        let textureFunc;
                        if (samplerType === "sampler2D") {
                          textureFunc = "texture2D";
                        } else if (samplerType === "samplerCube") {
                          textureFunc = "textureCube";
                        } else {
                          textureFunc = "";
                          const errorMessage = "__convertTextureFunctionToES1: do not support " + samplerType + " type";
                          this.__outError(splittedShaderCode, i, errorMessage, embedErrorsInOutput);
                        }
                        if (textureFunc !== "") {
                          splittedShaderCode[i] = splittedShaderCode[i].replace(regTexture, `$1${textureFunc}$2${extensionStr}$3`);
                        }
                      }
                      continue;
                    }
                    const isBlockEnd = !!line.match(/\}/);
                    if (isBlockEnd) {
                      argumentSamplerMap = void 0;
                    }
                  }
                }
                /**
                 * @private
                 * This method finds uniform declarations of sampler types in the shader and
                 * creates a map with variable names as keys and types as values.
                 */
                static __createUniformSamplerMap(splittedShaderCode, embedErrorsInOutput) {
                  const uniformSamplerMap = /* @__PURE__ */ new Map();
                  for (let i = 0; i < splittedShaderCode.length; i++) {
                    const line = splittedShaderCode[i];
                    const match = line.match(/^(?![\/])[\t ]*uniform*[\t ]*(highp|mediump|lowp|)[\t ]*(sampler\w+)[\t ]+(\w+)/);
                    if (match) {
                      const samplerType = match[2];
                      const name = match[3];
                      if (uniformSamplerMap.get(name)) {
                        const errorMessage = "__createUniformSamplerMap: duplicate variable name";
                        this.__outError(splittedShaderCode, i, errorMessage, embedErrorsInOutput);
                      }
                      uniformSamplerMap.set(name, samplerType);
                    }
                  }
                  return uniformSamplerMap;
                }
                /**
                 * @private
                 * This method finds sampler types from the function arguments and
                 * creates a map with variable names as keys and types as values.
                 */
                static __createArgumentSamplerMap(splittedShaderCode, lineIndex, embedErrorsInOutput) {
                  var _a, _b;
                  const argumentSamplerMap = /* @__PURE__ */ new Map();
                  for (let i = lineIndex; i >= 0; i--) {
                    const line = splittedShaderCode[i];
                    const isBlockStartLine = !!line.match(/\{/);
                    if (!isBlockStartLine) {
                      continue;
                    }
                    const bracketSectionCode = this.__getBracketSection(splittedShaderCode, i);
                    const innerBracketSectionCode = (_a = bracketSectionCode.match(/.*\((.*)\)/)) === null || _a === void 0 ? void 0 : _a[1];
                    if (innerBracketSectionCode == null) {
                      return;
                    }
                    const variableCandidates = innerBracketSectionCode.split(",");
                    const samplerTypeDefinitionReg = /[\n\t ]*(highp|mediump|lowp|)[\n\t ]*(sampler\w+)[\n\t ]*(\w+)[\n\t ]*/;
                    const isFunctionBracket = !!((_b = variableCandidates[0].match(samplerTypeDefinitionReg)) !== null && _b !== void 0 ? _b : variableCandidates[0].match(/^[\n\t ]*$/));
                    if (!isFunctionBracket) {
                      continue;
                    }
                    for (const variableCandidate of variableCandidates) {
                      const samplerVariableMatch = variableCandidate.match(samplerTypeDefinitionReg);
                      if (samplerVariableMatch == null) {
                        continue;
                      }
                      const samplerType = samplerVariableMatch[2];
                      const name = samplerVariableMatch[3];
                      if (argumentSamplerMap.get(name)) {
                        const errorMessage = "__createArgumentSamplerMap: duplicate variable name";
                        this.__outError(splittedShaderCode, i, errorMessage, embedErrorsInOutput);
                      }
                      argumentSamplerMap.set(name, samplerType);
                    }
                    break;
                  }
                  return argumentSamplerMap;
                }
                /**
                 * @private
                 * This method returns the part enclosed in brackets(= '()').
                 * For example, you can get lines that contain function arguments, conditional expressions for if statements, etc.
                 */
                static __getBracketSection(splittedShaderCode, bracketEndIndex) {
                  let bracketStartIndex = 0;
                  for (let j = bracketEndIndex; j >= 0; j--) {
                    const line = splittedShaderCode[j];
                    const isBracketStartMatch = !!line.match(/\(/);
                    if (isBracketStartMatch) {
                      bracketStartIndex = j;
                      break;
                    }
                  }
                  let containBracketCode = "";
                  for (let j = bracketStartIndex; j <= bracketEndIndex; j++) {
                    containBracketCode += splittedShaderCode[j];
                  }
                  return containBracketCode;
                }
                /**
                 * @private
                 * Find the 'attribute' qualifier in the vertex shader code and replace it with the GLSL ES3 qualifier('in')
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertAttribute(splittedShaderCode, isFragmentShader) {
                  if (isFragmentShader) {
                    return;
                  }
                  const reg = /^(?![\/])[\t ]*attribute[\t ]+/g;
                  const replaceStr = "in ";
                  this.__replaceLine(splittedShaderCode, reg, replaceStr);
                }
                /**
                 * @private
                 * Find the 'varying' qualifier in the shader code and replace it with the GLSL ES3 qualifier('in' or 'out')
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertVarying(splittedShaderCode, isFragmentShader) {
                  const reg = /^(?![\/])[\t ]*varying[\t ]+/g;
                  const replaceStr = isFragmentShader ? "in " : "out ";
                  this.__replaceLine(splittedShaderCode, reg, replaceStr);
                }
                /**
                 * @private
                 * Find the 'textureCube' method in the shader code and replace it with the GLSL ES3 method('texture')
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertTextureCube(splittedShaderCode) {
                  const sbl = this.__regSymbols();
                  const reg = new RegExp(`(${sbl}+)(textureCube)(${sbl}+)`, "g");
                  const replaceStr = "texture";
                  this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
                }
                /**
                 * @private
                 * Find the 'texture2D' method in the shader code and replace it with the GLSL ES3 method('texture')
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertTexture2D(splittedShaderCode) {
                  const sbl = this.__regSymbols();
                  const reg = new RegExp(`(${sbl}+)(texture2D)(${sbl}+)`, "g");
                  const replaceStr = "texture";
                  this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
                }
                /**
                 * @private
                 * Find the 'texture2DProj' method in the shader code and replace it with the GLSL ES3 method('textureProj')
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertTexture2DProd(splittedShaderCode) {
                  const sbl = this.__regSymbols();
                  const reg = new RegExp(`(${sbl}+)(texture2DProj)(${sbl}+)`, "g");
                  const replaceStr = "textureProj";
                  this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
                }
                /**
                 * @private
                 * Find the 'texture3D' method in the shader code and replace it with the GLSL ES3 method('texture')
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertTexture3D(splittedShaderCode) {
                  const sbl = this.__regSymbols();
                  const reg = new RegExp(`(${sbl}+)(texture3D)(${sbl}+)`, "g");
                  const replaceStr = "texture";
                  this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
                }
                /**
                 * @private
                 * Find the 'texture3DProj' method in the shader code and replace it with the GLSL ES3 method('textureProj')
                 * This method directly replace the elements of the splittedShaderCode variable.
                 */
                static __convertTexture3DProd(splittedShaderCode) {
                  const sbl = this.__regSymbols();
                  const reg = new RegExp(`(${sbl}+)(texture3DProj)(${sbl}+)`, "g");
                  const replaceStr = "textureProj";
                  this.__replaceLine(splittedShaderCode, reg, "$1" + replaceStr + "$3");
                }
                static __regSymbols() {
                  return `[!"#$%&'()*+-.,/:;<=>?@[\\]^\`{|}~	
 ]`;
                }
                static __replaceLine(splittedShaderCode, reg, replacement) {
                  for (let i = 0; i < splittedShaderCode.length; i++) {
                    splittedShaderCode[i] = splittedShaderCode[i].replace(reg, replacement);
                  }
                }
                static __removeFirstMatchingLine(splittedShaderCode, reg) {
                  for (let i = 0; i < splittedShaderCode.length; i++) {
                    if (splittedShaderCode[i].match(reg)) {
                      splittedShaderCode.splice(i, 1);
                      break;
                    }
                  }
                }
                static __outError(splittedShaderCode, lineIndex, errorMessage, embedErrorsInOutput) {
                  if (embedErrorsInOutput) {
                    const shaderOutputMessage = `// line ${lineIndex}: ${errorMessage}
`;
                    const closeBracketReg = /(.*)\}[\n\t ]*$/;
                    for (let i = splittedShaderCode.length - 1; i >= 0; i--) {
                      const line = splittedShaderCode[i];
                      if (line.match(closeBracketReg)) {
                        break;
                      }
                      if (splittedShaderCode[i] === shaderOutputMessage) {
                        return;
                      }
                    }
                    console.error(errorMessage);
                    splittedShaderCode.push(shaderOutputMessage);
                  } else {
                    throw new Error(errorMessage);
                  }
                }
              }
              exports2["default"] = ShaderTransformer;
            }
          ),
          /***/
          "./src/main/Shaderity.ts": (
            /*!*******************************!*\
              !*** ./src/main/Shaderity.ts ***!
              \*******************************/
            /***/
            function(__unused_webpack_module, exports2, __webpack_require__2) {
              var __importDefault = this && this.__importDefault || function(mod) {
                return mod && mod.__esModule ? mod : { "default": mod };
              };
              Object.defineProperty(exports2, "__esModule", { value: true });
              const Reflection_1 = __importDefault(__webpack_require__2(
                /*! ./Reflection */
                "./src/main/Reflection.ts"
              ));
              const ShaderTransformer_1 = __importDefault(__webpack_require__2(
                /*! ./ShaderTransformer */
                "./src/main/ShaderTransformer.ts"
              ));
              const ShaderEditor_1 = __importDefault(__webpack_require__2(
                /*! ./ShaderEditor */
                "./src/main/ShaderEditor.ts"
              ));
              const Utility_1 = __importDefault(__webpack_require__2(
                /*! ./Utility */
                "./src/main/Utility.ts"
              ));
              const ShaderityObjectCreator_1 = __importDefault(__webpack_require__2(
                /*! ./ShaderityObjectCreator */
                "./src/main/ShaderityObjectCreator.ts"
              ));
              const PreProcessor_1 = __importDefault(__webpack_require__2(
                /*! ./PreProcessor */
                "./src/main/PreProcessor.ts"
              ));
              class Shaderity {
                // =========================================================================================================
                // shader transformation functions
                // =========================================================================================================
                /**
                 * Translate a GLSL ES3 shader code to a GLSL ES1 shader code
                 * @param obj Shaderity object to translate to glsl es1
                 * @param embedErrorsInOutput If true, when there is an error in the conversion,
                 *    the error and the number of lines are output at the bottom of the return
                 *    value ShaderityObject.code. If false, throw an error.
                 * @returns ShaderityObject whose code property is the shader code for GLSL ES1
                 */
                static transformToGLSLES1(obj, embedErrorsInOutput = false) {
                  const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                  const transformedSplittedShaderCode = ShaderTransformer_1.default._transformToGLSLES1(splittedShaderCode, obj.isFragmentShader, embedErrorsInOutput);
                  const resultCode = Utility_1.default._joinSplittedLine(transformedSplittedShaderCode);
                  const resultObj = {
                    code: resultCode,
                    shaderStage: obj.shaderStage,
                    isFragmentShader: obj.isFragmentShader
                  };
                  return resultObj;
                }
                /**
                 * Translate a GLSL ES1 shader code to a GLSL ES3 shader code
                 */
                static transformToGLSLES3(obj) {
                  const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                  const transformedSplittedShaderCode = ShaderTransformer_1.default._transformToGLSLES3(splittedShaderCode, obj.isFragmentShader);
                  const resultCode = Utility_1.default._joinSplittedLine(transformedSplittedShaderCode);
                  const resultObj = {
                    code: resultCode,
                    shaderStage: obj.shaderStage,
                    isFragmentShader: obj.isFragmentShader
                  };
                  return resultObj;
                }
                /**
                 * Translate a GLSL shader code to a shader code of specified GLSL version
                 */
                static transformTo(version, obj, embedErrorsInOutput = false) {
                  const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                  const transformedSplittedShaderCode = ShaderTransformer_1.default._transformTo(version, splittedShaderCode, obj.isFragmentShader, embedErrorsInOutput);
                  const resultCode = Utility_1.default._joinSplittedLine(transformedSplittedShaderCode);
                  const resultObj = {
                    code: resultCode,
                    shaderStage: obj.shaderStage,
                    isFragmentShader: obj.isFragmentShader
                  };
                  return resultObj;
                }
                static processPragma(obj, remainDefine, definitions = [], startLineStr, endLineStr) {
                  const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                  const transformedSplittedShaderCode = PreProcessor_1.default.process(splittedShaderCode, remainDefine, definitions, startLineStr, endLineStr);
                  const resultCode = Utility_1.default._joinSplittedLine(transformedSplittedShaderCode);
                  const resultObj = {
                    code: resultCode,
                    shaderStage: obj.shaderStage,
                    isFragmentShader: obj.isFragmentShader
                  };
                  return resultObj;
                }
                // =========================================================================================================
                // shaderity object creation functions
                // =========================================================================================================
                /**
                 * Create an instance to create shaderity object.
                 */
                static createShaderityObjectCreator(shaderStage) {
                  return new ShaderityObjectCreator_1.default(shaderStage);
                }
                // =========================================================================================================
                // shader edit functions
                // =========================================================================================================
                /**
                 * Find the following template pattern in the shader code and replace key to value
                 * @param templateObject An object that represents the string before and after the replacement
                 * The key can be a string or an object. If an object is used as the key,
                 * the key in the pattern of shaderCode must also match the object.
                 * For example, if templateObject is
                    {
                        sample {
                            sampleA: 0
                        }
                    }
                 * then the key in a shader code is sample.sampleA.
                 */
                // The template pattern is	/* shaderity: @{key} */
                static fillTemplate(obj, arg) {
                  const copy = this.__copyShaderityObject(obj);
                  copy.code = ShaderEditor_1.default._fillTemplate(copy.code, arg);
                  return copy;
                }
                /**
                 * Insert define directive
                 */
                static insertDefinition(obj, definition) {
                  const copy = this.__copyShaderityObject(obj);
                  const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                  ShaderEditor_1.default._insertDefinition(splittedShaderCode, definition);
                  copy.code = Utility_1.default._joinSplittedLine(splittedShaderCode);
                  return copy;
                }
                // =========================================================================================================
                // reflection functions
                // =========================================================================================================
                /**
                 * Create an instance to get the attribute, varying, and uniform information from a shader code of the shaderity.
                 * To get these information, you need to call reflection.reflect method.
                 */
                static createReflectionObject(obj) {
                  const splittedShaderCode = Utility_1.default._splitByLineFeedCode(obj.code);
                  const reflection = new Reflection_1.default(splittedShaderCode, obj.shaderStage);
                  return reflection;
                }
                // =========================================================================================================
                // private functions
                // =========================================================================================================
                static __copyShaderityObject(obj) {
                  const copiedObj = {
                    code: obj.code,
                    shaderStage: obj.shaderStage,
                    isFragmentShader: obj.isFragmentShader
                  };
                  return copiedObj;
                }
              }
              exports2["default"] = Shaderity;
            }
          ),
          /***/
          "./src/main/ShaderityObjectCreator.ts": (
            /*!********************************************!*\
              !*** ./src/main/ShaderityObjectCreator.ts ***!
              \********************************************/
            /***/
            function(__unused_webpack_module, exports2, __webpack_require__2) {
              var __importDefault = this && this.__importDefault || function(mod) {
                return mod && mod.__esModule ? mod : { "default": mod };
              };
              Object.defineProperty(exports2, "__esModule", { value: true });
              const Utility_1 = __importDefault(__webpack_require__2(
                /*! ./Utility */
                "./src/main/Utility.ts"
              ));
              class ShaderityObjectCreator {
                constructor(shaderStage) {
                  this.__functionIdCount = 0;
                  this.__defineDirectiveNames = [];
                  this.__extensions = [];
                  this.__globalPrecision = {
                    int: "highp",
                    float: "highp",
                    sampler2D: "highp",
                    samplerCube: "highp",
                    sampler3D: "highp",
                    sampler2DArray: "highp",
                    isampler2D: "highp",
                    isamplerCube: "highp",
                    isampler3D: "highp",
                    isampler2DArray: "highp",
                    usampler2D: "highp",
                    usamplerCube: "highp",
                    usampler3D: "highp",
                    usampler2DArray: "highp",
                    sampler2DShadow: "highp",
                    samplerCubeShadow: "highp",
                    sampler2DArrayShadow: "highp"
                  };
                  this.__structDefinitions = [];
                  this.__globalConstantValues = [];
                  this.__globalConstantStructValues = [];
                  this.__attributes = [];
                  this.__varyings = [];
                  this.__uniforms = [];
                  this.__uniformStructs = [];
                  this.__uniformBufferObjects = [];
                  this.__functions = [];
                  this.__mainFunctionCode = "void main() {}";
                  this.__outputColorVariableName = "renderTarget0";
                  this.__shaderStage = shaderStage;
                }
                // =========================================================================================================
                // add parameters functions
                // =========================================================================================================
                addDefineDirective(defineDirectiveName) {
                  const isDuplicate = this.__defineDirectiveNames.some((name) => name === defineDirectiveName);
                  if (isDuplicate) {
                    console.warn("addDefineDirective: this define directive is already set");
                    return;
                  }
                  this.__defineDirectiveNames.push(defineDirectiveName);
                }
                addExtension(extensionName, behavior = "enable") {
                  const isDuplicate = this.__extensions.some((extension) => extension.extensionName === extensionName);
                  if (isDuplicate) {
                    console.warn("addExtension: this extension is already set");
                    return;
                  }
                  this.__extensions.push({
                    extensionName,
                    behavior
                  });
                }
                // only define types
                addStructDefinition(structName, memberObjects) {
                  const isDuplicate = this.__structDefinitions.some((structDefinition) => structDefinition.structName === structName);
                  if (isDuplicate) {
                    console.error(`addStructDefinition: duplicate struct type name ${structName}`);
                    return;
                  }
                  this.__structDefinitions.push({
                    structName,
                    memberObjects
                  });
                }
                addGlobalConstantValue(variableName, type, values) {
                  const isDuplicate = this.__globalConstantValues.some((globalConstantValue) => globalConstantValue.variableName === variableName);
                  if (isDuplicate) {
                    console.error(`addGlobalConstantValue: duplicate variable name ${variableName}`);
                    return;
                  }
                  const isValidComponentNumber = Utility_1.default._isValidComponentCount(type, values);
                  if (!isValidComponentNumber) {
                    console.error(`addGlobalConstantValue: the component count of ${variableName} is invalid`);
                    return;
                  }
                  const isIntType = Utility_1.default._isIntType(type);
                  if (isIntType) {
                    const existNonIntegerValue = ShaderityObjectCreator.__existNonIntegerValue(values);
                    if (existNonIntegerValue) {
                      console.warn(`addGlobalConstantValue: non-integer value is set to ${variableName}`);
                    }
                  }
                  this.__globalConstantValues.push({
                    variableName,
                    type,
                    values
                  });
                }
                // need to define struct by the addStructDefinition method
                // validate that the corresponding structure is defined by the __createGlobalConstantStructValueShaderCode method
                addGlobalConstantStructValue(structName, variableName, values) {
                  const isDuplicate = this.__globalConstantStructValues.some((structValue) => structValue.variableName === variableName);
                  if (isDuplicate) {
                    console.error(`addGlobalConstantStructValue: duplicate variable name ${variableName}`);
                    return;
                  }
                  this.__globalConstantStructValues.push({
                    variableName,
                    structName,
                    values
                  });
                }
                addAttributeDeclaration(variableName, type, options) {
                  if (this.__shaderStage !== "vertex") {
                    console.error("addAttribute: this method is for vertex shader only");
                    return;
                  }
                  const isDuplicate = this.__attributes.some((attribute) => attribute.variableName === variableName);
                  if (isDuplicate) {
                    console.error(`addAttribute: duplicate variable name ${variableName}`);
                    return;
                  }
                  this.__attributes.push({
                    variableName,
                    type,
                    precision: options === null || options === void 0 ? void 0 : options.precision,
                    location: options === null || options === void 0 ? void 0 : options.location
                  });
                }
                addVaryingDeclaration(variableName, type, options) {
                  const isDuplicate = this.__varyings.some((varying) => varying.variableName === variableName);
                  if (isDuplicate) {
                    console.error(`addVarying: duplicate variable name ${variableName}`);
                    return;
                  }
                  const isIntType = Utility_1.default._isIntType(type);
                  let interpolationType = options === null || options === void 0 ? void 0 : options.interpolationType;
                  if (isIntType && interpolationType !== "flat") {
                    if (interpolationType != null) {
                      console.error(`addVarying: the interpolationType must be flat for integer types`);
                      return;
                    } else {
                      console.warn(`addVarying: set the interpolationType of integer types to flat to avoid compilation error`);
                      interpolationType = "flat";
                    }
                  }
                  this.__varyings.push({
                    variableName,
                    type,
                    precision: options === null || options === void 0 ? void 0 : options.precision,
                    interpolationType
                  });
                }
                addUniformDeclaration(variableName, type, options) {
                  const isDuplicate = this.__uniforms.some((uniform) => uniform.variableName === variableName);
                  if (isDuplicate) {
                    console.error(`addUniform: duplicate variable name ${variableName}`);
                    return;
                  }
                  if (type === "bool" && (options === null || options === void 0 ? void 0 : options.precision) != null) {
                    console.warn(`addUniform: remove the specification of precision for bool type to avoid compilation error`);
                    options.precision = void 0;
                  }
                  this.__uniforms.push({
                    variableName,
                    type,
                    precision: options === null || options === void 0 ? void 0 : options.precision
                  });
                }
                // need to define struct by the addStructDefinition method
                addUniformStructDeclaration(structName, variableName) {
                  const isDuplicate = this.__uniformStructs.some((uniformStruct) => uniformStruct.variableName === variableName);
                  if (isDuplicate) {
                    console.error(`addUniformStructDeclaration: duplicate variable name ${variableName}`);
                    return;
                  }
                  this.__uniformStructs.push({
                    variableName,
                    structName
                  });
                }
                // for es3
                addUniformBufferObjectDeclaration(blockName, variableObjects, options) {
                  const isDuplicateBlockName = this.__uniformBufferObjects.some((ubo) => ubo.blockName === blockName);
                  if (isDuplicateBlockName) {
                    console.error(`addUniformBufferObjectDeclaration: duplicate block name ${blockName}`);
                    return;
                  }
                  for (const ubo of this.__uniformBufferObjects) {
                    for (const uboVariableObject of ubo.variableObjects) {
                      for (const variableObject of variableObjects) {
                        if (uboVariableObject.variableName === variableObject.variableName) {
                          console.error(`addUniformBufferObjectDeclaration: duplicate variable name ${variableObject.variableName}`);
                          return;
                        }
                      }
                    }
                  }
                  this.__uniformBufferObjects.push({
                    blockName,
                    variableObjects,
                    instanceName: options === null || options === void 0 ? void 0 : options.instanceName
                  });
                }
                // the return value Id is a value to delete the function
                // the main function is defined (updated) by the updateMainFunction method
                addFunctionDefinition(functionCode, options) {
                  var _a, _b;
                  const functionId = this.__functionIdCount++;
                  const dependencyLevel = (_a = options === null || options === void 0 ? void 0 : options.dependencyLevel) !== null && _a !== void 0 ? _a : 0;
                  this.__functions[dependencyLevel] = (_b = this.__functions[dependencyLevel]) !== null && _b !== void 0 ? _b : [];
                  this.__functions[dependencyLevel].push({
                    functionCode,
                    functionId
                  });
                  return functionId;
                }
                // =========================================================================================================
                // update parameters functions
                // =========================================================================================================
                updateGlobalPrecision(precision) {
                  Object.assign(this.__globalPrecision, precision);
                }
                updateStructDefinition(structName, memberObjects) {
                  const matchedIndex = this.__structDefinitions.findIndex((structDefinition) => structDefinition.structName === structName);
                  if (matchedIndex === -1) {
                    console.error(`updateStructDefinition: the struct type name ${structName} is not exist`);
                    return;
                  }
                  this.__structDefinitions[matchedIndex].memberObjects = memberObjects;
                }
                updateGlobalConstantValue(variableName, values) {
                  const matchedIndex = this.__globalConstantValues.findIndex((globalConstantValue) => globalConstantValue.variableName === variableName);
                  if (matchedIndex === -1) {
                    console.warn(`updateGlobalConstantValue: the variable name ${variableName} is not exist`);
                    return;
                  }
                  const type = this.__globalConstantValues[matchedIndex].type;
                  const isValidComponentNumber = Utility_1.default._isValidComponentCount(type, values);
                  if (!isValidComponentNumber) {
                    console.error("updateGlobalConstantValue: the component count is invalid");
                    return;
                  }
                  const isIntType = Utility_1.default._isIntType(type);
                  if (isIntType) {
                    const existNonIntegerValue = ShaderityObjectCreator.__existNonIntegerValue(values);
                    if (existNonIntegerValue) {
                      console.warn(`updateGlobalConstantValue: the ${variableName} has a non-integer value.`);
                    }
                  }
                  this.__globalConstantValues[matchedIndex].values = values;
                }
                updateGlobalConstantStructValue(variableName, values) {
                  const matchedIndex = this.__globalConstantStructValues.findIndex((structValue) => structValue.variableName === variableName);
                  if (matchedIndex === -1) {
                    console.error(`updateGlobalConstantStructValue:  the variable name ${variableName} is not exist`);
                    return;
                  }
                  this.__globalConstantStructValues[matchedIndex].values = values;
                }
                updateMainFunction(mainFunctionCodeInner) {
                  this.__mainFunctionCode = mainFunctionCodeInner;
                }
                // specify the name of the output color variable from the main function in the fragment shader.
                // users have to assign the result of fragment shader calculation to this variable.
                updateOutputColorVariableName(outputColorVariableName) {
                  if (this.__shaderStage !== "fragment") {
                    console.error("updateOutputColorVariableName: this method is for fragment shader only");
                    return;
                  }
                  if (outputColorVariableName.length === 0) {
                    console.error("updateOutputColorVariableName: invalid outColorVariableName");
                    return;
                  }
                  this.__outputColorVariableName = outputColorVariableName;
                }
                // =========================================================================================================
                // remove parameters functions
                // =========================================================================================================
                removeDefineDirective(defineDirectiveName) {
                  const matchedIndex = this.__defineDirectiveNames.indexOf(defineDirectiveName);
                  if (matchedIndex === -1) {
                    console.warn("removedDefineDirective: this define directive is not exist");
                    return;
                  }
                  this.__defineDirectiveNames.splice(matchedIndex, 1);
                }
                removeExtension(extensionName) {
                  const matchedIndex = this.__extensions.findIndex((extension) => extension.extensionName === extensionName);
                  if (matchedIndex === -1) {
                    console.warn("removeExtension: this extension is not exist");
                    return;
                  }
                  this.__extensions.splice(matchedIndex, 1);
                }
                removeStructDefinition(structName) {
                  const matchedIndex = this.__structDefinitions.findIndex((structDefinition) => structDefinition.structName === structName);
                  if (matchedIndex === -1) {
                    console.error(`removeStructDefinition: the struct type name ${structName} is not exist`);
                    return;
                  }
                  this.__structDefinitions.splice(matchedIndex, 1);
                }
                removeGlobalConstantValue(variableName) {
                  const matchedIndex = this.__globalConstantValues.findIndex((globalConstantValue) => globalConstantValue.variableName === variableName);
                  if (matchedIndex === -1) {
                    console.warn(`removeGlobalConstantValue: the variable name ${variableName} is not exist`);
                    return;
                  }
                  this.__globalConstantValues.splice(matchedIndex, 1);
                }
                removeGlobalConstantStructValue(variableName) {
                  const matchedIndex = this.__globalConstantStructValues.findIndex((structValue) => structValue.variableName === variableName);
                  if (matchedIndex === -1) {
                    console.error(`updateGlobalConstantStructValue:  the variable name ${variableName} is not exist`);
                    return;
                  }
                  this.__globalConstantStructValues.splice(matchedIndex, 1);
                }
                removeAttributeDeclaration(variableName) {
                  const matchedIndex = this.__attributes.findIndex((attribute) => attribute.variableName === variableName);
                  if (matchedIndex === -1) {
                    console.warn(`removeAttribute: the variable name ${variableName} is not exist`);
                    return;
                  }
                  this.__attributes.splice(matchedIndex, 1);
                }
                removeVaryingDeclaration(variableName) {
                  const matchedIndex = this.__varyings.findIndex((varying) => varying.variableName === variableName);
                  if (matchedIndex === -1) {
                    console.warn(`removeVarying: the variable name ${variableName} is not exist`);
                    return;
                  }
                  this.__varyings.splice(matchedIndex, 1);
                }
                removeUniformDeclaration(variableName) {
                  const matchedIndex = this.__uniforms.findIndex((uniform) => uniform.variableName === variableName);
                  if (matchedIndex === -1) {
                    console.warn(`removeUniform: the variable name ${variableName} is not exist`);
                    return;
                  }
                  this.__uniforms.splice(matchedIndex, 1);
                }
                removeUniformStructDeclaration(variableName) {
                  const matchedIndex = this.__uniformStructs.findIndex((uniformStruct) => uniformStruct.variableName === variableName);
                  if (matchedIndex === -1) {
                    console.warn(`removeUniformStructDeclaration: the variable name ${variableName} is not exist`);
                    return;
                  }
                  this.__uniformStructs.splice(matchedIndex, 1);
                }
                removeUniformBufferObjectDeclaration(blockName) {
                  const matchedIndex = this.__uniformBufferObjects.findIndex((ubo) => ubo.blockName === blockName);
                  if (matchedIndex === -1) {
                    console.warn(`removeUniformStructDeclaration: the variable name ${blockName} is not exist`);
                    return;
                  }
                  this.__uniformBufferObjects.splice(matchedIndex, 1);
                }
                removeFunctionDefinition(functionId) {
                  this.__fillEmptyFunctions();
                  if (functionId < 0 || functionId >= this.__functionIdCount) {
                    console.warn("removeFunctionDefinition: invalid function id");
                  }
                  for (const functionObjects of this.__functions) {
                    const matchedIndex = functionObjects.findIndex((functionObject) => functionObject.functionId === functionId);
                    if (matchedIndex !== -1) {
                      functionObjects.splice(matchedIndex, 1);
                      return;
                    }
                  }
                  console.warn(`removeFunctionDefinition: not found the function of functionId ${functionId}`);
                }
                // =========================================================================================================
                // create shaderity object function
                // =========================================================================================================
                createShaderityObject() {
                  const shaderityObj = {
                    code: this.__createShaderCode(),
                    shaderStage: this.__shaderStage,
                    isFragmentShader: this.__shaderStage === "fragment"
                  };
                  return shaderityObj;
                }
                // =========================================================================================================
                // private methods
                // =========================================================================================================
                static __existNonIntegerValue(values) {
                  for (const value of values) {
                    if (!Number.isInteger(value)) {
                      return true;
                    }
                  }
                  return false;
                }
                // TODO: implement shader code import feature (low priority)
                // public importShaderCode(code: string) {}
                // need to apply Shaderity.transformToGLSLES1, transformToGLSLES3 or transformTo method
                __createShaderCode() {
                  this.__fillEmptyFunctions();
                  const code = `#version 300 es

` + this.__createDefineDirectiveShaderCode() + this.__createExtensionShaderCode() + this.__createGlobalPrecisionShaderCode() + this.__createStructDefinitionShaderCode() + this.__createGlobalConstantValueShaderCode() + this.__createGlobalConstantStructValueShaderCode() + this.__createAttributeDeclarationShaderCode() + this.__createVaryingDeclarationShaderCode() + this.__createOutputColorDeclarationShaderCode() + this.__createUniformDeclarationShaderCode() + this.__createUniformStructDeclarationShaderCode() + this.__createUniformBufferObjectShaderCode() + this.__createFunctionDefinitionShaderCode() + this.__createMainFunctionDefinitionShaderCode();
                  return code;
                }
                __fillEmptyFunctions() {
                  var _a;
                  for (let i = 0; i < this.__functions.length; i++) {
                    this.__functions[i] = (_a = this.__functions[i]) !== null && _a !== void 0 ? _a : [];
                  }
                }
                __createDefineDirectiveShaderCode() {
                  let shaderCode = "";
                  for (const defineDirectiveName of this.__defineDirectiveNames) {
                    shaderCode += `#define ${defineDirectiveName}
`;
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createExtensionShaderCode() {
                  let shaderCode = "";
                  for (const extension of this.__extensions) {
                    shaderCode += `#extension ${extension.extensionName}: ${extension.behavior}
`;
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                //TODO: remove needless precisions
                __createGlobalPrecisionShaderCode() {
                  let shaderCode = "";
                  for (const type in this.__globalPrecision) {
                    const precisionType = type;
                    const precisionQualifier = this.__globalPrecision[precisionType];
                    shaderCode += `precision ${precisionQualifier} ${precisionType};
`;
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createStructDefinitionShaderCode() {
                  let shaderCode = "";
                  for (const structDefinition of this.__structDefinitions) {
                    shaderCode += `struct ${structDefinition.structName} {
`;
                    for (let i = 0; i < structDefinition.memberObjects.length; i++) {
                      const variable = structDefinition.memberObjects[i];
                      shaderCode += `  `;
                      if (variable.precision != null) {
                        shaderCode += `${variable.precision} `;
                      }
                      shaderCode += `${variable.type} ${variable.memberName};
`;
                    }
                    shaderCode += `};
`;
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createGlobalConstantValueShaderCode() {
                  let shaderCode = "";
                  for (const globalConstantValue of this.__globalConstantValues) {
                    const type = globalConstantValue.type;
                    const variableName = globalConstantValue.variableName;
                    const value = globalConstantValue.values;
                    shaderCode += `const ${type} ${variableName} = ${type}(`;
                    for (let i = 0; i < value.length; i++) {
                      shaderCode += value[i] + ", ";
                    }
                    shaderCode = shaderCode.replace(/,\s$/, ");\n");
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createGlobalConstantStructValueShaderCode() {
                  let shaderCode = "";
                  for (const structValue of this.__globalConstantStructValues) {
                    const matchedIndex = this.__structDefinitions.findIndex((definition) => definition.structName === structValue.structName);
                    if (matchedIndex === -1) {
                      console.error(`__createGlobalConstantStructValueShaderCode: the struct type ${structValue.structName} is not defined`);
                      continue;
                    }
                    shaderCode += `const ${structValue.structName} ${structValue.variableName} = ${structValue.structName} (
`;
                    const structDefinition = this.__structDefinitions[matchedIndex];
                    if (structDefinition.memberObjects.length !== Object.keys(structValue.values).length) {
                      console.error(`__createGlobalConstantStructValueShaderCode: Invalid number of variables that ${structValue.variableName} has`);
                      continue;
                    }
                    const hasSamplerType = structDefinition.memberObjects.some((memberObject) => Utility_1.default._isSamplerType(memberObject.type));
                    if (hasSamplerType) {
                      console.error(`__createGlobalConstantStructValueShaderCode: ConstantStructValue (${structValue.variableName}) cannot have sampler type parameter`);
                      continue;
                    }
                    for (let i = 0; i < structDefinition.memberObjects.length; i++) {
                      const variableName = structDefinition.memberObjects[i].memberName;
                      const value = structValue.values[variableName];
                      if (value == null) {
                        console.error(`__createGlobalConstantStructValueShaderCode: ${structValue.variableName} does not have the value of ${variableName}`);
                        continue;
                      }
                      const type = structDefinition.memberObjects[i].type;
                      const isValidComponentNumber = Utility_1.default._isValidComponentCount(type, value);
                      if (!isValidComponentNumber) {
                        console.error(`__createGlobalConstantStructValueShaderCode: the component count of ${variableName} in ${structValue.variableName} is invalid`);
                        continue;
                      }
                      shaderCode += `  ${type}(`;
                      for (let i2 = 0; i2 < value.length; i2++) {
                        shaderCode += value[i2] + ", ";
                      }
                      shaderCode = shaderCode.replace(/,\s$/, "),\n");
                    }
                    shaderCode = shaderCode.replace(/,\n$/, "\n);\n");
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createAttributeDeclarationShaderCode() {
                  let shaderCode = "";
                  for (const attribute of this.__attributes) {
                    if (attribute.location != null) {
                      shaderCode += `layout (location = ${attribute.location}) `;
                    }
                    shaderCode += `in `;
                    if (attribute.precision != null) {
                      shaderCode += `${attribute.precision} `;
                    }
                    shaderCode += `${attribute.type} ${attribute.variableName};
`;
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createVaryingDeclarationShaderCode() {
                  let shaderCode = "";
                  for (const varying of this.__varyings) {
                    if (varying.interpolationType != null) {
                      shaderCode += `${varying.interpolationType} `;
                    }
                    shaderCode += this.__shaderStage == "vertex" ? `out ` : `in `;
                    if (varying.precision != null) {
                      shaderCode += `${varying.precision} `;
                    }
                    shaderCode += `${varying.type} ${varying.variableName};
`;
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                //TODO: translate when glsl es1
                __createOutputColorDeclarationShaderCode() {
                  if (this.__shaderStage !== "fragment") {
                    return "";
                  }
                  return `layout(location = 0) out vec4 ${this.__outputColorVariableName};

`;
                }
                __createUniformDeclarationShaderCode() {
                  let shaderCode = "";
                  for (const uniform of this.__uniforms) {
                    shaderCode += `uniform `;
                    if (uniform.precision != null) {
                      shaderCode += `${uniform.precision} `;
                    }
                    shaderCode += `${uniform.type} ${uniform.variableName};
`;
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createUniformStructDeclarationShaderCode() {
                  let shaderCode = "";
                  for (const uniformStruct of this.__uniformStructs) {
                    const structName = uniformStruct.structName;
                    const existStructDefinition = this.__structDefinitions.some((definition) => definition.structName === structName);
                    if (!existStructDefinition) {
                      console.error(`__createUniformStructDeclarationShaderCode: the struct type ${structName} is not defined`);
                      continue;
                    }
                    shaderCode += `uniform ${structName} ${uniformStruct.variableName};
`;
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createUniformBufferObjectShaderCode() {
                  let shaderCode = "";
                  for (const ubo of this.__uniformBufferObjects) {
                    shaderCode += `layout (std140) uniform ${ubo.blockName} {
`;
                    for (let i = 0; i < ubo.variableObjects.length; i++) {
                      const variableObj = ubo.variableObjects[i];
                      shaderCode += `  ${variableObj.type} ${variableObj.variableName};
`;
                    }
                    if (ubo.instanceName != null) {
                      shaderCode += `} ${ubo.instanceName};
`;
                    } else {
                      shaderCode += `};
`;
                    }
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createFunctionDefinitionShaderCode() {
                  let shaderCode = "";
                  for (let i = 0; i < this.__functions.length; i++) {
                    const functionObjects = this.__functions[i];
                    for (let j = 0; j < functionObjects.length; j++) {
                      shaderCode += functionObjects[j].functionCode + `
`;
                    }
                  }
                  return Utility_1.default._addLineFeedCodeIfNotNullString(shaderCode);
                }
                __createMainFunctionDefinitionShaderCode() {
                  return this.__mainFunctionCode + `
`;
                }
              }
              exports2["default"] = ShaderityObjectCreator;
            }
          ),
          /***/
          "./src/main/Utility.ts": (
            /*!*****************************!*\
              !*** ./src/main/Utility.ts ***!
              \*****************************/
            /***/
            (__unused_webpack_module, exports2) => {
              Object.defineProperty(exports2, "__esModule", { value: true });
              class Utility {
                static _splitByLineFeedCode(source) {
                  return source.split(/\r\n|\n/);
                }
                static _joinSplittedLine(splittedLine) {
                  return splittedLine.join("\n");
                }
                static _addLineFeedCodeIfNotNullString(source) {
                  return source === "" ? source : source + "\n";
                }
                static _componentNumber(type) {
                  let componentNumber;
                  if (type === "float" || type === "int" || type === "bool" || type === "uint" || type === "sampler2D" || type === "samplerCube" || type === "sampler3D" || type === "sampler2DArray" || type === "isampler2D" || type === "isamplerCube" || type === "isampler3D" || type === "isampler2DArray" || type === "usampler2D" || type === "usamplerCube" || type === "usampler3D" || type === "usampler2DArray" || type === "sampler2DShadow" || type === "samplerCubeShadow" || type === "sampler2DArrayShadow") {
                    componentNumber = 1;
                  } else if (type === "vec2" || type === "ivec2" || type === "bvec2" || type === "uvec2") {
                    componentNumber = 2;
                  } else if (type === "vec3" || type === "ivec3" || type === "bvec3" || type === "uvec3") {
                    componentNumber = 3;
                  } else if (type === "vec4" || type === "ivec4" || type === "bvec4" || type === "uvec4" || type === "mat2" || type === "mat2x2") {
                    componentNumber = 4;
                  } else if (type === "mat2x3" || type === "mat3x2") {
                    componentNumber = 6;
                  } else if (type === "mat2x4" || type === "mat4x2") {
                    componentNumber = 8;
                  } else if (type === "mat3" || type === "mat3x3") {
                    componentNumber = 9;
                  } else if (type === "mat3x4" || type === "mat4x3") {
                    componentNumber = 12;
                  } else if (type === "mat4" || type === "mat4x4") {
                    componentNumber = 16;
                  } else {
                    componentNumber = 0;
                    console.error("Utility._componentNumber: detect unknown type");
                  }
                  return componentNumber;
                }
                static _isIntType(type) {
                  if (type === "int" || type === "ivec2" || type === "ivec3" || type === "ivec4" || type === "uint" || type === "uvec2" || type === "uvec3" || type === "uvec4") {
                    return true;
                  } else {
                    return false;
                  }
                }
                static _isValidComponentCount(type, values) {
                  const validComponentCount = Utility._componentNumber(type);
                  if (validComponentCount === values.length) {
                    return true;
                  }
                  return false;
                }
                static _isSamplerType(type) {
                  if (type === "sampler2D" || type === "samplerCube" || type === "sampler3D" || type === "sampler2DArray" || type === "isampler2D" || type === "isamplerCube" || type === "isampler3D" || type === "isampler2DArray" || type === "usampler2D" || type === "usamplerCube" || type === "usampler3D" || type === "usampler2DArray" || type === "sampler2DShadow" || type === "samplerCubeShadow" || type === "sampler2DArrayShadow") {
                    return true;
                  } else {
                    return false;
                  }
                }
              }
              exports2["default"] = Utility;
            }
          )
          /******/
        };
        var __webpack_module_cache__ = {};
        function __webpack_require__(moduleId) {
          var cachedModule = __webpack_module_cache__[moduleId];
          if (cachedModule !== void 0) {
            return cachedModule.exports;
          }
          var module2 = __webpack_module_cache__[moduleId] = {
            /******/
            // no module.id needed
            /******/
            // no module.loaded needed
            /******/
            exports: {}
            /******/
          };
          __webpack_modules__[moduleId].call(module2.exports, module2, module2.exports, __webpack_require__);
          return module2.exports;
        }
        var __webpack_exports__ = __webpack_require__("./src/index.ts");
        module.exports = __webpack_exports__;
      })();
    }
  });

  // runtime/src/webgl-state.cjs
  var require_webgl_state = __commonJS({
    "runtime/src/webgl-state.cjs"(exports, module) {
      "use strict";
      function installWebGLState() {
        const states = /* @__PURE__ */ new WeakMap();
        for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
          let stateFor = function(gl) {
            let state = states.get(gl);
            if (!state) {
              state = {};
              states.set(gl, state);
              for (const event of ["webglcontextlost", "webglcontextrestored"])
                gl.canvas.addEventListener(event, () => {
                  delete state.face;
                  delete state.mask;
                });
            }
            return state;
          };
          if (!type || Object.hasOwn(type.prototype, "__padport_draw_state__")) continue;
          const proto = type.prototype;
          const getParameter = proto.getParameter, frontFace = proto.frontFace, colorMask = proto.colorMask;
          proto.getParameter = function(parameter) {
            if (parameter !== this.FRONT_FACE && parameter !== this.COLOR_WRITEMASK)
              return getParameter.call(this, parameter);
            const state = stateFor(this);
            if (parameter === this.FRONT_FACE) {
              if (state.face === void 0) state.face = getParameter.call(this, parameter);
              return state.face;
            }
            if (state.mask === void 0) state.mask = getParameter.call(this, parameter);
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
          Object.defineProperty(proto, "__padport_draw_state__", { value: true });
        }
      }
      module.exports = { installWebGLState };
    }
  });

  // runtime/src/graphics.cjs
  var require_graphics = __commonJS({
    "runtime/src/graphics.cjs"(exports, module) {
      "use strict";
      var Shaderity = require_esm().default;
      function installGraphics() {
        const textureCanvases = ["MV", "MZ"].includes(window.__PADPORT_CONFIG__.engine);
        const canvasProto = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
        if (textureCanvases && canvasProto && !canvasProto.__padport_texture_canvas__) {
          const getContext = canvasProto.getContext;
          let imageCanvas = false;
          canvasProto.getContext = function(type, options) {
            return getContext.call(this, type, type === "2d" && imageCanvas ? { ...options, willReadFrequently: true } : options);
          };
          window.addEventListener("load", () => {
            const proto = window.Bitmap && window.Bitmap.prototype;
            if (!proto || typeof proto._createCanvas !== "function") return;
            const createCanvas = proto._createCanvas;
            proto._createCanvas = function(...args) {
              const previous = imageCanvas;
              imageCanvas = !!this._image;
              try {
                return createCanvas.apply(this, args);
              } finally {
                imageCanvas = previous;
              }
            };
          }, { capture: true, once: true });
          canvasProto.__padport_texture_canvas__ = true;
        }
        require_webgl_state().installWebGLState();
        const canvas = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
        if (textureCanvases && canvas && !canvas.__padport_source_pixels__) {
          const deferredSources = /* @__PURE__ */ new WeakSet();
          const drawImage = canvas.drawImage;
          const getImageData = canvas.getImageData;
          const putImageData = canvas.putImageData;
          canvas.drawImage = function(source, ...args) {
            if (source !== this.canvas && deferredSources.has(source)) {
              const context = source.getContext("2d");
              if (context && source.width && source.height) {
                try {
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
            if (!(source instanceof HTMLCanvasElement) || source === this.canvas || !source.getContext("2d")) deferredSources.add(this.canvas);
            return result;
          };
          canvas.__padport_source_pixels__ = true;
        }
        if (canvas && !canvas.__padport_readback_patched__) {
          const getImageData = canvas.getImageData;
          canvas.getImageData = function(x, y, width, height, ...options) {
            return getImageData.call(
              this,
              !x || isNaN(x) ? 0 : x,
              !y || isNaN(y) ? 0 : y,
              !width || isNaN(width) ? 1 : width,
              !height || isNaN(height) ? 1 : height,
              ...options
            );
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
                  program && __dbgLoggedProgram.set(program, true), __dbgCount++, extra ? console.warn("[padport-webgl] attrloc-skip:", reason, extra) : console.warn("[padport-webgl] attrloc-skip:", reason);
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
              for (var seen = /* @__PURE__ */ Object.create(null), out = [], j = 0; j < names.length; j++) {
                var n = names[j];
                !seen[n] && (seen[n] = true, out.push(n));
              }
              return {
                names: out,
                hasExplicitLayout
              };
            }, patchProto = function(proto) {
              if (proto && !proto.__padport_attrloc_patched__) {
                proto.__padport_attrloc_patched__ = true;
                var origShaderSource = proto.shaderSource, origAttachShader = proto.attachShader, origBindAttribLocation = proto.bindAttribLocation, origLinkProgram = proto.linkProgram;
                typeof origShaderSource == "function" && (proto.shaderSource = function(shader, source) {
                  try {
                    var src = String(source || ""), info = shaderInfo.get(shader) || {
                      src: "",
                      hasExplicitLayout: false
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
                    __internalBindDepth <= 0 && programHasExplicitBind.set(program, true);
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
                      var attrs = [], hasExplicitLayout = false;
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
                          info && info.hasExplicitLayout && (hasExplicitLayout = true);
                          var parsed = parseVertexAttributes(src);
                          parsed && parsed.hasExplicitLayout && (hasExplicitLayout = true), parsed && parsed.names && (attrs = attrs.concat(parsed.names));
                        } catch {
                        }
                      }, this), hasExplicitLayout)
                        return __dbgLogOnce(program, "explicit layout(location=...) detected"), origLinkProgram.call(this, program);
                      for (var seen = /* @__PURE__ */ Object.create(null), uniq = [], i = 0; i < attrs.length; i++) {
                        var n = attrs[i];
                        !seen[n] && (seen[n] = true, uniq.push(n));
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
            if (typeof window > "u" || window.__padport_DETERMINISTIC_ATTR_LOC_OFF__ || window.__padport_DETERMINISTIC_ATTR_LOC__ || (window.__padport_DETERMINISTIC_ATTR_LOC__ = true, typeof WeakMap > "u" || typeof Set > "u"))
              return;
            var shaderInfo = /* @__PURE__ */ new WeakMap(), programShaders = /* @__PURE__ */ new WeakMap(), programHasExplicitBind = /* @__PURE__ */ new WeakMap(), __internalBindDepth = 0, __dbgEnabled = false;
            try {
              __dbgEnabled = !!window.__padport_DETERMINISTIC_ATTR_LOC_DEBUG__;
            } catch {
              __dbgEnabled = false;
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
                  isFragmentShader: stage === "fragment"
                }).code : targetVersion === 300 && Shaderity.transformToGLSLES3 && (transformed = Shaderity.transformToGLSLES3({
                  code: src,
                  shaderStage: stage,
                  isFragmentShader: stage === "fragment"
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
              shader.__patchedOnce = true;
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
              let patchedAny = false;
              shaders.forEach((shader) => {
                if (shader.__patchedOnce)
                  return;
                const src = originalSrcMap.get(shader);
                if (!src)
                  return;
                const type = gl.getShaderParameter(shader, gl.SHADER_TYPE), stage = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
                try {
                  const patched = patchSource(src, stage, gl, isGL2Ctx(gl));
                  gl.shaderSource(shader, patched), shader.__patchedOnce = true, gl.compileShader(shader), patchedAny = true;
                } catch {
                }
              }), patchedAny && origLink.call(gl, program);
            }, proto.__shaderPatchApplied = true;
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
              return !source || typeof source != "object" ? false : typeof HTMLImageElement < "u" && source instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && source instanceof HTMLCanvasElement || typeof HTMLVideoElement < "u" && source instanceof HTMLVideoElement || typeof ImageBitmap < "u" && source instanceof ImageBitmap || typeof OffscreenCanvas < "u" && source instanceof OffscreenCanvas;
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
                var canvas2 = document.createElement("canvas");
                canvas2.width = scaledW, canvas2.height = scaledH, cache = {
                  source,
                  canvas: canvas2,
                  width: scaledW,
                  height: scaledH,
                  drawnOnce: false
                }, sourceCanvasCache.set(cacheKey, cache);
              }
              var isStaticImg = typeof HTMLImageElement < "u" && source instanceof HTMLImageElement;
              if (!isStaticImg || !cache.drawnOnce) {
                var ctx = cache.canvas.getContext("2d");
                ctx && (ctx.clearRect(0, 0, scaledW, scaledH), ctx.imageSmoothingEnabled = true, ctx.imageSmoothingQuality = "high", ctx.drawImage(source, 0, 0, w, h, 0, 0, scaledW, scaledH), cache.drawnOnce = true);
              }
              return cache.canvas;
            }, patchTexUploadProto = function(proto) {
              if (!(!proto || proto.__padportOversizedTexPatched)) {
                proto.__padportOversizedTexPatched = true;
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
            window.__padport_WEBGL_OVERSIZED_TEX_PATCH__ = true;
            var maxTexSizeCache = /* @__PURE__ */ new WeakMap(), sourceCanvasCache = /* @__PURE__ */ new WeakMap(), oversizedGlTextures = /* @__PURE__ */ new WeakMap();
            patchTexUploadProto(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype), patchTexUploadProto(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
          } catch {
          }
        }();
      }
      module.exports = { installGraphics };
    }
  });

  // app/src/main/assets/audio-decode.js
  var require_audio_decode = __commonJS({
    "app/src/main/assets/audio-decode.js"() {
      (() => {
        "use strict";
        const config = window.__PADPORT_CONFIG__;
        if (config.renderer !== "gecko" && !["MV", "MZ"].includes(config.engine)) return;
        const proto = window.BaseAudioContext && window.BaseAudioContext.prototype;
        if (!proto || proto.decodeAudioData.padportQueued) return;
        const decode = proto.decodeAudioData;
        const queue = [];
        let active = 0;
        function drain() {
          while (active < 4 && queue.length) {
            const task = queue.shift();
            active++;
            let result;
            try {
              result = decode.apply(task.context, task.args);
            } catch (error) {
              active--;
              task.reject(error);
              continue;
            }
            Promise.resolve(result).then((buffer) => {
              active--;
              task.resolve(buffer);
              drain();
            }, (error) => {
              active--;
              task.reject(error);
              drain();
            });
          }
        }
        function decodeAudioData(data, success, failure) {
          const args = Array.from(arguments);
          if (!(this instanceof window.BaseAudioContext) || !(data instanceof ArrayBuffer) || success != null && typeof success !== "function" || failure != null && typeof failure !== "function") return decode.apply(this, args);
          try {
            args[0] = structuredClone(data, { transfer: [data] });
          } catch (error) {
            return decode.apply(this, args);
          }
          return new Promise((resolve, reject) => {
            queue.push({ context: this, args, resolve, reject });
            drain();
          });
        }
        Object.defineProperty(decodeAudioData, "padportQueued", { value: true });
        proto.decodeAudioData = decodeAudioData;
      })();
    }
  });

  // runtime/src/media.cjs
  var require_media = __commonJS({
    "runtime/src/media.cjs"(exports, module) {
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
                }, proto[methodName].padportPatched = true;
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
              }, proto[methodName].padportPatched = true);
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
          let pausedGlobal = false;
          const SKIP_ATTR = "data-mediactl-skip", shouldSkip = (el) => el?.hasAttribute?.(SKIP_ATTR);
          function mediaState(el) {
            let meta = metaMedia.get(el);
            if (!meta) {
              meta = { pausedByCtl: false, prevMuted: el.muted };
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
            metaCtx.set(ctx, { suspendedByCtl: false, resuming: false, operation: 0 });
            ctx.addEventListener("statechange", () => {
              if (ctx.state === "closed") audioContexts.delete(ctx);
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
            mediaEls.forEach((el) => {
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
              return ctx.suspend().catch((error) => {
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
                  if (el.paused) el.play().catch((error) => console.error("Media resume failed", error));
                } catch (error) {
                  console.error("Media resume failed", error);
                }
                meta.pausedByCtl = false;
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
              return ctx.resume().catch((error) => {
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
          window.addEventListener("pagehide", (event) => {
            if (!event.persisted) {
              for (const ctx of audioContexts) {
                if (ctx.state !== "closed") ctx.close().catch((error) => console.error(error));
              }
              mediaEls.clear();
              audioContexts.clear();
            }
          });
        })();
      }
      module.exports = { installMedia };
    }
  });

  // runtime/src/platform.cjs
  var require_platform = __commonJS({
    "runtime/src/platform.cjs"(exports, module) {
      "use strict";
      function installPlatformModules({ require: require2, requireCache, Buffer: Buffer2, process: process2 }) {
        let greenworks = {};
        requireCache.greenworks = greenworks;
        greenworks.activateAchievement = function(achievement, success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.indicateAchievementProgress = function(achievement, current, max, success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.getAchievement = function(achievement, success_callback, error_callback) {
          if (success_callback) {
            success_callback(true);
          }
          return true;
        };
        greenworks.clearAchievement = function(achievement, success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.getAchievementNames = function() {
          return [];
        };
        greenworks.getNumberOfAchievements = function() {
          return 0;
        };
        greenworks.getAuthSessionTicket = function(success_callback, error_callback) {
          const ticket = { ticket: Buffer2.from("getAuthSessionTicket"), handle: 100 };
          if (success_callback) success_callback(ticket);
          return ticket;
        };
        greenworks.cancelAuthTicket = function(ticket_handle) {
          return true;
        };
        greenworks.getEncryptedAppTicket = function(user_data, success_callback, error_callback) {
          if (success_callback) {
            success_callback(Buffer2.from("getAuthSessionTicket"));
          }
          return true;
        };
        greenworks.decryptAppTicket = function(encrypted_ticket, decryption_key) {
          return Buffer2.from("getAuthSessionTicket");
        };
        greenworks.isTicketForApp = function(decrypted_ticket, app_id) {
          return true;
        };
        greenworks.getTicketIssueTime = function(decrypted_ticket) {
          return Math.floor(Date.now() / 1e3);
        };
        function returnSteamID() {
          let ret = {};
          ret.isAnonymous = function() {
            return false;
          };
          ret.isAnonymousGameServer = function() {
            return false;
          };
          ret.isAnonymousGameServerLogin = function() {
            return false;
          };
          ret.isAnonymousUser = function() {
            return false;
          };
          ret.isChatAccount = function() {
            return false;
          };
          ret.isClanAccount = function() {
            return false;
          };
          ret.isConsoleUserAccount = function() {
            return false;
          };
          ret.isContentServerAccount = function() {
            return false;
          };
          ret.isGameServerAccount = function() {
            return false;
          };
          ret.isIndividualAccount = function() {
            return true;
          };
          ret.isPersistentGameServerAccount = function() {
            return false;
          };
          ret.isLobby = function() {
            return false;
          };
          ret.getAccountID = function() {
            return 1234567890;
          };
          ret.getRawSteamID = function() {
            return "012345678901234567890123456789";
          };
          ret.getAccountType = function() {
            return 1;
          };
          ret.isValid = function() {
            return true;
          };
          ret.getStaticAccountKey = function() {
            return "012345678901234567890123456789";
          };
          ret.getPersonaName = function() {
            return "Player";
          };
          ret.getNickname = function() {
            return "Player";
          };
          ret.getRelationship = function() {
            return {};
          };
          ret.getSteamLevel = function() {
            return 1;
          };
          return ret;
        }
        greenworks.getTicketSteamId = function(decrypted_ticket) {
          return returnSteamID();
        };
        greenworks.saveTextToFile = function(file_name, file_content, success_callback, error_callback) {
          try {
            let fs = require2("fs");
            if (!fs.existsSync("steamSaveFiles")) {
              fs.mkdirSync("steamSaveFiles");
            }
            fs.writeFileSync("steamSaveFiles/" + file_name, file_content);
            if (success_callback) {
              success_callback();
            }
          } catch (e) {
            if (error_callback) {
              error_callback(e);
            }
          }
          return false;
        };
        greenworks.readTextFromFile = function(file_name, success_callback, error_callback) {
          try {
            if (success_callback) {
              success_callback(require2("fs").readFileSync("steamSaveFiles/" + file_name, "utf8"));
            }
          } catch (e) {
            if (error_callback) {
              error_callback(e);
            }
          }
          return false;
        };
        greenworks.deleteFile = function(file_name, success_callback, error_callback) {
          try {
            require2("fs").unlinkSync("steamSaveFiles/" + file_name);
          } catch (e) {
          }
          if (success_callback) {
            success_callback();
          }
          return false;
        };
        greenworks.saveFilesToCloud = function(file_name, success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return false;
        };
        greenworks.isCloudEnabledForUser = function() {
          return true;
        };
        greenworks.isCloudEnabled = function() {
          return true;
        };
        greenworks.enableCloud = function() {
          return true;
        };
        greenworks.getCloudQuota = function(success_callback, error_callback) {
          if (success_callback) {
            success_callback({
              total_bytes: 9999999,
              available_bytes: 9999999
            });
          }
          return true;
        };
        greenworks.getFileCount = function(success_callback, error_callback) {
          try {
            return require2("fs").readdirSync("steamSaveFiles").length;
          } catch (e) {
          }
          return 0;
        };
        greenworks.getFileNameAndSize = function(index) {
          let fs = require2("fs");
          let files = fs.readdirSync("steamSaveFiles");
          let stat = fs.statSync("steamSaveFiles/" + files[index]);
          return {
            name: files[index],
            size: stat.size
          };
        };
        greenworks.getDLCCount = function() {
          return 0;
        };
        greenworks.getDLCDataByIndex = function(index) {
          return {
            appId: 0,
            available: true,
            name: ""
          };
        };
        greenworks.isDLCInstalled = function(dlc_app_id) {
          return true;
        };
        greenworks.installDLC = function(dlc_app_id) {
          return true;
        };
        greenworks.uninstallDLC = function(dlc_app_id) {
          return true;
        };
        greenworks.on = function(evtype, callback) {
          return true;
        };
        greenworks.FriendFlags = {
          None: 0,
          Blocked: 1,
          FriendshipRequested: 2,
          Immediate: 3,
          ClanMember: 4,
          OnGameServer: 5,
          RequestingFriendship: 6,
          RequestingInfo: 7,
          Ignored: 8,
          IgnoredFriend: 9,
          ChatMember: 10,
          All: 11
        };
        greenworks.FriendRelationship = {
          None: 0,
          Blocked: 1,
          RequestRecipient: 2,
          Friend: 3,
          RequestInitiator: 4,
          Ignored: 5,
          IgnoredFriend: 6
        };
        greenworks.PersonaChange = {
          Name: 0,
          Status: 1,
          ComeOnline: 2,
          GoneOffline: 3,
          GamePlayed: 4,
          GameServer: 5,
          Avatar: 6,
          JoinedSource: 7,
          LeftSource: 8,
          RelationshipChanged: 9,
          NameFirstSet: 10,
          FacebookInfo: 11,
          NickName: 12,
          SteamLevel: 13
        };
        greenworks.AccountType = {
          Invalid: 0,
          Individual: 1,
          Multiseat: 2,
          GameServer: 3,
          AnonymousGameServer: 4,
          Pending: 5,
          ContentServer: 6,
          Clan: 7,
          Chat: 8,
          ConsoleUser: 9,
          AnonymousUser: 10
        };
        greenworks.ChatEntryType = {
          Invalid: 0,
          ChatMsg: 1,
          Typing: 2,
          InviteGame: 3,
          Emote: 4,
          LeftConversation: 5,
          Entered: 6,
          WasKicked: 7,
          WasBanned: 8,
          Disconnected: 9,
          HistoricalChat: 10,
          LinkBlocked: 11
        };
        greenworks.getFriendsAccount = function(friend_flag) {
          return 1;
        };
        greenworks.getFriendsAccount = function(getFriends) {
          return [returnSteamID()];
        };
        greenworks.requestUserInformation = function(raw_steam_id, require_name_only) {
          return returnSteamID();
        };
        greenworks.getSmallFriendAvatar = function(raw_steam_id) {
          return 0;
        };
        greenworks.getMediumFriendAvatar = function(raw_steam_id) {
          return 0;
        };
        greenworks.getLargeFriendAvatar = function(raw_steam_id) {
          return 0;
        };
        greenworks.setListenForFriendsMessage = function(intecept_enabled) {
          return 0;
        };
        greenworks.replyToFriendMessage = function(raw_steam_id, message) {
          return true;
        };
        greenworks.getFriendMessage = function(raw_steam_id, message_id, maximum_message_size) {
          return "dummy_getFriendMessage";
        };
        greenworks.getFriendPersonaName = function(raw_steam_id) {
          return "dummy_getFriendPersonaName";
        };
        greenworks.setRichPresence = function(pchKey, pchValue) {
          return false;
        };
        greenworks.ClearRichPresence = function() {
          return false;
        };
        greenworks.getFriendRichPresence = function(steamIDFriend, pchKey) {
          return "dummy_getFriendRichPresence";
        };
        greenworks.setPlayedWith = function(steamIDUserPlayedWith) {
          return true;
        };
        greenworks.getFriendGamePlayed = function(steamIDFriend) {
          return void 0;
        };
        greenworks.activateGameOverlayInviteDialog = function(steamIDLobby) {
          return void 0;
        };
        greenworks.activateGameOverlayToUser = function(pchDialog, steamID) {
          return void 0;
        };
        greenworks.ChatMemberStateChange = {
          Entered: 0,
          Left: 1,
          Disconnected: 2,
          Kicked: 3,
          Banned: 4
        };
        greenworks.LobbyComparison = {
          EqualToOrLessThan: 0,
          LessThan: 1,
          Equal: 2,
          GreaterThan: 3,
          EqualToOrGreaterThan: 4,
          NotEqual: 4
        };
        greenworks.LobbyDistanceFilter = {
          Close: 0,
          Default: 1,
          Far: 2,
          Worldwide: 3
        };
        greenworks.LobbyDistanceFilter = {
          Private: 0,
          FriendsOnly: 1,
          Public: 2,
          Invisible: 3
        };
        greenworks.Result = {
          OK: 0,
          Fail: 1,
          NoConnection: 2,
          InvalidPassword: 3,
          LoggedInElsewhere: 4,
          InvalidProtocolVer: 5,
          InvalidParam: 6,
          FileNotFound: 7,
          Busy: 8,
          InvalidState: 9,
          InvalidName: 10,
          InvalidEmail: 11,
          DuplicateName: 12,
          AccessDenied: 13,
          Timeout: 14,
          Banned: 15,
          AccountNotFound: 16,
          InvalidSteamID: 17,
          ServiceUnavailable: 18,
          NotLoggedOn: 19,
          Pending: 20,
          EncryptionFailure: 21,
          InsufficientPrivilege: 22,
          LimitExceeded: 23,
          Revoked: 24,
          Expired: 25,
          AlreadyRedeemed: 26,
          DuplicateRequest: 27,
          AlreadyOwned: 28,
          IPNotFound: 29,
          PersistFailed: 30,
          LockingFailed: 31,
          LogonSessionReplaced: 32,
          ConnectFailed: 33,
          HandshakeFailed: 34,
          IOFailure: 35,
          RemoteDisconnect: 36,
          ShoppingCartNotFound: 37,
          Blocked: 38,
          Ignored: 39,
          NoMatch: 40,
          AccountDisabled: 41,
          ServiceReadOnly: 42,
          AccountNotFeatured: 43,
          AdministratorOK: 44,
          ContentVersion: 45,
          TryAnotherCM: 46,
          PasswordRequiredToKickSession: 47,
          AlreadyLoggedInElsewhere: 48,
          Suspended: 49,
          Cancelled: 50,
          DataCorruption: 51,
          DiskFull: 52,
          RemoteCallFailed: 53,
          PasswordUnset: 54,
          ExternalAccountUnlinked: 55,
          PSNTicketInvalid: 56,
          ExternalAccountAlreadyLinked: 57,
          RemoteFileConflict: 58,
          IllegalPassword: 59,
          SameAsPreviousValue: 60,
          AccountLogonDenied: 61,
          CannotUseOldPassword: 62,
          InvalidLoginAuthCode: 63,
          AccountLogonDeniedNoMail: 64,
          HardwareNotCapableOfIPT: 65,
          IPTInitError: 66,
          ParentalControlRestricted: 67,
          FacebookQueryError: 68,
          ExpiredLoginAuthCode: 69,
          IPLoginRestrictionFailed: 70,
          AccountLockedDown: 71,
          AccountLogonDeniedVerifiedEmailRequired: 72,
          NoMatchingURL: 73,
          BadResponse: 74,
          RequirePasswordReEntry: 75,
          ValueOutOfRange: 76,
          UnexpectedError: 77,
          Disabled: 78,
          InvalidCEGSubmission: 79,
          RestrictedDevice: 80,
          RegionLocked: 81,
          RateLimitExceeded: 82,
          AccountLoginDeniedNeedTwoFactor: 83,
          ItemDeleted: 84,
          AccountLoginDeniedThrottle: 85,
          TwoFactorCodeMismatch: 86,
          TwoFactorActivationCodeMismatch: 87,
          AccountAssociatedToMultiplePartners: 88,
          NotModified: 89,
          NoMobileDevice: 90,
          TimeNotSynced: 91,
          SmsCodeFailed: 92,
          AccountLimitExceeded: 93,
          AccountActivityLimitExceeded: 94,
          PhoneActivityLimitExceeded: 95,
          RefundToWallet: 96,
          EmailSendFailure: 97,
          NotSettled: 98,
          NeedCaptcha: 99,
          GSLTDenied: 100,
          GSOwnerDenied: 101,
          InvalidItemType: 102,
          IPBanned: 103,
          GSLTExpired: 104,
          InsufficientFunds: 105,
          TooManyPending: 106
        };
        greenworks.createLobby = function(lobbyType, maxMembers) {
          return greenworks.Result.OK;
        };
        greenworks.deleteLobbyData = function(steamIDLobby, pchKey) {
          return true;
        };
        greenworks.getLobbyByIndex = function(index) {
          return "dummy_getLobbyByIndex";
        };
        greenworks.getLobbyMemberByIndex = function(steamIDLobby, iMember) {
          return "dummy_getLobbyMemberByIndex";
        };
        greenworks.getNumLobbyMembers = function(steamIDLobby) {
          return 0;
        };
        greenworks.getNumLobbyMembers = function(steamIDLobby) {
          return "dummy_getNumLobbyMembers";
        };
        greenworks.inviteUserToLobby = function(steamIDLobby, steamIDInvitee) {
          return false;
        };
        greenworks.joinLobby = function(steamIDLobby) {
          return greenworks.Result.Fail;
        };
        greenworks.leaveLobby = function(steamIDLobby) {
          return greenworks.Result.OK;
        };
        greenworks.setLobbyData = function(steamIDLobby, pchKey, pchValue) {
          return true;
        };
        greenworks.setLobbyJoinable = function(steamIDLobby, bLobbyJoinable) {
          return true;
        };
        greenworks.setLobbyOwner = function(steamIDLobby, steamIDNewOwner) {
          return true;
        };
        greenworks.setLobbyOwner = function(steamIDLobby, eLobbyType) {
          return true;
        };
        greenworks.initAPI = function() {
          return true;
        };
        greenworks.init = function() {
          return true;
        };
        greenworks.isSteamRunning = function() {
          return true;
        };
        greenworks.isSteamRunningOnSteamDeck = function() {
          return false;
        };
        greenworks.restartAppIfNecessary = function(appId) {
          return false;
        };
        greenworks.getAppId = function() {
          return 0;
        };
        greenworks.getAppBuildId = function() {
          return 0;
        };
        greenworks.getSteamId = function() {
          return returnSteamID();
        };
        greenworks.getCurrentGameLanguage = function() {
          return "zh-CN";
        };
        greenworks.getCurrentUILanguage = function() {
          return "zh-CN";
        };
        greenworks.getCurrentGameInstallDir = function() {
          return process2.cwd();
        };
        greenworks.getAppInstallDir = function(app_id, buffer, buffer_size) {
          return process2.cwd();
        };
        greenworks.getNumberOfPlayers = function(success_callback, error_callback) {
          if (success_callback) {
            success_callback(1);
          }
          return true;
        };
        greenworks.activateGameOverlay = function(option) {
          return true;
        };
        greenworks.isGameOverlayEnabled = function() {
          return false;
        };
        greenworks.isSteamInBigPictureMode = function() {
          return false;
        };
        greenworks.activateGameOverlayToWebPage = function(url) {
          return false;
        };
        greenworks.activateGameOverlayToWebPage = function(appId, storeFlag) {
          return false;
        };
        greenworks.isSubscribedApp = function(appId) {
          return true;
        };
        greenworks.isAppInstalled = function(appId) {
          return true;
        };
        greenworks.getImageSize = function(handle) {
          return {
            width: 0,
            height: 0
          };
        };
        greenworks.getImageRGBA = function(handle) {
          return Buffer2.alloc(0);
        };
        greenworks.getIPCountry = function(handle) {
          return "US";
        };
        greenworks.getLaunchCommandLine = function(handle) {
          return "";
        };
        greenworks.getStatInt = function(name) {
          return 0;
        };
        greenworks.getStatFloat = function(name) {
          return 0;
        };
        greenworks.setStat = function(name, value) {
          return true;
        };
        greenworks.storeStats = function(success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.FloatingGamepadTextInputMode = 0;
        greenworks.showFloatingGamepadTextInput = function(keyboardMode, x, y, width, height) {
          return true;
        };
        greenworks.Utils = {};
        greenworks.Utils.move = function(source_dir, target_dir, success_callback, error_callback) {
          return true;
        };
        greenworks.Utils.createArchive = function(zip_file_path, source_dir, password, compress_level, success_callback, error_callback) {
          return true;
        };
        greenworks.Utils.extractArchive = function(zip_file_path, extract_dir, password, success_callback, error_callback) {
          return true;
        };
        greenworks.fileShare = function(file_path, success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.publishWorkshopFile = function(options, file_path, image_path, title, description, success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.updatePublishedWorkshopFile = function(options, published_file_handle, file_path, image_path, title, description, success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.ugcPublish = function(file_path, title, description, image_path, success_callback, error_callback, progress_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.ugcPublishUpdate = function(published_file_handle, file_path, title, description, image_path, success_callback, error_callback, progress_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.ugcGetItems = function(options, ugc_matching_type, ugc_query_type, success_callback, error_callback) {
          if (success_callback) {
            success_callback([]);
          }
          return true;
        };
        greenworks.ugcGetUserItems = function(options, ugc_matching_type, ugc_list_sort_order, ugc_list, success_callback, error_callback) {
          if (success_callback) {
            success_callback([]);
          }
          return true;
        };
        greenworks.ugcDownloadItem = function(download_file_handle, download_dir, success_callback, error_callback) {
          if (success_callback) {
            success_callback();
          }
          return true;
        };
        greenworks.ugcSynchronizeItems = function(options, sync_dir, success_callback, error_callback) {
          if (success_callback) {
            success_callback([]);
          }
          return true;
        };
        greenworks.ugcUnsubscribe = function(published_file_handle, success_callback, error_callback) {
          if (success_callback) {
            success_callback([]);
          }
          return true;
        };
        greenworks.ugcShowOverlay = function(published_file_id) {
          return true;
        };
        greenworks.ugcGetItemState = function(published_file_id) {
          return 0;
        };
        greenworks.ugcGetItemInstallInfo = function(published_file_id) {
          return void 0;
        };
        greenworks._steam_events = {
          "on": function() {
          }
        };
        const greenworksKeys = Object.keys(greenworks);
        const greenworksProxy = new Proxy(greenworks, {
          get(target, prop, receiver) {
            return Reflect.get(target, prop, receiver);
          },
          set(target, prop, value, receiver) {
            if (greenworksKeys.includes(prop)) {
              return true;
            }
            return Reflect.set(target, prop, value, receiver);
          }
        });
        requireCache["./lib/greenworks-osx64"] = greenworksProxy;
        requireCache["./lib/greenworks-osx32"] = greenworksProxy;
        requireCache["./lib/greenworks-win64"] = greenworksProxy;
        requireCache["./lib/greenworks-win32"] = greenworksProxy;
        requireCache["./lib/greenworks-linux64"] = greenworksProxy;
        requireCache["./lib/greenworks-linux32"] = greenworksProxy;
        let steamworksInitAppId = 0;
        const createMockLobby = (id) => ({
          id: BigInt(id),
          leave() {
          },
          openInviteDialog() {
          },
          getData() {
            return null;
          },
          setData() {
            return false;
          },
          setJoinable() {
            return false;
          },
          getMemberCount() {
            return 0;
          },
          getMemberLimit() {
            return 0;
          },
          getOwner() {
            return { steamId64: BigInt(0) };
          },
          getMembers() {
            return [];
          }
        });
        const createSteamworksApi = (appId) => ({
          achievement: {
            activate() {
            },
            clear() {
            },
            isActivated() {
              return false;
            }
          },
          localplayer: {
            getSteamId() {
              return { steamId64: BigInt(0) };
            },
            getName() {
              return "Player";
            },
            getIpCountry() {
              return "Unknown";
            },
            getLevel() {
              return 0;
            },
            setRichPresence() {
            }
          },
          utils: {
            getAppId() {
              return appId || steamworksInitAppId || 0;
            },
            getServerRealTime() {
              return Date.now();
            },
            isSteamRunningOnSteamDeck() {
              return false;
            }
          },
          matchmaking: {
            createLobby() {
              return Promise.resolve(createMockLobby(1));
            },
            getLobbies() {
              return Promise.resolve([]);
            },
            joinLobby(id) {
              return Promise.resolve(createMockLobby(id));
            }
          },
          apps: {
            isSubscribedApp() {
              return false;
            },
            isAppInstalled() {
              return false;
            },
            isDlcInstalled() {
              return false;
            },
            appInstallDir() {
              return "";
            },
            isVacBanned() {
              return false;
            },
            isLowViolence() {
              return false;
            },
            isSubscribed() {
              return false;
            },
            currentGameLanguage() {
              return "";
            },
            currentBetaName() {
              return "";
            },
            appBuildId() {
              return 0;
            }
          },
          cloud: {
            isEnabledForAccount() {
              return false;
            },
            isEnabledForApp() {
              return false;
            },
            readFile() {
              return "";
            },
            writeFile() {
              return false;
            },
            fileExists() {
              return false;
            },
            deleteFile() {
              return false;
            }
          },
          workshop: {
            createItem() {
              return Promise.reject(new Error("steamworks.js stub"));
            },
            updateItem() {
              return Promise.reject(new Error("steamworks.js stub"));
            },
            subscribe() {
              return Promise.reject(new Error("steamworks.js stub"));
            },
            unsubscribe() {
              return Promise.reject(new Error("steamworks.js stub"));
            },
            download() {
            },
            state() {
              return 0;
            },
            installInfo() {
              return null;
            },
            downloadInfo() {
              return null;
            }
          }
        });
        const steamworksJs = {
          electronEnableSteamOverlay() {
          },
          restartAppIfNecessary() {
            return false;
          },
          init(appId) {
            steamworksInitAppId = appId || 0;
            return createSteamworksApi(appId);
          }
        };
        requireCache["steamworks.js"] = steamworksJs;
        return {
          greenworks,
          steamworks: steamworksJs
        };
      }
      module.exports = { installPlatformModules };
    }
  });

  // app/src/main/assets/ui-strings.js
  var require_ui_strings = __commonJS({
    "app/src/main/assets/ui-strings.js"() {
      (() => {
        "use strict";
        const strings = {
          en: {
            unsupported_save: "Cannot map this save file to browser storage: {0}",
            invalid_save_index: "The MV save index is invalid. No saves were imported.",
            incompatible_save_index: "The MV save index uses a different engine identifier. No saves were imported.",
            no_directory_saves: "No supported saves were found in the game save folder.",
            no_app_saves: "This game has no app saves to export.",
            game_font_error: "GameFont failed to load. Check the game font files and fonts/gamefont.css.",
            ttm_title_hint: "Start or load a game to open the notebook.",
            ttm_notebook: "Notebook",
            ttm_characters: "Characters",
            ttm_notes: "Notes",
            ttm_items: "Items",
            ttm_empty: "Nothing collected in this section yet.",
            dual_waiting: "Waiting for the game\u2026",
            dual_party: "Party",
            dual_choose_target: "Choose the item target",
            dual_inventory: "Inventory",
            dual_use: "Use",
            dual_back: "Back",
            dual_choose_action: "Choose an action",
            dual_confirm_drop: "Discard?",
            weather_clear: "Clear",
            weather_cloudy: "Cloudy",
            weather_rain: "Rain",
            weather_storm: "Storm",
            weather_snow: "Snow",
            snapshot_error: "Controller snapshot: {0}",
            node_module: "PadPort: Node.js module is unavailable: {0}",
            node_fs_readonly: "PadPort: game files are read-only ({0})",
            binary_save: "Unsupported binary save: {0}",
            export_error: "Export: {0}",
            wrong_backup: "This backup belongs to another game or uses an unsupported format.",
            invalid_backup: "Invalid save backup structure.",
            no_forage: "The game engine does not provide localforage storage.",
            invalid_local_storage: "Invalid localStorage value: {0}",
            import_error: "Import: {0}",
            gamepad_ready: "Gamepad API ready \xB7 {0}",
            tester: "tester",
            tester_title: "PadPort \u2014 controller tester",
            tester_heading: "What does the game see?",
            tester_hint: "This is the same Gamepad API used by RPG Maker. Press buttons and move the sticks and triggers.",
            keyboard_events: "Keyboard events: ",
            held_keys: "Held keys: ",
            keyboard_mode_hint: "Keyboard mode \u2014 mapped controller buttons appear below as keyboard events.",
            tester_footer: "In Gamepad mode, the keyboard counter stays at 0. Keyboard mode sends mapped keys instead. App menu: \u22EE or the system Back button.",
            no_controller: "No controller connected. Connect a Bluetooth/USB controller. For keyboard-mode HID devices, map their buttons first.",
            left_stick: "Left: ",
            right_stick: "Right: "
          },
          zh: {
            unsupported_save: "\u65E0\u6CD5\u5C06\u6B64\u5B58\u6863\u6587\u4EF6\u6620\u5C04\u5230\u5E94\u7528\u5B58\u50A8\uFF1A{0}",
            invalid_save_index: "MV \u5B58\u6863\u7D22\u5F15\u65E0\u6548\uFF0C\u672A\u5BFC\u5165\u4EFB\u4F55\u5B58\u6863\u3002",
            incompatible_save_index: "MV \u5B58\u6863\u7D22\u5F15\u7684\u5F15\u64CE\u6807\u8BC6\u4E0D\u4E00\u81F4\uFF0C\u672A\u5BFC\u5165\u4EFB\u4F55\u5B58\u6863\u3002",
            no_directory_saves: "\u6E38\u620F save \u76EE\u5F55\u4E2D\u6CA1\u6709\u53D7\u652F\u6301\u7684\u5B58\u6863\u3002",
            no_app_saves: "\u5E94\u7528\u5185\u6CA1\u6709\u672C\u6E38\u620F\u53EF\u5BFC\u51FA\u7684\u5B58\u6863\u3002",
            game_font_error: "\u6E38\u620F\u5B57\u4F53\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5B57\u4F53\u6587\u4EF6\u53CA fonts/gamefont.css\u3002",
            ttm_title_hint: "\u5F00\u59CB\u6216\u8F7D\u5165\u6E38\u620F\u540E\u53EF\u67E5\u770B\u7B14\u8BB0\u672C\u3002",
            ttm_notebook: "\u7B14\u8BB0\u672C",
            ttm_characters: "\u4EBA\u7269",
            ttm_notes: "\u7B14\u8BB0",
            ttm_items: "\u7269\u54C1",
            ttm_empty: "\u6B64\u5206\u7C7B\u6682\u65E0\u5185\u5BB9\u3002",
            dual_waiting: "\u6B63\u5728\u7B49\u5F85\u6E38\u620F\u2026",
            dual_party: "\u961F\u4F0D",
            dual_choose_target: "\u9009\u62E9\u7269\u54C1\u4F7F\u7528\u5BF9\u8C61",
            dual_inventory: "\u7269\u54C1\u680F",
            dual_use: "\u4F7F\u7528",
            dual_back: "\u8FD4\u56DE",
            dual_choose_action: "\u9009\u62E9\u64CD\u4F5C",
            dual_confirm_drop: "\u4E22\u5F03\uFF1F",
            weather_clear: "\u6674",
            weather_cloudy: "\u591A\u4E91",
            weather_rain: "\u96E8",
            weather_storm: "\u66B4\u98CE\u96E8",
            weather_snow: "\u96EA",
            snapshot_error: "\u63A7\u5236\u5668\u72B6\u6001\uFF1A{0}",
            node_module: "PadPort\uFF1A\u65E0\u6CD5\u4F7F\u7528 Node.js \u6A21\u5757\uFF1A{0}",
            node_fs_readonly: "PadPort\uFF1A\u6E38\u620F\u8D44\u6E90\u6587\u4EF6\u4E3A\u53EA\u8BFB\uFF08{0}\uFF09",
            binary_save: "\u4E0D\u652F\u6301\u7684\u4E8C\u8FDB\u5236\u5B58\u6863\uFF1A{0}",
            export_error: "\u5BFC\u51FA\u5931\u8D25\uFF1A{0}",
            wrong_backup: "\u5907\u4EFD\u5C5E\u4E8E\u5176\u4ED6\u6E38\u620F\uFF0C\u6216\u683C\u5F0F\u4E0D\u53D7\u652F\u6301\u3002",
            invalid_backup: "\u5B58\u6863\u5907\u4EFD\u7ED3\u6784\u65E0\u6548\u3002",
            no_forage: "\u6E38\u620F\u5F15\u64CE\u672A\u63D0\u4F9B localforage \u5B58\u50A8\u3002",
            invalid_local_storage: "\u65E0\u6548\u7684 localStorage \u6570\u636E\uFF1A{0}",
            import_error: "\u5BFC\u5165\u5931\u8D25\uFF1A{0}",
            gamepad_ready: "\u624B\u67C4\u63A5\u53E3\u5DF2\u5C31\u7EEA \xB7 {0}",
            tester: "\u6D4B\u8BD5\u5668",
            tester_title: "PadPort \xB7 \u63A7\u5236\u5668\u6D4B\u8BD5",
            tester_heading: "\u6E38\u620F\u6536\u5230\u4E86\u54EA\u4E9B\u8F93\u5165\uFF1F",
            tester_hint: "\u8FD9\u91CC\u4F7F\u7528\u4E0E RPG Maker \u76F8\u540C\u7684\u624B\u67C4\u63A5\u53E3\u3002\u8BF7\u6309\u4E0B\u6309\u94AE\u3001\u79FB\u52A8\u6447\u6746\u6216\u6273\u673A\u3002",
            keyboard_events: "\u952E\u76D8\u4E8B\u4EF6\uFF1A",
            held_keys: "\u5F53\u524D\u6309\u952E\uFF1A",
            keyboard_mode_hint: "\u952E\u76D8\u6A21\u5F0F\uFF1A\u4E0B\u65B9\u663E\u793A\u6620\u5C04\u6309\u94AE\u4EA7\u751F\u7684\u952E\u76D8\u4E8B\u4EF6\u3002",
            tester_footer: "\u624B\u67C4\u6A21\u5F0F\u4E0B\u952E\u76D8\u8BA1\u6570\u4FDD\u6301\u4E3A 0\uFF0C\u952E\u76D8\u6A21\u5F0F\u4F1A\u53D1\u9001\u6620\u5C04\u6309\u952E\u3002\u70B9\u51FB \u22EE \u6216\u7CFB\u7EDF\u8FD4\u56DE\u952E\u6253\u5F00\u83DC\u5355\u3002",
            no_controller: "\u672A\u8FDE\u63A5\u63A7\u5236\u5668\u3002\u8BF7\u8FDE\u63A5\u84DD\u7259\u6216 USB \u624B\u67C4\uFF1B\u952E\u76D8\u6A21\u5F0F\u8BBE\u5907\u9700\u5148\u6620\u5C04\u6309\u952E\u3002",
            left_stick: "\u5DE6\u6447\u6746\uFF1A",
            right_stick: "\u53F3\u6447\u6746\uFF1A"
          },
          pl: {
            unsupported_save: "Nie mo\u017Cna przypisa\u0107 pliku zapisu do magazynu przegl\u0105darki: {0}",
            invalid_save_index: "Indeks zapis\xF3w MV jest nieprawid\u0142owy. Nie zaimportowano zapis\xF3w.",
            incompatible_save_index: "Indeks zapis\xF3w MV ma inny identyfikator silnika. Nie zaimportowano zapis\xF3w.",
            no_directory_saves: "Brak obs\u0142ugiwanych zapis\xF3w w folderze save gry.",
            no_app_saves: "Ta gra nie ma zapis\xF3w aplikacji do eksportu.",
            ttm_title_hint: "Rozpocznij lub wczytaj gr\u0119, aby otworzy\u0107 notatnik.",
            ttm_notebook: "Notatnik",
            ttm_characters: "Postacie",
            ttm_notes: "Notatki",
            ttm_items: "Przedmioty",
            ttm_empty: "Nie ma jeszcze wpis\xF3w w tej sekcji.",
            dual_waiting: "Oczekiwanie na gr\u0119\u2026",
            dual_party: "Dru\u017Cyna",
            dual_choose_target: "Wybierz cel przedmiotu",
            dual_inventory: "Ekwipunek",
            dual_use: "U\u017Cyj",
            dual_back: "Wstecz",
            dual_choose_action: "Wybierz akcj\u0119",
            dual_confirm_drop: "Wyrzuci\u0107?",
            weather_clear: "Pogodnie",
            weather_cloudy: "Pochmurno",
            weather_rain: "Deszcz",
            weather_storm: "Burza",
            weather_snow: "\u015Anieg",
            snapshot_error: "Stan kontrolera: {0}",
            node_module: "PadPort: niedost\u0119pny modu\u0142 Node.js: {0}",
            node_fs_readonly: "PadPort: pliki gry s\u0105 tylko do odczytu ({0})",
            binary_save: "Niestandardowy binarny zapis: {0}",
            export_error: "Eksport: {0}",
            wrong_backup: "Kopia pochodzi z innej gry albo ma nieobs\u0142ugiwany format.",
            invalid_backup: "Nieprawid\u0142owa struktura kopii zapis\xF3w.",
            no_forage: "Silnik nie udost\u0119pnia magazynu localforage.",
            invalid_local_storage: "Nieprawid\u0142owy localStorage: {0}",
            import_error: "Import: {0}",
            gamepad_ready: "Gamepad API gotowe \xB7 {0}",
            tester: "tester",
            tester_title: "PadPort \u2014 tester kontrolera",
            tester_heading: "Co widzi gra?",
            tester_hint: "To ten sam Gamepad API, z kt\xF3rego korzysta RPG Maker. Wci\u015Bnij przyciski, porusz ga\u0142kami i triggerami.",
            keyboard_events: "Wygenerowane zdarzenia klawiatury: ",
            held_keys: "Trzymane klawisze: ",
            keyboard_mode_hint: "Tryb klawiaturowy \u2014 przypisane przyciski pada pojawiaj\u0105 si\u0119 poni\u017Cej jako zdarzenia klawiatury.",
            tester_footer: "W trybie Gamepad licznik klawiatury pozostaje na 0. Tryb Klawiatura wysy\u0142a przypisane klawisze. Menu aplikacji: \u22EE lub systemowy Wstecz.",
            no_controller: "Brak kontrolera. Pod\u0142\u0105cz pad Bluetooth/USB. W trybie klawiaturowym najpierw naucz aplikacj\u0119 jego przycisk\xF3w.",
            left_stick: "Lewy: ",
            right_stick: "Prawy: "
          }
        };
        const requestedLanguage = (window.__PADPORT_CONFIG__ || {}).language;
        const language = Object.prototype.hasOwnProperty.call(strings, requestedLanguage) ? requestedLanguage : "en";
        const text = (key, ...args) => (strings[language][key] || strings.en[key] || key).replace(/\{(\d+)\}/g, (_, index) => String(args[Number(index)] ?? ""));
        window.PadPortI18n = Object.freeze({ language, text, keys: Object.freeze(Object.keys(strings.en)) });
      })();
    }
  });

  // runtime/src/input.cjs
  var require_input = __commonJS({
    "runtime/src/input.cjs"(exports, module) {
      "use strict";
      function clearInput() {
        if (window.Input && typeof window.Input.clear === "function") window.Input.clear();
        if (window.TouchInput && typeof window.TouchInput.clear === "function") window.TouchInput.clear();
      }
      function installInput(snapshot) {
        let revision = -1;
        let pads = [null, null, null, null];
        let lastPaused = false;
        let inputMode = "gamepad";
        function event(name, pad) {
          const e = new Event(name);
          Object.defineProperty(e, "gamepad", { value: pad });
          window.dispatchEvent(e);
        }
        function poll() {
          const data = snapshot();
          if (data.revision === revision) return pads.slice();
          revision = data.revision;
          const mode = data.inputMode === "keyboard" ? "keyboard" : "gamepad";
          if (mode !== inputMode) clearInput();
          inputMode = mode;
          const next = [null, null, null, null];
          for (let i = 0; i < next.length; i++) {
            const raw = inputMode === "keyboard" ? null : (data.pads || [])[i];
            const old = pads[i];
            if (old && (!raw || old._nativeId !== raw.nativeId)) {
              old.connected = false;
              old.buttons.forEach((b) => {
                b.pressed = b.touched = false;
                b.value = 0;
              });
              old.axes.fill(0);
              event("gamepaddisconnected", old);
              clearInput();
            }
            if (!raw) continue;
            const same = old && old.connected && old._nativeId === raw.nativeId;
            const pad = same ? old : {
              id: "PadPort \xB7 " + raw.id,
              index: i,
              connected: true,
              mapping: "standard",
              axes: [0, 0, 0, 0],
              buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
              timestamp: 0,
              _nativeId: raw.nativeId
            };
            for (let a = 0; a < 4; a++) pad.axes[a] = data.paused ? 0 : Math.max(-1, Math.min(1, Number(raw.axes[a]) || 0));
            for (let b = 0; b < 17; b++) {
              const value = data.paused ? 0 : Math.max(0, Math.min(1, Number(raw.buttons[b]) || 0));
              Object.assign(pad.buttons[b], { value, pressed: value > 0.5, touched: value > 0 });
            }
            pad.timestamp = performance.now();
            next[i] = pad;
            if (!same) event("gamepadconnected", pad);
          }
          if (data.paused && !lastPaused) clearInput();
          lastPaused = Boolean(data.paused);
          pads = next;
          return pads.slice();
        }
        Object.defineProperty(navigator, "getGamepads", { value: poll, configurable: true });
        Object.defineProperty(navigator, "webkitGetGamepads", { value: poll, configurable: true });
        return { poll, inputMode: () => inputMode };
      }
      module.exports = { installInput, clearInput };
    }
  });

  // runtime/src/host.cjs
  var require_host = __commonJS({
    "runtime/src/host.cjs"(exports, module) {
      "use strict";
      var { installInput, clearInput } = require_input();
      function installHost({ base, client }) {
        let state = { revision: 0, paused: false, pads: [] };
        const nativeLifecycle = typeof window.PadPortFiles?.request === "function";
        let disposed = false, reportingFailure = false, mediaPaused = false;
        const endpoint = (name) => base + "__padport__/" + name;
        const post = async (name, body) => {
          if (disposed) return;
          try {
            const response = await fetch(endpoint(name), { method: "POST", body: String(body == null ? "" : body) });
            if (!response.ok) throw new Error("Host request failed: " + response.status);
            reportingFailure = false;
          } catch (error) {
            if (!reportingFailure) console.warn("Host request failed: " + error.message);
            reportingFailure = true;
          }
        };
        const host = window.PadPortHost = {
          inputSnapshot: () => state,
          snapshot: () => JSON.stringify(state),
          log: (value) => post("log", value),
          debugState: (value) => post("debug-state", value)
        };
        let viewportGraphics = null;
        let viewportSignature = "";
        function log(message) {
          host.log(String(message).slice(0, 2e3));
        }
        function viewportSize() {
          return [
            window.innerWidth || document.documentElement.clientWidth,
            window.innerHeight || document.documentElement.clientHeight
          ];
        }
        function updateFitScale() {
          const [width, height] = viewportSize();
          if (width > 0 && height > 0 && this._width > 0 && this._height > 0) {
            this._stretchEnabled = true;
            this._realScale = Math.min(width / this._width, height / this._height);
          }
        }
        function fitToViewport() {
          const g = window.Graphics;
          if (!g || !g._canvas || !(g._width > 0 && g._height > 0) || typeof g._updateAllElements !== "function") return false;
          const [width, height] = viewportSize();
          if (!(width > 0 && height > 0)) return false;
          const signature = [width, height, g._width, g._height].join(":");
          const expected = Math.min(width / g._width, height / g._height);
          const changed = viewportGraphics !== g || viewportSignature !== signature || g._updateRealScale !== updateFitScale || !g._stretchEnabled || Math.abs(g._realScale - expected) > 1e-9;
          g._updateRealScale = updateFitScale;
          if (changed) {
            viewportGraphics = g;
            viewportSignature = signature;
            g._updateAllElements();
          }
          return true;
        }
        const { poll, inputMode } = installInput(() => state);
        const events = new EventSource(endpoint("events"));
        let mediaTransition = Promise.resolve();
        function setPaused(paused) {
          if (paused === mediaPaused) return mediaTransition;
          mediaPaused = paused;
          clearInput();
          return mediaTransition = (paused ? window.__mediaCtl.pause() : window.__mediaCtl.resume()).catch((error) => log("Media: " + error.message));
        }
        events.onmessage = (event) => {
          const next = JSON.parse(event.data);
          const changed = Boolean(next.paused) !== Boolean(state.paused);
          state = next;
          poll();
          if (changed && !nativeLifecycle) setPaused(Boolean(state.paused));
        };
        events.addEventListener("cmd", (event) => {
          const command = String(event.data);
          if (command === "pause") setPaused(true);
          else if (command === "resume") setPaused(false);
          else if (command === "debug:true" || command === "debug:false")
            window.PadPortDebug.setEnabled(command === "debug:true");
        });
        const pressedKeys = /* @__PURE__ */ new Set(), keyId = (event) => event.code || event.keyCode + ":" + event.location;
        window.addEventListener("keydown", (event) => {
          const key = keyId(event);
          if (pressedKeys.has(key) && !event.repeat)
            Object.defineProperty(event, "repeat", { configurable: true, value: true });
          pressedKeys.add(key);
          poll();
        }, true);
        window.addEventListener("keyup", (event) => {
          pressedKeys.delete(keyId(event));
          poll();
        }, true);
        window.addEventListener("blur", () => {
          pressedKeys.clear();
          clearInput();
        });
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            pressedKeys.clear();
            clearInput();
          }
        });
        window.addEventListener("resize", fitToViewport);
        let fitFrame = 0;
        const fit = () => {
          if (!disposed && !fitToViewport()) fitFrame = requestAnimationFrame(fit);
        };
        fitFrame = requestAnimationFrame(fit);
        window.addEventListener("pagehide", () => {
          disposed = true;
          cancelAnimationFrame(fitFrame);
          events.close();
          clearInput();
          fetch(endpoint("release"), { method: "POST", body: client, keepalive: true }).catch((error) => console.error(error));
        }, { once: true });
        window.addEventListener("error", (event) => log("ERROR " + (event.error && event.error.stack || event.message + " @ " + event.filename + ":" + event.lineno)));
        window.addEventListener("unhandledrejection", (event) => log("PROMISE " + (event.reason && event.reason.stack || String(event.reason))));
        window.PadPort = Object.freeze({
          poll,
          inputMode,
          clearInput,
          fitToViewport,
          pause: () => setPaused(true),
          resume: () => setPaused(false)
        });
      }
      module.exports = { installHost };
    }
  });

  // app/src/main/assets/runtime-debug.js
  var require_runtime_debug = __commonJS({
    "app/src/main/assets/runtime-debug.js"() {
      (() => {
        "use strict";
        if (window.PadPortDebug) return;
        const host = window.PadPortHost;
        const pending = /* @__PURE__ */ new Map();
        const requests = /* @__PURE__ */ new WeakMap();
        const history2 = [];
        const failures = [];
        let timer = null;
        let previousFrame = null;
        let tracker = null;
        function record(error) {
          failures.push({ at: Date.now(), error: String(error).slice(0, 2048) });
          if (failures.length > 10) failures.shift();
        }
        function failure(event) {
          const error = event.error || event.reason;
          record(error && error.stack || error || event.message);
        }
        function snapshot() {
          const manager = window.SceneManager;
          const scene = manager && manager._scene;
          const graphics = window.Graphics;
          const frame = graphics && graphics.frameCount;
          const interpreters = [];
          let interpreter = window.$gameMap && window.$gameMap._interpreter;
          while (interpreter && interpreters.length < 8) {
            const command = interpreter._list && interpreter._list[interpreter._index];
            interpreters.push({
              index: interpreter._index,
              command: command && command.code,
              waitMode: interpreter._waitMode,
              waitCount: interpreter._waitCount
            });
            interpreter = interpreter._childInterpreter;
          }
          const images = [];
          const imageManager = window.ImageManager;
          const caches = imageManager ? [
            imageManager._imageCache && imageManager._imageCache._items,
            imageManager._cache,
            imageManager._system
          ] : [];
          for (const cache of caches) {
            if (!cache) continue;
            for (const entry of Object.values(cache)) {
              const bitmap = entry && (entry.bitmap || entry);
              if (bitmap && bitmap._loadingState && !["loaded", "none"].includes(bitmap._loadingState)) {
                images.push({ url: String(bitmap._url).slice(0, 256), state: bitmap._loadingState });
                if (images.length === 12) break;
              }
            }
            if (images.length === 12) break;
          }
          const audio = window.WebAudio && window.WebAudio._context;
          const input = window.Input;
          const native = JSON.parse(host.snapshot());
          const state = {
            at: Date.now(),
            visibility: document.visibilityState,
            frame,
            frameDelta: previousFrame == null || frame == null ? null : frame - previousFrame,
            scene: scene && scene.constructor.name,
            sceneStarted: manager && manager._sceneStarted,
            stopped: manager && manager._stopped,
            frozen: manager && manager._freeze,
            sceneActive: scene && scene._active,
            audio: audio && audio.state,
            native: { revision: native.revision, paused: native.paused, inputMode: native.inputMode },
            pressed: input && Object.keys(input._currentState || {}).filter((key) => input._currentState[key]),
            interpreters,
            images,
            requests: Array.from(pending.values()).slice(0, 12).map((request) => ({ method: request.method, url: request.url, elapsed: Date.now() - request.at }))
          };
          return state;
        }
        function sample() {
          const state = snapshot();
          previousFrame = state.frame;
          history2.push(state);
          if (history2.length > 10) history2.shift();
          const report = { samples: history2.slice(), errors: failures.slice() };
          let json = JSON.stringify(report);
          while (json.length > 8192 && report.samples.length > 1) {
            report.samples.shift();
            json = JSON.stringify(report);
          }
          while (json.length > 8192 && report.errors.length) {
            report.errors.shift();
            json = JSON.stringify(report);
          }
          host.debugState(json);
        }
        function setEnabled(enabled) {
          if (enabled === (timer !== null)) return;
          if (enabled) {
            const active = { enabled: true };
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            const trackedOpen = function(method, url) {
              const result = originalOpen.apply(this, arguments);
              if (active.enabled) requests.set(this, { method: String(method).slice(0, 16), url: String(url).slice(0, 256) });
              return result;
            };
            const trackedSend = function() {
              const request = active.enabled && requests.get(this);
              if (request) {
                const key = {};
                const stack = new Error("XHR " + request.method + " " + request.url).stack;
                if (pending.size < 100) pending.set(key, { ...request, at: Date.now() });
                this.addEventListener("loadend", () => {
                  pending.delete(key);
                  if (active.enabled && (this.status === 0 || this.status >= 400)) record("HTTP " + this.status + " " + stack);
                }, { once: true });
                try {
                  return originalSend.apply(this, arguments);
                } catch (error) {
                  pending.delete(key);
                  throw error;
                }
              }
              return originalSend.apply(this, arguments);
            };
            XMLHttpRequest.prototype.open = trackedOpen;
            XMLHttpRequest.prototype.send = trackedSend;
            tracker = { active, originalOpen, originalSend, trackedOpen, trackedSend };
            window.addEventListener("error", failure);
            window.addEventListener("unhandledrejection", failure);
            timer = setInterval(sample, 1e3);
            sample();
          } else {
            clearInterval(timer);
            timer = null;
            previousFrame = null;
            window.removeEventListener("error", failure);
            window.removeEventListener("unhandledrejection", failure);
            tracker.active.enabled = false;
            if (XMLHttpRequest.prototype.open === tracker.trackedOpen) XMLHttpRequest.prototype.open = tracker.originalOpen;
            if (XMLHttpRequest.prototype.send === tracker.trackedSend) XMLHttpRequest.prototype.send = tracker.originalSend;
            tracker = null;
            pending.clear();
            history2.length = 0;
            failures.length = 0;
          }
        }
        window.PadPortDebug = Object.freeze({ setEnabled, snapshot });
        if (window.__PADPORT_CONFIG__.debug === true) setEnabled(true);
      })();
    }
  });

  // runtime/src/frame-scheduler.cjs
  var require_frame_scheduler = __commonJS({
    "runtime/src/frame-scheduler.cjs"(exports, module) {
      "use strict";
      function installFrameScheduler() {
        const rawRAF = window.requestAnimationFrame.bind(window);
        const rawCAF = window.cancelAnimationFrame.bind(window);
        const FPS = 60;
        const interval = 1e3 / FPS;
        const frameTolerance = 1;
        let idSeed = 1;
        const scheduled = /* @__PURE__ */ new Map();
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
            if (delta + frameTolerance < interval) {
              ensureDriver();
              return;
            }
            if (delta >= interval) {
              lastExec = ts - delta % interval;
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
      module.exports = { installFrameScheduler };
    }
  });

  // runtime/src/electron-main.cjs
  var require_electron_main = __commonJS({
    "runtime/src/electron-main.cjs"(exports, module) {
      "use strict";
      function startMainScope({ app, filename, directory, makeRequire, electron, script }) {
        const mainRequire = makeRequire(filename, electron);
        let firstLoadPage = false;
        app.on = function(event, handler) {
          if (event === "activate" || event === "ready") handler();
          return app;
        };
        app.once = app.addListener = app.prependListener = app.prependOnceListener = app.on;
        app.off = app.removeListener = app.removeAllListeners = app.setMaxListeners = function() {
          return app;
        };
        app.emit = function() {
          return false;
        };
        app.whenReady = function() {
          return Promise.resolve();
        };
        app.requestSingleInstanceLock = function() {
          return true;
        };
        app.quit = function() {
        };
        const reportMainScriptError = function(kind, error) {
          if (firstLoadPage) return;
          console.error(kind + " in " + filename + " before the game page was loaded:");
          console.error(error && error.stack ? error.stack : String(error));
        };
        const onUnhandledRejection = (event) => reportMainScriptError("Unhandled rejection", event && event.reason);
        const onWindowError = (event) => reportMainScriptError("Uncaught error", event && (event.error || event.message));
        window.addEventListener("unhandledrejection", onUnhandledRejection);
        window.addEventListener("error", onWindowError);
        const noWindowTimer = setTimeout(function() {
          if (!firstLoadPage) console.error(filename + " has not called BrowserWindow.loadFile/loadURL after 15s; the game page will not be loaded.");
        }, 15e3);
        function loaded() {
          firstLoadPage = true;
          clearTimeout(noWindowTimer);
          window.removeEventListener("unhandledrejection", onUnhandledRejection);
          window.removeEventListener("error", onWindowError);
          window.removeEventListener("pagehide", loaded);
        }
        window.addEventListener("pagehide", loaded, { once: true });
        try {
          const mainModule = { exports: {}, filename, id: filename, loaded: false, require: mainRequire };
          new Function("require", "module", "exports", "__filename", "__dirname", script)(mainRequire, mainModule, mainModule.exports, filename, directory);
          mainModule.loaded = true;
        } catch (error) {
          reportMainScriptError("Exception", error);
          loaded();
          throw error;
        }
        return loaded;
      }
      module.exports = { startMainScope };
    }
  });

  // runtime/src/electron.cjs
  var require_electron = __commonJS({
    "runtime/src/electron.cjs"(exports, module) {
      "use strict";
      function launch({ fs, path, process: process2, EventEmitter, makeRequire, config, base, installGameHost, configurePage }) {
        require_frame_scheduler().installFrameScheduler();
        path = path.posix;
        const app = new EventEmitter(), ipcMain = new EventEmitter(), ipcRenderer = new EventEmitter();
        const handlers = /* @__PURE__ */ new Map(), windows = [];
        let activeWindow, mainPageLoaded;
        Object.assign(app, {
          isReady: () => true,
          getAppPath: () => config.appRoot,
          getName: () => "PadPort",
          commandLine: {
            appendSwitch(name) {
              console.warn("Browser switches are managed by the host: " + name);
            },
            hasSwitch: () => false,
            getSwitchValue: () => ""
          },
          quit: () => window.close(),
          exit: () => window.close()
        });
        ipcMain.handle = (channel, handler) => {
          if (handlers.has(channel)) throw new Error("Handler already registered: " + channel);
          handlers.set(channel, handler);
        };
        ipcMain.handleOnce = (channel, handler) => ipcMain.handle(channel, (...args) => {
          handlers.delete(channel);
          return handler(...args);
        });
        ipcMain.removeHandler = (channel) => {
          handlers.delete(channel);
        };
        const mainEvent = () => ({
          sender: activeWindow.webContents,
          reply: (channel, ...args) => ipcRenderer.emit(channel, {}, ...args)
        });
        ipcRenderer.send = (channel, ...args) => {
          ipcMain.emit(channel, mainEvent(), ...args);
        };
        ipcRenderer.sendSync = (channel, ...args) => {
          const event = mainEvent();
          ipcMain.emit(channel, event, ...args);
          return event.returnValue;
        };
        ipcRenderer.invoke = async (channel, ...args) => {
          if (!handlers.has(channel)) throw new Error("No handler registered for: " + channel);
          return handlers.get(channel)(mainEvent(), ...args);
        };
        const renderer = { ipcRenderer, contextBridge: { exposeInMainWorld: (name, value) => {
          window[name] = value;
        } } };
        const globalShortcut = {
          register(accelerator) {
            console.warn("Global shortcuts are unavailable: " + accelerator);
            return false;
          },
          registerAll(accelerators) {
            for (const accelerator of accelerators) this.register(accelerator);
          },
          isRegistered: () => false,
          unregister() {
          },
          unregisterAll() {
          }
        };
        const main = { app, BrowserWindow, ipcMain, globalShortcut, Menu: {
          setApplicationMenu(menu) {
            if (menu !== null) console.warn("Native application menus are unavailable");
          }
        } };
        renderer.remote = main;
        process2.platform = "win32";
        process2.resourcesPath = path.dirname(config.appRoot);
        process2.argv = ["--appPath=" + config.appRoot];
        function localPage(value, options, isUrl) {
          let url;
          if (isUrl) {
            const parsed = new URL(value);
            if (parsed.protocol === "file:") {
              const file = decodeURIComponent(parsed.pathname);
              if (parsed.host || !file.startsWith(config.root + "/")) throw new Error("Page is outside the game folder");
              url = new URL(file.slice(config.root.length + 1).split("/").map(encodeURIComponent).join("/"), base);
              url.search = parsed.search;
              url.hash = parsed.hash;
            } else url = parsed;
          } else {
            const file = path.resolve(config.appRoot, value);
            if (!file.startsWith(config.root + "/")) throw new Error("Page is outside the game folder");
            url = new URL(file.slice(config.root.length + 1).split("/").map(encodeURIComponent).join("/"), base);
            if (options && options.query) url.search = new URLSearchParams(options.query).toString();
            if (options && options.search) url.search = options.search;
            if (options && options.hash) url.hash = options.hash;
          }
          if (url.origin !== new URL(base).origin || !url.pathname.startsWith(new URL(base).pathname))
            throw new Error("Page is outside the game folder");
          return url;
        }
        async function loadPage(owner, value, options, isUrl) {
          try {
            if (activeWindow && activeWindow !== owner) throw new Error("Multiple game windows are unsupported");
            activeWindow = owner;
            if (mainPageLoaded) mainPageLoaded();
            const url = localPage(value, options, isUrl);
            const file = path.join(config.root, decodeURIComponent(url.pathname.slice(new URL(base).pathname.length)));
            const html = fs.readFileSync(file, "utf8");
            configurePage(file);
            const preferences = owner.options.webPreferences || {};
            document.open();
            history.replaceState({}, "", url.href);
            Object.assign(window, { require: makeRequire(file, renderer), __filename: file, __dirname: path.dirname(file) });
            if (preferences.preload) {
              const originalOnce = process2.once;
              try {
                process2.once = function(event, handler) {
                  if (event === "loaded" && typeof handler === "function") {
                    handler();
                    return process2;
                  }
                  return originalOnce.apply(this, arguments);
                };
                makeRequire(file, renderer)(path.resolve(config.appRoot, preferences.preload));
              } finally {
                process2.once = originalOnce;
              }
            }
            installGameHost();
            if (preferences.nodeIntegration === false) {
              for (const name of ["require", "process", "global", "nw"]) delete window[name];
            }
            const loaded = new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
            document.write(html);
            document.close();
            owner.webContents.url = url.href;
            await loaded;
            owner.emit("ready-to-show");
            owner.webContents.emit("did-finish-load");
          } catch (error) {
            owner.webContents.emit("did-fail-load", {}, -2, error.message, String(value));
            throw error;
          }
        }
        function BrowserWindow(options = {}) {
          EventEmitter.call(this);
          this.options = options;
          this.webContents = new EventEmitter();
          Object.assign(this.webContents, {
            send: (channel, ...args) => ipcRenderer.emit(channel, {}, ...args),
            clearHistory() {
              console.warn("WebContents.clearHistory is managed by the host");
            },
            getURL: () => this.webContents.url || "",
            executeJavaScript: async (code) => window.eval(code)
          });
          windows.push(this);
        }
        Object.setPrototypeOf(BrowserWindow.prototype, EventEmitter.prototype);
        Object.assign(BrowserWindow.prototype, {
          loadFile(value, options) {
            return loadPage(this, value, options, false);
          },
          loadURL(value, options) {
            return loadPage(this, value, options, true);
          },
          show() {
            window.focus();
            this.emit("show");
          },
          focus() {
            window.focus();
          },
          close() {
            window.close();
          },
          setTitle(title) {
            document.title = title;
          },
          getTitle() {
            return document.title;
          },
          setFullScreen(value) {
            return value ? document.documentElement.requestFullscreen() : document.exitFullscreen();
          },
          isFullScreen() {
            return !!document.fullscreenElement;
          }
        });
        BrowserWindow.getAllWindows = () => windows.slice();
        BrowserWindow.getFocusedWindow = () => activeWindow || null;
        window.require = makeRequire(process2.mainModule.filename, main);
        mainPageLoaded = require_electron_main().startMainScope({
          app,
          filename: process2.mainModule.filename,
          directory: path.dirname(process2.mainModule.filename),
          makeRequire,
          electron: main,
          script: fs.readFileSync(process2.mainModule.filename, "utf8")
        });
        if (activeWindow) mainPageLoaded();
      }
      module.exports = { launch };
    }
  });

  // runtime/src/client.cjs
  var require_client = __commonJS({
    "runtime/src/client.cjs"() {
      var { Buffer: Buffer2 } = require_buffer();
      var EventEmitter = require_events();
      var process2 = require_browser();
      var createPath = require_path();
      var config = window.__PADPORT_RUNTIME_CONFIG__;
      var processEvents = new EventEmitter();
      for (const name of Object.getOwnPropertyNames(EventEmitter.prototype))
        if (name !== "constructor" && typeof EventEmitter.prototype[name] === "function")
          process2[name] = processEvents[name].bind(processEvents);
      process2.cwd = () => config.cwd || config.root;
      process2.platform = config.platform;
      process2.arch = config.arch || "arm64";
      process2.versions = { node: config.nodeVersion };
      if (!config.mainIsJs) Object.assign(process2.versions, { nw: "0.67.2", "node-webkit": "0.67.2" });
      process2.execPath = config.root + "/Game.exe";
      process2.mainModule = { filename: config.appRoot + "/" + config.main, path: config.appRoot };
      process2.env.HOME = config.root;
      process2.env.OS = "Windows_NT";
      if (!window.setImmediate) {
        window.setImmediate = (callback, ...args) => setTimeout(() => callback(...args), 0);
        window.clearImmediate = (id) => clearTimeout(id);
      }
      process2.nextTick = window.setImmediate;
      window.process = process2;
      var util = require_util();
      var path = createPath(process2);
      var base = new URL(".", document.currentScript.src).href.replace(/__padport__\/$/, "");
      var client = crypto.randomUUID();
      var cleanups = /* @__PURE__ */ new Set();
      var nativeFiles = window.PadPortFiles;
      var protocolJSON = require_protocol_json().createProtocolJSON();
      function errorFrom(error) {
        return Object.assign(new Error(error.message), error);
      }
      function result(response) {
        if (response.error) throw errorFrom(response.error);
        return response.value;
      }
      function sync(command) {
        if (nativeFiles) return result(protocolJSON.parse(nativeFiles.request(config.bridgeToken, JSON.stringify({ client, ...command }))));
        const xhr = new XMLHttpRequest();
        xhr.open("POST", base + "__padport__/fs", false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ client, ...command }));
        if (xhr.status !== 200) throw new Error("File request failed: " + xhr.status);
        return result(protocolJSON.parse(xhr.responseText));
      }
      async function asyncCall(command) {
        const response = await fetch(base + "__padport__/fs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client, ...command })
        });
        if (!response.ok) throw new Error("File request failed: " + response.status);
        return result(protocolJSON.parse(await response.text()));
      }
      var filename = (value) => value instanceof URL ? decodeURIComponent(value.pathname) : Buffer2.isBuffer(value) ? value.toString() : value;
      var encoding = (options) => typeof options === "string" ? options : options && options.encoding;
      var filePath = (value) => {
        const name = filename(value);
        if (typeof name !== "string") throw new TypeError("The path argument must be a string, Buffer or URL");
        return path.resolve(process2.cwd(), name);
      };
      var Stats = class {
        constructor(data) {
          Object.assign(this, data);
          for (const name of ["mtime", "atime", "ctime", "birthtime"]) this[name] = new Date(data[name + "Ms"]);
        }
        isFile() {
          return this.type === "file";
        }
        isDirectory() {
          return this.type === "directory";
        }
        isSymbolicLink() {
          return false;
        }
        isBlockDevice() {
          return false;
        }
        isCharacterDevice() {
          return false;
        }
        isFIFO() {
          return false;
        }
        isSocket() {
          return false;
        }
      };
      function statResult(file, options, call) {
        try {
          return new Stats(call({ op: "stat", file: filePath(file) }));
        } catch (error) {
          if (options && options.throwIfNoEntry === false && error.code === "ENOENT") return void 0;
          throw error;
        }
      }
      function readResult(value, options) {
        const data = Buffer2.from(value.base64, "base64"), enc = encoding(options);
        return enc ? data.toString(enc) : data;
      }
      function writeCommand(file, data, options) {
        if (typeof data !== "string" && !ArrayBuffer.isView(data)) throw new TypeError("Data must be a string, Buffer or TypedArray");
        const bytes = typeof data === "string" ? Buffer2.from(data, encoding(options) || "utf8") : Buffer2.from(data.buffer, data.byteOffset, data.byteLength);
        return { op: "write", file: filePath(file), base64: bytes.toString("base64"), options };
      }
      var fsRemote = {
        Stats,
        constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 },
        existsSync: (file) => sync({ op: "exists", file: filePath(file) }),
        statSync: (file, options) => statResult(file, options, sync),
        lstatSync: (file, options) => statResult(file, options, sync),
        readFileSync: (file, options) => readResult(sync({ op: "read", file: filePath(file) }), options),
        writeFileSync: (file, data, options) => {
          sync(writeCommand(file, data, options));
        },
        appendFileSync: (file, data, options) => {
          sync(writeCommand(file, data, { flag: "a", ...typeof options === "string" ? { encoding: options } : options }));
        },
        mkdirSync: (file, options) => sync({ op: "mkdir", file: filePath(file), options }),
        unlinkSync: (file) => {
          sync({ op: "unlink", file: filePath(file) });
        },
        renameSync: (from, to) => {
          sync({ op: "rename", file: filePath(from), to: filePath(to) });
        },
        rmdirSync: (file) => {
          sync({ op: "rmdir", file: filePath(file) });
        },
        openSync: (file, flags, mode) => sync({ op: "open", file: filePath(file), flags, mode }),
        closeSync: (fd) => {
          sync({ op: "close", fd });
        },
        fstatSync: (fd) => new Stats(sync({ op: "statHandle", fd })),
        readSync: (fd, buffer, offset, length, position) => {
          const value = sync({ op: "readHandle", fd, length, position });
          Buffer2.from(value.base64, "base64").copy(buffer, offset);
          return value.count;
        },
        writeSync: (fd, data, offset, length, position) => {
          const bytes = typeof data === "string" ? Buffer2.from(data, typeof length === "string" ? length : "utf8") : Buffer2.from(data.buffer, data.byteOffset + (offset || 0), length == null ? data.byteLength - (offset || 0) : length);
          return sync({ op: "writeHandle", fd, base64: bytes.toString("base64"), position: typeof data === "string" ? offset : position });
        },
        readdirSync: (file, options) => {
          const names = sync({ op: "list", file: filePath(file) });
          if (options && options.withFileTypes) return names.map((name) => {
            const stats = fsRemote.statSync(path.join(filePath(file), name));
            return { name, mode: stats.mode, _isFile: stats.isFile(), _isDirectory: stats.isDirectory(), parentPath: filePath(file) };
          });
          return encoding(options) === "buffer" ? names.map((name) => Buffer2.from(name)) : names;
        }
      };
      fsRemote.accessSync = (file) => {
        fsRemote.statSync(file);
      };
      fsRemote.realpathSync = (file) => {
        fsRemote.statSync(file);
        return filePath(file);
      };
      fsRemote.promises = {
        readFile: async (file, options) => readResult(await asyncCall({ op: "read", file: filePath(file) }), options),
        writeFile: async (file, data, options) => {
          await asyncCall(writeCommand(file, data, options));
        },
        stat: async (file) => new Stats(await asyncCall({ op: "stat", file: filePath(file) })),
        mkdir: async (file, options) => asyncCall({ op: "mkdir", file: filePath(file), options }),
        unlink: async (file) => {
          await asyncCall({ op: "unlink", file: filePath(file) });
        },
        rename: async (from, to) => {
          await asyncCall({ op: "rename", file: filePath(from), to: filePath(to) });
        }
      };
      for (const name of ["readFile", "writeFile", "stat", "mkdir", "unlink", "rename"]) {
        fsRemote[name] = (...args) => {
          const callback = args.pop();
          if (typeof callback !== "function") throw new TypeError("Callback must be a function");
          fsRemote.promises[name](...args).then((value) => callback(null, value), (error) => callback(error));
        };
      }
      var { proxyFs: fs, proxyFsExtra } = require_fs_cache()({
        fsOri: fsRemote,
        path,
        util,
        Buffer: Buffer2,
        process: process2,
        packageData: { gameCWD: process2.cwd(), gameExecDir: config.root },
        writeFileSync: (...args) => fsRemote.writeFileSync(...args),
        onCleanup: (cleanup) => cleanups.add(cleanup)
      });
      var zlib = {};
      for (const method of ["deflateSync", "inflateSync", "gzipSync", "gunzipSync"])
        zlib[method] = (data, options) => Buffer2.from(sync({ op: "zlib", method, options, base64: Buffer2.from(data).toString("base64") }).base64, "base64");
      var guiWindow = new EventEmitter();
      Object.assign(guiWindow, {
        show: () => window.focus(),
        focus: () => window.focus(),
        close: () => window.close(),
        enterFullscreen: () => document.documentElement.requestFullscreen(),
        leaveFullscreen: () => document.exitFullscreen(),
        moveTo: (x, y) => window.moveTo(x, y),
        resizeTo: (w, h) => window.resizeTo(w, h),
        isFullscreen: true,
        width: window.innerWidth,
        height: window.innerHeight
      });
      var gui = {
        Window: { get: () => guiWindow },
        App: { startPath: config.root, dataPath: config.root, argv: [], fullArgv: [] },
        Shell: { openExternal: (url) => window.open(url, "_blank") }
      };
      var builtin = {
        fs,
        "fs/promises": fs.promises,
        "fs-extra": proxyFsExtra,
        path,
        "path/posix": path.posix,
        "path/win32": path.win32,
        buffer: { Buffer: Buffer2 },
        events: EventEmitter,
        util,
        process: process2,
        zlib,
        url: require_url_browser()(sync),
        "nw.gui": gui,
        os: {
          platform: () => process2.platform,
          arch: () => process2.arch,
          homedir: () => config.root,
          tmpdir: () => config.root + "/tmp",
          userInfo: () => ({ username: "Player", homedir: config.root })
        }
      };
      var cache = /* @__PURE__ */ Object.create(null);
      var electronCaches = /* @__PURE__ */ new WeakMap();
      function makeRequire(parent, electron) {
        if (electron && !electronCaches.has(electron)) electronCaches.set(electron, /* @__PURE__ */ Object.create(null));
        const modules = electron ? electronCaches.get(electron) : cache;
        function resolve(name) {
          const id = name.replace(/^node:/, "");
          if (id === "electron" && electron) return id;
          return Object.hasOwn(builtin, id) ? id : sync({ op: "resolve", name, basedir: path.dirname(parent) });
        }
        function require2(name) {
          const id = resolve(name);
          if (id === "electron" && electron) return electron;
          if (Object.hasOwn(builtin, id)) return builtin[id];
          if (modules[id]) return modules[id].exports;
          if (id.endsWith(".node")) throw Object.assign(new Error("Native modules are unavailable in the game page"), { code: "ERR_DLOPEN_DISABLED" });
          const module2 = { id, filename: id, exports: {}, loaded: false };
          modules[id] = module2;
          try {
            const source = fs.readFileSync(id, "utf8");
            if (id.endsWith(".json")) module2.exports = JSON.parse(source.replace(/^\uFEFF/, ""));
            else new Function(
              "exports",
              "require",
              "module",
              "__filename",
              "__dirname",
              source.replace(/^#![^\n]*\n/, "") + "\n//# sourceURL=" + base + id.slice(6)
            ).call(module2.exports, module2.exports, makeRequire(id, electron), module2, id, path.dirname(id));
            module2.loaded = true;
          } catch (error) {
            delete modules[id];
            throw error;
          }
          return module2.exports;
        }
        require2.resolve = resolve;
        require2.cache = modules;
        require2.main = process2.mainModule;
        return require2;
      }
      function installGameCompatibility() {
        if (window.__PADPORT_COMPAT_INSTALLED__) return;
        window.__PADPORT_COMPAT_INSTALLED__ = true;
        require_fonts().installFonts({ base, onCleanup: (cleanup) => cleanups.add(cleanup) });
        require_bitmap_lifecycle().installBitmapLifecycle();
        require_resource_loading().installResourceLoading();
        require_graphics().installGraphics();
        require_audio_decode();
        require_media().installMedia();
      }
      var pagePath = decodeURIComponent(new URL(window.location.href).pathname.slice(new URL(base).pathname.length));
      var pageFilename = config.mainIsJs ? process2.mainModule.filename : path.join(config.root, pagePath);
      Object.assign(window, {
        Buffer: Buffer2,
        process: process2,
        global: window,
        require: makeRequire(pageFilename),
        nw: gui,
        __filename: pageFilename,
        __dirname: path.dirname(pageFilename)
      });
      require_platform().installPlatformModules({ require: window.require, requireCache: builtin, Buffer: Buffer2, process: process2 });
      window.PadPortRuntime = Object.freeze({ fs, path, base });
      window.__PADPORT_CONFIG__ = {
        ...window.__PADPORT_CONFIG__,
        engine: config.engine,
        title: config.title,
        language: config.language,
        debug: config.debug
      };
      window.PadPortBuffer = { Buffer: Buffer2 };
      function installGameHost() {
        installGameCompatibility();
        require_ui_strings();
        require_host().installHost({ base, client });
        require_runtime_debug();
        window.addEventListener("pagehide", () => {
          for (const cleanup of cleanups) cleanup();
          window.PadPortDebug.setEnabled(false);
        }, { once: true });
      }
      if (config.mainIsJs) {
        const { launch } = require_electron();
        launch({
          fs,
          path,
          process: process2,
          EventEmitter,
          makeRequire,
          config,
          base,
          installGameHost,
          configurePage(file) {
            const engine = sync({ op: "engine", file: path.dirname(file) });
            config.engine = engine;
            window.__PADPORT_CONFIG__.engine = engine;
          }
        });
      } else installGameHost();
    }
  });
  require_client();
})();
