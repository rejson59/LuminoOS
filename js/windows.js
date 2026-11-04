/* ============================================================
   LuminoOS — makiety: powłoka Windows 11 (laptop)
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, icon, player, clamp } = window.Lumino;

  const WIN_APPS = {
    explorer: { title: "Pliki", icon: "i-folder", tint: "#ffd67a", w: "68%", h: "76%", x: 94, y: 18, part: window.Lumino.explorer },
    spotify: { title: "Spotify", icon: "i-spotify", tint: "#1ed760", w: "58%", h: "72%", x: 150, y: 26, part: window.Lumino.spotifyWin, cls: "sp-win" },
    settings: { title: "Ustawienia", icon: "i-gear-win", tint: "#a8c7fa", w: "52%", h: "70%", x: 170, y: 30, part: window.Lumino.winSettings },
    notepad: { title: "Notatnik", icon: "i-notes", tint: "#ffe08a", w: "44%", h: "52%", x: 210, y: 60, part: window.Lumino.notepad },
    edge: { title: "Edge", icon: "i-edge", tint: "#8ed0ff", w: "60%", h: "72%", x: 140, y: 24, part: { html: () => `<div class="center-msg" style="height:100%">
        <span class="app__icon ic-sky">${icon("i-edge")}</span>
        <b style="color:#fff;font-size:12px">Microsoft Edge — makieta</b>
        <span style="font-size:9.5px">Tu trafi docelowa przeglądarka LuminoOS.</span></div>` } },
    store: { title: "Store", icon: "i-store", tint: "#a8c7fa", w: "54%", h: "66%", x: 160, y: 40, part: { html: () => `<div class="win-settings">
        <h4>Polecane aplikacje</h4>
        ${[["Spotify", "ic-spotify", "i-spotify"], ["Pliki", "ic-yellow", "i-files"], ["Notatnik", "ic-amber", "i-notes"]]
          .map(([n, c, i]) => `<div class="set-card"><span class="app__icon ${c}" style="--s:26px;border-radius:7px">${icon(i)}</span>
            <span>${n}</span><span class="val">Zainstaluj</span></div>`).join("")}
        <p style="font-size:8.5px;color:#a9b2c6;margin-top:6px">Makieta sklepu z aplikacjami.</p>
      </div>` } },
    calculator: { title: "Kalkulator", icon: "i-calc", tint: "#a8c7fa", w: "30%", h: "62%", x: 300, y: 60, part: { html: () => wineCalcHTML() } },
    weather: { title: "Pogoda", icon: "i-sun", tint: "#ffd166", w: "38%", h: "48%", x: 240, y: 70, part: { html: () => `
      <div style="padding:16px;height:100%;display:flex;flex-direction:column;justify-content:center;gap:10px;background:
        radial-gradient(70% 60% at 20% 10%, rgba(255,209,102,.35), transparent 60%),linear-gradient(160deg,#1b2438,#0d1120)">
        <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#c8d0e0">Kraków</div>
        <div style="font-size:34px;font-weight:300;letter-spacing:-1px">12°</div>
        <div style="font-size:9.5px;color:#c8d0e0">Pochmurno · odczuwalna 10°</div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#cfd8ea;margin-top:6px">
          ${["13°", "14°", "13°", "11°", "9°"].map((t, i) => `<span style="text-align:center">${t}<br><small style="opacity:.5">${10 + i * 2}</small></span>`).join("")}
        </div>
      </div>` } }
  };

  const EXTRA_APPS = [
    ["mail", "Poczta", "i-mail", "#5aa9ff"],
    ["calendar", "Kalendarz", "i-calendar", "#ff9f6b"],
    ["photos", "Zdjęcia", "i-gallery", "#ff8fb1"],
    ["maps", "Mapy", "i-maps", "#6fe3c4"],
    ["terminal", "Terminal", "i-files", "#d6dbe6"],
    ["paint", "Paint", "i-gallery", "#ffd166"],
    ["word", "Word", "i-notes", "#5aa9ff"],
    ["excel", "Excel", "i-calc", "#7bd88f"],
    ["xbox", "Xbox", "i-play", "#7bd88f"],
    ["camera", "Aparat", "i-camera", "#cfd6e6"],
    ["clock", "Zegar", "i-sun", "#cfd6e6"],
    ["recycle", "Kosz", "i-trash", "#cfd6e6"]
  ];

  const TASKBAR_APPS = [
    { id: "start", icon: "i-windows", label: "Start" },
    { id: "search", icon: "i-search", label: "Szukaj" },
    { id: "explorer", icon: "i-folder", label: "Eksplorator plików", dataIcon: "folder" },
    { id: "edge", icon: "i-edge", label: "Edge", dataIcon: "edge" },
    { id: "spotify", icon: "i-spotify", label: "Spotify", dataIcon: "spotify" },
    { id: "store", icon: "i-store", label: "Sklep", dataIcon: "store" }
  ];

  const START_APPS = [
    ["edge", "Edge", "i-edge", "#1a73e8"],
    ["explorer", "Pliki", "i-folder", "#e8b33c"],
    ["settings", "Ustawienia", "i-gear-win", "#8b95a8"],
    ["notepad", "Notatnik", "i-notes", "#6fa8dc"],
    ["spotify", "Spotify", "i-spotify", "#1ed760"],
    ["store", "Sklep", "i-store", "#4cc2ff"],
    ["weather", "Pogoda", "i-sun", "#ffb54d"],
    ["calculator", "Kalkulator", "i-calc", "#5f6368"],
    ["mail", "Poczta", "i-mail", "#3b82f6"],
    ["calendar", "Kalendarz", "i-calendar", "#ef6a4c"],
    ["photos", "Zdjęcia", "i-gallery", "#e8567f"],
    ["maps", "Mapy", "i-maps", "#39b98a"],
    ["terminal", "Terminal", "i-files", "#2b2f36"],
    ["paint", "Paint", "i-gallery", "#f2c744"],
    ["word", "Word", "i-notes", "#2b579a"],
    ["excel", "Excel", "i-calc", "#217346"],
    ["xbox", "Xbox", "i-play", "#107c10"],
    ["clock", "Zegar", "i-sun", "#5f6368"]
  ];

  function registerExtraApps() {
    EXTRA_APPS.forEach(([id, title, ic, tint]) => {
      if (WIN_APPS[id]) return;
      WIN_APPS[id] = {
        title, icon: ic, tint, w: "48%", h: "62%", x: 160, y: 42,
        part: { html: () => `<div class="center-msg" style="height:100%">
          <span class="app__icon" style="--s:42px;border-radius:10px;background:${tint};color:#0a1020">${icon(ic)}</span>
          <b style="color:#fff;font-size:12px">${title}</b>
          <span style="font-size:9.5px;max-width:220px">Makieta aplikacji — do zaprojektowania w LuminoOS.</span></div>` }
      };
    });
  }

  function buildWindows(screen) {
    registerExtraApps();
    screen.innerHTML = `
      <div class="win-wallpaper"></div>
      <div class="win-desktop">
        <div class="win-desktop-icons">
          <div class="win-desk-icon" data-open="explorer">${icon("i-pc")}<span>Ten komputer</span></div>
          <div class="win-desk-icon" data-open="explorer">${icon("i-folder")}<span>Dokumenty</span></div>
          <div class="win-desk-icon" data-open="explorer">${icon("i-trash")}<span>Kosz</span></div>
          <div class="win-desk-icon" data-open="edge">${icon("i-globe")}<span>Przeglądarka</span></div>
        </div>
        <div class="win-layer"></div>
      </div>

      <div class="start-menu">
        <div class="start-search">${icon("i-search", "ico--tiny")}
          <input type="text" placeholder="Wpisz, aby wyszukać" aria-label="Szukaj aplikacji">
        </div>
        <div class="start-scroll">
          <div class="start-head"><span>Przypięte</span><span class="start-all">Wszystkie aplikacje ›</span></div>
          <div class="start-grid">
            ${START_APPS.map(([id, name, ic, color]) => `
              <button class="start-app" data-open="${id}" data-name="${name.toLowerCase()}">
                <span class="start-app__ic" style="background:${color}">${icon(ic)}</span>
                <span>${name}</span>
              </button>`).join("")}
          </div>
          <div class="start-head"><span>Polecane</span></div>
          <div class="start-recent">
            <button class="recent" data-open="notepad"><span class="file__ic f-txt"></span>
              <div><b>notatki.txt</b><small>Ostatnio edytowane</small></div></button>
            <button class="recent" data-open="explorer"><span class="file__ic f-img"></span>
              <div><b>tapeta.png</b><small>Wczoraj</small></div></button>
            <button class="recent" data-open="spotify"><span class="app__icon ic-spotify" style="--s:22px;border-radius:5px">${icon("i-spotify")}</span>
              <div><b>Neonowe Ulice</b><small>Mira Kova · Spotify</small></div></button>
            <button class="recent" data-open="mail"><span class="file__ic f-pdf"></span>
              <div><b>umowa.pdf</b><small>Wczoraj</small></div></button>
          </div>
        </div>
        <div class="start-user">
          <span class="avatar">Ł</span><span>Łukasz</span>
          <button class="start-power" data-power="lock" title="Zablokuj">${icon("i-lock")}</button>
          <button class="start-power" data-power="off" title="Zasilanie">${icon("i-gear-win")}</button>
        </div>
      </div>

      <div class="taskbar">
        <div class="taskbar__left"><span class="weather-pill">☁ 12°</span></div>
        <div class="taskbar__center">
          ${TASKBAR_APPS.map(a => `
            <button class="tb-icon" data-tb="${a.id}" data-icon="${a.dataIcon || a.id}"
              title="${a.label}" aria-label="${a.label}" ${a.id === "start" ? 'aria-expanded="false"' : ""}>
              ${icon(a.icon)}
            </button>`).join("")}
        </div>
        <div class="taskbar__right" title="Panel szybkich ustawień">
          <span class="tray-ico">⌃</span>
          <span class="tray-icon">${icon("i-wifi")}</span>
          <span class="tray-icon">${icon("i-volume")}</span>
          <span class="tray-icon">${icon("i-battery")}</span>
          <span class="tray-clock"><b class="js-time">09:41</b><small class="js-date-short">04.11.2026</small></span>
        </div>
      </div>

      <div class="win-lock">
        <div>
          <div class="win-lock__time js-time">09:41</div>
          <div class="win-lock__date js-date-long">poniedziałek, 4 listopada</div>
          <div class="win-lock__weather">${icon("i-sun")} 12° · Kraków, pochmurno</div>
        </div>
        <div class="win-lock__center">
          <div class="win-lock__avatar">Ł</div>
          <div class="win-lock__name">Łukasz</div>
          <button class="win-lock__btn" data-lock="unlock">Kliknij, aby się zalogować</button>
          <div class="win-lock__hint">Makieta — hasło nie jest wymagane</div>
        </div>
        <div class="win-lock__bottom">
          <span>${icon("i-wifi", "ico--tiny")} Lumino_5G</span>
          <span>${icon("i-battery", "ico--tiny")} 78%</span>
        </div>
      </div>

      <div class="win-toast">
        <span class="app__icon ic-spotify" style="--s:22px;border-radius:6px">${icon("i-spotify")}</span>
        <div><b>Spotify</b><span>Odtwarzanie uruchomione</span></div>
      </div>
    `;

    const layer = $(".win-layer", screen);
    const startMenu = $(".start-menu", screen);
    const startBtn = $('[data-tb="start"]', screen);
    const toast = $(".win-toast", screen);
    const openWindows = new Map(); // id -> { el, meta, cleanup }

    /* ---------------- menu Start ---------------- */
    function openStart() {
      startMenu.classList.add("is-open");
      startBtn.setAttribute("aria-expanded", "true");
      const input = $("input", startMenu);
      setTimeout(() => input.focus(), 60);
    }
    function closeStart() {
      startMenu.classList.remove("is-open");
      startBtn.setAttribute("aria-expanded", "false");
    }
    const toggleStart = () => startMenu.classList.contains("is-open") ? closeStart() : openStart();

    startBtn.addEventListener("click", e => { e.stopPropagation(); toggleStart(); });
    screen.addEventListener("click", e => {
      if (!e.target.closest(".start-menu, [data-tb='start']")) closeStart();
    });

    // filtrowanie w Start
    $("input", startMenu).addEventListener("input", e => {
      const q = e.target.value.trim().toLowerCase();
      $$(".start-app", startMenu).forEach(a => {
        a.classList.toggle("is-hidden", q && !a.dataset.name.includes(q));
      });
    });

    /* ---------------- ekran blokady ---------------- */
    const lockEl = $(".win-lock", screen);
    function lockPC() {
      closeStart();
      lockEl.classList.remove("is-unlocked");
    }
    function unlockPC() { lockEl.classList.add("is-unlocked"); }
    $("[data-lock='unlock']", screen).addEventListener("click", unlockPC);
    screen.addEventListener("click", e => {
      const p = e.target.closest("[data-power]");
      if (!p) return;
      closeStart();
      if (p.dataset.power === "lock") lockPC();
      else showToast("Zasilanie", "Makieta — tu pojawi się menu zasilania");
    });

    /* ---------------- powiadomienie ---------------- */
    let toastTimer = null;
    function showToast(title, text) {
      toast.querySelector("b").textContent = title;
      toast.querySelector("span:last-child").textContent = text;
      toast.classList.add("is-open");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-open"), 3200);
    }

    /* ---------------- okna ---------------- */
    function focusWindow(id) {
      openWindows.forEach((w, k) => w.el.classList.toggle("is-inactive", k !== id));
      const w = openWindows.get(id);
      if (w) w.el.style.zIndex = String(++zTop);
    }
    let zTop = 10;

    function openWindow(id) {
      if (openWindows.has(id)) {
        const w = openWindows.get(id);
        w.el.classList.remove("is-minimized");
        focusWindow(id);
        return;
      }
      const meta = WIN_APPS[id];
      if (!meta) return;

      const el = document.createElement("div");
      el.className = "win-window" + (meta.cls ? " " + meta.cls : "");
      el.dataset.win = id;
      el.style.width = meta.w;
      el.style.height = meta.h;
      el.style.left = meta.x + "px";
      el.style.top = meta.y + "px";
      el.innerHTML = `
        <div class="win-titlebar">
          <div class="win-tabs">
            <span class="win-tab">${icon(meta.icon)}<span>${meta.title}</span></span>
          </div>
          <div class="win-ctrl">
            <button class="min" title="Minimalizuj" aria-label="Minimalizuj"></button>
            <button class="max" title="Maksymalizuj" aria-label="Maksymalizuj"></button>
            <button class="close" title="Zamknij" aria-label="Zamknij"></button>
          </div>
        </div>
        ${meta.part.html()}`;
      layer.appendChild(el);

      // zawartość: inicjalizacja
      let cleanup = null;
      if (meta.part.init) {
        const res = meta.part.init(el, screen);
        cleanup = typeof res === "function" ? { dispose: res } : res;
      }

      openWindows.set(id, { el, meta, cleanup });
      focusWindow(id);

      /* przyciski okna */
      $(".min", el).addEventListener("click", e => { e.stopPropagation(); minimize(id); });
      $(".max", el).addEventListener("click", e => {
        e.stopPropagation();
        el.classList.toggle("is-maximized");
        focusWindow(id);
      });
      $(".close", el).addEventListener("click", e => { e.stopPropagation(); closeWindow(id); });

      /* zawartość specjalna */
      if (id === "calculator") bindWineCalc(el);

      /* przeciąganie */
      makeDraggable(el, id);
      el.addEventListener("pointerdown", () => focusWindow(id));

      updateTaskbar();
    }

    function closeWindow(id) {
      const w = openWindows.get(id);
      if (!w) return;
      if (w.cleanup) {
        if (typeof w.cleanup === "function") w.cleanup();
        else if (w.cleanup.dispose) w.cleanup.dispose();
      }
      w.el.remove();
      openWindows.delete(id);
      updateTaskbar();
    }

    function minimize(id) {
      const w = openWindows.get(id);
      if (!w) return;
      w.el.classList.add("is-minimized");
      updateTaskbar();
    }

    function updateTaskbar() {
      $$(".tb-icon", screen).forEach(btn => {
        const id = btn.dataset.tb;
        const running = openWindows.has(id) && !openWindows.get(id).el.classList.contains("is-minimized");
        btn.classList.toggle("is-running", running);
      });
    }

    /* ---------------- przeciąganie okien ---------------- */
    function makeDraggable(el, id) {
      const bar = $(".win-titlebar", el);
      let startX = 0, startY = 0, origX = 0, origY = 0, dragging = false;

      bar.addEventListener("pointerdown", e => {
        if (e.target.closest(".win-ctrl")) return;
        if (el.classList.contains("is-maximized")) return;
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        origX = el.offsetLeft; origY = el.offsetTop;
        bar.setPointerCapture(e.pointerId);
        el.style.transition = "none";
        focusWindow(id);
      });
      bar.addEventListener("pointermove", e => {
        if (!dragging) return;
        const bounds = layer.getBoundingClientRect();
        const maxX = Math.max(0, bounds.width - el.offsetWidth);
        const maxY = Math.max(0, bounds.height - 32);
        const nx = clamp(origX + (e.clientX - startX), 0, maxX);
        const ny = clamp(origY + (e.clientY - startY), 0, maxY);
        el.style.left = nx + "px";
        el.style.top = ny + "px";
      });
      const end = () => { dragging = false; el.style.transition = ""; };
      bar.addEventListener("pointerup", end);
      bar.addEventListener("pointercancel", end);
    }

    /* ---------------- pasek zadań ---------------- */
    $$(".tb-icon", screen).forEach(btn => {
      const id = btn.dataset.tb;
      if (id === "start") return;
      btn.addEventListener("click", e => {
        e.stopPropagation();
        if (id === "search") { openStart(); return; }
        const w = openWindows.get(id);
        if (!w) { openWindow(id); return; }
        const minimized = w.el.classList.contains("is-minimized");
        const inactive = w.el.classList.contains("is-inactive");
        if (minimized) { w.el.classList.remove("is-minimized"); focusWindow(id); }
        else if (!inactive) minimize(id);
        else focusWindow(id);
      });
    });

    $$("[data-open]", screen).forEach(el => {
      el.addEventListener("click", e => {
        e.stopPropagation();
        openWindow(el.dataset.open);
        closeStart();
      });
    });

    /* ---------------- powiadomienie przy starcie ---------------- */
    setTimeout(() => showToast("LuminoOS", "Witaj — otwórz Start lub aplikację"), 900);

    /* ---------------- odtwarzacz → pasek zadań ---------------- */
    let lastPlaying = false;
    player.subscribe(p => {
      if (p.playing && !lastPlaying) {
        showToast("Spotify", `${p.track.title} — ${p.track.artist}`);
      }
      lastPlaying = p.playing;
      const tb = $('[data-tb="spotify"]', screen);
      if (tb) tb.classList.toggle("is-running", openWindows.has("spotify") || p.playing);
    });

    /* ---------------- startowe okno ---------------- */
    openWindow("explorer");

    /* ---------------- API ---------------- */
    screen.lumino = { openWindow, closeWindow, closeStart, openStart, lockPC, unlockPC };
  }

  /* ---------------- kalkulator (Windows) ---------------- */
  function wineCalcHTML() {
    const keys = [
      ["C", "fn"], ["⌫", "fn"], ["%", "op"], ["÷", "op"],
      ["7", ""], ["8", ""], ["9", ""], ["×", "op"],
      ["4", ""], ["5", ""], ["6", ""], ["−", "op"],
      ["1", ""], ["2", ""], ["3", ""], ["＋", "op"],
      ["±", "fn"], ["0", ""], [",", ""], ["=", "eq"]
    ];
    return `<div class="win-calc">
      <div class="win-calc__out"><div class="win-calc__expr"></div><div class="win-calc__val">0</div></div>
      <div class="win-calc__keys">${keys.map(([k, c]) => `<button class="${c}" data-key="${k}">${k}</button>`).join("")}</div>
    </div>`;
  }

  function bindWineCalc(el) {
    let cur = "0", prev = null, op = null, fresh = true;
    const valEl = el.querySelector(".win-calc__val");
    const exprEl = el.querySelector(".win-calc__expr");
    const ops = { "＋": "+", "−": "-", "×": "*", "÷": "/" };
    const compute = (a, b, o) => {
      a = parseFloat(a); b = parseFloat(b);
      let r = o === "+" ? a + b : o === "-" ? a - b : o === "*" ? a * b : (b === 0 ? NaN : a / b);
      if (!isFinite(r) || isNaN(r)) return "Błąd";
      return String(Math.round(r * 1e10) / 1e10);
    };
    const show = () => {
      valEl.textContent = cur;
      exprEl.textContent = prev !== null && op ? `${prev} ${op} ` : "";
    };
    const press = (k) => {
      if (k === "C") { cur = "0"; prev = null; op = null; fresh = true; }
      else if (k === "⌫") cur = cur.length > 1 ? cur.slice(0, -1) : "0";
      else if (k === "±") cur = cur.startsWith("-") ? cur.slice(1) : (cur === "0" ? "0" : "-" + cur);
      else if (k === "%") cur = String(parseFloat(cur) / 100);
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
    el.querySelectorAll("[data-key]").forEach(b => b.addEventListener("click", () => press(b.dataset.key)));
    show();
  }

  window.Lumino.buildWindows = buildWindows;
})();
