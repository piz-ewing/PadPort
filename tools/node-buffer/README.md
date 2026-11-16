# Browser Buffer bundle

`npm ci --ignore-scripts && npm run build` rebuilds the checked-in
`app/src/main/assets/node-buffer.js` from `buffer` 6.0.3 and its locked
dependencies using esbuild. No dependency is downloaded at game runtime.

Both renderers load this bundle before bridge.js. The Node shim exposes its
Buffer as a global and through require('buffer'), without enabling NW.js mode.

The fs shim additionally supports extensionless empty marker files at the game
root: existsSync/statSync/readFileSync and openSync with w/wx, plus closeSync.
Creation uses the selected game's SAF write permission. Nonempty files cannot
be truncated and resource writes remain unsupported. The returned handles
represent empty markers only; writeSync and the general Node fs API are not
implemented. Native descriptors are closed immediately.

Marker metadata is read once synchronously, then refreshed on demand at most
once a second through an asynchronous request in both renderers. Creation
updates the cached metadata immediately; resuming the game requests a refresh.
External changes may take one refresh interval plus provider latency to appear.
Background refreshes time out after five seconds and expose failures to callers.

Licenses for runtime dependencies ship in assets/node-buffer-LICENSE.txt.
