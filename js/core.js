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


  /* ---------------- brandowe ikony aplikacji (styl Android/Pixel) ---------------- */
  const BRAND = {
    phone: { bg: "#0f9d58", shape: "squircle", glyph: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M6.6 3h2.2c.5 0 .9.3 1 .8l.9 3.3c.1.4 0 .8-.4 1l-1.4 1a12 12 0 0 0 5.9 5.9l1-1.4c.2-.3.6-.5 1-.4l3.3.9c.5.1.8.5.8 1v2.2c0 1.3-1.1 2.4-2.4 2.2C10.5 19.9 4.1 13.5 3.4 5.4 3.2 4.1 4.3 3 5.6 3Z"/></svg>' },
    messages: { bg: "#1a73e8", shape: "squircle", glyph: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.6c-.6.6-1.6.1-1.6-.7V5.5Z"/></svg>' },
    spotify: { bg: "#1ed760", shape: "circle", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="#04150a" stroke-width="2" stroke-linecap="round"><path d="M5.5 8.4c4.5-1.4 9.6-.9 13 1.4"/><path d="M6.6 12.5c3.7-1.1 7.8-.6 10.7 1.3"/><path d="M7.7 16.4c2.9-.9 6-.5 8.2 1"/></svg>' },
    camera: { bg: "#2b2f36", shape: "squircle", glyph: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="13" rx="3" fill="#fff"/><circle cx="12" cy="12.5" r="4" fill="#2b2f36"/><circle cx="12" cy="12.5" r="2.1" fill="#8ab4f8"/><circle cx="18.4" cy="9" r=".9" fill="#2b2f36"/></svg>' },
    chrome: { bg: "#fff", shape: "circle", css: "chrome", glyph: "" },
    gallery: { bg: "#fff", shape: "circle", css: "photos", glyph: "" },
    youtube: { bg: "#ff0000", shape: "squircle", glyph: '<svg viewBox="0 0 24 24"><rect x="1.5" y="5" width="21" height="14" rx="4.2" fill="#fff"/><path d="M10 8.6 16 12l-6 3.4V8.6Z" fill="#ff0000"/></svg>' },
    calendar: { bg: "#fff", shape: "squircle", css: "gcal", glyph: '<span class="cal-day">4</span>' },
    gmail: { bg: "#fff", shape: "squircle", css: "gmail", glyph: '<svg viewBox="0 0 24 24"><path fill="#ea4335" d="M2.5 6.2 12 13.4l9.5-7.2v2.6L12 16 2.5 8.8V6.2Z"/><path fill="#c5221f" d="M2.5 6.2 12 13.4l9.5-7.2-.1-1.1c-.1-1.2-1.4-1.9-2.4-1.2L12 9.3 4.9 3.9C3.9 3.2 2.6 3.9 2.5 5.1v1.1Z"/><path fill="#4285f4" d="M2.5 8.8V19h3.4v-7.4L2.5 8.8Z"/><path fill="#34a853" d="M21.5 8.8V19h-3.4v-7.4l3.4-2.8Z"/></svg>' },
    maps: { bg: "#fff", shape: "squircle", css: "gmaps", glyph: '<svg viewBox="0 0 24 24"><path fill="#34a853" d="M12 2a7.4 7.4 0 0 0-7.4 7.4C4.6 15 12 22 12 22s7.4-7 7.4-12.6A7.4 7.4 0 0 0 12 2Z"/><path fill="#fff" d="M12 6.2a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"/><path fill="#4285f4" d="M12 2v4.6a3.2 3.2 0 0 1 0 6.4V22s7.4-7 7.4-12.6A7.4 7.4 0 0 0 12 2Z" opacity=".85"/></svg>' },
    notes: { bg: "#fbbc04", shape: "squircle", glyph: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2.4" fill="#fff8e1"/><rect x="7" y="7" width="10" height="1.8" rx=".9" fill="#f9ab00"/><rect x="7" y="11" width="10" height="1.8" rx=".9" fill="#f9ab00"/><rect x="7" y="15" width="6" height="1.8" rx=".9" fill="#f9ab00"/></svg>' },
    calculator: { bg: "#202124", shape: "squircle", glyph: '<svg viewBox="0 0 24 24"><rect x="4" y="2.5" width="16" height="19" rx="3" fill="#3c4043"/><rect x="7" y="5.5" width="10" height="3.4" rx="1" fill="#8ab4f8"/><g fill="#e8eaed"><circle cx="8.8" cy="12.6" r="1.2"/><circle cx="12" cy="12.6" r="1.2"/><circle cx="15.2" cy="12.6" r="1.2"/><circle cx="8.8" cy="16.4" r="1.2"/><circle cx="12" cy="16.4" r="1.2"/><circle cx="15.2" cy="16.4" r="1.2"/><circle cx="8.8" cy="19.8" r="1.2"/><circle cx="12" cy="19.8" r="1.2"/></g><circle cx="15.2" cy="19.8" r="1.2" fill="#8ab4f8"/></svg>' },
    files: { bg: "#1a73e8", shape: "squircle", glyph: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M3 6a2 2 0 0 1 2-2h4.6l2 2.4H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/></svg>' },
    settings: { bg: "#5f6368", shape: "circle", glyph: '<svg viewBox="0 0 24 24"><path fill="#e8eaed" d="m10.3 2h3.4l.5 2.3c.6.2 1.1.5 1.6.9l2.2-.9 2.4 2.4-.9 2.2c.4.5.7 1 .9 1.6l2.3.5v3.4l-2.3.5c-.2.6-.5 1.1-.9 1.6l.9 2.2-2.4 2.4-2.2-.9c-.5.4-1 .7-1.6.9l-.5 2.3h-3.4l-.5-2.3c-.6-.2-1.1-.5-1.6-.9l-2.2.9L4 18.9l.9-2.2c-.4-.5-.7-1-.9-1.6L1.7 14.6v-3.4L4 10.7c.2-.6.5-1.1.9-1.6L4 6.9l2.4-2.4 2.2.9c.5-.4 1-.7 1.6-.9L10.3 2Zm1.7 6.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z"/></svg>' },
    store: { bg: "#fff", shape: "squircle", css: "store", glyph: '<span class="play-mark"></span>' },
    youtubeMusic: { bg: "#ff0000", shape: "circle", glyph: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fff"/><path d="M10 8.6 16 12l-6 3.4V8.6Z" fill="#ff0000"/></svg>' }
  };

  function brandIcon(id) {
    const b = BRAND[id] || BRAND.settings;
    const cls = ["app__icon", "bi", b.shape === "circle" ? "bi--circle" : "", b.css ? "bi-" + b.css : ""].join(" ");
    return `<span class="${cls}" style="--bg:${b.bg}">${b.glyph}</span>`;
  }

  window.Lumino = { $, $$, icon, fmtTime, parseDur, clamp, player, tracks, androidApps, appById, notifications, brandIcon };
})();
