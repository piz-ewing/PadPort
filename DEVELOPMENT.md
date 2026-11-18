# PadPort - dokumentacja deweloperska

Opis dla graczy: [README.md](README.md). Tutaj: architektura, historia zmian, budowanie i testy.


Androidowy launcher oryginalnych folderów **RPG Maker MV/MZ**, z natywnym
wejściem gamepada: Bluetooth, USB i kontrolery wbudowane w handheldy.

**APK:** `dist/PadPort-0.6.1-debug.apk`  
**Instrukcja użytkownika:** `HOW-TO-RUN.txt` / `JAK-URUCHOMIC.txt`


## Jak działa

1. Systemowy picker przyznaje trwały dostęp do wybranego folderu (SAF).
2. Launcher zapisuje identyfikator gry i URI. Rozpoznawanie MV/MZ oraz katalogowe
   indeksowanie nadal migrują z Java `GameSource` do Node.
3. Gry MV/MZ działają w systemowym Chromium WebView. Node serwuje stronę z oryginalnego folderu,
   a dostęp do plików SAF przez `GameDocuments` i Node `DocumentFiles`, bez kopii.
4. Node obsługuje zwykłe foldery i ASAR przez jedną warstwę plików;
   RGSS nadal uruchamia osobny silnik natywny.
5. `InputManager`, `KeyEvent` i `MotionEvent` dostarczają stan kontrolerów.
   `navigator.getGamepads()` zwraca standardowe przyciski 0–16, cztery osie,
   analogowe wartości triggerów i informacje o podłączeniu.

W klasycznym trybie Gamepad nie powstają zdarzenia klawiatury. Jeśli sam kontroler zgłasza się
jako klawiatura HID, użytkownik przypisuje jego fizyczne kody do przycisków
wirtualnego gamepada. Profile są przypisane do deskryptora urządzenia, a nie
zmieniającego się po ponownym podłączeniu numeru Androida.

Są uwzględnione: martwa strefa, alternatywne osie prawej gałki, odwrócenie Y,
hat/d-pad, cyfrowe i analogowe triggery, pauza/utrata fokusu i odłączenie pada.
Cyfrowy sygnał L2/R2 nie spłaszcza równoległego pomiaru analogowego do 0/1.
Wbudowany kontroler jest obsługiwany tą samą ścieżką co pozostałe urządzenia.

## Przeglądarka i proces Node

Gry MV/MZ oraz tester kontrolera używają systemowego Chromium WebView
w PlayerActivity. APK zawiera biblioteki natywne arm64-v8a.
PlayerActivity odbiera wejście i cykl życia. NodeRuntime łączy ją z osobnym
procesem NodeService, który obsługuje pliki, moduły i zasoby HTTP.

Synchroniczne operacje plikowe korzystają z JavascriptInterface i trwałego
uwierzytelnionego kanału TCP do Node. Ramki mają 8-bajtowy nagłówek little-endian
(długość i typ) oraz treść JSON. Błędy plików wracają bez zmiany ich kodów;
nieudane zapisy nie są automatycznie powtarzane. Zasoby i asynchroniczne
wywołania nadal korzystają z HTTP, a wejście i polecenia z SSE.
JNI przekazuje operacje SAF do GameDocuments.
Katalog roboczy stron HTML to katalog pliku wejściowego; skrypt główny
Electron zachowuje katalog pakietu. Względne ścieżki fs i path.resolve()
korzystają z tego samego process.cwd(). Bezwzględne ścieżki w /game
zachowują położenie, także przy zapisie obok archiwum ASAR.

Pauza i wznowienie obejmują WebView oraz jego zegary. Przywrócenie audio
nie czeka na zakończenie oczekującego suspend(). Zamknięcie gry zwalnia
kanał plikowy, deskryptory oraz proces Node. Origin zależy od identyfikatora
gry; format i położenie zapisów plikowych określa jej silnik.
Dane przeglądarkowe ze wcześniejszego silnika nie są automatycznie migrowane.

Menu gry otwiera się z pływającego przycisku i pozostaje nad stroną gry.
Panel ustawień i okno diagnostyki utrzymują wspólną pauzę. Utrata fokusu
czyści wejście, a stan audio zmienia dopiero cykl życia aktywności lub menu.
Potwierdzenie zakończenia pauzy strony poprzedza zatrzymanie zegarów WebView; przy wznowieniu
zegary ruszają przed wywołaniem strony. Opóźnione migawki kontrolera nie
zmieniają stanu audio w natywnym odtwarzaczu.
Oczekujące play() jest najpierw wyciszane, a pause() następuje po zakończeniu
żądania odtwarzania. Szybkie wznowienie unieważnia oczekującą pauzę.
Błędy oryginalnego play() nadal trafiają do wywołującego.

Diagnostyka przechowuje osobno błędy i pozostałe komunikaty. Powtórzenia są
liczone, a zapis do logcat jest ograniczany dla identycznych komunikatów.
Powtarzające się ostrzeżenia nie usuwają w ten sposób ostatnich błędów.


## Bieżące zmiany w kodzie — bez nowego APK

- W opcjach kontrolera dostępne są tryby **Gamepad (klasyczny)** i **Klawiatura**.
  Pierwszy zachowuje dotychczasową obsługę. Drugi zamienia stan kontrolerów
  fizycznych i ekranowego na klawisze; Gamepad API jest wtedy wyciszone, aby
  ta sama akcja nie trafiała do gry dwukrotnie. W RGSS używane są wybrane klawisze
  zamiast dotychczasowej stałej mapy przycisków.
- Domyślne przypisania: krzyżak/lewa gałka → strzałki, A → Enter, B/Y/Start → Esc,
  X → Shift, L1/R1 → Q/W, L2/R2 → S/D, Select → Tab. L3/R3/Guide nie mają
  domyślnego klawisza. Każde przypisanie można zmienić z listy lub klawiatury.
  Przypisania krzyżaka obejmują również lewą gałkę. Modyfikatory działają przy
  przytrzymaniu kilku przycisków; powtórzenia i zwalnianie klawiszy są obsługiwane.
- Wybór trybu i układ są globalne, zapisane w prywatnym `controller-output.json`,
  czytanym także przez proces RGSS. Tester pokazuje klawisze w trybie klawiaturowym.
- Biblioteka jest sortowana według ostatniego uruchomienia (najnowsze na górze).
  Historia jest zapisywana jako `lastPlayed`; odświeżenie metadanych gry jej
  nie kasuje. Nieuruchamiane gry są na końcu, z zachowaniem dotychczasowej kolejności.
- W opcjach kontrolera jest suwak przezroczystości pada ekranowego 0–100%,
  domyślnie 50%. Zmiana jest zapamiętywana i stosowana po powrocie do gry lub testera,
  również w procesie RGSS.
- Checkbox „Pokaż kontroler ekranowy” w ustawieniach kontrolerów oraz menu gry.
  Domyślnie wyłączony, wspólny dla MV/MZ i natywnego RGSS. Dotykowy krzyżak,
  A/B/X/Y, L1/L2/R1/R2 i Start/Select obsługują kilka palców oraz przesuwanie
  palca po krzyżaku (także po skosie). Kontrolki są półprzezroczyste.
- Wirtualny pad jest scalany ze stanem pierwszego pada fizycznego w Gamepad API;
  RGSS korzysta z tej samej sumy stanów. Zwolnienie dotyku nie zwalnia nadal
  trzymanego przycisku fizycznego. Pauza, utrata fokusu i wyłączenie opcji
   zerują wirtualne wejście. W klasycznym trybie MV/MZ nie są generowane zdarzenia klawiatury.
- Ustawienie jest małym plikiem w prywatnych danych aplikacji, odczytywanym
  także przez proces RGSS — bez problemu cache SharedPreferences między procesami.
- Język wybiera standardowy mechanizm zasobów Androida (`values` / `values-pl`).
  Polski jest dostępny dla polskiego locale, a angielski pozostaje wersją
  zapasową. Przełącznik i własne wymuszanie locale zostały usunięte.
- Tester WebView odczytuje marker `ui_language` z tych samych zasobów co UI,
  dzięki czemu jest zgodny również przy systemowej liście wielu języków.
- Stara preferencja języka z 0.5 nie jest odczytywana.

## Zmiany w wydanym APK 0.5 (zachowanie języka zastąpione powyżej)

- Przywrócona nazwa **PadPort**.
- Angielski jako domyślny język interfejsu, również na polskim Androidzie.
  W bibliotece można wybrać English / Polski; wybór jest zapamiętywany.
- Biblioteka, grafiki, kontrolery, menu gry, kopie zapisów i tester WebView
  są dostępne w obu językach. Ustawienie nie zmienia języka gry ani jej plików.
- Natywne teksty: `res/values/strings.xml` (EN), `res/values-pl/strings.xml` (PL).
  `AppLanguage` i `LocalizedActivity` ustawiają locale tylko kontekstu aplikacji.
  Teksty WebView: `assets/ui-strings.js`, z językiem przekazywanym przez hosta.

## Zmiany w 0.4.1

- Zwiększony promień rozmycia tła karty: z 2 do 6 dp.

## Zmiany w 0.4

- Nazwa aplikacji: **RPGMPadPort**. Tagline: „Graj w gry z RPG Magera na Androidzie!”.
- Delikatny blur tła karty (około 2 dp) i dodatkowe przyciemnienie o około 12,5%.
  Efekt obejmuje tylko obraz — napisy i przyciski są osobnymi, ostrymi warstwami.
  Android 12+ używa RenderEffect; starsze wersje przetwarzają miniaturkę w workerze.
  Oryginalne miniaturki w cache są ostre, więc kolejne odczyty nie kumulują rozmycia.
- Identyfikator pakietu, originy zapisów i format kopii pozostają zgodne
  z wcześniejszym PadPort; APK instaluje się jako jego aktualizacja.

## Zmiany w 0.3

- Karty biblioteki mają grafikę w tle i przyciemnienie pod napisami/przyciskami.
  Domyślnie aplikacja używa ekranu tytułowego gry (`System.json` → `title1Name`
  i `title2Name`, również zaszyfrowane PNG MZ/MV). Obrazy są tylko odczytywane,
  a małe miniaturki zapisywane w prywatnym katalogu aplikacji.
- Gdy obrazka nie ma, pozostaje zwykła karta. Wczytywanie grafik jest asynchroniczne;
  obrazki niewidocznych kart są zwalniane podczas przewijania.
- `Opcje gry ⋮ → Grafika karty…` pozwala wybrać własny PNG/JPG/WebP,
  przywrócić grafikę z gry lub otworzyć wyszukiwanie w SteamGridDB/Steam.
  Własny obrazek jest kopiowany do danych aplikacji i pozostaje po odświeżeniu gry.
- Do szerokich teł polecane są poziome grafiki **Hero** ze
  [SteamGridDB](https://www.steamgriddb.com/search/grids?term=Look%20Outside).
  Można też użyć obrazków ze [strony gry na Steamie](https://store.steampowered.com/app/3373660/Look_Outside/).
  Pobranie odbywa się w przeglądarce, potem wybieramy obraz w aplikacji.

## Zmiany w 0.2

- Gra jest powiększana lub pomniejszana do maksymalnego dostępnego obszaru,
  z zachowaniem proporcji i wyśrodkowaniem. Usunięty jest mobilny zapas 10%
  wysokości MZ oraz zaokrąglanie skali do pełnych/połówkowych mnożników.
  Wspólna skala silnika zapewnia poprawne współrzędne dotyku i rozmiar wideo.
- Przycisk menu ma 40% krycia i znika po 5 sekundach bezczynności dotykowej.
  Dotknięcie ekranu pokazuje go ponownie, bez przechwytywania dotyku gry.
  Timer jest zatrzymywany podczas dotyku, otwartego menu i w tle aplikacji.

## Zgodność

- Android 8.0+, aktualny System WebView (WebGL, WebAudio, WebAssembly).
- MV/MZ w trybie przeglądarkowym; oryginalne foldery desktopowe mogą zostać
  wskazane bez konwersji. Ładowanie plików toleruje różnice wielkości liter
  i zastępuje brakujące warianty mobilnego audio istniejącym OGG.
- Odczyt zakresów HTTP umożliwia przewijanie mediów. OGG/MZ `_`/MV `.rpgmvo`
  pozostają w formacie obsługiwanym przez sam silnik gry.
- Lokalne zapisy plus eksport/import kopii MV localStorage i MZ localforage.
- Minimalny adapter `require('os').userInfo()` dla przeglądarkowej ścieżki
  Look Outside. `process` i `nw` nie są definiowane, więc silnik nie próbuje
  zapisywać plików jak desktopowe NW.js.
- `require('fs')` tylko do odczytu (`existsSync`, `statSync`, `readFileSync`...)
  dla pluginów, które sprawdzają pliki gry - np. `monsterImageExists()` Look
  Outside przy każdej zmianie pozy potwora w walce. Pliki idą synchronicznym
  zapytaniem z tego samego źródła co reszta gry (bez względu na wielkość liter,
  z pamięcią podręczną na sesję). Zapis przez `fs` jest odrzucany - zapisy
  zostają w pamięci przeglądarki. Do tego proste `require('path')`.
- Opcjonalne integracje Steam pozostają nieaktywne. Gra Look Outside sama
  obsługuje ich brak; komunikat Greenworks w logu nie blokuje uruchomienia.

Aplikacja nie uruchamia Windows EXE ani dowolnych natywnych modułów Node.
Opcjonalny panel drugiego ekranu ma dedykowane profile dla Look Outside, To the Moon
i Fear & Hunger.
Zgodność konkretnych rozbudowanych pluginów musi być sprawdzana per gra.

### Opcja 60 Hz (`DisplayRate.java`)

Przełącznik „Ogranicz ekran do 60 Hz” w menu podczas gry MV/MZ, domyślnie
wyłączony (plik `limit-60hz.enabled`). Włączony ustawia
`preferredDisplayModeId` okna gry (i panelu drugiego ekranu) na tryb ~60 Hz
o bieżącej rozdzielczości; wyłączony przywraca 0 (domyślne systemu). Logika
MV/MZ i tak działa w 60 krokach/s, a opcja „Unlimited” gry (PIXI
`maxFPS = 0`) na ekranach 120 Hz rysowała 120 klatek. Na Thorze sprawdzone:
górny ekran przechodzi na `refreshRate=60.000004`.

### Pliki Windows w folderze gry (`PcRuntimeFiles.java`)

Przy dodaniu lub odświeżeniu gry MV/MZ PadPort liczy pliki środowiska NW.js
i Steam (`*.dll`, `*.exe`, `*.node`, `*.pak`, `icudtl.dat`, `*_blob.bin`,
`v8_context_snapshot.bin` w katalogu głównym, oraz `locales/*.pak(.info)`,
`swiftshader/*.dll`, `lib/*.dll|*.node`). Od 5 MB pyta o usunięcie z listą
przykładów i rozmiarem (Elderfield: 481 plików, 540 MB). Nigdy nie rusza
głębszych folderów, `www/`, plików tekstowych ani gier RGSS. Wymaga trwałego
uprawnienia zapisu do drzewa SAF — PadPort je zapamiętuje przy wyborze
folderu; gry dodane starszą wersją trzeba dodać ponownie, żeby pytanie się
pojawiło. Po usunięciu indeks jest skanowany ponownie.

### Zgodność gier (`GameCompat.java`, `assets/game-compat.js`)

- **FOSSIL (każda gra MZ):** gdy FOSSIL jest pierwszym włączonym pluginem,
  pod NW.js zapisuje `FOSSILindex.html` (`index.html` z `js/main.js` →
  `js/plugins/FOSSIL.js`) i przeładowuje stronę. PadPort nie zapisuje plików
  gry, więc sam podaje tę stronę zamiast `index.html` (`GameCompat.entry`).
  Tryb główny FOSSIL nie używa Node.
- **Welcome to Elderfield (MZ), profil `welcome-to-elderfield`:**
  - `nodeShim: false` — bez `require`. Cyclone-Steam i WTE_PluginToggleManager
    po wykryciu `require` czytają `process.*` przy ładowaniu i gra staje przed
    tytułem. Pozostałe użycia Node są w grze zabezpieczone (`Utils.isNwjs()`)
    albo mają ścieżkę przeglądarkową (Hendrix_Localization_Core: XHR).
  - LookupTableComparison: lista `Tables/**/*.csv` z indeksu folderu trafia do
    konfiguracji, a hook `preloadAll` wczytuje je kluczami jak skan NW.js
    (`Gifts/AliceLoves`). Bez tego wszystkie reakcje NPC na prezenty są fałszywe.
  - SimpleMusicPlayer (radio, „The Weather Channel”): `isSongFileExists()`
    używa `process.mainModule` bez try/catch; podmieniane w prototypie sceny
    (hook `SceneManager.onSceneCreate`) na zapytanie HEAD. Odtwarzanie i tak
    wraca do względnej ścieżki `media/player/*.ogg` (zakresy bajtów).
  - Testy: `tests/game-compat.test.cjs` i `GameCompatTest` (z
    `ELDERFIELD_GAME` także na prawdziwych plikach gry, w tym porównanie z
    dostarczonym `FOSSILindex.html`).

## RPG Maker XP / VX / VX Ace (RGSS) — w kodzie, jeszcze nie w wydanym APK

Pełny opis prac, architektury, testów i otwartych spraw: [`RGSS.md`](RGSS.md).

- Wykrywanie: `Game.ini` / `<exec>.ini` z `Library=RGSS1/2/3…`, archiwum
  `.rgssad`/`.rgss2a`/`.rgss3a` albo luźne `Data/Scripts.*`; `execName`
  z `mkxp.conf` ma pierwszeństwo (`RgssGame`). Karta: „RPG Maker XP/VX/VX Ace”.
- Silnik: natywny **mkxp-z** (Ruby 3.1, SDL2, OpenGL ES) z publicznego wydania
  `BookerRues9/mkxp-z-android-reworked` v1.0.0, tylko `arm64-v8a`.
  `tools/fetch_rgss_engine.py` pobiera APK, sprawdza SHA-256 i wypakowuje `.so`
  do `app/src/main/jniLibs` (poza kontrolą wersji). Ten sam skrypt poprawia
  w `libmkxp-z.so` osadzone shadery (mediump → highp, indeks autotile w
  zakresie): na Adreno kafelki mapy znikały i migały, emulator tego nie pokazywał.
  Gra jest zawsze pełnoekranowa (`Graphics.fullscreen=` ignoruje `false`,
  Alt+Enter wyłączony, paski systemowe ukrywane ponownie). Klasy Java SDL 2.26.3 są
  w `org.libsdl.app` (jedna poprawka flagi receivera dla Androida 14).
- `RgssActivity` działa w osobnym procesie `:rgss` (maszyny Ruby nie da się
  zainicjować ponownie); po wyjściu z gry proces kończy się, biblioteka zostaje.
- mkxp-z wymaga ścieżek POSIX, więc przy pierwszym „Graj” oryginalny folder SAF
  jest kopiowany do prywatnych danych aplikacji (`files/rgss/<id>/game`, bez
  `.exe`/`.dll`). Kolejne uruchomienia kopiują tylko zmienione pliki. Zapisy:
  pliki utworzone przez grę w jej folderze + `files/rgss/<id>/saves`
  (`APPDATA`, `AV_APPDATA` itd.). Menu gry (Wstecz / ⋮ / Guide): eksport
  i import zapisów jako ZIP, log diagnostyczny, zakończenie gry. Usunięcie gry
  z biblioteki usuwa kopię plików, ale nie zapisy.
- `mkxp.json` jest generowany z `mkxp.conf` (format mkxp Ancurio) i ewentualnego
  `mkxp.json` gry; gdy `mkxp.conf` nie wymienia skryptów, dołączane są
  `preload/*.rb` (tak robią porty Freebird Games).
- `assets/rgss/padport_rgss.rb` (pierwszy preload) — warstwa zgodności:
  przepisuje w pamięci tylko sekcje skryptów, które nie kompilują się w Ruby 3
  (listy haszy `{a, b}`, `when x:`, `foo (a, b)`), przywraca metody Ruby 1.8
  dla XP/VX, normalizuje ścieżki Windows, udostępnia API `MKXP` i zastępuje
  niedostępne `Win32API` (klawiatura, mysz, INI, okno; reszta zwraca sukces).
- Pad: `ControllerHub` (te same profile) → klawisze RGSS: A=Enter (C),
  B/Start=Esc (B), X=Shift (A), Y=A (X), L1/R1=Q/W, L2/R2=S/D, krzyżak
  i lewa gałka = strzałki. HIDAPI SDL jest wyłączone, żeby nie dublować wejścia.
  Dotyk działa jako mysz (gry XP ze skryptem myszy, np. To the Moon).
- Przy dodawaniu gry XP/VX/VX Ace pojawia się ostrzeżenie o wersji
  eksperymentalnej; gra trafia do biblioteki dopiero po „Kontynuuj”.
- Skrypty z Ruby 1.8 w stylu `bitmap.text_size (s).width` są przepisywane na
  `text_size(s).width` (Ruby 1.9+ czytał to jako `text_size((s).width)`).
- Grafika karty (wszystkie silniki): gdy pliki gry nie mają obrazu tytułowego,
  PadPort pobiera grafikę ze sklepu Steam (`library_hero`, potem mniejsze).
  Numer aplikacji z `steam_appid.txt`, a bez niego wyszukiwarka Steam
  i wyłącznie identyczny tytuł. Brak gry na Steamie jest zapamiętywany, brak
  sieci — nie (`SteamArtwork`).
- Ograniczenia: brak MIDI (FluidSynth), brak RTP — gry wymagające
  zainstalowanego RTP nie mają jego grafik/dźwięków; brak wideo; tylko 64-bit ARM
  (emulator x86_64 korzysta z tłumaczenia ARM).
- Licencja: mkxp-z jest na GPL, więc APK z tym silnikiem musi być
  rozpowszechniany na GPL-3.0-or-later wraz ze źródłami. Szczegóły i pochodzenie
  binariów: `assets/rgss/NOTICE.txt`.
- Zweryfikowane: To the Moon (Steam, RGSS1, `.rgssad`) na silniku mkxp-z
  w emulatorze Androida 15 — splash, ekran tytułowy i nowa gra, zarówno z własnym
  wrapperem gry, jak i wyłącznie z zapasowym Win32API PadPort. Przez PadPort:
  wykrycie przez SAF, karta XP, kopia 112 MB, start procesu `:rgss` i skryptów.
  Pełny przebieg przez APK PadPort po ostatnich poprawkach czeka na zlecony build
  (`python tools/android_rgss_smoke.py`).

## Budowanie

**APK budujemy tylko na wyraźną prośbę użytkownika.** Zmiany kodu i testy nie
uruchamiają automatycznie pakowania. Projekt można otworzyć w Android Studio.
Polecenie do użycia po zleceniu buildu:

```powershell
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug
```

Potrzebne są JDK 17 lub nowszy i Android SDK 35.

Host Node wymaga NDK `27.0.12077973` i CMake `3.22.1`. Przygotowanie
zależności oraz skryptów uruchomieniowych:

```powershell
python tools/fetch_node_runtime.py
python tools/fetch_rgss_engine.py
npm ci --prefix runtime
npm run build --prefix runtime
```

Skrypt pobierania sprawdza SHA-512 oficjalnego pakietu Node.js Mobile
`18.20.4`. Biblioteki i nagłówki trafiają do `.tools/nodejs-mobile`.
Wspólna biblioteka C++ pochodzi z NDK. Licencja Node i jego zależności
znajduje się w `app/src/main/assets/node-LICENSE.txt`.

Alternatywna ścieżka budowania:

```powershell
python tools/build.py testDebugUnitTest lintDebug assembleDebug
```

`tools/bootstrap.py` korzysta z zainstalowanego JDK, SDK wskazanego przez
`local.properties` lub `ANDROID_HOME` oraz Gradle 8.14.5 z lokalnego cache
albo `GRADLE_HOME`. `tools/build.py` uruchamia Gradle z `--offline`; brakujący
komponent zgłasza jako błąd. Zależności natywne muszą być już przygotowane
przed budowaniem.

APK pochodzi z `app/build/outputs/apk/debug/app-debug.apk`; skrypt pakujący
kopiuje je i instrukcję do `dist/`, a także zapisuje SHA-256. To podpisany
kluczem debug build testowy. APK nie zawiera plików gier.

## Testy

```powershell
node --test tests/bridge.test.cjs
node --test tests/game-compat.test.cjs
npm test --prefix runtime
python -m unittest discover -s tests -p "test_*.py"
python tools/build.py testDebugUnitTest
```

Testy JVM obejmują zakresy osi, martwe strefy, mapowanie HID, łączenie stanów
klawiszy/hatów/triggerów i zakresy odczytu zasobów. Testy JS obejmują strukturę
Gamepad API, połączenie/rozłączenie, pauzę, zerową liczbę generowanych klawiszy,
zapisy i wycofanie częściowo nieudanego importu.

Opcjonalne testy wcześniej zbudowanego APK na **dedykowanym emulatorze**,
nigdy na automatycznie wybranym fizycznym urządzeniu:

```powershell
python tools/prepare_emulator.py
python tools/android_smoke.py
python tools/android_game_smoke.py
python tools/android_keyboard_smoke.py
python tools/android_display_smoke.py
python tools/android_artwork_smoke.py
python tools/android_language_smoke.py
```

Emulator ma numer `emulator-5580`. Testy tworzą uinput HID w Androidzie,
deklarując magistrale USB/Bluetooth; sprawdzają więc pełną ścieżkę jądro →
Android → aplikacja → WebView → Gamepad API. Nie są testem radia Bluetooth
ani fizycznego kontrolera Thora. Kopiowanie gry do tego emulatora może wymagać
`adb -s emulator-5580 root`; aplikacja i normalny użytkownik nie wymagają roota.

Wykonano również test startu oryginalnych plików Look Outside w desktopowym
Chromium z Androidowym user-agentem (`tools/smoke-game.cjs`).

### Zweryfikowane w tej sesji

- kompilacja APK i testy JVM/JS; Android Lint bez błędów;
- natywne wejście USB/Bluetooth HID na Androidzie 15, z zerem zdarzeń klawiatury;
- nauczenie klawisza Z jako przycisku A przez prawdziwy interfejs aplikacji;
- wybór folderu przez SAF, zachowanie dostępu po restarcie aplikacji;
- start Look Outside w Androidowym WebView, menu i rozpoczęcie nowej gry
  przez natywny kontroler, mapa wprowadzająca 5, aktywny kontekst audio;
- odczyt zwrotny Unicode przez rzeczywisty `StorageManager` gry i eksport danych.
- w 0.2: dopasowanie obrazu na ekranach 1280×800 i 1600×900, poprawne
  współrzędne dotyku oraz zmiana rozmiaru okna bez ponownego uruchamiania gry;
- ukrywanie menu po bezczynności, pokazywanie dotykiem i restart licznika;
  dotknięcie miejsca ukrytego przycisku trafia do gry, nie otwiera menu.
- w 0.3: automatyczna grafika z zaszyfrowanego tytułu Look Outside, wybór
  własnego PNG przez systemowy picker, zachowanie własnej grafiki po odświeżeniu,
  przywrócenie tła z gry i zwykła karta po braku pliku obrazu.
- w 0.5: domyślny angielski przy polskim bazowym locale Androida, oba języki
  ekranów natywnych i testera WebView, zapamiętanie wyboru po restarcie oraz
  zgodność formatu kopii zapisów między językami. Raport: `android-language-smoke.json`.

Raporty i zrzuty znajdują się w `test-results/`. Pełnego przejścia gry,
testów fizycznego Bluetooth/USB i testu na AYN Thorze jeszcze nie wykonano.

## Pliki

- `ControllerHub`, `PadProfile`, `PadMath` — Android HID i profile.
- `GameSource`, `AssetPaths`, `GameWebClient` — foldery i serwowanie zasobów.
- `PlayerActivity` — WebView, cykl życia, menu i kopie zapisów.
- `ControllerActivity` — wybór urządzenia, nauka przycisków i diagnostyka.
- `assets/bridge.js` — Gamepad API i magazyny zapisów.
- `RgssGame`, `RgssRuntime`, `RgssActivity`, `RgssKeys`, `RgssArtwork`,
  `assets/rgss/padport_rgss.rb` — RPG Maker XP/VX/VX Ace (mkxp-z).

SDK, obrazy emulatora, cache i wyniki testów są wyłączone z kontroli wersji.
