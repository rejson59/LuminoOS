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
css/android.css     – Android: blokada, launcher, panel, aplikacje, Spotify
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

## Rozwiązywanie problemów

- **Pusta scena po wybraniu „Telefon / Tablet / Laptop”** — naprawione (selektory
  widoków korzystają z klas `device--phone/tablet/laptop`). Jeśli nadal widzisz stary
  stan, odśwież z pominięciem cache: `Ctrl+Shift+R` (albo `Cmd+Shift+R`).
- **Zmiany nie widać po aktualizacji** — pliki CSS/JS mają znacznik `?v=3`;
  podbij go przy większych zmianach, żeby przeglądarka pobrała nową wersję.
- **Coś się wysypuje** — na dole strony pojawia się czerwony pasek z treścią błędu
  (`js/guard.js`). Skopiuj jego treść i wyślij — to najszybsza droga do poprawki.
- **Testy**: `npm test` (interakcje, 45 sprawdzeń) oraz `npm run test:views`
  (kaskada CSS trybów pojedynczych).
