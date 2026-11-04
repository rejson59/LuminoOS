# LuminoOS

System operacyjny dla telefonu, tabletu i laptopa — projekt w toku.

## Etap 1 — makiety poglądowe (gotowe)

Statyczna strona pokazująca trzy urządzenia w znanym, „domyślnym” wyglądzie:
telefon i tablet jak **Android 15**, laptop jak **Windows 11**.

## Etap 2 — makiety interaktywne (ten etap)

Makiety przestały być obrazkami — to klikalne powłoki z prawdziwą logiką w JS.

### Telefon i tablet (Android)
- **Ekran blokady** — zegar, powiadomienia, skrót do aparatu/latarki; odblokowanie kliknięciem lub przeciągnięciem w górę.
- **Launcher** — dwie strony z przewijaniem, kropki stron, dock, pasek gestów.
- **Panel powiadomień** — klik w pasek stanu; 6–8 szybkich ustawień (przełączają się), suwaki jasności i głośności, lista powiadomień, „Zablokuj”.
- **Szuflada aplikacji** — wszystkie aplikacje, otwierana paskiem gestów.
- **Aplikacje**:
  - **Spotify** — listę 9 przykładowych utworów, odtwarzanie/pauza, następny/poprzedni, losowo, postęp, pełny ekran odtwarzacza z okładką i suwakiem;
  - **Wiadomości** — lista wątków, rozmowa, wysyłanie (z symulowaną odpowiedzią);
  - **Kalkulator** — naprawdę liczy (podstawa, %, ±, backspace);
  - **Ustawienia** — przełączniki, grupy, profil;
  - **Notatki**, **Kalendarz** (prawdziwy miesiąc z dzisiejszą datą), **Zdjęcia**, **Aparat**, **Chrome** — makiety z treścią;
  - pozostałe (Gmail, Mapy, Pliki, Telefon, YouTube) — ekrany „do zaprojektowania”.

### Laptop (Windows 11)
- **Okna** — przeciąganie za pasek tytułu, minimalizacja, maksymalizacja, zamykanie, fokus/nieaktywne.
- **Menu Start** — wyszukiwanie filtrujące aplikacje, przypięte, polecane, profil.
- **Pasek zadań** — wskaźniki uruchomionych aplikacji, zegar z datą, taca.
- **Aplikacje**: Eksplorator plików (nawigacja po folderach, zaznaczanie plików), Spotify (ta sama playlista, ten sam stan odtwarzania), Ustawienia, Notatnik (prawdziwy tekst), Kalkulator, Pogoda, Edge, Store.
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
js/page.js          – start strony i spięcie urządzeń
tools/smoke-test.js – test dymny w jsdom
```

## Etap 3 — do ustalenia

Kierunek wizualny LuminoOS (kolory, typografia, ikony), nazwy i układ aplikacji,
zachowanie powłoki (gesty, powiadomienia, okna) oraz to, co ma być **wspólne**
między urządzeniami. Wtedy podmieniamy makiety — zaczynając od telefonu.
