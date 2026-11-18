[简体中文](README.zh-CN.md)

# PadPort

![PadPort — Play your RPG Maker games on Android.](docs/banner.jpg)

[![Downloads](https://img.shields.io/github/downloads/mkaflowski/PadPort/total?style=for-the-badge&logo=github&label=Downloads&labelColor=1a1819&color=d16197)](https://github.com/mkaflowski/PadPort/releases)

Play your **RPG Maker** games on Android with a controller.

Copy the game folder from your PC to your phone, tablet or handheld, add it in
PadPort and press Play. No converting, no PC needed. PadPort never changes
your game files.

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
- **Save backups**: export your saves and import them again.
- **Chromium System WebView** for MV / MZ games, with a separate Node runtime
  for game files, modules, and local services. See [Browser runtime](#browser-runtime).
- English and Polish, following your Android language.

## What you need

- Android 8.0 or newer.
- A 64-bit ARM device (almost every phone and handheld from the last few
  years). The downloadable APK includes ARM64 native engines.
- Your own copy of the game. PadPort does not include any games.

## Getting started

1. Download the APK from **[Releases](../../releases)** and install it.
   Android asks you to allow installing apps from this source - allow it.
2. Copy the **whole game folder** from your PC to the device, for example to
   `Download/Games/Look Outside`. If the game is in a ZIP, unpack it first.
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
`app.asar.unpacked` folder beside the archive. PadPort locates a unique MV/MZ
web entry point inside the archive and reads individual files without extracting
the game. Local storage must support random access. Electron main/preload scripts
and desktop native modules are not executed. Their APIs may require additional
compatibility work for individual games.

ASAR archives remain read-only. Normal saves use browser storage as usual; the
manual directory import/export actions use `save` beside the selected game folder
contents. Select the same folder each time to retain the same browser storage.

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

**Keyboard mode:** some games only react to the keyboard. Switch the control
mode to **Keyboard** and the controller will press keys instead (you can change
which key each button presses).

## While playing

- The game fills the screen and keeps its shape (black bars at the sides when
  the screen is wider than the game).
- The small menu button hides after 5 seconds. Touch the screen or press the
  Android Back button to bring it back.
- From that menu you can **Export saved games**, **Import save backup**, show
  the on-screen controller, copy a diagnostic
  log, or go **Back to library**.
- **Limit the screen to 60 Hz** (off by default, MV / MZ): RPG Maker games run
  at 60 FPS, so on 90 / 120 Hz screens (e.g. AYN Thor) this saves battery. A
  game's "unlimited" FPS option then means exactly 60.

## Saves

Save normally inside the game. PadPort keeps MV/MZ saves in the browser
profile and RGSS saves in app storage. Removing a game from the library keeps
its saves. Re-add the same folder with the same renderer to use them again.

The in-game app menu also offers **Import saves from game folder** and
**Export saves to game folder** for MV/MZ. These copy files once between the
app and the game’s `save` directory (usually `www/save`). Importing replaces
matching app saves and restarts the game; source files stay unchanged.
Exporting replaces matching files after confirmation and needs write access
to the game folder. It copies existing saves, not unsaved gameplay progress.
Normal gameplay never synchronizes with that directory.

MV transfers include configuration, global metadata, numbered slots and their
backups, using the game’s filename and browser-key rules. Plugin slots used
through StorageManager are discovered as the game runs; filename-based slots
are accepted when the engine confirms their mapping. Unmapped or conflicting
files are reported before importing.
MV plugins may use save-index titles as chapter labels. PadPort preserves these
labels and records game identity separately for newly created and imported
saves. Existing saves in the selected game's browser storage are recognized
without rewriting them. Directory import requires matching engine identifiers;
invalid indices fail before app saves are replaced. Slot payloads stay unchanged.
Use saves from a compatible version of the selected game; recording identity
does not establish save-data compatibility.
MZ transfers use the game’s localforage keys and `.rmmzsave` files.
The existing JSON backup import and export remain available.

**Uninstalling PadPort or clearing its data deletes app-stored saves.**
Export backups first. Moving the game folder changes its identity in PadPort;
use an exported backup to move saves to a different folder.

## Browser runtime

MV and MZ games run in Android System WebView, which provides Chromium rendering
and WebAudio. A separate Node process handles game files, CommonJS modules,
and local resource requests.

Game saves use the engine's original file format and directory. They remain
with the game folder across player restarts. Browser storage created by an
earlier browser engine is separate and is not automatically migrated.


## Games with extra fixes

Some games use PC-only add-ons. PadPort carries small fixes for those it knows:

| Game | RPG Maker | What PadPort fixes |
| --- | --- | --- |
| *Welcome to Elderfield* | MZ | Starts at all (its Steam and plugin-toggle add-ons stop it outside the PC version). NPC gift reactions work (gift tables are loaded). The in-game radio, including *The Weather Channel*, plays. |
| Games using the **FOSSIL** plugin | MZ | FOSSIL rewrites its start page on PC; PadPort serves that page directly. |
| Games that ask for **full screen** at start | MV / MZ | The request is answered as done - PadPort is already full screen - instead of stopping the game. |

Folders copied from a PC usually also contain the Windows runtime (NW.js,
Chromium, Steam libraries) - for *Welcome to Elderfield* about 540 MB. When you
add an MV / MZ game, PadPort lists these files with their size and offers to
delete them (game data and saves are never touched).

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

## Want a game supported?

**[Open an issue](../../issues/new)** and tell us:

- the game's name (and a Steam or itch.io link if there is one),
- which RPG Maker it uses (MV, MZ, XP, VX or VX Ace), if you know,
- your device and Android version,
- what happens: for example it does not start, crashes at a certain place, or
  a button does not work,
- the log from **Diagnostics / copy log**, if the game starts at all.

## For developers

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
