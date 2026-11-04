/* ============================================================
   LuminoOS — makiety: dane przykładowe + wspólne narzędzia
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const icon = (id, cls = "") => `<svg class="ico ${cls}"><use href="#${id}"/></svg>`;
  const fmtTime = (s) => {
    s = Math.max(0, Math.round(s));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  const parseDur = (d) => {
    const [m, s] = d.split(":").map(Number);
    return m * 60 + s;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------- przykładowe utwory ---------------- */
  const tracks = [
    { id: "t1", title: "Nocna Jazda", artist: "Mira Kova", album: "Neonowe Ulice", dur: "3:42", cover: "cv-1" },
    { id: "t2", title: "Szklane Miasto", artist: "Pola i Mróz", album: "Zimny Front", dur: "4:05", cover: "cv-2" },
    { id: "t3", title: "Lato w Krakowie", artist: "Bracia Wiatr", album: "Podróżni", dur: "3:18", cover: "cv-3" },
    { id: "t4", title: "Cisza nad Wisłą", artist: "Aster", album: "Rzeka", dur: "4:44", cover: "cv-4" },
    { id: "t5", title: "Białe Światło", artist: "Nova Sadko", album: "Spektrum", dur: "3:56", cover: "cv-5" },
    { id: "t6", title: "Zielony Sygnał", artist: "Kwant", album: "Sygnały", dur: "2:58", cover: "cv-6" },
    { id: "t7", title: "Pusty Peron", artist: "Mira Kova", album: "Neonowe Ulice", dur: "4:12", cover: "cv-7" },
    { id: "t8", title: "Obietnica", artist: "Dwie Wieże", album: "Noc", dur: "3:31", cover: "cv-8" },
    { id: "t9", title: "Satelita", artist: "Aster", album: "Orbita", dur: "5:02", cover: "cv-9" }
  ];

  /* ---------------- wspólny odtwarzacz ---------------- */
  const player = {
    tracks,
    index: 0,
    playing: false,
    elapsed: 0,
    shuffle: false,
    _subs: new Set(),
    _timer: null,

    get track() { return tracks[this.index]; },
    get duration() { return parseDur(this.track.dur); },
    get progress() { return this.duration ? this.elapsed / this.duration : 0; },

    subscribe(fn) { this._subs.add(fn); fn(this); return () => this._subs.delete(fn); },
    emit() { this._subs.forEach(fn => { try { fn(this); } catch (e) { /* ignoruj */ } }); },

    play(i) {
      if (typeof i === "number" && i >= 0 && i < tracks.length) {
        if (i !== this.index) this.elapsed = 0;
        this.index = i;
      }
      this.playing = true;
      this._start();
      this.emit();
    },
    pause() { this.playing = false; this._stop(); this.emit(); },
    toggle() { this.playing ? this.pause() : this.play(); },
    next() {
      this.index = this.shuffle
        ? Math.floor(Math.random() * tracks.length)
        : (this.index + 1) % tracks.length;
      this.elapsed = 0;
      if (this.playing) { this._start(); }
      this.emit();
    },
    prev() {
      if (this.elapsed > 3) { this.elapsed = 0; this.emit(); return; }
      this.index = (this.index - 1 + tracks.length) % tracks.length;
      this.elapsed = 0;
      this.emit();
    },
    seek(ratio) { this.elapsed = clamp(ratio, 0, 1) * this.duration; this.emit(); },
    toggleShuffle() { this.shuffle = !this.shuffle; this.emit(); },

    _start() {
      this._stop();
      this._timer = setInterval(() => {
        this.elapsed += 1;
        if (this.elapsed >= this.duration) {
          this.index = this.shuffle
            ? Math.floor(Math.random() * tracks.length)
            : (this.index + 1) % tracks.length;
          this.elapsed = 0;
        }
        this.emit();
      }, 1000);
    },
    _stop() { if (this._timer) clearInterval(this._timer); this._timer = null; }
  };

  /* ---------------- dane aplikacji Androida ---------------- */
  const androidApps = [
    { id: "phone", label: "Telefon", icon: "i-phone", color: "ic-green" },
    { id: "messages", label: "Wiadomości", icon: "i-message", color: "ic-blue", badge: 2 },
    { id: "spotify", label: "Spotify", icon: "i-spotify", color: "ic-spotify" },
    { id: "camera", label: "Aparat", icon: "i-camera", color: "ic-slate" },
    { id: "chrome", label: "Chrome", icon: "i-globe", color: "ic-sky" },
    { id: "gallery", label: "Zdjęcia", icon: "i-gallery", color: "ic-pink" },
    { id: "youtube", label: "YouTube", icon: "i-play", color: "ic-violet" },
    { id: "calendar", label: "Kalendarz", icon: "i-calendar", color: "ic-amber" },
    { id: "gmail", label: "Gmail", icon: "i-mail", color: "ic-red", badge: 4 },
    { id: "maps", label: "Mapy", icon: "i-maps", color: "ic-teal" },
    { id: "notes", label: "Notatki", icon: "i-notes", color: "ic-yellow" },
    { id: "calculator", label: "Kalkulator", icon: "i-calc", color: "ic-black" },
    { id: "files", label: "Pliki", icon: "i-files", color: "ic-indigo" },
    { id: "settings", label: "Ustawienia", icon: "i-settings", color: "ic-gray" }
  ];
  const appById = (id) => androidApps.find(a => a.id === id);

  /* ---------------- powiadomienia ---------------- */
  const notifications = [
    { app: "messages", title: "Marta", text: "Widzimy się o 18:00? 😊", time: "2 min" },
    { app: "spotify", title: "Spotify", text: "Nowy album: Mira Kova — Neonowe Ulice", time: "24 min" },
    { app: "gmail", title: "Gmail", text: "2 nowe wiadomości od zespołu Lumino", time: "1 godz." },
    { app: "calendar", title: "Kalendarz", text: "13:30 — Spotkanie z zespołem", time: "3 godz." }
  ];



  /* ---------------- ikony: liquid glass (bez kolorowych płytek) ----------------
     Każda ikona to przezroczysty, szklany kwadrat (squircle), a w środku
     kolorowy glif marki. Kolor glifu ustawia --ink.
     ------------------------------------------------------------------------- */
  const SV = (body, extra = "") => `<svg viewBox="0 0 24 24" ${extra}>${body}</svg>`;

  const BRAND = {
    phone: { g1: "#7BF0A8", g2: "#0C9B54", glyph: SV(
      '<path fill="currentColor" d="M6.6 3h2.2c.5 0 .9.3 1 .8l.9 3.3c.1.4 0 .8-.4 1l-1.4 1a12 12 0 0 0 5.9 5.9l1-1.4c.2-.3.6-.5 1-.4l3.3.9c.5.1.8.5.8 1v2.2c0 1.3-1.1 2.4-2.4 2.2C10.5 19.9 4.1 13.5 3.4 5.4 3.2 4.1 4.3 3 5.6 3Z"/>') },

    messages: { g1: "#8CC8FF", g2: "#1B5AD6", glyph: SV(
      '<path fill="currentColor" d="M4 5.6A2.6 2.6 0 0 1 6.6 3h10.8A2.6 2.6 0 0 1 20 5.6v7.8a2.6 2.6 0 0 1-2.6 2.6H9.2l-3.8 3.4c-.6.5-1.4.1-1.4-.7V5.6Z"/>'
      + '<g fill="rgba(10,20,40,.45)"><circle cx="9" cy="9" r="1"/><circle cx="12" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></g>') },

    spotify: { g1: "#7CF5A8", g2: "#0E9E4E", glyph: SV(
      '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">'
      + '<path d="M5.4 8.3c4.6-1.5 9.9-.9 13.4 1.5"/>'
      + '<path d="M6.5 12.4c3.8-1.1 8-.6 11 1.4"/>'
      + '<path d="M7.6 16.4c2.9-.9 6.1-.5 8.4 1"/></g>') },

    camera: { g1: "#C9D4E6", g2: "#3A4356", glyph: SV(
      '<rect x="2.4" y="6" width="19.2" height="12.8" rx="3.4" fill="currentColor"/>'
      + '<circle cx="12" cy="12.4" r="3.7" fill="none" stroke="rgba(12,18,30,.6)" stroke-width="1.9"/>'
      + '<circle cx="12" cy="12.4" r="1.5" fill="rgba(12,18,30,.55)"/>'
      + '<circle cx="18.2" cy="9.2" r="1" fill="rgba(12,18,30,.5)"/>') },

    chrome: { g1: "#FFE08A", g2: "#E0452B", glyph: SV(
      '<g fill="none" stroke-width="3.1">'
      + '<circle cx="12" cy="12" r="9.1" stroke="#ea4335" stroke-dasharray="19.1 38.1"/>'
      + '<circle cx="12" cy="12" r="9.1" stroke="#fbbc04" stroke-dasharray="19.1 38.1" stroke-dashoffset="-19.1"/>'
      + '<circle cx="12" cy="12" r="9.1" stroke="#34a853" stroke-dasharray="19.1 38.1" stroke-dashoffset="-38.2"/>'
      + '</g><circle cx="12" cy="12" r="4.9" fill="rgba(255,255,255,.92)"/><circle cx="12" cy="12" r="2.5" fill="#4285f4"/>') },

    gallery: { g1: "#FFB8D0", g2: "#C42E70", glyph: SV(
      '<g fill="none" stroke-width="3.3" stroke-linecap="round">'
      + '<path d="M12 3.2a8.8 8.8 0 0 1 8.8 8.8" stroke="#4285f4"/>'
      + '<path d="M20.8 12a8.8 8.8 0 0 1-8.8 8.8" stroke="#34a853"/>'
      + '<path d="M12 20.8A8.8 8.8 0 0 1 3.2 12" stroke="#fbbc04"/>'
      + '<path d="M3.2 12A8.8 8.8 0 0 1 12 3.2" stroke="#ea4335"/>'
      + '</g>') },

    youtube: { g1: "#FF9A9A", g2: "#D40000", glyph: SV(
      '<rect x="2" y="5.4" width="20" height="13.2" rx="4.2" fill="#ff2d55"/>'
      + '<path d="M10.2 8.8 15.8 12l-5.6 3.2V8.8Z" fill="#fff"/>') },

    calendar: { g1: "#FFFFFF", g2: "#DCE6F7", glyph: SV(
      '<rect x="3.5" y="4.3" width="17" height="16.2" rx="3.6" fill="rgba(255,255,255,.94)"/>'
      + '<path d="M3.5 7.9a3.6 3.6 0 0 1 3.6-3.6h9.8a3.6 3.6 0 0 1 3.6 3.6v.6H3.5V7.9Z" fill="currentColor"/>'
      + '<text class="lu-day" x="12" y="17.6" text-anchor="middle" font-size="6.6" font-weight="700" fill="#1a73e8">4</text>') },

    gmail: { g1: "#FFFFFF", g2: "#E8EEF8", glyph: SV(
      '<path fill="#ea4335" d="M3 7.6 12 14.2l9-6.6V7L12 13.6 3 7v.6Z"/>'
      + '<path fill="#c5221f" d="M3 7.6 12 14.2l9-6.6V6.2a1.7 1.7 0 0 0-2.6-1.4L12 9.7 5.6 4.8A1.7 1.7 0 0 0 3 6.2v1.4Z"/>'
      + '<path fill="#4285f4" d="M3 8.4V18h3.3v-6.6L3 8.4Z"/>'
      + '<path fill="#34a853" d="M21 8.4V18h-3.3v-6.6L21 8.4Z"/>'
      + '<path fill="#fbbc04" d="M6.3 11.4V18h3.1v-4.4l-3.1-2.2Z"/>'
      + '<path fill="#34a853" d="M17.7 11.4V18h-3.1v-4.4l3.1-2.2Z"/>') },

    maps: { g1: "#9BF3D4", g2: "#12876A", glyph: SV(
      '<path fill="currentColor" d="M12 2.3a7 7 0 0 0-7 7c0 5.3 7 12.4 7 12.4s7-7.1 7-12.4a7 7 0 0 0-7-7Z"/>'
      + '<circle cx="12" cy="9.2" r="2.7" fill="rgba(8,20,16,.85)"/>') },

    notes: { g1: "#FFE7A6", g2: "#D99A00", glyph: SV(
      '<rect x="4.6" y="3.2" width="14.8" height="17.6" rx="2.8" fill="currentColor"/>'
      + '<g stroke="rgba(20,14,0,.45)" stroke-width="1.7" stroke-linecap="round">'
      + '<path d="M8.2 8.4h7.6"/><path d="M8.2 12h7.6"/><path d="M8.2 15.6h4.8"/></g>') },

    calculator: { g1: "#8A94A8", g2: "#1E2330", glyph: SV(
      '<rect x="4.4" y="2.6" width="15.2" height="18.8" rx="3.4" fill="none" stroke="currentColor" stroke-width="1.7"/>'
      + '<rect x="7" y="5.4" width="10" height="3.1" rx="1" fill="currentColor"/>'
      + '<g fill="currentColor"><circle cx="8.7" cy="12.3" r="1.1"/><circle cx="12" cy="12.3" r="1.1"/><circle cx="15.3" cy="12.3" r="1.1"/>'
      + '<circle cx="8.7" cy="15.9" r="1.1"/><circle cx="12" cy="15.9" r="1.1"/><circle cx="15.3" cy="15.9" r="1.1"/>'
      + '<circle cx="8.7" cy="19.1" r="1.1"/><circle cx="12" cy="19.1" r="1.1"/></g>') },

    files: { g1: "#9CC9FF", g2: "#1553B8", glyph: SV(
      '<path fill="currentColor" d="M3 6.4A2.3 2.3 0 0 1 5.3 4.1h4.5l2 2.4h6.9A2.3 2.3 0 0 1 21 8.8v8.5a2.3 2.3 0 0 1-2.3 2.3H5.3A2.3 2.3 0 0 1 3 17.3V6.4Z"/>') },

    settings: { g1: "#C7D0E2", g2: "#4A5162", glyph: SV(
      '<path fill="currentColor" d="m10.3 2h3.4l.5 2.3c.6.2 1.1.5 1.6.9l2.2-.9 2.4 2.4-.9 2.2c.4.5.7 1 .9 1.6l2.3.5v3.4l-2.3.5c-.2.6-.5 1.1-.9 1.6l.9 2.2-2.4 2.4-2.2-.9c-.5.4-1 .7-1.6.9l-.5 2.3h-3.4l-.5-2.3c-.6-.2-1.1-.5-1.6-.9l-2.2.9L4 18.9l.9-2.2c-.4-.5-.7-1-.9-1.6L1.7 14.6v-3.4L4 10.7c.2-.6.5-1.1.9-1.6L4 6.9l2.4-2.4 2.2.9c.5-.4 1-.7 1.6-.9L10.3 2Zm1.7 6.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z"/>') },

    store: { g1: "#FFFFFF", g2: "#E9F1FB", glyph: SV(
      '<path d="M5.2 2.9 21 11.4c.7.4.7 1.4 0 1.8L5.2 21.7c-.7.4-1.6-.1-1.6-.9V3.8c0-.8.9-1.3 1.6-.9Z" fill="none"/>'
      + '<path d="M5 2.6 12.4 12 5 21.4c-.7-.1-1.2-.6-1.2-1.4V4c0-.8.5-1.3 1.2-1.4Z" fill="#00c3ff"/>'
      + '<path d="M12.4 12 19.8 2.9c.5.3.8.8.8 1.4v15.4c0 .6-.3 1.1-.8 1.4L12.4 12Z" fill="#00e676"/>'
      + '<path d="M12.4 12 20 11.4c.7.4.7 1.4 0 1.8l-7.6 1.4V12Z" fill="#ffca28" opacity=".9"/>') },

    youtubeMusic: { g1: "#FF9A9A", g2: "#D40000", glyph: SV(
      '<circle cx="12" cy="12" r="9.1" fill="none" stroke="#ff2d55" stroke-width="2.2"/>'
      + '<path d="M10.1 8.7 16 12l-5.9 3.3V8.7Z" fill="#ff2d55"/>') }
  };

  /* Ikony to gotowe grafiki (assets/icons/<id>.png) generowane przez
     tools/make-icons.js — wyglądają jak ikony Apple w każdej przeglądarce. */
  const ICON_V = "5";
  const ICON_IDS = ["phone","messages","spotify","camera","chrome","gallery",
    "youtube","calendar","gmail","maps","notes","calculator","files",
    "settings","store","youtubeMusic","search","weather","terminal","clock","trash"];

  /** <i> z ikoną aplikacji (tło = PNG, bez glifów w HTML) */
  function iconImg(id, extra = "") {
    const key = ICON_IDS.includes(id) ? id : "settings";
    /* „sm” = mniejsza ikona w liście/powiadomieniu; rozmiar ustawia CSS */
    const cls = extra ? `app__icon bi ${extra === "sm" ? "bi--sm" : extra}` : "app__icon bi";
    /* UWAGA: adres podajemy wprost w background-image — url() ukryty w zmiennej
       CSS był rozwiązywany względem pliku .css (css/assets/...), przez co ikony
       w ogóle się nie wczytywały. */
    const style = `background-image:url('assets/icons/${key}.png?v=${ICON_V}')`;
    return `<i class="${cls}" style="${style}" aria-hidden="true"></i>`;
  }

  function brandIcon(id) { return iconImg(id); }

  window.Lumino = { $, $$, icon, iconImg, fmtTime, parseDur, clamp, player, tracks, androidApps, appById, notifications, brandIcon, BRAND };
})();
