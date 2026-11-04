/* ============================================================
   LuminoOS — silnik ruchu
   Jeden pętlowy scheduler (requestAnimationFrame) dla WSZYSTKICH animacji
   sprężynowych, inercyjnego przewijania i efektów świetlnych.
   • zero setTimeout/setInterval w animacjach
   • praca tylko na transform / opacity (kompozytor, GPU)
   • automatyczne wygaszanie, gdy karta jest w tle
   ============================================================ */
(function () {
  "use strict";

  const reduce = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  if (!window.requestAnimationFrame) return;

  /* ---------------- scheduler ---------------- */
  const tasks = new Set();
  let raf = 0, last = 0, hidden = false;

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(64, now - last) : 16.7;
    last = now;
    if (hidden || reduce.matches) { tasks.clear(); return; }
    tasks.forEach(t => {
      let alive = false;
      try { alive = t(dt, now) !== false; } catch (e) { alive = false; }
      if (!alive) tasks.delete(t);
    });
    schedule();
  }
  function schedule() {
    if (!raf && tasks.size && !hidden) raf = requestAnimationFrame(tick);
  }
  function add(fn) { tasks.add(fn); schedule(); return () => tasks.delete(fn); }

  /* ---------------- sprężyna (krytycznie tłumiona) ---------------- */
  /* animuje wartość do celu; zwraca funkcję „set target” */
  function spring(opts) {
    const o = Object.assign({ stiffness: 170, damping: 22, mass: 1, onUpdate: null, onRest: null }, opts);
    let x = o.from || 0, v = 0, target = o.to || 0, resting = false;
    const stop = add(dt => {
      const t = dt / 1000;
      /* 2 kroki dla stabilności przy dużym dt */
      for (let i = 0; i < 2; i++) {
        const f = -o.stiffness * (x - target);
        const d = -o.damping * v;
        v += ((f + d) / o.mass) * (t / 2);
        x += v * (t / 2);
      }
      if (Math.abs(v) < 0.01 && Math.abs(x - target) < 0.01) {
        x = target; v = 0;
        if (!resting) { resting = true; o.onUpdate && o.onUpdate(x); o.onRest && o.onRest(x); }
        return false;
      }
      resting = false;
      o.onUpdate && o.onUpdate(x);
      return true;
    });
    return {
      to(n) { target = n; resting = false; schedule(); },
      stop,
      get value() { return x; }
    };
  }

  /* ---------------- inercyjne przewijanie (kółko myszy) ---------------- */
  /* dodaje „ciężar” i wygładzenie do przewijania list, jak w macOS */
  const SCROLL_SEL = ".launcher-pages,.start-scroll,.win-body,.side,.list";
  function smoothScroll(el) {
    if (el.dataset.luSmooth) return;
    el.dataset.luSmooth = "1";
    let target = el.scrollTop, current = el.scrollTop, active = false;
    const step = () => {
      const d = target - current;
      current += d * 0.28;
      if (Math.abs(d) < 0.6) { current = target; el.scrollTop = current; active = false; return false; }
      el.scrollTop = current;
      return true;
    };
    el.addEventListener("wheel", e => {
      if (reduce.matches) return;
      if (e.ctrlKey) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 4) return;
      e.preventDefault();
      target = Math.max(0, Math.min(max, target + e.deltaY * (e.deltaMode === 1 ? 18 : 1)));
      if (!active) { active = true; current = el.scrollTop; add(step); }
    }, { passive: false });
    el.addEventListener("scroll", () => {
      if (!active) { target = el.scrollTop; current = el.scrollTop; }
    }, { passive: true });
  }

  /* ---------------- „magnetyczne” ikony bez przeliczania layoutu ---------------- */
  /* zamiast getBoundingClientRect na każdy ruch kursora, trzymamy geometrię
     w cache i aktualizujemy ją tylko przy zmianie rozmiaru/przewinięciu */
  const MAG_SEL = ".app .app__icon, .dock-app .app__icon, .start-app .app__icon, .tb-icon .app__icon";
  function magnetise() {
    let hovered = null, rect = null;
    document.addEventListener("pointerover", e => {
      const el = e.target.closest && e.target.closest(MAG_SEL);
      if (!el || el === hovered) return;
      hovered = el;
      rect = el.getBoundingClientRect();
      window.Lumino && (window.Lumino._magRect = rect);
    }, { passive: true });
    document.addEventListener("pointerout", e => {
      const el = e.target.closest && e.target.closest(MAG_SEL);
      if (el && el === hovered) { hovered = null; rect = null; }
    }, { passive: true });
    return () => ({ hovered, rect });
  }

  /* ---------------- stan „w ruchu” ---------------- */
  const root = document.documentElement;
  let busyTimer = 0;
  function busy(ms) {
    root.classList.add("lu-busy");
    clearTimeout(busyTimer);
    busyTimer = setTimeout(() => root.classList.remove("lu-busy"), ms || 320);
  }

  /* ---------------- widoczność karty ---------------- */
  document.addEventListener("visibilitychange", () => {
    hidden = document.hidden;
    document.documentElement.classList.toggle("lu-hidden", hidden);
    if (!hidden) { last = 0; schedule(); }
  });

  /* ---------------- start ---------------- */
  function boot() {
    document.querySelectorAll(SCROLL_SEL).forEach(smoothScroll);
    magnetise();
    /* nowe warstwy (panele, aplikacje, okna) też dostają płynne przewijanie */
    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes && m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.matches && n.matches(SCROLL_SEL)) smoothScroll(n);
        if (n.querySelectorAll) n.querySelectorAll(SCROLL_SEL).forEach(smoothScroll);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else boot();

  window.Lumino = window.Lumino || {};
  window.Lumino.motion = { spring, add, busy, reduce: () => reduce.matches };
})();
