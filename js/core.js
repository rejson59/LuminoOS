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



  /* ---------------- szklane, nowoczesne ikony aplikacji ---------------- */
  const SV = (body, extra = "") =>
    `<svg viewBox="0 0 24 24" ${extra}>${body}</svg>`;

  const BRAND = {
    phone: { g: "linear-gradient(150deg,#5ce1a0,#0f9d58 58%,#0a6b3d)", glyph:
      SV('<path fill="rgba(255,255,255,.96)" d="M6.6 3h2.2c.5 0 .9.3 1 .8l.9 3.3c.1.4 0 .8-.4 1l-1.4 1a12 12 0 0 0 5.9 5.9l1-1.4c.2-.3.6-.5 1-.4l3.3.9c.5.1.8.5.8 1v2.2c0 1.3-1.1 2.4-2.4 2.2C10.5 19.9 4.1 13.5 3.4 5.4 3.2 4.1 4.3 3 5.6 3Z"/>') },
    messages: { g: "linear-gradient(150deg,#7cc4ff,#1a73e8 60%,#123f8f)", glyph:
      SV('<path fill="rgba(255,255,255,.96)" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.6c-.6.6-1.6.1-1.6-.7V5.5Z"/>') },
    spotify: { r: "50%", g: "linear-gradient(150deg,#6ef79a,#1ed760 55%,#0d7a35)", glyph:
      SV('<g fill="none" stroke="rgba(4,21,10,.92)" stroke-width="2" stroke-linecap="round"><path d="M5.5 8.4c4.5-1.4 9.6-.9 13 1.4"/><path d="M6.6 12.5c3.7-1.1 7.8-.6 10.7 1.3"/><path d="M7.7 16.4c2.9-.9 6-.5 8.2 1"/></g>') },
    camera: { g: "linear-gradient(150deg,#8ea2c4,#3a4356 58%,#1b2029)", glyph:
      SV('<rect x="2" y="6" width="20" height="13" rx="3.4" fill="rgba(255,255,255,.95)"/><circle cx="12" cy="12.5" r="4" fill="#2b2f36"/><circle cx="12" cy="12.5" r="2.1" fill="#9dc4ff"/><circle cx="18.3" cy="9" r=".9" fill="#2b2f36"/>') },
    chrome: { r: "50%", g: "conic-gradient(from -30deg,#ff7a6e 0 33%,#ffd166 33% 66%,#5ce1a0 66% 100%)", glyph:
      SV('<circle cx="12" cy="12" r="5.1" fill="rgba(255,255,255,.96)"/><circle cx="12" cy="12" r="2.6" fill="#4a90ff"/>', 'class="lu-chrome"') },
    gallery: { r: "50%", g: "conic-gradient(from 0deg,#8ec5ff 0 25%,#ff9db4 25% 50%,#ffd166 50% 75%,#7ef0c8 75% 100%)", glyph:
      SV('<circle cx="12" cy="12" r="6.6" fill="rgba(255,255,255,.9)"/><circle cx="12" cy="12" r="2.6" fill="rgba(255,255,255,0)"/>') },
    youtube: { g: "linear-gradient(150deg,#ff7a7a,#ff0000 60%,#b30000)", glyph:
      SV('<rect x="1.5" y="5" width="21" height="14" rx="4.4" fill="rgba(255,255,255,.96)"/><path d="M10 8.8 15.8 12 10 15.2V8.8Z" fill="#e00000"/>') },
    calendar: { g: "linear-gradient(150deg,#fff,#eef2fb)", glyph:
      `<span class="cal-day">4</span>` , cls: "lu-cal" },
    gmail: { g: "linear-gradient(150deg,#fff,#eef2fb)", glyph:
      SV('<path fill="#ea4335" d="M3 7.4 12 14l9-6.6V7L12 13.6 3 7v.4Z"/><path fill="#c5221f" d="M3 7.4 12 14l9-6.6V6a1.6 1.6 0 0 0-2.5-1.3L12 9.6 5.5 4.7A1.6 1.6 0 0 0 3 6v1.4Z"/><path fill="#4285f4" d="M3 8.2V18h3.2v-6.6L3 8.2Z"/><path fill="#34a853" d="M21 8.2V18h-3.2v-6.6L21 8.2Z"/>'),
      cls: "lu-gmail" },
    maps: { g: "linear-gradient(150deg,#7ef0c8,#2fa87a 55%,#1a6b52)", glyph:
      SV('<path fill="rgba(255,255,255,.96)" d="M12 2.6a6.9 6.9 0 0 0-6.9 6.9C5.1 14.6 12 21.4 12 21.4s6.9-6.8 6.9-11.9A6.9 6.9 0 0 0 12 2.6Z"/><circle cx="12" cy="9.4" r="2.7" fill="#2fa87a"/>') },
    notes: { g: "linear-gradient(150deg,#ffe9a8,#fbbc04 58%,#d09300)", glyph:
      SV('<rect x="4.2" y="3" width="15.6" height="18" rx="2.6" fill="rgba(255,255,255,.94)"/><g fill="#e0a800"><rect x="7" y="7.2" width="10" height="1.7" rx=".85"/><rect x="7" y="11" width="10" height="1.7" rx=".85"/><rect x="7" y="14.8" width="6.4" height="1.7" rx=".85"/></g>') },
    calculator: { g: "linear-gradient(150deg,#5a6376,#2b3040 60%,#151922)", glyph:
      SV('<rect x="4.5" y="2.8" width="15" height="18.4" rx="3.2" fill="rgba(255,255,255,.14)"/><rect x="7" y="5.4" width="10" height="3.2" rx="1" fill="rgba(150,200,255,.95)"/><g fill="rgba(255,255,255,.9)"><circle cx="8.8" cy="12.4" r="1.15"/><circle cx="12" cy="12.4" r="1.15"/><circle cx="15.2" cy="12.4" r="1.15"/><circle cx="8.8" cy="16" r="1.15"/><circle cx="12" cy="16" r="1.15"/><circle cx="8.8" cy="19.2" r="1.05"/><circle cx="12" cy="19.2" r="1.05"/></g><circle cx="15.2" cy="16" r="1.15" fill="rgba(150,200,255,.95)"/>') },
    files: { g: "linear-gradient(150deg,#8fc6ff,#1a73e8 58%,#0f4bb0)", glyph:
      SV('<path fill="rgba(255,255,255,.96)" d="M3 6.4A2.2 2.2 0 0 1 5.2 4.2h4.4l2 2.4h7.2A2.2 2.2 0 0 1 21 8.8v8.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.4V6.4Z"/>') },
    settings: { r: "50%", g: "linear-gradient(150deg,#aab4c8,#5f6368 58%,#33383f)", glyph:
      SV('<path fill="rgba(255,255,255,.95)" d="m10.3 2h3.4l.5 2.3c.6.2 1.1.5 1.6.9l2.2-.9 2.4 2.4-.9 2.2c.4.5.7 1 .9 1.6l2.3.5v3.4l-2.3.5c-.2.6-.5 1.1-.9 1.6l.9 2.2-2.4 2.4-2.2-.9c-.5.4-1 .7-1.6.9l-.5 2.3h-3.4l-.5-2.3c-.6-.2-1.1-.5-1.6-.9l-2.2.9L4 18.9l.9-2.2c-.4-.5-.7-1-.9-1.6L1.7 14.6v-3.4L4 10.7c.2-.6.5-1.1.9-1.6L4 6.9l2.4-2.4 2.2.9c.5-.4 1-.7 1.6-.9L10.3 2Zm1.7 6.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z"/>') },
    store: { g: "linear-gradient(150deg,#fff,#eaf1fb)", glyph:
      SV('<path d="M4.4 3.2 20 11.4c.6.3.6 1 0 1.3L4.4 20.8c-.5.2-.9-.1-.9-.6V3.8c0-.5.4-.8.9-.6Z" fill="#00c3ff"/><path d="M4.4 3.2 13 12 4.4 20.8c-.5.2-.9-.1-.9-.6V3.8c0-.5.4-.8.9-.6Z" fill="#00e676"/><path d="M4.4 3.2 9.4 6 8 12l-3.6-8.8Z" fill="#ffca28"/>'),
      cls: "lu-store" },
    youtubeMusic: { r: "50%", g: "linear-gradient(150deg,#ff7a7a,#ff0000 60%,#b30000)", glyph:
      SV('<circle cx="12" cy="12" r="8.4" fill="rgba(255,255,255,.14)"/><circle cx="12" cy="12" r="3.2" fill="rgba(255,255,255,.95)"/><path d="M10.8 9.6 15 12l-4.2 2.4V9.6Z" fill="#e00000"/>') }
  };

  function brandIcon(id) {
    const b = BRAND[id] || BRAND.settings;
    const cls = ["app__icon", "bi"];
    if (b.r) cls.push("bi--circle");
    if (b.cls) cls.push(b.cls);
    return `<span class="${cls.join(" ")}" style="--bg:${b.g}">${b.glyph}</span>`;
  }

  window.Lumino = { $, $$, icon, fmtTime, parseDur, clamp, player, tracks, androidApps, appById, notifications, brandIcon };
})();
