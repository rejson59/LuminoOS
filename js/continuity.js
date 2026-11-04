/* ============================================================
   LuminoOS — CONTINUITY (etap 15)
   Pomysł: skoro telefon, tablet i laptop to JEDEN system, aplikacja
   powinna „płynąć” między urządzeniami — bez logowania, bez chmury,
   bez kopiowania. Bierzesz ikonę aplikacji i przeciągasz ją na inny
   ekran: animacja leci po prostej między urządzeniami, a aplikacja
   otwiera się tam, gdzie ją upuścisz.
   Do tego PULSE: dziennik zdarzeń systemu (jedno miejsce, w którym
   widać, co się dzieje na wszystkich ekranach naraz).
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, iconImg, sys } = window.Lumino;
  const reduce = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const HANDLE_SEL = ".android .app, .android .dock-app, .win-desk-icon, .win .start-app, .win .tb-icon[data-tb]";
  const DRAG_THRESHOLD = 10;         /* px — poniżej to zwykły klik */
  const DEVICES = ["phone", "tablet", "laptop"];

  /* aplikacje, których nie ma na drugim systemie — mapujemy na odpowiednik */
  const ALIAS = {
    explorer: "files", files: "explorer", edge: "chrome", chrome: "edge",
    notepad: "notes", notes: "notepad", mail: "gmail", gmail: "mail",
    calendar: "calendar", photos: "gallery", gallery: "photos",
    calculator: "calculator", settings: "settings", spotify: "spotify",
    messages: "messages", camera: "camera", clock: "clock", maps: "maps",
    weather: "weather", store: "store", terminal: "terminal", phone: "phone"
  };

  /* Ten sam identyfikator znaczy co innego w każdej powłoce:
     po stronie Androida są „notes”, „files”, „chrome”…, a Windows używa
     „notepad”, „explorer”, „edge”… Mapa musi więc znać KIERUNEK. */
  const ANDROID_APPS = new Set(["phone", "messages", "spotify", "camera", "chrome",
    "gallery", "youtube", "calendar", "gmail", "maps", "notes", "calculator",
    "files", "settings", "weather", "clock"]);
  const WIN_APPS = new Set(["explorer", "spotify", "settings", "notepad", "edge",
    "store", "calculator", "weather", "mail", "calendar", "photos", "maps",
    "terminal", "paint", "word", "excel", "xbox", "camera", "clock", "recycle"]);
  function toAndroid(id) {
    if (ANDROID_APPS.has(id)) return id;
    const a = ALIAS[id] || id;
    return ANDROID_APPS.has(a) ? a : "settings";
  }
  function toWindows(id) {
    if (WIN_APPS.has(id)) return id;
    const a = ALIAS[id] || id;
    return WIN_APPS.has(a) ? a : "settings";
  }

  const LABEL = {
    phone: "Telefon", messages: "Wiadomości", spotify: "Spotify", camera: "Aparat",
    chrome: "Chrome", edge: "Edge", gallery: "Zdjęcia", photos: "Zdjęcia",
    youtube: "YouTube", calendar: "Kalendarz", gmail: "Gmail", mail: "Poczta",
    maps: "Mapy", notes: "Notatki", notepad: "Notatnik", calculator: "Kalkulator",
    files: "Pliki", explorer: "Pliki", settings: "Ustawienia", store: "Sklep",
    terminal: "Terminal", clock: "Zegar", paint: "Paint", weather: "Pogoda"
  };

  /* ------------------------------------------------------------
     PULSE — dziennik zdarzeń systemu
     ------------------------------------------------------------ */
  const pulse = (() => {
    const host = document.getElementById("pulse");
    const feed = host ? host.querySelector(".pulse__feed") : null;
    const btn = document.getElementById("pulseToggle");
    const entries = [];
    let visible = false;

    function dot(st) {
      return `<span class="pulse__dot pulse__dot--${st}" aria-hidden="true"></span>`;
    }
    function stamp() {
      return new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    }
    function push(text, st = "sys") {
      entries.unshift({ text, st, at: stamp() });
      if (entries.length > 7) entries.pop();
      render();
    }
    function render() {
      if (!feed) return;
      feed.innerHTML = entries.map(e => `
        <li class="pulse__row">
          ${dot(e.st)}
          <span class="pulse__txt">${e.text}</span>
          <span class="pulse__at">${e.at}</span>
        </li>`).join("");
    }
    function setVisible(on) {
      visible = on;
      if (!host) return;
      host.classList.toggle("is-visible", on);
      host.setAttribute("aria-hidden", String(!on));
      if (btn) {
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", String(on));
      }
      if (on) render();
    }
    if (btn) {
      btn.addEventListener("click", () => setVisible(!visible));
      /* w dzienniku nie ma przełącznika — lecimy „na żywo" po zdarzeniach */
    }
    return { push, setVisible, isVisible: () => visible };
  })();

  /* nasłuchujemy wszystkiego, co i tak już dzieje się w systemie
     (bez dopisywania logiki do powłok — zero duplikacji) */
  function wirePulse() {
    const win = document.getElementById("winScreen");
    document.querySelectorAll("[data-android]").forEach(screen => {
      const dev = screen.dataset.android;
      /* otwarcie aplikacji */
      new MutationObserver(muts => {
        muts.forEach(m => m.addedNodes && m.addedNodes.forEach(n => {
          if (n.nodeType === 1 && n.classList && n.classList.contains("a-app")) {
            pulse.push(`${LABEL[n.dataset.appId] || n.dataset.appId} — otwarte na ${LABEL[dev] || dev}`, "open");
          }
        }));
      }).observe(screen.querySelector(".a-apps") || screen, { childList: true });
    });
    if (win) {
      const layer = win.querySelector(".win-layer");
      if (layer) {
        new MutationObserver(muts => {
          muts.forEach(m => m.addedNodes && m.addedNodes.forEach(n => {
            if (n.nodeType === 1 && n.dataset && n.dataset.win) {
              pulse.push(`${LABEL[n.dataset.win] || n.dataset.win} — otwarte na Laptopie`, "open");
            }
          }));
        }).observe(layer, { childList: true });
      }
    }
    /* zmiany stanu systemu */
    if (sys) {
      let first = true;
      sys.subscribe((state, key) => {
        if (first) { first = false; return; }
        if (key === null || key === undefined) return;
        const names = {
          wifi: "Wi‑Fi", bt: "Bluetooth", dnd: "Nie przeszkadzać", air: "Tryb samolotowy",
          saver: "Oszczędzanie baterii", flash: "Latarka", rotate: "Auto‑obrót",
          cast: "Przesyłanie obrazu", brightness: "Jasność", volume: "Głośność"
        };
        if (key === "brightness" || key === "volume") return;   /* za dużo wpisów */
        pulse.push(`${names[key] || key} — ${state[key] ? "włączone" : "wyłączone"} (wszystkie ekrany)`, "sys");
      });
    }
    /* muzyka */
    const player = window.Lumino.player;
    if (player && player.subscribe) {
      let last = null;
      player.subscribe(p => {
        const sig = `${p.playing}:${p.track.id}`;
        if (last === null) { last = sig; return; }
        if (sig === last) return;
        last = sig;
        pulse.push(p.playing
          ? `Muzyka: ${p.track.title} — ${p.track.artist} (wszystkie ekrany)`
          : `Muzyka wstrzymana`, "media");
      });
    }
  }

  /* ------------------------------------------------------------
     CONTINUITY — przeciąganie aplikacji między urządzeniami
     ------------------------------------------------------------ */
  let drag = null;

  /* ------------------------------------------------------------
     „Ciąg dalszy" — aplikacja otwarta na dwóch urządzeniach naraz
     pokazuje w pasku stanu mały, wspólny znacznik. To jedyna część
     systemu, która mówi wprost: to ta sama sesja, nie dwie kopie.
     ------------------------------------------------------------ */
  function paintShared() {
    document.querySelectorAll("[data-cont-shared]").forEach(el => el.remove());
    const openOn = { phone: new Set(), tablet: new Set(), laptop: new Set() };
    document.querySelectorAll("[data-android]").forEach(screen => {
      const dev = screen.dataset.android;
      screen.querySelectorAll(".a-app.is-open").forEach(a => {
        if (a.dataset.appId) openOn[dev].add(ALIAS[a.dataset.appId] || a.dataset.appId);
      });
    });
    const win = document.getElementById("winScreen");
    if (win) win.querySelectorAll("[data-win]").forEach(w => {
      if (w.dataset.win) openOn.laptop.add(ALIAS[w.dataset.win] || w.dataset.win);
    });
    ["phone", "tablet"].forEach(dev => {
      const screen = document.querySelector(`[data-android="${dev}"]`);
      if (!screen) return;
      const others = DEVICES.filter(d => d !== dev).reduce((n, d) => n + openOn[d].size, 0);
      const shared = [...openOn[dev]].filter(id => {
        return DEVICES.some(d => d !== dev && openOn[d].has(id));
      });
      const host = screen.querySelector(".statusbar__icons");
      if (!host || !shared.length || !others) return;
      const tag = document.createElement("span");
      tag.className = "cont-shared";
      tag.dataset.contShared = "1";
      tag.title = `Ta sama sesja na innym urządzeniu: ${shared.map(id => LABEL[id] || id).join(", ")}`;
      tag.textContent = `⟳ ${shared.map(id => LABEL[id] || id).join(" · ")}`;
      host.appendChild(tag);
    });
    const winBar = win && win.querySelector(".taskbar__left");
    if (winBar) {
      const shared = [...openOn.laptop].filter(id => {
        return DEVICES.some(d => d !== "laptop" && openOn[d].has(id));
      });
      if (shared.length) {
        const tag = document.createElement("span");
        tag.className = "cont-shared cont-shared--win";
        tag.dataset.contShared = "1";
        tag.textContent = `⟳ ${shared.map(id => LABEL[id] || id).join(" · ")}`;
        tag.title = "Ta sama sesja na telefonie/tablecie";
        winBar.appendChild(tag);
      }
    }
  }
  window.Lumino.paintShared = paintShared;
  window.Lumino.continuityPaint = paintShared;

  function deviceOf(el) {
    const d = el.closest(".device");
    return d ? d.dataset.device : null;
  }

  function appOf(el) {
    if (!el) return null;
    const win = el.closest(".win");
    if (win) {
      const tb = el.closest("[data-tb]");
      if (tb && tb.dataset.tb !== "start" && tb.dataset.tb !== "search") return tb.dataset.tb;
      const open = el.closest("[data-open]");
      if (open && el.classList.contains("start-app")) return open.dataset.open;
      return null;
    }
    const app = el.closest("[data-app]");
    return app ? app.dataset.app : null;
  }

  function makeGhost(el, x, y) {
    const src = el.querySelector(".app__icon, .ico");
    const g = document.createElement("div");
    g.className = "cont-ghost";
    g.innerHTML = src ? src.outerHTML : "";
    const r = src ? src.getBoundingClientRect() : el.getBoundingClientRect();
    g.style.width = g.style.height = Math.max(30, r.width || 36) + "px";
    g.style.transform = `translate(${x}px, ${y}px)`;
    document.body.appendChild(g);
    return g;
  }

  function zone(el) {
    /* strefy upuszczania: każda makieta (z lekkim zapasem wokół ramki) */
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { l: r.left - 18, t: r.top - 18, r: r.right + 18, b: r.bottom + 18 };
  }
  function zoneAt(x, y) {
    for (const d of DEVICES) {
      const el = document.querySelector(`.device[data-device="${d}"]`);
      const z = el && zone(el);
      if (z && x >= z.l && x <= z.r && y >= z.t && y <= z.b) return { device: d, el };
    }
    return null;
  }

  function paintZones(active, x, y) {
    const hit = zoneAt(x, y);
    DEVICES.forEach(d => {
      const el = document.querySelector(`.device[data-device="${d}"]`);
      if (!el) return;
      el.classList.toggle("is-drop-target", !!hit && hit.device === d && d !== active);
    });
  }

  function clearZones() {
    $$(".device.is-drop-target").forEach(el => el.classList.remove("is-drop-target"));
  }

  function openOn(device, appId) {
    const src = device === "laptop" ? window.Lumino.player && null : null;
    if (device === "laptop") {
      const win = document.getElementById("winScreen");
      if (!win || !win.lumino) return false;
      const id = toWindows(appId);
      win.lumino.unlockPC && win.lumino.unlockPC();
      win.lumino.openWindow && win.lumino.openWindow(id);
      return true;
    }
    const screen = document.querySelector(`[data-android="${device}"]`);
    if (!screen || !screen.lumino) return false;
    const id = toAndroid(appId);
    screen.lumino.unlock();
    screen.lumino.openApp(id);
    return true;
  }

  function launch(device, appId) {
    const el = document.querySelector(`.device[data-device="${device}"]`);
    if (!el) return;
    /* krótka, czytelna „iskra" na urządzeniu docelowym */
    const spark = document.createElement("span");
    spark.className = "cont-spark";
    const r = el.getBoundingClientRect();
    spark.style.left = (r.left + r.width / 2) + "px";
    spark.style.top = (r.top + r.height / 2) + "px";
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 700);
    pulse.push(`${LABEL[appId] || appId} — przeniesione na ${LABEL[device]}`, "move");
  }

  function start(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!e.target || typeof e.target.closest !== "function") return;
    const host = e.target.closest(HANDLE_SEL);
    if (!host) return;
    const device = deviceOf(host);
    const appId = appOf(host);
    if (!device || !appId) return;

    drag = {
      device, appId, host,
      x0: e.clientX, y0: e.clientY,
      x: e.clientX, y: e.clientY, ghost: null, moved: false, pointerId: e.pointerId
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", end, { passive: true });
    window.addEventListener("pointercancel", cancel, { passive: true });
  }

  function move(e) {
    if (!drag) return;
    drag.x = e.clientX; drag.y = e.clientY;
    const dist = Math.hypot(drag.x - drag.x0, drag.y - drag.y0);
    if (!drag.moved && dist < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.ghost = makeGhost(drag.host, drag.x, drag.y);
      document.body.classList.add("is-cont-drag");
    }
    if (!drag.ghost) return;
    drag.ghost.style.transform = `translate(${drag.x}px, ${drag.y}px)`;
    paintZones(drag.device, drag.x, drag.y);
  }

  function end(e) {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", cancel);
    if (!drag) return;
    const d = drag; drag = null;
    document.body.classList.remove("is-cont-drag");
    clearZones();
    if (!d.moved) return;
    if (d.ghost) {
      /* animacja „lotu" do celu — jeśli nie ma celu, dusimy ikonę */
      const hit = zoneAt(e.clientX, e.clientY);
      const target = hit && hit.device;
      const el = target && document.querySelector(`.device[data-device="${target}"]`);
      if (el && target !== d.device) {
        const r = el.getBoundingClientRect();
        d.ghost.style.transition = "transform 420ms cubic-bezier(.22,1,.36,1), opacity 240ms ease-out";
        d.ghost.style.transform = `translate(${r.left + r.width / 2 - 18}px, ${r.top + r.height * 0.42}px) scale(.6)`;
        d.ghost.style.opacity = "0";
        setTimeout(() => d.ghost.remove(), 440);
        if (openOn(target, d.appId)) launch(target, d.appId);
      } else {
        d.ghost.style.transition = "transform 240ms ease-out, opacity 200ms ease-out";
        d.ghost.style.opacity = "0";
        setTimeout(() => d.ghost.remove(), 260);
      }
    }
  }

  function cancel() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", cancel);
    if (drag && drag.ghost) drag.ghost.remove();
    drag = null;
    document.body.classList.remove("is-cont-drag");
    clearZones();
  }

  /* ------------------------------------------------------------
     start
     ------------------------------------------------------------ */
  function init() {
    document.addEventListener("pointerdown", start, { passive: true });
    wirePulse();
    /* znacznik wspólnej sesji: obserwujemy warstwy aplikacji (tanio, zbiorczo) */
    let sharedRaf = 0;
    const scheduleShared = () => {
      if (sharedRaf) return;
      sharedRaf = requestAnimationFrame(() => { sharedRaf = 0; paintShared(); });
    };
    document.querySelectorAll(".a-apps").forEach(h =>
      new MutationObserver(scheduleShared).observe(h, { childList: true }));
    const winLayer = document.querySelector("#winScreen .win-layer");
    if (winLayer) new MutationObserver(scheduleShared).observe(winLayer, { childList: true });
    scheduleShared();
    pulse.push("System gotowy — przeciągnij ikonę na inne urządzenie", "sys");

    /* Jednorazowa wskazówka po pierwszym odblokowaniu: ikony delikatnie
       „podskakują” — bez napisów, żeby nie zaśmiecać ekranu. */
    const phone = document.querySelector('[data-android="phone"] .a-lock');
    if (phone) {
      let hinted = false;
      const once = () => {
        if (hinted || !phone.classList.contains("is-unlocked")) return;
        hinted = true;
        const dev = phone.closest(".device");
        if (dev) {
          dev.classList.add("cont-hint");
          setTimeout(() => dev.classList.remove("cont-hint"), 3600);
        }
        mo.disconnect();
      };
      const mo = new MutationObserver(once);
      mo.observe(phone, { attributes: true, attributeFilter: ["class"] });
    }
    /* Escape anuluje przeciąganie (myszka + klawiatura) */
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && drag) cancel();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 60), { once: true });
  } else {
    setTimeout(init, 60);
  }

  window.Lumino.paintShared = paintShared;
  window.Lumino.continuity = { openOn, pulse, ALIAS, paintShared };
})();
