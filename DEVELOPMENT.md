# PadPort - dokumentacja deweloperska

Opis dla graczy: [README.md](README.md) i [README.zh-CN.md](README.zh-CN.md).
Zakres przebudowy i ograniczenia: [docs/REFACTORING.md](docs/REFACTORING.md).

## Status przebudowy

To eksperymentalna, przebudowana wersja PadPort. Sprawdzano ją wyłącznie
lokalnie, na ograniczonej liczbie urządzeń i gier. Nie ma gwarancji stabilności,
wydajności ani zgodności. Historyczne wyniki testów wcześniejszego odtwarzacza
nie są potwierdzeniem poprawności obecnej architektury. Problemy można zgłaszać
przez [Issues](../../issues/new), podając wersję aplikacji i kroki odtworzenia.

Zmiany obejmują wspólny backend plików Node, zasoby ASAR, część interfejsów
uruchomieniowych Electron oraz poprawki ładowania zasobów, grafiki, audio
i wejścia. Usunięto obsługę drugiego ekranu, jego panele i zasoby oraz ścieżkę
odtwarzania GeckoView. Gry MV/MZ używają teraz systemowego WebView. RGSS
zachowuje osobny odtwarzacz natywny.

## Architektura

1. Systemowy picker przyznaje trwały dostęp do folderu gry przez SAF.
   Java `GameSource` nadal obsługuje rozpoznawanie i indeksowanie biblioteki.
2. `PlayerActivity` uruchamia MV/MZ w systemowym Chromium WebView.
   Odpowiada za okno, wejście, menu oraz cykl życia aktywności.
3. `NodeRuntime` łączy odtwarzacz z `NodeService` w procesie `:runtime`.
   Node obsługuje pliki, moduły CommonJS i lokalne zasoby HTTP.
4. `GameDocuments` i `RuntimeFileChannel` przekazują operacje SAF oraz
   deskryptory plików do Node. Kod JNI znajduje się w `app/src/main/cpp`.
5. `runtime/src` zawiera źródła backendu i klienta przeglądarkowego.
   `runtime/build.cjs` tworzy pakiety używane przez aplikację.
6. `RgssActivity` i mkxp-z uruchamiają XP/VX/VX Ace w procesie `:rgss`.
   Szczegóły i ograniczenia: [RGSS.md](RGSS.md).

Synchroniczne operacje plikowe korzystają z `JavascriptInterface` i trwałego,
uwierzytelnionego kanału TCP do Node. Ramki mają 8-bajtowy nagłówek little-endian
(długość i typ) oraz treść JSON. Zasoby i wywołania asynchroniczne korzystają
z HTTP, a migawki wejścia i polecenia z SSE. Stan wejścia jest parsowany
przy nadejściu wiadomości, a nie przy każdym odczycie Gamepad API.

Katalog roboczy zwykłej strony HTML odpowiada jej plikowi wejściowemu.
Pakiet Electron zachowuje własny punkt wejścia i uruchamia skrypt główny
oraz preload przez warstwę zgodności. Nie jest to pełna implementacja
Electron; dowolne natywne moduły desktopowe i pliki Windows EXE są nieobsługiwane.
ASAR pozostaje tylko do odczytu. Pliki zapisu muszą znajdować się poza archiwum.

## Wejście, menu i cykl życia

`ControllerHub` scala kontrolery fizyczne i dotykowe. Tryb Gamepad udostępnia
standardowy stan przez `navigator.getGamepads()`, a tryb Klawiatura wysyła
przypisane klawisze. Przyciski literowe układu dotykowego mogą wysyłać klawisze
również w trybie Gamepad. Dlatego diagnoza powinna rozróżniać oba źródła.

Ustawienia kontrolera obejmują wybór układu, przezroczystość oraz edytor
położenia i rozmiaru gałki obsługiwany przeciąganiem. Podążanie podstawy
pozostaje opcjonalne. Przewidywanie wejścia jest domyślnie wyłączone
i korzysta wyłącznie z historii wejścia oraz ruchu palca.

Każdy aktywny dotyk ma własny identyfikator. Zdarzenia podniesienia palca
i anulowania zwalniają stan przycisków oraz osi. Pauza, utrata fokusu
i odłączenie kontrolera wymagają wyzerowania odpowiedniego wejścia.

Menu otwierane pływającym przyciskiem i diagnostyka wstrzymują grę.
Pauza oraz wznowienie obejmują WebView, zegary strony i media.
Zamknięcie gry zwalnia kanał plikowy, deskryptory i proces Node.
Opcja 60 Hz korzysta z `preferredRefreshRate`, bez przypinania trybu
wyświetlacza; ostateczny wybór należy do Androida. Nie jest to licznik
ani gwarancja 60 klatek gry na sekundę.

## Zapisy

MV/MZ korzysta z plików przez Node, w formacie i katalogu wybranym przez
silnik lub plugin. Nie należy przekierowywać tych operacji do drugiego
magazynu przeglądarkowego. W aktywnym menu MV/MZ nie ma już wcześniejszych
akcji transferu zapisów przeglądarkowych. Dane poprzedniego silnika
przeglądarki nie są automatycznie migrowane.

RGSS zachowuje zapisy w danych aplikacji i import/eksport ZIP. Przed zmianą
wersji należy wykonać kopię i sprawdzić zapis oraz odczyt w używanej grze.

## Budowanie

APK budujemy tylko na wyraźną prośbę. Zmiana dokumentacji ani przegląd
commitów nie wymagają nowego APK.

Projekt wymaga JDK zgodnego z używanym Gradle i Android Gradle Plugin,
Android SDK 35, NDK `27.0.12077973` oraz CMake `3.22.1`. Lokalny build
używa istniejącego JDK 21 i zapisanych zależności. Konfiguracja SDK
pozostaje w nieśledzonym `local.properties` lub `ANDROID_HOME`.

Przygotowanie nowego środowiska wymaga zależności Node.js Mobile `18.20.4`,
bibliotek RGSS i zależności npm. Skrypty `tools/fetch_node_runtime.py`,
`tools/fetch_rgss_engine.py` oraz `npm ci --prefix runtime` pobierają pliki;
nie należy ich uruchamiać jako automatycznej próby naprawienia lokalnego
buildu. Skrypty pobierające weryfikują sumy kontrolne zależności.

Po przygotowaniu środowiska przebudowa klienta i backendu JS:

```powershell
npm run build --prefix runtime
```

Gdy zlecono build APK, kompilacja Release z lokalnego cache:

```powershell
.\gradlew.bat --offline assembleRelease --console=plain
```

Alternatywnie `python tools/build.py assembleRelease` korzysta
z `tools/bootstrap.py` i uruchamia Gradle offline. Brakujący komponent
powinien zostać zgłoszony jako błąd, bez automatycznego pobierania.

Wynik to `app/build/outputs/apk/release/app-release-unsigned.apk`.
Projekt nie konfiguruje klucza podpisu Release. Taki plik wymaga podpisania
przed zwykłą instalacją systemową. Biblioteki i generowane pliki runtime
są wyłączone z kontroli wersji; wyjątkiem jest śledzony klient
`app/src/main/assets/runtime-client.js`.

## Weryfikacja i zgłoszenia

Repozytorium zawiera testy JS, backendu Node i JVM. Ich obecność nie oznacza,
że zostały uruchomione dla bieżącego commita ani że dana gra jest stabilna.
Przy raportowaniu wyników należy podać commit, wersje narzędzi, urządzenie,
wykonany zakres i to, czego nie sprawdzono. Lokalne scenariusze syntetyczne
nie zastępują regresji rzeczywistego przebiegu gry.

Przykładowe polecenia, uruchamiane w uzgodnionym zakresie:

```powershell
node --test tests/bridge.test.cjs
npm test --prefix runtime
python -m unittest discover -s tests -p "test_*.py"
python tools/build.py testDebugUnitTest
```

Instrukcje zbierania logów i użycia debuggera:
[docs/DEBUGGING.md](docs/DEBUGGING.md). Zgłoszenie powinno zawierać wersję
aplikacji, Androida i WebView, model urządzenia, kroki odtworzenia oraz
sprawdzony pod kątem prywatnych danych log. Nie należy dołączać plików gry
ani prywatnych zapisów do publicznych zgłoszeń.

## Główne pliki

- `ControllerHub`, `PadProfile`, `PadMath`: wejście i profile kontrolerów.
- `VirtualControllerView`, `VirtualControllerEditor`, `VirtualInputPrediction`:
  nakładka dotykowa, edytor i opcjonalne przewidywanie wejścia.
- `GameSource`, `GameDocuments`, `RuntimeFileChannel`: biblioteka i dostęp SAF.
- `PlayerActivity`, `NodeRuntime`, `NodeService`: odtwarzacz i proces Node.
- `runtime/src/client.cjs`, `host.cjs`, `input.cjs`: strona gry i most wejścia.
- `runtime/src/server.cjs`, `files.cjs`, `documents.cjs`: backend plików.
- `RgssRuntime`, `RgssActivity`, `assets/rgss/padport_rgss.rb`: RGSS.

Licencje komponentów zewnętrznych i wymagane informacje o pochodzeniu
muszą zostać zachowane. SDK, lokalne konfiguracje, pliki gier i raporty
z prywatnymi danymi nie należą do publicznego repozytorium.
