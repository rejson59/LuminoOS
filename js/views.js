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

  function fit() {
    const v = currentView();
    devices.forEach(d => d.style.removeProperty("--zoom"));
    if (v === "all") { stage.classList.remove("single"); return; }
    stage.classList.add("single");

    const el = stage.querySelector(`.device.device--${v}`);
    if (!el) return;
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
  }

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
