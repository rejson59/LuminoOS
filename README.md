# LuminoOS

System operacyjny dla telefonu, tabletu i laptopa — projekt w toku.

## Etap 1 — makiety poglądowe (gotowe)

Statyczna strona HTML/CSS/JS pokazująca trzy urządzenia w znanym, „domyślnym” wyglądzie:

| Urządzenie | Wygląd startowy | Co pokazuje makieta |
|---|---|---|
| 📱 Telefon | Android 15 (Material You) | pasek stanu, zegar, siatka 4×3, dock, pasek gestów, kropki stron |
| 💻 Tablet | Android 15 | widgety (pogoda, kalendarz), siatka 6 kolumn, wyszukiwanie, dock |
| 🖥️ Laptop | Windows 11 | tapeta, ikony pulpitu, okno Eksploratora plików, pasek zadań, menu Start |

### Uruchomienie

Bez kompilacji i zależności — wystarczy otworzyć `index.html` w przeglądarce
albo uruchomić lokalny serwer:

```bash
python3 -m http.server 5173
# → http://localhost:5173
```

### Interakcje w podglądzie

- kliknięcie urządzenia — wyróżnia je (reszta przygasa), `Esc` lub dwuklik wraca do całości,
- w laptopie przycisk Start otwiera/zamyka menu Start,
- zegar i data są aktualne (czas lokalny),
- layout skaluje się od szerokiego ekranu do telefonu.

### Pliki

```
index.html   – struktura makiety + sprite ikon SVG
styles.css   – ramki urządzeń, style Androida i Windows 11, responsywność
app.js       – zegar, wyróżnianie urządzeń, menu Start, mikro-animacje
```

## Etap 2 — do ustalenia

Kierunek wizualny LuminoOS (kolory, typografia, ikony), zachowanie powłoki
(gesty, powiadomienia, okna, synchronizacja między urządzeniami) oraz zakres
pierwszego działającego prototypu. Makiety z etapu 1 są punktem odniesienia —
podmieniamy je kolejno, zaczynając od telefonu.
