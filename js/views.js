/* ============================================================
   LuminoOS — makiety: przełączanie i skalowanie podglądów
   ============================================================ */
(function () {
  "use strict";
  const stage = document.getElementById("stage");
  const buttons = Array.from(document.querySelectorAll("[data-view]"));
  const devices = Array.from(document.querySelectorAll(".device"));

  const BASE = { phone: [292, 600], tablet: [710, 540], laptop: [700, 440] };
  const MAX_ZOOM = { phone: 1.9, tablet: 1.45, laptop: 1.5 };

  function currentView() { return stage.dataset.view || "all"; }

  function deviceSize() {
    const v = currentView();
    if (v === "all") return null;
    const el = stage.querySelector(`.device[data-device="${v}"]`);
    if (!el) return null;
    const frame = el.querySelector(".frame, .lid") || el;
    const r = frame.getBoundingClientRect();
    // rozmiar bez aktualnej skali
    const scale = parseFloat(el.style.getPropertyValue("--zoom")) || 1;
    return {
      w: (r.width + 74) / scale,
      h: (r.height + 44) / scale
    };
  }

  /* Makiety, których nie widać, nie animują się i nie malują — to największa
     oszczędność w widoku „wszystkie urządzenia”. */
  function pauseHiddenDevices() {
    const v = currentView();
    devices.forEach(d => {
      const visible = v === "all" || d.classList.contains(`device--${v}`);
      d.classList.toggle("is-idle", !visible);
    });
    /* w widoku pojedynczym reszta jest display:none — dodatkowo usuwamy jej
       animacje, żeby nie zużywały klatek przy przejściu */
    const ids = ["phone", "tablet", "laptop"];
    ids.forEach(id => {
      const d = stage.querySelector(`.device--${id}`);
      if (!d) return;
      const on = v === "all" || v === id;
      d.style.animationPlayState = on ? "" : "paused";
    });
  }

  /* ------------------------------------------------------------
     Tryb 1:1 — urządzenie w rzeczywistych proporcjach, przeliczane
     na piksele zamiast powiększania makiety:
     telefon 390×844, tablet 1024×768 (4:3), laptop 1440×900.
     Skala = 1, o ile urządzenie zmieści się w oknie.
     ------------------------------------------------------------ */
  const REAL = {
    phone:  { w: 390,  h: 844 },
    tablet: { w: 1024, h: 768 },
    laptop: { w: 1440, h: 900 }
  };

  let sizeReal = false;
  const sizeBtn = document.getElementById("sizeToggle");

  function fit() {
    const v = currentView();
    /* w pełnym ekranie rozmiar liczy fitFullscreen() — tu nic nie zmieniamy */
    if (fullscreen) return;
    devices.forEach(d => {
      d.style.removeProperty("--zoom");
      d.style.removeProperty("--real-scale");
    });
    if (v === "all") { stage.classList.remove("single"); return; }
    stage.classList.add("single");

    const el = stage.querySelector(`.device.device--${v}`);
    if (!el) return;
    /* dokładnie jedno urządzenie jest „pokazane” (także w pełnym ekranie) */
    devices.forEach(d => d.classList.toggle("is-shown", d === el));

    /* tryb 1:1 — skalujemy makietę tak, by miała wymiary urządzenia */
    if (sizeReal) {
      const frame = el.querySelector(".frame, .lid") || el;
      const base = frame.getBoundingClientRect();
      const scale = parseFloat(el.style.getPropertyValue("--zoom")) || 1;
      const w = base.width / scale, h = base.height / scale;
      /* dostępne miejsce: całe okno minus marginesy (pełny ekran = całe okno) */
      const native = document.documentElement.classList.contains("is-native");
      const padX = fullscreen ? (native ? 0 : 32) : 72;
      const padY = fullscreen ? (native ? 0 : 56) : 128;
      const availW = Math.max(240, window.innerWidth - padX);
      const availH = Math.max(300, window.innerHeight - padY);
      const k = Math.min(1, availW / w, availH / h);   /* 1:1 tylko gdy się mieści */
      el.style.setProperty("--zoom", String(k));
      el.dataset.realSize = REAL[v] ? `${REAL[v].w}×${REAL[v].h}` : "";
      const frameEl = el.querySelector(".frame, .lid");
      if (frameEl && REAL[v]) frameEl.dataset.realSizeLabel = `${REAL[v].w} × ${REAL[v].h} px`;
      stage.dataset.scale = k.toFixed(3);
      return;
    }

    // dostępne miejsce (pełny ekran: mierzymy okno, nie przewijany stage)
    const availW = (fullscreen ? window.innerWidth : stage.clientWidth) - (fullscreen ? 24 : 40);
    const availH = (fullscreen ? window.innerHeight : stage.clientHeight) - (fullscreen ? 24 : 34);
    const base = BASE[v] || [400, 400];
    let zoom = Math.min(
      availW / (base[0] + 60),
      availH / (base[1] + 52),
      MAX_ZOOM[v] || 1.5
    );
    /* w pełnym ekranie makieta musi zmieścić się w oknie bez przewijania */
    if (fullscreen) {
      const w = (base[0] + 60) * zoom, h = (base[1] + 52) * zoom;
      if (w > availW || h > availH) zoom = Math.min(availW / (base[0] + 60), availH / (base[1] + 52));
    }
    el.style.setProperty("--zoom", String(Math.max(0.55, zoom)));
    stage.dataset.scale = "";
  }

  /* ------------------------------------------------------------
     Pełny ekran — makieta dokładnie na całe okno, każdy element
     liczony w pikselach okna (nie w transformie, który ucinał treść).
     ------------------------------------------------------------ */
  let fullscreen = false;
  let fsZoom = 1;
  const fullBtn = document.getElementById("fullToggle");

  /* W pełnym ekranie makieta jest rozciągnięta na całe okno:
     usuwamy transform (to on ucinał laptop i powiększał telefon poza ekran)
     i podajemy realne piksele — dzięki temu treść w środku skaluje się sama. */
  function fitFullscreen() {
    const html = document.documentElement;
    if (!fullscreen) return;
    const v = currentView() === "all" ? "phone" : currentView();
    const el = stage.querySelector(`.device.device--${v}`);
    if (!el) return;

    fsZoom = 1;
    el.style.removeProperty("--zoom");
    el.style.setProperty("--zoom", "1");
    stage.dataset.scale = "";

    const W = window.innerWidth, H = window.innerHeight;
    const padX = 18, padY = 18;

    if (v === "phone") {
      const availH = H - padY * 2;
      const w = Math.min(430, Math.round(availH * (390 / 844) + 18));
      const h = Math.min(availH, Math.round((w - 18) * (844 / 390) + 18));
      html.style.setProperty("--phone-w", w + "px");
      html.style.setProperty("--phone-h", h + "px");
    } else if (v === "tablet") {
      const availW = W - padX * 2, availH = H - padY * 2;
      let w = Math.min(availW, 1400);
      let h = Math.round((w - 24) * (768 / 1024) + 24);
      if (h > availH) { h = availH; w = Math.round((h - 24) * (1024 / 768) + 24); }
      html.style.setProperty("--tablet-w", w + "px");
      html.style.setProperty("--tablet-h", h + "px");
    } else {
      /* laptop: ekran 16:10 + ramka i podstawka */
      const availW = W - padX * 2, availH = H - padY * 2;
      const chromeW = 20, chromeH = 10 + 12 + 14 + 3;   /* padding + base + przerwa */
      let w = Math.min(availW - 40, 1600);
      let h = Math.round((w - chromeW) * (900 / 1440));
      if (h + chromeH > availH) {
        h = availH - chromeH;
        w = Math.round(h * (1440 / 900) + chromeW);
      }
      html.style.setProperty("--win-w", w + "px");
      html.style.setProperty("--win-h", h + "px");
    }
  }

  function resetSizeVars() {
    ["--phone-w", "--phone-h", "--tablet-w", "--tablet-h", "--win-w", "--win-h"]
      .forEach(k => document.documentElement.style.removeProperty(k));
  }

  function setFullscreen(on, native) {
    fullscreen = on;
    const html = document.documentElement;
    html.classList.toggle("is-fullscreen", on);
    html.classList.toggle("is-native", on && !!native);
    if (fullBtn) {
      fullBtn.classList.toggle("is-active", on);
      fullBtn.setAttribute("aria-pressed", String(on));
    }
    /* w pełnym ekranie zawsze dokładnie jedno urządzenie (nigdy czarne tło) */
    if (on && currentView() === "all") setView("phone");
    if (on) { fitFullscreen(); }
    else { resetSizeVars(); }
    requestAnimationFrame(fit);
    setTimeout(() => { if (fullscreen) fitFullscreen(); fit(); }, 260);
  }

  function toggleFullscreen() {
    if (!fullscreen) {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      let native = false;
      if (req) {
        try {
          const p = req.call(el);
          native = !!p;
          if (p && p.catch) p.catch(() => {});
        } catch (e) { /* np. iframe bez allowfullscreen — tryb theater */ }
      }
      setFullscreen(true, native);
      if (!native) showFullscreenHint();
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
        try { exit.call(document); } catch (e) { /* ignorujemy */ }
      }
      setFullscreen(false);
    }
  }

  /* Jeśli przeglądarka odmówi prawdziwego pełnego ekranu (np. podgląd w iframe),
     mówimy o tym wprost zamiast udawać, że to pełny ekran. */
  let hintEl = null, hintTimer = null;
  function showFullscreenHint() {
    if (!hintEl) {
      hintEl = document.createElement("div");
      hintEl.className = "fs-hint";
      hintEl.innerHTML = "Przeglądarka zablokowała pełny ekran. Otwórz podgląd w osobnej karcie i naciśnij <b>F</b>.";
      document.body.appendChild(hintEl);
    }
    hintEl.classList.add("is-visible");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hintEl.classList.remove("is-visible"), 5200);
  }

  function syncFullscreen() {
    const native = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (native && !fullscreen) setFullscreen(true, true);
    if (!native && fullscreen && document.documentElement.classList.contains("is-native")) {
      setFullscreen(false, false);
    }
    requestAnimationFrame(fit);
    setTimeout(fit, 260);
  }
  document.addEventListener("fullscreenchange", syncFullscreen);
  document.addEventListener("webkitfullscreenchange", syncFullscreen);

  if (sizeBtn) sizeBtn.addEventListener("click", () => {
    sizeReal = !sizeReal;
    /* 1:1 ma sens tylko dla jednego urządzenia — przełączamy widok */
    if (sizeReal && currentView() === "all") setView("phone");
    sizeBtn.classList.toggle("is-active", sizeReal);
    sizeBtn.setAttribute("aria-pressed", String(sizeReal));
    sizeBtn.querySelector("span").textContent = sizeReal ? "1:1 ✓" : "1:1";
    fit();
    requestAnimationFrame(fit);
  });
  if (fullBtn) fullBtn.addEventListener("click", toggleFullscreen);

  /* przycisk wyjścia widoczny w pełnym ekranie */
  const exitBtn = document.createElement("button");
  exitBtn.className = "fs-exit";
  exitBtn.type = "button";
  exitBtn.title = "Wyjdź z pełnego ekranu (Esc)";
  exitBtn.setAttribute("aria-label", "Wyjdź z pełnego ekranu");
  exitBtn.textContent = "✕";
  exitBtn.addEventListener("click", () => { if (fullscreen) toggleFullscreen(); });
  document.body.appendChild(exitBtn);

  /* wyjście z pełnego ekranu skrótem z podglądu (przycisk w rogu) */
  window.Lumino = window.Lumino || {};
  window.Lumino.isFullscreen = () => fullscreen;
  window.Lumino.toggleFullscreen = toggleFullscreen;

  document.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "f" || e.key === "F") { toggleFullscreen(); return; }
    if (e.key === "s" || e.key === "S") { if (sizeBtn) sizeBtn.click(); return; }
    if (e.key === "Escape" && fullscreen) { toggleFullscreen(); return; }
  });

  function setView(v) {
    stage.dataset.view = v;
    document.body.dataset.view = v;
    buttons.forEach(b => {
      const on = b.dataset.view === v;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    try {
      const url = new URL(location.href);
      url.hash = v === "all" ? "" : v;
      history.replaceState(null, "", url.href);
    } catch (err) {
      /* np. przy otwarciu z file:// — pomijamy zapis w adresie */
    }
    pauseHiddenDevices();
    if (fullscreen) fitFullscreen();
    // natychmiast, a potem jeszcze po ustabilizowaniu layoutu
    fit();
    requestAnimationFrame(fit);
    setTimeout(fit, 260);
  }

  buttons.forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));

  // skrót: 1/2/3 = telefon/tablet/laptop, 0 = wszystkie
  document.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "1") setView("phone");
    if (e.key === "2") setView("tablet");
    if (e.key === "3") setView("laptop");
    if (e.key === "0") setView("all");
  });

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => { if (fullscreen) fitFullscreen(); fit(); }, 120);
  });

  window.Lumino = window.Lumino || {};
  window.Lumino.setView = setView;

  // start: z adresu (#phone/#tablet/#laptop) albo wszystkie
  const hash = (location.hash || "").replace("#", "");
  setView(["phone", "tablet", "laptop"].includes(hash) ? hash : "all");
})();
