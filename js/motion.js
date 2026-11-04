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

  /* ---------------- płynny „pill" pod aktywną zakładką ---------------- */
  /* Jedna szklana pigułka, która przejeżdża między zakładkami (transform),
     zamiast migającego tła na każdym przycisku. */
  function buildViewPill() {
    const group = document.querySelector(".viewbar__group");
    if (!group || typeof group.appendChild !== "function") return;
    if (group.querySelector(".viewbar__pill")) return;
    const pill = document.createElement("span");
    pill.className = "viewbar__pill";
    pill.setAttribute("aria-hidden", "true");
    group.prepend(pill);

    const move = (animate) => {
      const active = group.querySelector(".viewbtn.is-active");
      if (!active || !active.offsetWidth) { pill.style.opacity = "0"; return; }
      const g = group.getBoundingClientRect();
      const a = active.getBoundingClientRect();
      pill.style.opacity = "1";
      pill.style.width = a.width + "px";
      pill.style.height = a.height + "px";
      if (!animate) pill.style.transition = "none";
      pill.style.transform =
        `translate(${(a.left - g.left).toFixed(1)}px, ${(a.top - g.top).toFixed(1)}px)`;
      if (!animate) {
        /* wymuś klatkę, żeby powrót do transition był animowany */
        void pill.offsetWidth;
        pill.style.transition = "";
      }
    };

    move(false);
    group.querySelectorAll(".viewbtn").forEach(b => {
      b.addEventListener("click", () => requestAnimationFrame(() => move(true)));
    });
    window.addEventListener("resize", () => move(false), { passive: true });
  }
  buildViewPill();

  /* ---------------- ripple ---------------- */
  function ripple(host, ev) {
    if (host.dataset.noRipple !== undefined) return;
    /* rozmiar bierzemy z cache (offsetWidth jest tani — nie wymusza pełnego
       przeliczania stylów tak jak getBoundingClientRect w pętli) */
    const w = host.offsetWidth, h = host.offsetHeight;
    if (!w || !h) return;
    const r = { width: w, height: h, left: 0, top: 0 };

    const size = Math.max(w, h) * 2.1;
    let x = w / 2 - size / 2, y = h / 2 - size / 2;
    if (ev && ev.clientX) {
      const b = host.getBoundingClientRect();
      x = ev.clientX - b.left - size / 2;
      y = ev.clientY - b.top - size / 2;
    }
    if (getComputedStyle(host).position === "static") host.style.position = "relative";

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
  }

  document.addEventListener("pointerdown", e => {
    const host = e.target.closest(RIPPLE_SEL);
    if (host) ripple(host, e);
  }, { passive: true });

  /* ---------------- sprężyste wejście kart i list ---------------- */
  const POP_SEL = ".app, .dock-app, .qs, .notif, .row, .start-app, .recent, .file, .sp-track, .win-desk-icon";

  /* ---------------- okna: zamykanie i minimalizacja płyną ---------------- */
  /* WAAPI nie nadpisuje CSS-owej animacji wyjścia (ta jest w windows.js),
     ale minimalizacja dostaje „wdech" — okno najpierw lekko rośnie ku górze. */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".win-ctrl button");
    if (!btn || !btn.closest(".win-window")) return;
    const win = btn.closest(".win-window");
    if (btn.classList.contains("min") && typeof win.animate === "function") {
      win.animate(
        [{ transform: "none" }, { transform: "translateY(-4px) scale(1.008)", offset: .3 }, { transform: "none" }],
        { duration: 260, easing: EASE }
      );
    }
  }, true);

  function popIn(root) {
    const items = Array.from(root.querySelectorAll(POP_SEL)).filter(el => !el.dataset.popped);
    if (!items.length) return;
    /* maks. 16 elementów w jednej fali — reszta od razu w stanie końcowym */
    const wave = items.slice(0, 16);
    items.slice(16).forEach(el => { el.dataset.popped = "1"; });
    wave.forEach((el, i) => {
      el.dataset.popped = "1";
      el.animate(
        [
          { opacity: 0, transform: "translateY(10px) scale(.96)" },
          { opacity: 1, transform: "translateY(0) scale(1)" }
        ],
        { duration: 380, delay: Math.min(i * 14, 140), easing: EASE, fill: "backwards" }
      );
    });
  }

  // obserwujemy pojawianie się nowych warstw (panele, szuflada, aplikacje, okna)
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches && (node.matches(".a-app, .a-drawer, .win-window, .start-menu") ||
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
        { opacity: 0, transform: "translateY(12px) scale(.975)" },
        { opacity: 1, transform: "none" }
      ],
      { duration: 420, easing: EASE }
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
            { duration: 460, delay: i * 45, easing: EASE }
          );
        });
      });
    });
  });

  /* ---------------- magnetyczne podświetlenie pod kursorem ----------------
     Kursorem „przyciągamy” tylko ikonę wewnątrz kafla (.app__icon), a nie cały
     kafel — wcześniej nadpisywaliśmy transform kafla i psuło to jego własne
     animacje (hover/active z CSS). Ruch jest wygładzany (lerp) w jednej pętli
     rAF, więc nie ma „szarpania” i nie ma wymuszonych przeliczeń layoutu. */
  let magHost = null, magTarget = null, magRect = null, magRaf = 0, magEv = null;
  let magCur = { x: 0, y: 0 }, magGoal = { x: 0, y: 0 };

  /* tylko wewnętrzna ikona — nigdy sam kafel (jego transform należy do CSS) */
  function magPick(el) {
    if (!el) return null;
    return el.querySelector(".app__icon, .ico, .bi");
  }

  const MAG_SEL = ".app, .dock-app, .tb-icon, .start-app, .win-desk-icon";

  document.addEventListener("pointerover", e => {
    const host = e.target.closest(MAG_SEL);
    if (host === magHost) return;
    if (magTarget) magTarget.style.transform = "";
    magHost = host;
    magTarget = host ? magPick(host) : null;
    magRect = host && magTarget ? host.getBoundingClientRect() : null;
    magCur = { x: 0, y: 0 };
    magGoal = { x: 0, y: 0 };
  }, { passive: true });

  document.addEventListener("pointermove", e => {
    if (!magHost || !magRect) return;
    magEv = e;
    if (!magRaf) magRaf = requestAnimationFrame(magTick);
  }, { passive: true });

  function magTick() {
    magRaf = 0;
    if (!magHost || !magRect || !magTarget || !magEv) return;
    const px = (magEv.clientX - magRect.left) / magRect.width - .5;
    const py = (magEv.clientY - magRect.top) / magRect.height - .5;
    /* wygładzenie (0.22 = miękkie, ale responsywne) */
    magGoal = { x: px, y: py };
    magCur.x += (magGoal.x - magCur.x) * .22;
    magCur.y += (magGoal.y - magCur.y) * .22;
    magTarget.style.transform =
      `perspective(420px) rotateX(${(-magCur.y * 7).toFixed(2)}deg) ` +
      `rotateY(${(magCur.x * 9).toFixed(2)}deg) translateY(-2px) scale(1.04)`;
    /* dopóki jest różnica, animujemy dalej (płynne wyhamowanie) */
    if (Math.abs(magGoal.x - magCur.x) > .002 || Math.abs(magGoal.y - magCur.y) > .002) {
      magRaf = requestAnimationFrame(magTick);
    }
  }

  function magReset() {
    if (magTarget) magTarget.style.transform = "";
    magHost = null; magTarget = null; magRect = null;
  }
  document.addEventListener("pointerout", e => {
    const host = e.target.closest(MAG_SEL);
    if (!host || host !== magHost) return;
    magReset();
  }, { passive: true });
  /* kursor opuścił okno — ikona musi wrócić na miejsce */
  document.addEventListener("pointerleave", magReset, { passive: true });
  window.addEventListener("blur", magReset);

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
      { duration: 420, easing: EASE }
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
