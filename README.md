# LuminoOS

System operacyjny dla telefonu, tabletu i laptopa — projekt w toku.

## Etap 1 — makiety poglądowe (gotowe)

Statyczna strona pokazująca trzy urządzenia w znanym, „domyślnym” wyglądzie:
telefon i tablet jak **Android 15**, laptop jak **Windows 11**.

## Etap 2 — makiety interaktywne + osobne podglądy (ten etap)

### Osobne podglądy
Przełącznik u góry: **Wszystkie / Telefon / Tablet / Laptop**. Widok pojedynczy
skaluje urządzenie do okna (do ~1,9×) i ukrywa resztę — wygodne klikanie.
Skróty klawiszowe: `1` telefon, `2` tablet, `3` laptop, `0` wszystkie.
Wybór zapisuje się w adresie (`#phone`, `#tablet`, `#laptop`).

### Wierność oryginałom

Makiety przestały być obrazkami — to klikalne powłoki z prawdziwą logiką w JS.

### Telefon i tablet (Android 15 / Pixel)
- **Ekran blokady** — zegar, powiadomienia, skrót do aparatu/latarki; odblokowanie kliknięciem lub przeciągnięciem w górę.
- **Launcher** — dwie strony z przewijaniem, kropki stron, dock, pasek gestów.
- **Panel powiadomień** — styl Androida 15: duże kafelki 2×2 z opisem (Internet,
  Bluetooth, Nie przeszkadzać, Oszczędzanie), rząd małych przełączników, suwaki
  jasności i głośności, karty powiadomień, „Zablokuj”.
- **Szuflada aplikacji** — wszystkie aplikacje, otwierana paskiem gestów.
- **Aplikacje**:
  - **Spotify** — listę 9 przykładowych utworów, odtwarzanie/pauza, następny/poprzedni, losowo, postęp, pełny ekran odtwarzacza z okładką i suwakiem;
  - **Wiadomości** — lista wątków, rozmowa, wysyłanie (z symulowaną odpowiedzią);
  - **Kalkulator** — naprawdę liczy (podstawa, %, ±, backspace);
  - **Ustawienia** — przełączniki, grupy, profil;
  - **Notatki**, **Kalendarz** (prawdziwy miesiąc z dzisiejszą datą), **Zdjęcia**, **Aparat**, **Chrome** — makiety z treścią;
  - pozostałe (Gmail, Mapy, Pliki, Telefon, YouTube) — ekrany „do zaprojektowania”.

### Laptop (Windows 11 / 23H2)
- **Okna** — przeciąganie za pasek tytułu, minimalizacja, maksymalizacja, zamykanie, fokus/nieaktywne.
- **Ekran blokady** — zegar, data, pogoda, awatar i logowanie (makieta).
- **Menu Start** — 6 kolumn, 18 przypiętych aplikacji z kolorowymi kaflami,
  wyszukiwanie filtrujące, polecane pliki, pasek użytkownika z blokadą/zasilaniem.
- **Pasek zadań** — wskaźniki uruchomionych aplikacji, zegar z datą, taca.
- **Aplikacje**: Eksplorator plików (nawigacja po folderach, zaznaczanie plików), Spotify (ta sama playlista, ten sam stan odtwarzania), Ustawienia, Notatnik (prawdziwy tekst), Kalkulator, Pogoda, Edge, Store, Terminal, Poczta, Kalendarz, Zdjęcia, Mapy, Word, Excel, Paint, Xbox, Zegar.
- **Powiadomienia toast** przy otwieraniu Spotify / starcie systemu.

### Wspólny odtwarzacz
Telefon, tablet i laptop korzystają z jednego stanu muzyki: uruchomienie utworu
na telefonie od razu widać w widgecie tabletu i w oknie Spotify na laptopie
(pierwszy zarys „ciągłości” między urządzeniami).

## Uruchomienie

Bez kompilacji — otwórz `index.html` albo:

```bash
python3 -m http.server 5173     # lub: npm start
# → http://localhost:5173
```

Test dymny (jsdom, sprawdza powłoki i interakcje):

```bash
npm install      # tylko jsdom, opcjonalnie
npm test
```

## Pliki

```
index.html          – scena z trzema urządzeniami + sprite ikon SVG
css/base.css        – strona, ramki urządzeń, wspólne kafelki ikon
css/android.css     – Android: blokada, launcher, wyspa (skróty), aplikacje, Spotify
css/windows.css     – Windows: okna, pasek zadań, Start, aplikacje
js/core.js          – dane przykładowe (utwory, aplikacje, powiadomienia) + wspólny odtwarzacz
js/apps.js          – treść aplikacji (Android i Windows)
js/android.js       – powłoka Androida (telefon + tablet)
js/windows.js       – powłoka Windows (okna, Start, pasek zadań)
js/views.js         – przełącznik podglądów i skalowanie urządzenia
js/page.js          – start strony i spięcie urządzeń
tools/smoke-test.js – test dymny w jsdom
```

## Etap 3 — do ustalenia

Kierunek wizualny LuminoOS (kolory, typografia, ikony), nazwy i układ aplikacji,
zachowanie powłoki (gesty, powiadomienia, okna) oraz to, co ma być **wspólne**
między urządzeniami. Wtedy podmieniamy makiety — zaczynając od telefonu.

## Tapeta

Tapeta laptopa pochodzi z pliku użytkownika (`b_Wygeneruj_piękną_now.webp`).
W `assets/` leżą jej wersje zoptymalizowane pod makietę:

| Plik | Rozmiar | Zastosowanie |
|---|---|---|
| `assets/wallpaper-desktop.jpg` | ~193 KB | pulpit laptopa (lekkie przyciemnienie + gradient pod ikonami) |
| `assets/wallpaper-lock.jpg` | ~41 KB | ekran blokady laptopa (rozmycie + mocniejsze przyciemnienie) |
| `assets/wallpaper-phone-lock.jpg` | ~277 KB | ekran blokady telefonu i tabletu (tapeta pionowa) |
| `assets/wallpaper-phone-home.jpg` | ~145 KB | ekran główny (launcher) telefonu — lekko rozmyta |
| `assets/wallpaper-tablet-home.jpg` | ~64 KB | ekran główny tabletu — kadr poziomy z tapety pionowej |

Podmiana tapety: wrzuć nowy plik jako `assets/wallpaper-desktop.jpg`
(i rozmyty wariant jako `assets/wallpaper-lock.jpg`), a dla telefonu
`assets/wallpaper-phone-lock.jpg`, a na ekrany główne `assets/wallpaper-phone-home.jpg`
i `assets/wallpaper-tablet-home.jpg` — style podciągną je automatycznie
(`css/windows.css`: `.win-wallpaper` / `.win-lock`, `css/android.css`:
`.android[data-device=...]` oraz `.a-lock`).

## Wygląd i ruch (etap 3)

- **Tapety bez rozmycia** — wszystkie tła są ostre; przyciemnienie tylko pod tekstem.
- **Styl „glass”** (`css/glass.css`) — półprzezroczyste powierzchnie z rozmyciem tła
  (`backdrop-filter`), jasną krawędzią 0,5 px i miękkim cieniem: dock, panel
  powiadomień, szuflada, widgety, okna Windows, menu Start, pasek zadań, karty.
- **Ultra płynne animacje** (`js/motion.js`):
  - ripple pod każdym kliknięciem (jak w Androidzie),
  - sprężyste „dociśnięcie” przycisków i kafli,
  - sprężyste wejście list, paneli, aplikacji i okien (kaskadowe opóźnienia),
  - aplikacja Androida „wyrasta” z klikniętej ikony,
  - przejścia między podglądami (fade + skala + blur),
  - delikatny efekt 3D pod kursorem na ikonach i kaflach,
  - wszystko na Web Animations API (transform/opacity = warstwa kompozytora),
  - automatyczne wyłączenie przy `prefers-reduced-motion`.

### Szklane ikony aplikacji
Wszystkie ikony (`js/core.js` → `brandIcon`, styl `css/glass.css` → `.bi`) są teraz
„szklanymi” płytkami: gradient marki + refleks świetlny u góry, cienka rozświetlona
krawędź, miękki cień i podniesienie pod kursorem. Dotyczy to pulpitu, docku,
szuflady aplikacji, ekranu blokady i widgetów.

### Ikony — liquid glass w trybie „Clear" (jak iOS 26)
Ikona ma **dwie warstwy**:

1. `.bi::before` — `backdrop-filter: blur(16px) saturate(190%)` przycięty maską
   squircle (`assets/icons/mask.png`): tapeta **pod ikoną jest rozmyta i wysycona**,
2. `.bi` (tło = `assets/icons/<id>.png`) — **neutralne, szronione szkło**:
   lekka mgła (8–20%), rozświetlenie od góry, refleks przy górnej krawędzi,
   jasna krawędź squircle i wewnętrzny cień (grubość materiału).

**Glif jest jednobarwny (biały) i ma wykroje** — detale rysowane na czarno są
przez maskę **wycinane**, więc widać przez nie tapetę (tak robi to Apple w trybie
„Clear"). Dzięki temu ikona nie jest kolorową płytką: kolor pochodzi wyłącznie
od tapety, a glif pozostaje czytelny.

Grafiki generuje `tools/make-icons.js` (SVG → PNG przez `@resvg/resvg-js`):
squircle n=5 (ta sama krzywa co maska iOS), 512 px, kanał alfa.
Podpięcie: `Lumino.iconImg(id)` → `<i class="app__icon bi" style="background-image:url('assets/icons/<id>.png?v=6')">`.

Regeneracja: `node tools/make-icons.js` → podbij `ICON_V` w `js/core.js`
oraz `?v=` przy `mask.png` w `css/glass.css`.

### Najpłynniejszy interfejs (etap 5)
Wszystkie animacje idą **jedną ścieżką**: wyłącznie `transform` i `opacity`
(kompozytor/GPU), na **jednym schedulerze `requestAnimationFrame`** (`js/perf.js`).

- **krzywe Apple**: `--ease-ios: cubic-bezier(.32,.72,0,1)` — ruch jest szybki
  na starcie i miękko wyhamowuje; dodatkowo `--ease-spring` i `--ease-snap`,
- **sprężyny** (`Lumino.motion.spring`) — animacje bez sztywnych czasów,
- **efekt „wyrastania”** — aplikacja otwiera się z ikony (transform z jej pozycji
  i rozmiaru) i w nią się zapada przy zamykaniu,
- **inercyjne przewijanie** — kółko myszy dostaje wygładzenie jak w macOS,
- **zero wymuszonych przeliczeń layoutu** — ripple i „magnetyczne” ikony liczą
  geometrię raz, potem tylko macierze transformacji (rAF),
- **makiety poza widokiem nie pracują** — `content-visibility` + pauza animacji,
- **tryb `lu-busy`** — na czas animacji wyłączamy `backdrop-filter` pod ikonami,
- **wygaszanie w tle** — karta w tle zatrzymuje scheduler.

Kontrola jakości: `npm run test:perf` (`tools/perf-audit.js`) wykrywa przejścia
na właściwościach układu, zmiany `backdrop-filter` na hover i animacje filtrów.
Licznik klatek w podglądzie: dopisz `?fps=1` do adresu — w prawym dolnym rogu
pojawi się FPS, średnia klatka, najgorsza klatka i procent zaciągnięć.

### Podgląd 1:1 i pełny ekran
Dwa przyciski w belce widoków (skróty: **S** i **F**):

- **1:1** — urządzenie w rzeczywistych proporcjach (telefon 390×844,
  tablet 1024×768, laptop 1440×900); skala to 1, gdy mieści się w oknie,
  inaczej proporcjonalnie mniejsza. Aktualna skala jest pokazana w rogu.
- **Pełny ekran** — **prawdziwy fullscreen przeglądarki** (`requestFullscreen`,
  więc na laptopie znika pasek adresu i systemowe ramki), a makieta skaluje się
  do całego okna. Gdy przeglądarka odmówi (np. podgląd w iframe), pojawia się
  czytelny komunikat z prośbą o otwarcie podglądu w osobnej karcie — nie
  udajemy już pełnego ekranu. Wyjście: **F**, **Esc**, przycisk ✕ w prawym
  górnym rogu albo kropka paska trybów na dole.
  W pełnym ekranie widoczne jest **dokładnie jedno urządzenie** (`.is-shown`);
  gdyby JS nie zdążył, reguła awaryjna i tak pokazuje telefon — czarny ekran
  nie jest już możliwy.

### Górna belka telefonu/tabletu + wyspa (panel usunięty)
- **Wyspa po lewej** (tam, gdzie była godzina): ciemna pigułka z soczewką
  aparatu, zegarem i krótką datą. Bez animowanej kropki i bez
  `backdrop-filter` — czytelność daje ciemna mgła, zgodnie z zasadą
  „blur tylko w ikonach aplikacji”.
- **Klik w wyspę rozwija skróty** — wyspa jest teraz **jedynym centrum
  sterowania**, panel powiadomień został usunięty w całości
  (`.a-panel`, `.a-shade`, `.qs`, `.notif` w panelu). Rozwinięcie zawiera:
  - dwa cienkie suwaki (jasność, głośność) — tylko ikona + pasek,
  - **8 przełączników 4×2 jako same ikony** (Wi-Fi, Bluetooth, nie
    przeszkadzać, oszczędzanie, latarka, auto-obrót, samolot, przesyłanie),
    bez podpisów: włączony = wypełniony jasny kwadrat,
  - pasek powiadomień jako **same ikony aplikacji z kropką** (treść w tooltipie).
- Cała rozwijanka ma ~130 px wysokości i mieści się w 292 px szerokości
  makiety telefonu; zamyka ją klik w tło, ponowny klik w wyspę, gest
  „wstecz” (od lewej krawędzi) albo **Esc**.
- **Prawa strona**: szukaj (szuflada z filtrowaniem) i status
  (zasięg, Wi-Fi, bateria).
- **Stopka wyspy**: trzy ikony bez tekstu — kłódka (zablokuj ekran),
  lupa (szukaj w szufladzie) i siatka (wszystkie aplikacje).
- **Ekrany blokady** telefonu i tabletu są widoczne **od pierwszego otwarcia**
  (wcześniej start automatycznie je odblokowywał). Blokada wraca kłódką
  w wyspie albo `lumino.lockScreen()`.

### Telefon: nowe sterowanie gestami (zamiast ostatnich zadań)
Zamiast systemowego ekranu „ostatnich zadań” telefon ma **pływający, szklany
pasek w stylu macOS** z ostatnio używanymi aplikacjami (`js/gestures.js` +
`css/activity.css`). Pasek jest oderwany od wszystkich krawędzi (8 px z boków,
12 px od dołu), ma 24 px zaokrąglenia, jasną mgłę, `backdrop-filter: blur(26px)`
i miękką krawędź 1 px — unosi się nad tapetą zamiast być przyklejonym do dołu.
Nie ma już nagłówka z tekstem: tylko karty aplikacji (ikona + nazwa) i grabber.

| Gest | Efekt |
|---|---|
| przesunięcie **w górę od dolnej krawędzi** | wysuwa się pływający, szklany pasek ostatnich aplikacji (podąża za palcem) |
| przesunięcie **w górę na pasku** | ekran główny |
| przesunięcie **w dół** | schowanie paska |
| przesunięcie **od lewej krawędzi** | wstecz (zamyka aplikację / skróty wyspy) |
| przesunięcie **od prawej krawędzi** | ekran główny |
| kółko / przeciąganie / strzałki ‹ › | przewijanie paska w poziomie |
| ✕ na karcie | zamknięcie aplikacji + **„Cofnij”** (4 s) |

Pasek trzyma do 8 ostatnich aplikacji (bez duplikatów, kolejność jak w systemie),
karty mają prawdziwe ikony i podpisy. Cały ruch idzie na `transform`/`opacity`
przez wspólny scheduler (`js/perf.js`), więc nie gubi klatek.

### Tablet: komplet aplikacji na jednym ekranie
`14` aplikacji w siatce **5 kolumn** + 3 kompaktowe widgety w jednym rzędzie.
Siatka trzyma się w ramce (sprawdzane testem `tools/layout-check.js`), a pełna
lista aplikacji jest w szufladzie (pasek gestów).

### Tapety bez rozmycia i bez przyciemniania
Tapety są wstawiane jako czysty obraz (`center / cover`), bez nakładanych gradientów
i **bez `backdrop-filter`** — jedyne rozmycie w całym interfejsie występuje
w w grafikach ikon (`assets/icons/`). Czytelność białego tekstu zapewniają
wyłącznie cienie tekstu (`text-shadow`).

| Ekran | Plik |
|---|---|
| Pulpit i blokada laptopa | `assets/wallpaper-desktop.jpg`, `assets/wallpaper-lock.jpg` |
| Ekran główny i blokada tabletu | `assets/wallpaper-tablet-home.jpg`, `assets/wallpaper-tablet-lock.jpg` |
| Ekran główny i blokada telefonu | `assets/wallpaper-phone-home.jpg`, `assets/wallpaper-phone-lock.jpg` |

### Serwer bez cache
`tools/serve.py` wysyła `Cache-Control: no-store`, więc **każde odświeżenie pokazuje
najnowszą wersję** — bez `Ctrl+Shift+R`. Uruchomienie: `npm start`.

## Rozwiązywanie problemów

- **Pusta scena po wybraniu „Telefon / Tablet / Laptop”** — naprawione (selektory
  widoków korzystają z klas `device--phone/tablet/laptop`). Jeśli nadal widzisz stary
  stan, odśwież z pominięciem cache: `Ctrl+Shift+R` (albo `Cmd+Shift+R`).
- **Zmiany nie widać po aktualizacji** — serwer podglądu (`tools/serve.py`) wysyła
  `no-store`, więc wystarczy zwykłe odświeżenie. Dodatkowo pliki mają znacznik
  `?v=6` (podbijaj przy większych zmianach). Jeśli podgląd nadal pokazuje starą
  wersję: zamknij i otwórz panel podglądu ponownie albo `Ctrl+Shift+R`.
- **Coś się wysypuje** — na dole strony pojawia się czerwony pasek z treścią błędu
  (`js/guard.js`). Skopiuj jego treść i wyślij — to najszybsza droga do poprawki.
- **Testy**: `npm test` (interakcje, 45 sprawdzeń) oraz `npm run test:views`
  (kaskada CSS trybów pojedynczych).
