/* ============================================================
   LuminoOS — makiety: ultra płynne animacje
   • ripple pod każdym kliknięciem (jak w Androidzie)
   • sprężyste „dociśnięcie” elementów
   • płynne przejścia widoków i zakładek
   • miękkie najechane podświetlenia pod kursorem
   Wszystko na WAAPI (transform/opacity — kompozytor, 60–120 fps).
   ============================================================ */
(function () {
  "use strict";

  const reduce = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  if (reduce || typeof Element.prototype.animate !== "function") return;

  const EASE = "cubic-bezier(.22,1,.36,1)";
  const RIPPLE_SEL = [
    "button", ".app", ".dock-app", ".qs", ".notif", ".row", ".sp-track", ".sp-tile",
    ".start-app", ".recent", ".file", ".side-item", ".win-desk-icon", ".tb-icon",
    ".win-ctrl button", ".viewbtn", ".lock-action", ".cal-grid .cell", ".sp-chip",
    ".chip", ".win-tab", ".navpill", ".navbar__pill"
  ].join(",");

  /* ---------------- ripple ---------------- */
  function ripple(host, ev) {
    if (host.dataset.noRipple !== undefined) return;
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;

    const size = Math.max(r.width, r.height) * 2.1;
    const x = (ev && ev.clientX ? ev.clientX - r.left : r.width / 2) - size / 2;
    const y = (ev && ev.clientY ? ev.clientY - r.top : r.height / 2) - size / 2;

    const cs = getComputedStyle(host);
    if (cs.position === "static") host.style.position = "relative";
    const radius = cs.overflow === "hidden" ? "999px" : cs.borderRadius;

    const el = document.createElement("span");
    el.className = "lu-ripple";
    el.style.cssText = `
      position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;
      border-radius:50%;pointer-events:none;z-index:0;
      background:radial-gradient(circle, rgba(255,255,255,.45), rgba(255,255,255,.12) 55%, transparent 72%);
      opacity:0;mix-blend-mode:screen;`;
    host.appendChild(el);

    const anim = el.animate(
      [
        { transform: "scale(.18)", opacity: 0 },
        { transform: "scale(.55)", opacity: 1, offset: 0.22 },
        { transform: "scale(1)", opacity: 0 }
      ],
      { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
    );
    anim.onfinish = () => el.remove();

    // delikatne „wciśnięcie” całego elementu
    if (!host.dataset.noPress) {
      host.animate(
        [{ transform: "scale(1)" }, { transform: "scale(.975)", offset: .35 }, { transform: "scale(1)" }],
        { duration: 420, easing: EASE }
      );
    }
    void radius;
  }

  document.addEventListener("pointerdown", e => {
    const host = e.target.closest(RIPPLE_SEL);
    if (host) ripple(host, e);
  }, { passive: true });

  /* ---------------- sprężyste wejście kart i list ---------------- */
  const POP_SEL = ".app, .dock-app, .qs, .notif, .row, .start-app, .recent, .file, .sp-track, .win-desk-icon";

  function popIn(root) {
    const items = Array.from(root.querySelectorAll(POP_SEL)).filter(el => !el.dataset.popped);
    items.forEach((el, i) => {
      el.dataset.popped = "1";
      el.animate(
        [
          { opacity: 0, transform: "translateY(10px) scale(.96)" },
          { opacity: 1, transform: "translateY(0) scale(1)" }
        ],
        { duration: 440, delay: Math.min(i * 18, 260), easing: EASE, fill: "backwards" }
      );
    });
  }

  // obserwujemy pojawianie się nowych warstw (panele, szuflada, aplikacje, okna)
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches && (node.matches(".a-app, .a-panel, .a-drawer, .win-window, .start-menu") ||
            node.querySelector && node.querySelector(".app, .qs, .sp-track"))) {
          popIn(node);
          if (node.matches(".a-app, .win-window")) {
            node.animate(
              [{ opacity: 0, transform: "translateY(18px) scale(.97)" }, { opacity: 1, transform: "none" }],
              { duration: 460, easing: EASE }
            );
          }
        }
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });

  /* ---------------- przejścia między widokami ---------------- */
  const stage = document.getElementById("stage");
  function animateView(el) {
    if (!el) return;
    el.animate(
      [
        { opacity: 0, transform: "translateY(16px) scale(.97)", filter: "blur(6px)" },
        { opacity: 1, transform: "none", filter: "blur(0)" }
      ],
      { duration: 560, easing: EASE }
    );
  }

  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      requestAnimationFrame(() => {
        const v = stage.dataset.view;
        const target = v === "all" ? stage.querySelectorAll(".device") : stage.querySelectorAll(`.device--${v}`);
        target.forEach((d, i) => {
          d.animate(
            [
              { opacity: 0, transform: "translateY(22px) scale(.95)" },
              { opacity: 1, transform: "none" }
            ],
            { duration: 620, delay: i * 60, easing: EASE }
          );
        });
      });
    });
  });

  /* ---------------- magnetyczne podświetlenie pod kursorem ---------------- */
  document.addEventListener("pointermove", e => {
    const el = e.target.closest(".app, .tb-icon, .qs, .start-app");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5;
    const py = (e.clientY - r.top) / r.height - .5;
    el.style.transform = `perspective(420px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-2px)`;
  }, { passive: true });

  document.addEventListener("pointerout", e => {
    const el = e.target.closest(".app, .tb-icon, .qs, .start-app");
    if (!el) return;
    el.style.transform = "";
  }, { passive: true });

  /* ---------------- płynne otwieranie aplikacji Androida ---------------- */
  // warstwy .a-app mają już transition w CSS; tu dodajemy efekt „skali z ikony”
  document.addEventListener("click", e => {
    const appBtn = e.target.closest("[data-app]");
    if (!appBtn) return;
    const screen = appBtn.closest("[data-android]");
    if (!screen) return;
    const layer = screen.querySelector(".a-apps");
    if (!layer) return;
    const iconEl = appBtn.querySelector(".bi, .app__icon, .ico");
    if (!iconEl) return;
    const ir = iconEl.getBoundingClientRect();
    const sr = screen.getBoundingClientRect();
    layer.animate(
      [
        { opacity: 0, transform: `translate(${ir.left - sr.left + ir.width / 2 - sr.width / 2}px, ${ir.top - sr.top + ir.height / 2 - sr.height / 2}px) scale(.06)` },
        { opacity: 1, transform: "none" }
      ],
      { duration: 520, easing: EASE }
    );
  }, true);

  /* ---------------- miękkie przewijanie stron launchera ---------------- */
  document.querySelectorAll(".launcher-pages").forEach(p => {
    p.style.scrollBehavior = "smooth";
  });

  /* ---------------- suwaki: płynne wypełnienie ---------------- */
  document.querySelectorAll(".slider").forEach(s => {
    const paint = () => s.style.setProperty("--v", s.value + "%");
    s.addEventListener("input", paint);
    paint();
  });

  /* ---------------- Windows: płynne minimalizowanie/maksymalizowanie ---------------- */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".win-ctrl button");
    if (!btn) return;
    const win = btn.closest(".win-window");
    if (!win) return;
    if (btn.classList.contains("max")) {
      win.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.012)" }, { transform: "scale(1)" }],
        { duration: 380, easing: EASE }
      );
    }
  }, true);

  window.Lumino = window.Lumino || {};
  window.Lumino.animateView = animateView;
})();
