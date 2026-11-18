[简体中文](README.zh-CN.md)

# PadPort

![PadPort — Play your RPG Maker games on Android.](docs/banner.jpg)

Play your **RPG Maker** games on Android with a controller.

Copy the game folder from your PC to your phone, tablet or handheld, add it in
PadPort and press Play. No conversion or running PC is needed. The game engine
writes saves to its normal location through the player.

## Refactored version: experimental

This branch contains an experimental refactoring of PadPort, focused on making
more games playable and improving how they feel to play. Four improvements drive
the refactoring:

- **Many game errors fixed:** fixes for startup, resource loading, graphics, audio
  and input let some previously unplayable games start and continue playing.
- **Better-looking, easier-to-use touch controls:** improved button layouts,
  direct dragging to adjust joystick position and size, dragging origin and
  optional input prediction.
- **Smoother gameplay:** improvements to resource loading, file access and texture
  handling reduce redundant work and blocking during loading and play.
- **ASAR game support:** MV/MZ game resources inside `app.asar` are read on demand,
  without extracting the whole archive first.

MV/MZ playback now uses Android System WebView with a separate Node process,
with diagnostics and live page debugging available. Second-screen support and
the GeckoView playback path have been removed.

Testing has been limited to local development and a small number of devices and
games. Stability, performance and compatibility are not guaranteed. Back up saves
before trying this version, and [open an Issue](../../issues/new) if something
fails. See [Refactoring status](docs/REFACTORING.md) for changes and limitations.

## Roadmap

The next priorities are bug fixes and more responsive touch controls, alongside
new features and improvements to the settings UI:

- **Keep fixing issues:** address game compatibility, stuttering, audio and
  resource-loading problems.
- **More responsive touch buttons:** improve press, slide, release and multitouch
  handling so combined actions such as moving and attacking feel more reliable.
  The current touch response still needs improvement.
- **Add an in-game trainer:** provide tools to view and adjust common game data.
- **Improve the settings UI:** reorganize groups, layouts and interactions so
  common options are easier to find and use.

These are planned improvements and are not all implemented yet.

## What it can do

- Plays **RPG Maker MV and MZ** games straight from their original PC folder.
- Reads MV/MZ games inside **app.asar** archives on demand, including archives larger than 4 GB.
- Plays **RPG Maker XP, VX and VX Ace** games too (experimental).
- Works with **Bluetooth and USB controllers** and with the built-in
  controls of handhelds like the AYN Thor.
- Optional **on-screen controller** for touch screens.
- **Button mapping and a controller tester**, so you can see exactly what the
  game gets.
- **Keyboard mode** for games that only listen to the keyboard.
- **Game library** with artwork from the game itself, from Steam, or your own
  picture.
- **File saves** for MV/MZ, using the engine's original format; RGSS retains
  its ZIP save backup import and export.
- **Chromium System WebView** for MV / MZ games, with a separate Node runtime
  for game files, modules, and local services. See [Browser runtime](#browser-runtime).
- English, Polish and Simplified Chinese, following your Android language.

## What you need

- Android 8.0 or newer.
- A 64-bit ARM device (almost every phone and handheld from the last few
  years). The downloadable APK includes ARM64 native engines.
- Your own copy of the game. PadPort does not include any games.

## Getting started

1. Download the APK from **[Releases](../../releases)** and install it.
   Android asks you to allow installing apps from this source - allow it.
2. Copy the **whole game folder** from your PC to the device, for example to
   `Download/Games/MyGame`. If the game is in a ZIP, unpack it first.
3. Open PadPort, tap **Add game folder** and pick the game folder (the one with
   `index.html`, or the one that contains `www`). Allow access when asked.
4. Tap **Play**.

Game folders copied from a PC often carry the Windows runtime (NW.js, Chromium,
Steam libraries), which can be hundreds of MB. When you add an MV / MZ game,
PadPort lists those files with their total size and offers to delete them.
It never touches game data or saves, and asks before deleting anything.

When the game gets an update on PC, copy the new files over and use
**Refresh files after a game update** in the game's ⋮ menu.

For an ASAR-packaged MV/MZ game, select the game folder containing
`resources/app.asar`, or the folder containing `app.asar` directly. Keep any
`app.asar.unpacked` folder beside the archive. The runtime reads files on demand
and follows the package entry point. Packages that use Electron main/preload
scripts run through a compatibility layer supporting a subset of Electron APIs.
This is not a complete desktop Electron environment; arbitrary desktop native
modules are unsupported. Local storage must support random access.

ASAR archives remain read-only. Saves must use a writable location outside the
archive, as selected by the engine or package. See [Saves](#saves).

## Controls

Pair a Bluetooth controller in Android settings, plug in a USB controller, or
just use the built-in controls of your handheld. Default buttons in most
RPG Maker games:

| Button | What it does |
| --- | --- |
| A / cross | confirm, talk |
| B / circle | cancel, back |
| Y / triangle | game menu |
| L1 / R1 | previous / next page |
| D-pad or left stick | move |

Games can change these. If a button does nothing:

- Open **Controllers · mapping and test** and press it. The tester shows what
  the game receives.
- If your controller acts like a keyboard, use **Map** to teach PadPort its
  buttons.
- On the AYN Thor and similar handhelds, use the standard gamepad mode of the
  device. Touch-mapping tools of the system can catch buttons before they reach
  the app.

**On-screen controller:** turn on **Show on-screen controller** in the
controller settings or in the menu while playing. You can make it more or less
see-through with the transparency slider.
Choose a button layout from the dropdown. Open **Joystick size and position**
to drag the joystick and resize it with its handle, then save. **Dragging origin**
lets the base follow a finger beyond the outer buffer. Optional **Input prediction**
adjusts invisible hit areas using recent input; it is off by default.

**Keyboard mode:** some games only react to the keyboard. Switch the control
mode to **Keyboard** and the controller will press keys instead (you can change
which key each button presses).

## While playing

- The game fills the screen and keeps its shape (black bars at the sides when
  the screen is wider than the game).
- Open the floating menu button or press Android Back to show the player menu.
  The menu pauses the game while it is open.
- In MV/MZ, the menu provides controller settings, touch controls, diagnostics,
  game debugging and **Back to library**. RGSS retains its save backup actions.
- **Limit the screen to 60 Hz** (off by default, MV/MZ) requests a compatible
  display refresh rate. Android makes the final choice; this is not a guarantee
  that the game renders at 60 FPS.

## Saves

Save normally inside the game. MV/MZ uses file access through Node, with the
game engine or plugin determining the directory and format. For a typical
folder game this is its `save` directory, often `www/save`. The selected storage
provider must allow writes. ASAR contents cannot be written; the package needs
to place saves outside the archive.

The active MV/MZ player no longer offers the previous browser-storage backup
or game-folder import/export workflow. Browser saves created by earlier versions
are separate and are not automatically migrated. Keep an older backup before
switching versions, and check saving and loading before a longer session.

RGSS keeps saves in app storage and retains ZIP import/export from its player
menu. Removing an RGSS game from the library keeps those saves; uninstalling
the app or clearing its data deletes them. Back up app-stored saves and the
game's writable save directory before updating or removing anything.

## Browser runtime

MV and MZ games run in Android System WebView, which provides Chromium rendering
and WebAudio. A separate Node process handles game files, CommonJS modules,
and local resource requests.

Game saves use the engine's original file format and directory. They remain
with the game folder across player restarts. Browser storage created by an
earlier browser engine is separate and is not automatically migrated.


## Compatibility

The refactored runtime includes adaptations for desktop module requests,
fullscreen behavior, fonts, bitmap lifetimes, texture uploads and audio loading.
These address specific failure paths; they do not establish compatibility with
every game or plugin. Windows executables and arbitrary desktop native modules
do not run in this player. Game-specific compatibility claims from earlier
versions need to be checked again on the refactored runtime.

## If something goes wrong

- **The game does not start or shows an error:** open the menu while playing
  and choose **Diagnostics / copy log**, then send the log along with your
  question.
- **The game closes by itself:** saved progress is kept. Restart the game
  and include the diagnostic log when reporting the problem.
- **The game worked before an update:** use **Refresh files after a game
  update** in the game's ⋮ menu.
- **XP / VX / VX Ace games** are experimental. Games that need the RPG Maker RTP
  installed may miss graphics or sounds. MIDI music and videos do not play.
- Some MV / MZ games use special PC-only add-ons and may need extra support.
  Tell us which game it is.

## Report a problem

**[Open an issue](../../issues/new)** and tell us:

- the game's name (and a Steam or itch.io link if there is one),
- which RPG Maker it uses (MV, MZ, XP, VX or VX Ace), if you know,
- your device and Android version,
- the PadPort version and Android System WebView version,
- what happens: for example it does not start, crashes at a certain place, or
  a button does not work,
- steps to reproduce it, whether it happens every time, and whether an older
  version behaved differently,
- the log from **Diagnostics / copy log**, if the game starts at all.

Review logs for private paths or tokens before posting. Do not attach game
archives, copyrighted assets or personal save files to a public Issue.

## For developers

- [Refactoring status](docs/REFACTORING.md) - changes, removals and validation limits
- [Debugging MV/MZ games](docs/DEBUGGING.md) - live debugging and runtime reports
- [DEVELOPMENT.md](DEVELOPMENT.md) - how it works, building, tests (Polish)
- [RGSS.md](RGSS.md) - RPG Maker XP / VX / VX Ace support (Polish)

## License

PadPort source code is licensed under **GPL-3.0-or-later**. See [LICENSE](LICENSE).
Third-party components retain their respective copyright notices and licences.

The XP / VX / VX Ace support uses the **mkxp-z** engine, which is GPL, so the
APK is distributed under **GPL-3.0-or-later** together with its source code.
Details: [`app/src/main/assets/rgss/NOTICE.txt`](app/src/main/assets/rgss/NOTICE.txt).

PadPort does not include any games. Play only games you own.
