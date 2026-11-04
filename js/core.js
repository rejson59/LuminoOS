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

  window.Lumino = { $, $$, icon, fmtTime, parseDur, clamp, player, tracks, androidApps, appById, notifications };
})();
