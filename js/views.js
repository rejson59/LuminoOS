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
    devices.forEach(d => {
      d.style.removeProperty("--zoom");
      d.style.removeProperty("--real-scale");
    });
    if (v === "all") { stage.classList.remove("single"); return; }
    stage.classList.add("single");

    const el = stage.querySelector(`.device.device--${v}`);
    if (!el) return;

    /* tryb 1:1 — skalujemy makietę tak, by miała wymiary urządzenia */
    if (sizeReal) {
      const frame = el.querySelector(".frame, .lid") || el;
      const base = frame.getBoundingClientRect();
      const scale = parseFloat(el.style.getPropertyValue("--zoom")) || 1;
      const w = base.width / scale, h = base.height / scale;
      /* dostępne miejsce: całe okno minus marginesy (pełny ekran = więcej) */
      const pad = fullscreen ? 24 : 90;
      const availW = Math.max(240, window.innerWidth - pad);
      const availH = Math.max(300, window.innerHeight - pad * 2);
      const k = Math.min(1, availW / w, availH / h);   /* 1:1 tylko gdy się mieści */
      el.style.setProperty("--zoom", String(k));
      el.dataset.realSize = REAL[v] ? `${REAL[v].w}×${REAL[v].h}` : "";
      const frameEl = el.querySelector(".frame, .lid");
      if (frameEl && REAL[v]) frameEl.dataset.realSizeLabel = `${REAL[v].w} × ${REAL[v].h} px`;
      stage.dataset.scale = k.toFixed(3);
      return;
    }

    // dostępne miejsce
    const availW = stage.clientWidth - 40;
    const availH = stage.clientHeight - 34;
    const base = BASE[v] || [400, 400];
    const zoom = Math.min(
      availW / (base[0] + 60),
      availH / (base[1] + 52),
      MAX_ZOOM[v] || 1.5
    );
    el.style.setProperty("--zoom", String(Math.max(0.55, zoom)));
    stage.dataset.scale = "";
  }

  /* ------------------------------------------------------------
     Pełny ekran — makieta na całe okno (Fullscreen API, z awaryjnym
     trybem „theater”, gdy przeglądarka blokuje pełny ekran)
     ------------------------------------------------------------ */
  let fullscreen = false;
  const fullBtn = document.getElementById("fullToggle");

  function setFullscreen(on) {
    fullscreen = on;
    document.documentElement.classList.toggle("is-fullscreen", on);
    if (fullBtn) {
      fullBtn.classList.toggle("is-active", on);
      fullBtn.setAttribute("aria-pressed", String(on));
    }
    /* jeśli nie wybrano urządzenia, pokaż telefon (jest najbardziej „1:1”) */
    if (on && currentView() === "all") setView("phone");
    requestAnimationFrame(fit);
    setTimeout(fit, 260);
  }

  function toggleFullscreen() {
    if (!fullscreen) {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) {
        try {
          const p = req.call(el);
          if (p && p.catch) p.catch(() => {});
        } catch (e) { /* np. iframe bez allowfullscreen — tryb theater */ }
      }
      setFullscreen(true);
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
        try { exit.call(document); } catch (e) { /* ignorujemy */ }
      }
      setFullscreen(false);
    }
  }

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && fullscreen) setFullscreen(false);
  });

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

  document.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "f" || e.key === "F") toggleFullscreen();
    if (e.key === "s" || e.key === "S" && sizeBtn) sizeBtn.click();
    if (e.key === "Escape" && fullscreen) setFullscreen(false);
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
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fit, 120); });

  window.Lumino = window.Lumino || {};
  window.Lumino.setView = setView;

  // start: z adresu (#phone/#tablet/#laptop) albo wszystkie
  const hash = (location.hash || "").replace("#", "");
  setView(["phone", "tablet", "laptop"].includes(hash) ? hash : "all");
})();
