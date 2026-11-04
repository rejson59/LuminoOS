/* ============================================================
   LuminoOS — makiety: zawartość aplikacji (Android + Windows)
   ============================================================ */
(function () {
  "use strict";
  const { icon, iconImg, fmtTime, clamp, player, tracks, appById } = window.Lumino;

  /* ------------------------------------------------------------
     Pomocnicze
     ------------------------------------------------------------ */
  const cover = (t, cls = "") => `<span class="cover ${t.cover} ${cls}"></span>`;
  const chip = (label, on) => `<button class="sp-chip ${on ? "on" : ""}">${label}</button>`;

  const group = (title, rows) => `<div class="settings-group"><h4>${title}</h4>${rows}</div>`;
  const setting = (ic, label, right) => `
    <div class="setting">
      <span class="sicon">${icon(ic)}</span><span>${label}</span>${right}
    </div>`;
  const sw = (on = false) => `<button class="switch" role="switch" aria-checked="${on}" aria-label="Przełącznik"></button>`;

  /* ------------------------------------------------------------
     WIADOMOŚCI
     ------------------------------------------------------------ */
  const threads = [
    { name: "Marta", initial: "M", color: "ic-pink", last: "Widzimy się o 18:00? 😊", time: "14:02" },
    { name: "Zespół Lumino", initial: "L", color: "ic-indigo", last: "Kuba: wrzuciłem nowe makiety", time: "13:20" },
    { name: "Mama", initial: "M", color: "ic-teal", last: "Zadzwoń jak będziesz miał chwilę", time: "11:48" },
    { name: "Allegro", initial: "A", color: "ic-amber", last: "Twoja paczka jest w drodze", time: "09:15" }
  ];
  const conversation = {
    Marta: [
      ["in", "Hej! Masz już plan na wieczór?", "17:38"],
      ["out", "Jasne, myślałem o kinie 🎬", "17:41"],
      ["in", "Widzimy się o 18:00? 😊", "14:02"]
    ]
  };

  function messagesHTML() {
    return `
      <div class="app-body">
        <div class="list">
          ${threads.map(t => `
            <button class="row" data-thread="${t.name}">
              <span class="avatar-tile ${t.color}">${t.initial}</span>
              <span class="row__main"><b>${t.name}</b><span>${t.last}</span></span>
              <small style="font-size:8px;opacity:.5">${t.time}</small>
            </button>`).join("")}
        </div>
        <div class="thread" data-thread-view hidden></div>
      </div>
      <div class="composer" hidden>
        <input type="text" placeholder="Wiadomość" aria-label="Treść wiadomości">
        <button class="send" aria-label="Wyślij">${icon("i-chev")}</button>
      </div>`;
  }

  function initMessages(root) {
    const list = root.querySelector(".list");
    const thread = root.querySelector("[data-thread-view]");
    const composer = root.querySelector(".composer");
    const input = composer.querySelector("input");
    const title = root.querySelector(".appbar h3");

    function openThread(name) {
      const msgs = conversation[name] || [["in", "To makieta — tu pojawi się rozmowa.", "12:00"]];
      list.hidden = true;
      thread.hidden = false;
      composer.hidden = false;
      thread.innerHTML = msgs.map(([dir, text, time]) => `
        <div class="bubble ${dir}">${text}<time>${time}</time></div>`).join("");
      title.textContent = name;
      thread.scrollTop = thread.scrollHeight;
    }
    function closeThread() {
      list.hidden = false;
      thread.hidden = true;
      composer.hidden = true;
      title.textContent = "Wiadomości";
    }
    function send() {
      const v = input.value.trim();
      if (!v) return;
      const now = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
      const el = document.createElement("div");
      el.className = "bubble out";
      el.innerHTML = `${v}<time>${now}</time>`;
      thread.appendChild(el);
      input.value = "";
      if (!conversation[title.textContent]) conversation[title.textContent] = [];
      conversation[title.textContent].push(["out", v, now]);
      thread.scrollTop = thread.scrollHeight;
      // symulowana odpowiedź
      setTimeout(() => {
        const r = document.createElement("div");
        r.className = "bubble in";
        r.innerHTML = `Dobra, zapisane 👍<time>${now}</time>`;
        thread.appendChild(r);
        thread.scrollTop = thread.scrollHeight;
      }, 1400);
    }

    root.querySelectorAll("[data-thread]").forEach(btn => {
      btn.addEventListener("click", () => openThread(btn.dataset.thread));
    });
    root.querySelector(".send").addEventListener("click", send);
    input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
    root.addEventListener("lumino:back", closeThread);
    return () => closeThread();
  }

  /* ------------------------------------------------------------
     SPOTIFY
     ------------------------------------------------------------ */
  function spotifyHTML() {
    const tiles = [tracks[0], tracks[3], tracks[5], tracks[7], tracks[8], tracks[1]];
    return `
      <div class="app-body sp-body">
        <div class="sp-greet">Dzień dobry</div>
        <div class="sp-chips">${chip("Wszystko", true)}${chip("Muzyka")}${chip("Podcasty")}</div>

        <div class="sp-sec"><b>Ostatnio słuchane</b><span>Zobacz wszystko</span></div>
        <div class="sp-tiles">
          ${tiles.map(t => `<button class="sp-tile" data-play="${t.id}">${cover(t)}<span>${t.album}</span></button>`).join("")}
        </div>

        <div class="sp-sec"><b>Polecane dla Ciebie</b><span>${tracks.length} utworów</span></div>
        <div class="sp-tracks">
          ${tracks.map((t, i) => `
            <button class="sp-track" data-track="${i}">
              ${cover(t)}
              <span class="tm"><b>${t.title}</b><span>${t.artist} · ${t.album}</span></span>
              <span class="dur">${t.dur}</span>
            </button>`).join("")}
        </div>
        <div style="height:58px"></div>
      </div>

      <div class="sp-playing" data-sp="mini" role="button" tabindex="0" aria-label="Otwórz odtwarzacz">
        <span class="cover cv-1" data-sp="mini-cover"></span>
        <span class="pm"><b data-sp="mini-title">—</b><span data-sp="mini-artist">—</span></span>
        <button data-sp="mini-play" aria-label="Odtwórz / pauza">${icon("i-play")}</button>
      </div>
      <div class="sp-bar"><i data-sp="bar"></i></div>

      <div class="sp-now" data-sp="now">
        <div class="sp-now__top">
          <button class="iconbtn" data-sp="collapse" style="background:rgba(255,255,255,.14)">${icon("i-chev")}</button>
          <span>Odtwarzanie z playlisty</span>
          <span>${icon("i-more")}</span>
        </div>
        <div class="cover-lg cover cv-1" data-sp="cover"></div>
        <div class="sp-now__title" data-sp="title">—</div>
        <div class="sp-now__artist" data-sp="artist">—</div>
        <div class="sp-now__bar"><i data-sp="nbar"></i></div>
        <div class="sp-now__times"><span data-sp="cur">0:00</span><span data-sp="dur">0:00</span></div>
        <div class="sp-now__ctrl">
          <button data-sp="shuffle" aria-label="Losowo">${icon("i-shuffle")}</button>
          <button data-sp="prev" aria-label="Poprzedni">${icon("i-prev")}</button>
          <button class="play" data-sp="play" aria-label="Odtwórz / pauza">${icon("i-play")}</button>
          <button data-sp="next" aria-label="Następny">${icon("i-next")}</button>
          <button data-sp="heart" aria-label="Polub">${icon("i-heart")}</button>
        </div>
        <div class="sp-now__foot">
          <span>${icon("i-cast")}</span>
          <span class="eq paused" data-sp="eq"><i></i><i></i><i></i></span>
          <span>${icon("i-download")}</span>
        </div>
      </div>`;
  }

  function bindSpotify(root) {
    const q = (s) => root.querySelector(s);
    const now = q('[data-sp="now"]');

    /* pełny ekran */
    const openNow = () => now.classList.add("is-open");
    const closeNow = () => now.classList.remove("is-open");

    q('[data-sp="mini"]').addEventListener("click", e => {
      if (e.target.closest('[data-sp="mini-play"]')) return;
      openNow();
    });
    q('[data-sp="mini"]').addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openNow(); }
    });
    q('[data-sp="collapse"]').addEventListener("click", closeNow);
    q('[data-sp="mini-play"]').addEventListener("click", e => { e.stopPropagation(); player.toggle(); });
    q('[data-sp="play"]').addEventListener("click", () => player.toggle());
    q('[data-sp="next"]').addEventListener("click", () => player.next());
    q('[data-sp="prev"]').addEventListener("click", () => player.prev());
    q('[data-sp="shuffle"]').addEventListener("click", () => player.toggleShuffle());
    q('[data-sp="heart"]').addEventListener("click", e => e.currentTarget.classList.toggle("on"));

    /* przewijanie */
    q('[data-sp="nbar"]').parentElement.addEventListener("click", e => {
      const r = e.currentTarget.getBoundingClientRect();
      player.seek((e.clientX - r.left) / r.width);
    });

    /* lista utworów */
    root.querySelectorAll("[data-track]").forEach(btn => {
      btn.addEventListener("click", () => {
        player.play(Number(btn.dataset.track));
        openNow();
      });
    });
    root.querySelectorAll("[data-play]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = tracks.findIndex(t => t.id === btn.dataset.play);
        player.play(i < 0 ? 0 : i);
        openNow();
      });
    });
    root.querySelectorAll(".sp-chip").forEach(c => c.addEventListener("click", () => {
      root.querySelectorAll(".sp-chip").forEach(x => x.classList.remove("on"));
      c.classList.add("on");
    }));

    /* synchronizacja z odtwarzaczem */
    const unsub = player.subscribe(p => {
      const t = p.track;
      q('[data-sp="cover"]').className = `cover-lg cover ${t.cover}`;
      q('[data-sp="title"]').textContent = t.title;
      q('[data-sp="artist"]').textContent = t.artist;
      q('[data-sp="mini-title"]').textContent = t.title;
      q('[data-sp="mini-artist"]').textContent = t.artist;
      q('[data-sp="mini-cover"]').className = `cover ${t.cover}`;
      q('[data-sp="cur"]').textContent = fmtTime(p.elapsed);
      q('[data-sp="dur"]').textContent = t.dur;
      q('[data-sp="nbar"]').style.width = `${p.progress * 100}%`;
      q('[data-sp="bar"]').style.width = `${p.progress * 100}%`;
      const playIcon = p.playing ? "i-pause" : "i-play";
      q('[data-sp="play"]').innerHTML = icon(playIcon);
      q('[data-sp="mini-play"]').innerHTML = icon(playIcon);
      q('[data-sp="eq"]').classList.toggle("paused", !p.playing);
      q('[data-sp="shuffle"]').classList.toggle("on", p.shuffle);

      root.querySelectorAll(".sp-track").forEach((el, i) => {
        el.classList.toggle("is-playing", i === p.index);
      });
      const titleEl = root.querySelector(".sp-greet");
      if (titleEl && !root.closest(".a-app")) titleEl.textContent = p.playing ? "Teraz gramy" : "Dzień dobry";
    });

    return { dispose: unsub, onBack: () => { if (now.classList.contains("is-open")) { closeNow(); return true; } return false; } };
  }

  /* ------------------------------------------------------------
     USTAWIENIA (Android)
     ------------------------------------------------------------ */
  function settingsHTML() {
    return `
      <div class="app-body">
        <div class="setting" style="background:rgba(168,199,250,.14);margin-top:4px">
          <span class="avatar-tile ic-indigo">Ł</span>
          <span style="flex:1"><b style="display:block;font-size:11px">Łukasz</b>
          <small style="font-size:9px;opacity:.65">Konto Google · synchronizacja</small></span>
          ${icon("i-chev", "chev")}
        </div>
        ${group("Sieć", setting("i-wifi", "Wi-Fi", "<span style='font-size:9px;opacity:.6'>Lumino_5G</span>") +
          setting("i-signal", "Sieć komórkowa", "") +
          setting("i-bluetooth", "Bluetooth", "<span style='font-size:9px;opacity:.6'>2 urządzenia</span>"))}
        ${group("Ekran", setting("i-sun", "Jasność", "<input type='range' min='0' max='100' value='70' class='mini-range'>") +
          setting("i-rotate", "Auto-obrót", sw(true)) +
          setting("i-saver", "Oszczędzanie baterii", sw(false)))}
        ${group("Dźwięk i powiadomienia", setting("i-volume", "Dźwięki i wibracja", sw(true)) +
          setting("i-bell-off", "Nie przeszkadzać", sw(false)))}
        ${group("System", setting("i-files", "Aktualizacja systemu", "<span style='font-size:9px;opacity:.6'>Aktualne</span>") +
          setting("i-pc", "LuminoOS 0.1 (makieta)", "") +
          setting("i-settings", "Opcje programisty", ""))}
        <div style="height:10px"></div>
      </div>`;
  }

  /* ------------------------------------------------------------
     NOTATKI
     ------------------------------------------------------------ */
  const notatki = [
    { cls: "", title: "Pomysły na LuminoOS", text: "Wspólny pasek dla telefonu i laptopa? Jeden gest wstecz na wszystkich ekranach.", when: "Dziś, 09:12" },
    { cls: "blue", title: "Zakupy", text: "Kawa, mleko, makaron, baterie AA", when: "Wczoraj" },
    { cls: "green", title: "Do przemyślenia", text: "Czy powiadomienia mają być wspólne dla urządzeń, czy osobne dla każdego?", when: "2 dni temu" }
  ];

  function notesHTML() {
    return `<div class="app-body" style="display:flex;flex-direction:column;gap:8px;padding-top:8px">
      <button class="row" style="background:rgba(168,199,250,.16)">
        ${icon("i-plus")}<b style="font-size:10.5px;font-weight:600">Nowa notatka</b>
      </button>
      ${notatki.map(n => `<div class="note ${n.cls}"><b>${n.title}</b>${n.text}<br><span>${n.when}</span></div>`).join("")}
    </div>`;
  }

  /* ------------------------------------------------------------
     KALENDARZ
     ------------------------------------------------------------ */
  function calendarHTML() {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth(), today = now.getDate();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // poniedziałek = 0
    const days = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const monthName = now.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
    const marked = [today, today + 3, today + 6];

    let cells = "";
    for (let i = 0; i < startDow; i++) {
      cells += `<span class="cell dim">${prevDays - startDow + i + 1}</span>`;
    }
    for (let d = 1; d <= days; d++) {
      const cls = ["cell"];
      if (d === today) cls.push("today");
      if (marked.includes(d)) cls.push("has");
      cells += `<span class="${cls.join(" ")}">${d}</span>`;
    }
    const rest = (7 - ((startDow + days) % 7)) % 7;
    for (let i = 1; i <= rest; i++) cells += `<span class="cell dim">${i}</span>`;

    return `<div class="app-body">
      <div class="cal-head"><b style="text-transform:capitalize">${monthName}</b><span style="opacity:.6">Dziś</span></div>
      <div class="cal-grid">
        ${["pn", "wt", "śr", "cz", "pt", "sb", "nd"].map(d => `<span class="dow">${d}</span>`).join("")}
        ${cells}
      </div>
      <div class="cal-list">
        <div class="cal-item"><i></i><div><b>10:00 — Projekt Lumino</b><small>Spotkanie online · 45 min</small></div></div>
        <div class="cal-item"><i style="background:#ffca58"></i><div><b>13:30 — Zespół</b><small>Przegląd makiet · 1 godz.</small></div></div>
        <div class="cal-item"><i style="background:#7cf0dd"></i><div><b>18:00 — Siłownia</b><small>Trening nóg</small></div></div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------
     KALKULATOR
     ------------------------------------------------------------ */
  function calculatorHTML() {
    const keys = [
      ["C", "fn"], ["⌫", "fn"], ["%", "op"], ["÷", "op"],
      ["7", ""], ["8", ""], ["9", ""], ["×", "op"],
      ["4", ""], ["5", ""], ["6", ""], ["−", "op"],
      ["1", ""], ["2", ""], ["3", ""], ["＋", "op"],
      ["±", "fn"], ["0", ""], [",", ""], ["=", "eq"]
    ];
    return `<div class="app-body calc" style="padding:0">
      <div class="calc__out"><div class="calc__expr"></div><div class="calc__val">0</div></div>
      <div class="calc__keys">${keys.map(([k, c]) => `<button class="${c}" data-key="${k}">${k}</button>`).join("")}</div>
    </div>`;
  }

  function initCalculator(root) {
    let cur = "0", prev = null, op = null, fresh = true;
    const valEl = root.querySelector(".calc__val");
    const exprEl = root.querySelector(".calc__expr");

    const ops = { "＋": "+", "−": "-", "×": "*", "÷": "/" };
    const compute = (a, b, o) => {
      a = parseFloat(a); b = parseFloat(b);
      let r = 0;
      if (o === "+") r = a + b;
      if (o === "-") r = a - b;
      if (o === "*") r = a * b;
      if (o === "/") r = b === 0 ? NaN : a / b;
      if (!isFinite(r) || isNaN(r)) return "Błąd";
      return String(Math.round(r * 1e10) / 1e10);
    };
    const show = () => {
      valEl.textContent = cur;
      exprEl.textContent = prev !== null && op ? `${prev} ${op} ` : "";
    };
    const press = (k) => {
      if (k === "C") { cur = "0"; prev = null; op = null; fresh = true; }
      else if (k === "⌫") { cur = cur.length > 1 ? cur.slice(0, -1) : "0"; }
      else if (k === "±") { cur = cur.startsWith("-") ? cur.slice(1) : (cur === "0" ? "0" : "-" + cur); }
      else if (k === "%") { cur = String(parseFloat(cur) / 100); }
      else if (k === ",") { if (!cur.includes(",")) cur += ","; }
      else if (ops[k]) {
        if (prev !== null && op && !fresh) { cur = compute(prev, cur.replace(",", "."), ops[op]); prev = cur; }
        else prev = cur.replace(",", ".");
        op = k; fresh = true;
      } else if (k === "=") {
        if (prev !== null && op) { cur = compute(prev, cur.replace(",", "."), ops[op]); prev = null; op = null; fresh = true; }
      } else {
        cur = fresh || cur === "0" ? k : cur + k;
        fresh = false;
      }
      cur = cur.replace(".", ",");
      show();
    };
    root.querySelectorAll("[data-key]").forEach(b => b.addEventListener("click", () => press(b.dataset.key)));
    show();
  }

  /* ------------------------------------------------------------
     GALERIA / APARAT / CHROME (proste makiety)
     ------------------------------------------------------------ */
  function galleryHTML() {
    const grads = ["cv-1", "cv-2", "cv-3", "cv-4", "cv-5", "cv-6", "cv-7", "cv-8", "cv-9"];
    return `<div class="app-body">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 2px 8px;font-size:10px">
        <b>Dzisiaj</b><span style="opacity:.55;font-size:9px">24 zdjęcia</span>
      </div>
      <div class="gal-grid">
        ${grads.map((g, i) => `<div class="gal ${i === 0 ? "big" : ""} ${g}"></div>`).join("")}
      </div>
      <p style="font-size:9px;opacity:.5;padding:10px 2px">Makiety zdjęć — gradienty zastępcze.</p>
    </div>`;
  }

  function cameraHTML() {
    return `<div style="flex:1;position:relative;background:
        radial-gradient(60% 50% at 50% 40%, #2a3346, #0a0e16 70%);display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:14px">
      <div style="position:absolute;inset:0;background-image:
        linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
        background-size:33.3% 33.3%"></div>
      <div style="position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between;font-size:9px;opacity:.7">
        <span>${icon("i-flash")} Auto</span><span>4:3 · 12 MP</span>
      </div>
      <div style="display:flex;align-items:center;gap:22px">
        <span style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.14)"></span>
        <span style="width:52px;height:52px;border-radius:50%;border:3px solid #fff;background:rgba(255,255,255,.18)"></span>
        <span style="width:30px;height:30px;border-radius:50%;background:linear-gradient(140deg,#ffd166,#e5533d)"></span>
      </div>
      <div style="display:flex;gap:18px;margin-top:14px;font-size:9px;opacity:.7">
        <span>Wideo</span><b>Zdjęcie</b><span>Portret</span>
      </div>
    </div>`;
  }

  function browserHTML() {
    return `<div class="app-body" style="padding-top:8px">
      <div style="display:flex;gap:6px;align-items:center;background:rgba(255,255,255,.10);border-radius:99px;padding:7px 12px;font-size:10px">
        ${icon("i-lock", "ico--tiny")}<span style="flex:1;opacity:.8">lumino.os</span><span style="opacity:.5">${icon("i-more")}</span>
      </div>
      <div style="margin-top:14px;border-radius:14px;padding:16px;background:
        radial-gradient(80% 70% at 20% 10%, rgba(124,196,255,.35), transparent 60%),
        linear-gradient(160deg,#182138,#0d1020)">
        <h2 style="margin:0 0 6px;font-size:18px;font-weight:650">LuminoOS</h2>
        <p style="margin:0;font-size:10.5px;line-height:1.55;color:rgba(255,255,255,.75)">
          System dla telefonu, tabletu i laptopa. Ta strona to makieta przeglądarki —
          miejsce na docelową stronę startową.
        </p>
        <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
          ${["Telefon", "Tablet", "Laptop"].map(x => `<span style="font-size:9px;padding:5px 10px;border-radius:99px;background:rgba(255,255,255,.12)">${x}</span>`).join("")}
        </div>
      </div>
      <div class="list" style="margin-top:12px">
        <div class="row"><span class="row__main"><b>Skróty</b><span>Twoje najczęstsze strony</span></span>${icon("i-chev", "chev")}</div>
        <div class="row"><span class="row__main"><b>Karty</b><span>3 otwarte karty</span></span>${icon("i-chev", "chev")}</div>
      </div>
    </div>`;
  }

  function placeholderHTML(app) {
    return `<div class="center-msg">
      ${iconImg(app.id, "center__ico")}
      <b style="font-size:12px;color:#fff">${app.label}</b>
      <span>Ta aplikacja jest makietą — ekran do zaprojektowania.<br>Powiedz, jak ma działać w LuminoOS.</span>
    </div>`;
  }

  /* ------------------------------------------------------------
     REJESTR APLIKACJI (Android)
     ------------------------------------------------------------ */
  const APP = {
    messages: { title: "Wiadomości", icon: "i-message", html: messagesHTML, init: initMessages },
    spotify: { title: "Spotify", icon: "i-spotify", html: spotifyHTML, init: bindSpotify, dock: true },
    settings: { title: "Ustawienia", icon: "i-settings", html: settingsHTML },
    notes: { title: "Notatki", icon: "i-notes", html: notesHTML },
    calendar: { title: "Kalendarz", icon: "i-calendar", html: calendarHTML },
    calculator: { title: "Kalkulator", icon: "i-calc", html: calculatorHTML, init: initCalculator },
    gallery: { title: "Zdjęcia", icon: "i-gallery", html: galleryHTML },
    camera: { title: "Aparat", icon: "i-camera", html: cameraHTML, full: true },
    chrome: { title: "Chrome", icon: "i-globe", html: browserHTML, dock: true },
    youtube: { title: "YouTube", icon: "i-play", html: () => placeholderHTML(appById("youtube")) },
    gmail: { title: "Gmail", icon: "i-mail", html: () => placeholderHTML(appById("gmail")) },
    maps: { title: "Mapy", icon: "i-maps", html: () => placeholderHTML(appById("maps")) },
    files: { title: "Pliki", icon: "i-files", html: () => placeholderHTML(appById("files")) },
    phone: { title: "Telefon", icon: "i-phone", html: () => placeholderHTML(appById("phone")) }
  };

  /* ------------------------------------------------------------
     WINDOWS: Eksplorator plików
     ------------------------------------------------------------ */
  const fileSystem = {
    "Dokumenty": [
      { name: "Projekty", type: "f-folder" },
      { name: "Zdjęcia", type: "f-folder" },
      { name: "notatki.txt", type: "f-txt" },
      { name: "tapeta.png", type: "f-img" },
      { name: "umowa.pdf", type: "f-pdf" },
      { name: "archiwum.zip", type: "f-zip" },
      { name: "Lumino-pomysły.txt", type: "f-txt" }
    ],
    "Główny": [
      { name: "Dokumenty", type: "f-folder" },
      { name: "Obrazy", type: "f-folder" },
      { name: "Muzyka", type: "f-folder" },
      { name: "Pulpit", type: "f-folder" }
    ],
    "Obrazy": [
      { name: "tapeta.png", type: "f-img" },
      { name: "makieta-1.png", type: "f-img" },
      { name: "makieta-2.png", type: "f-img" }
    ],
    "Muzyka": [
      { name: "Nocna Jazda.mp3", type: "f-zip" },
      { name: "Cisza nad Wisłą.mp3", type: "f-zip" }
    ],
    "Kosz": []
  };

  function explorerHTML() {
    return `
      <div class="win-toolbar">
        <button class="tb-btn">＋ Nowy</button>
        <span class="tb-sep"></span>
        <span class="tb-path">› Ten komputer › <b data-crumb style="font-weight:600">Dokumenty</b></span>
        <span class="tb-search">${icon("i-search", "ico--tiny")} Szukaj</span>
      </div>
      <div class="win-body">
        <div class="win-side">
          <button class="side-item" data-folder="Główny">${icon("i-pc")} Główny</button>
          <button class="side-item on" data-folder="Dokumenty">${icon("i-folder")} Dokumenty</button>
          <button class="side-item" data-folder="Obrazy">${icon("i-gallery")} Obrazy</button>
          <button class="side-item" data-folder="Muzyka">${icon("i-play")} Muzyka</button>
          <button class="side-item" data-folder="Kosz">${icon("i-trash")} Kosz</button>
        </div>
        <div class="win-content">
          <div class="file-grid" data-files></div>
        </div>
      </div>`;
  }

  function initExplorer(root) {
    const grid = root.querySelector("[data-files]");
    const crumb = root.querySelector("[data-crumb]");

    function render(folder) {
      crumb.textContent = folder;
      const items = fileSystem[folder] || [];
      if (!items.length) {
        grid.innerHTML = `<p style="font-size:9.5px;opacity:.55;grid-column:1/-1">Ten folder jest pusty.</p>`;
        return;
      }
      grid.innerHTML = items.map(f => `
        <button class="file" data-name="${f.name}" data-type="${f.type}">
          <span class="file__ic ${f.type}"></span><span>${f.name}</span>
        </button>`).join("");
      grid.querySelectorAll(".file").forEach(el => {
        el.addEventListener("click", () => {
          grid.querySelectorAll(".file").forEach(x => x.classList.remove("selected"));
          el.classList.add("selected");
          if (el.dataset.type === "f-folder" && fileSystem[el.dataset.name]) {
            root.querySelectorAll(".side-item").forEach(s => s.classList.toggle("on", s.dataset.folder === el.dataset.name));
            render(el.dataset.name);
          }
        });
      });
    }

    root.querySelectorAll(".side-item").forEach(btn => btn.addEventListener("click", () => {
      root.querySelectorAll(".side-item").forEach(s => s.classList.remove("on"));
      btn.classList.add("on");
      render(btn.dataset.folder);
    }));

    render("Dokumenty");
  }

  /* ------------------------------------------------------------
     WINDOWS: Spotify (wersja desktopowa)
     ------------------------------------------------------------ */
  function spotifyWinHTML() {
    return `
      <div class="sp-win__body">
        <div class="sp-win__side">
          <div style="display:flex;align-items:center;gap:6px;padding:4px 6px 8px;font-size:10px;font-weight:700;color:#1ed760">
            ${icon("i-spotify")} Spotify
          </div>
          <button class="side-item on">${icon("i-home")} Start</button>
          <button class="side-item">${icon("i-search")} Szukaj</button>
          <button class="side-item">${icon("i-library")} Biblioteka</button>
          <div style="margin-top:10px;padding:0 6px;font-size:8px;letter-spacing:.08em;color:rgba(255,255,255,.45)">PLAYLISTY</div>
          <button class="side-item">${icon("i-heart")} Ulubione</button>
          <button class="side-item">${icon("i-cloud")} Na wieczór</button>
          <button class="side-item">${icon("i-play-circle")} Mój mix</button>
        </div>
        <div class="sp-win__main">
          <div class="sp-win__head">
            <span class="cover ${tracks[0].cover}"></span>
            <div>
              <small>Playlista</small>
              <b>Neonowe Ulice</b>
              <span>Mira Kova · ${tracks.length} utworów · 42 min</span>
            </div>
          </div>
          <div class="sp-win__tracks">
            ${tracks.map((t, i) => `
              <button class="sp-track" data-track="${i}">
                <span class="dur" style="width:12px;opacity:.5">${i + 1}</span>
                ${cover(t)}
                <span class="tm"><b>${t.title}</b><span>${t.artist}</span></span>
                <span class="dur">${t.dur}</span>
              </button>`).join("")}
          </div>
          <div class="sp-win__bar">
            <span class="cover cv-1" data-sp="mini-cover"></span>
            <span class="pm"><b data-sp="mini-title">Wybierz utwór</b><span data-sp="mini-artist">Spotify</span></span>
            <button data-sp="prev">${icon("i-prev")}</button>
            <button class="play" data-sp="play">${icon("i-play")}</button>
            <button data-sp="next">${icon("i-next")}</button>
          </div>
          <div class="sp-win__progress"><i data-sp="bar"></i></div>
        </div>
      </div>`;
  }

  function bindSpotifyWin(root) {
    root.querySelector('[data-sp="play"]').addEventListener("click", () => player.toggle());
    root.querySelector('[data-sp="next"]').addEventListener("click", () => player.next());
    root.querySelector('[data-sp="prev"]').addEventListener("click", () => player.prev());
    root.querySelectorAll("[data-track]").forEach(btn => {
      btn.addEventListener("click", () => player.play(Number(btn.dataset.track)));
    });
    const unsub = player.subscribe(p => {
      const t = p.track;
      root.querySelector('[data-sp="mini-title"]').textContent = t.title;
      root.querySelector('[data-sp="mini-artist"]').textContent =
        `${t.artist} · ${fmtTime(p.elapsed)} / ${t.dur}`;
      root.querySelector('[data-sp="mini-cover"]').className = `cover ${t.cover}`;
      root.querySelector('[data-sp="play"]').innerHTML = icon(p.playing ? "i-pause" : "i-play");
      root.querySelector('[data-sp="bar"]').style.width = `${p.progress * 100}%`;
      root.querySelectorAll(".sp-track").forEach((el, i) => el.classList.toggle("is-playing", i === p.index));
    });
    return { dispose: unsub };
  }

  /* ------------------------------------------------------------
     WINDOWS: Ustawienia
     ------------------------------------------------------------ */
  function winSettingsHTML() {
    const card = (ic, title, right) => `
      <div class="set-card"><span class="sicon">${icon(ic)}</span><span>${title}</span>${right}</div>`;
    return `<div class="win-settings">
      <div style="display:flex;gap:10px;align-items:center;padding:4px 2px 6px">
        <span class="avatar" style="width:28px;height:28px;font-size:11px">Ł</span>
        <div><b style="font-size:10.5px">Łukasz</b><div style="font-size:8.5px;opacity:.6">Konto lokalne · LuminoOS</div></div>
      </div>
      <h4>System</h4>
      ${card("i-pc", "Ekran", "<span class='val'>1920 × 1200 · 100%</span>")}
      ${card("i-volume", "Dźwięk", "<span class='val'>Głośniki · 62%</span>")}
      ${card("i-wifi", "Sieć i internet", "<span class='val'>Lumino_5G</span>")}
      ${card("i-bluetooth", "Bluetooth i urządzenia", sw(true))}
      <h4 style="margin-top:6px">Personalizacja</h4>
      ${card("i-sun", "Tryb ciemny", sw(true))}
      ${card("i-saver", "Oszczędzanie energii", sw(false))}
      ${card("i-bell-off", "Powiadomienia", sw(true))}
      <h4 style="margin-top:6px">Informacje</h4>
      ${card("i-gear-win", "LuminoOS 0.1", "<span class='val'>makieta</span>")}
      <div class="set-card" style="display:block">
        <div style="font-size:8.5px;color:#a9b2c6;line-height:1.5">
          To makieta ustawień systemowych. Docelowo tutaj trafią opcje LuminoOS —
          wspólne dla telefonu, tabletu i laptopa.
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------
     WINDOWS: Notatnik
     ------------------------------------------------------------ */
  function notepadHTML() {
    return `<div class="win-editor"><textarea spellcheck="false">LuminoOS — notatki

• Wspólny schowek między telefonem a laptopem.
• Jedno konto, jedno centrum powiadomień.
• Gesty wstecz spójne na każdym urządzeniu.

(tu wpisz coś — to prawdziwe pole tekstowe)</textarea></div>`;
  }

  window.Lumino.APP = APP;
  window.Lumino.explorer = { html: explorerHTML, init: initExplorer };
  window.Lumino.spotifyWin = { html: spotifyWinHTML, init: bindSpotifyWin };
  window.Lumino.winSettings = { html: winSettingsHTML };
  window.Lumino.notepad = { html: notepadHTML };
  window.Lumino.winHTML = { spotifyHTML, settingsHTML, galleryHTML, calculatorHTML };
})();
