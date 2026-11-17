# Debugging MV/MZ games

Open the in-game menu and enable **Game debugging**. The preference is off by
default, persists between launches, and works in release builds. It takes effect
on the current page without reloading the game. Turn it off after diagnosis.

## Attach a page debugger

Connect an ADB-authorized Android device to the development computer.

- **GeckoView:** open `about:debugging` in desktop Firefox, enable USB devices,
  select the device, and inspect the running game tab.
- **WebView:** open `chrome://inspect/#devices` in desktop Chrome and inspect
  the game WebView.

Use the debugger to pause JavaScript and inspect the call stack, event handlers,
exceptions, and network requests. Native menu controls remain available if the
page thread is stuck, so remote debugging can be enabled after a hang. If the
engine process has crashed, its live stack is no longer available.

For a remote ADB server, use `adb -H <host> -P <server-port> devices` to verify
the connection. Port forwards created through that server listen on the server
machine; tunnel them to the local computer before attaching a debugger. A local
connection failure alone does not indicate that the game process is gone.

## Runtime evidence

While enabled, the player samples runtime state once per second and retains a
bounded recent history in native memory. **Diagnostics / copy log** includes:

- sample timestamps, graphics frame counts and frame deltas;
- current scene, stopped/frozen flags, page visibility, and audio context state;
- interpreter positions, command codes, and wait modes;
- loading image states and pending XMLHttpRequests;
- JavaScript errors, rejected promises, and failed XHRs with request call stacks.

In the page console, `PadPortDebug.snapshot()` reads current state. For GeckoView,
the token-protected session URL `__padport__/debug-state` returns the most recent
report while debugging is enabled. These reports can contain resource URLs and
error messages; review them before sharing.

Sampling uses page timers rather than the engine update loop. A fresh timestamp
with unchanged frames distinguishes an idle/stopped engine from a blocked page
thread, where native memory retains the last report. The app menu deliberately
pauses the game; inspect samples from before opening it. Sampling cannot
reconstruct errors or requests that finished before debugging was enabled.

## Investigate a hang

1. Enable debugging before reproducing if possible, then preserve the running
   page and copy its diagnostic report.
2. Compare timestamps and frame deltas. If the page no longer responds, pause it
   in the remote debugger and inspect the current stack.
3. If frames stop while timers continue, inspect scene stopped/frozen flags and
   the engine update scheduling. If frames advance, inspect interpreter waits,
   current input, loading bitmaps, and network requests.
4. For failed resources, inspect the request origin and response. Verify how the
   engine or plugin handles the failure before attributing the hang to a 404.
5. Fix the failing lifecycle or resource-loading path, add a regression test,
   then reproduce the same sequence on the device.

Disabling debugging stops sampling, clears the retained report, and restores
the request methods where they are still owned by the diagnostic wrapper. No
game updates, resource completion, or interpreter progress is forced.
