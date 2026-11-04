/* ============================================================
   LuminoOS — spinacz: JEDEN system na trzech urządzeniach
   • wspólny stan (sys) → wyspa Androida, Ustawienia, panel zasobnika
   • wspólne przejścia: telefon → tablet → laptop (te same krzywe)
   • pasek „System LuminoOS" pod przełącznikiem podglądów:
     te same kafle, suwaki i przełączniki co w powłokach, więc widać
     na żywo, że wszystkie ekrany to jedno urządzenie-system
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, icon, sys, qsGrid, qsSliders, player, clamp } = window.Lumino;
  /* referencja do paska systemu musi istnieć ZANIM pierwszy subscriber
     zawoła paintDs() — inaczej TDZ przy starcie */
  const ds = document.getElementById("designSystem");

  const reduce = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* ------------------------------------------------------------
     1. Przejścia między powłokami a wspólnym stanem
     ------------------------------------------------------------ */
  /* Powiadomienie systemowe trafia do WSZYSTKICH ekranów naraz —
     jak w prawdziwym systemie z jedną chmurą powiadomień. */
  function broadcast(title, text, appId) {
    $$("[data-android]").forEach(screen => {
      if (screen.lumino && screen.lumino.pushNotification) {
        screen.lumino.pushNotification(appId || "messages", title, text);
      }
    });
  }
  window.Lumino.broadcast = window.Lumino.broadcast || broadcast;

  /* Przełączniki w aplikacji „Ustawienia" (Android i Windows) mówią tym
     samym stanem co wyspa: klik w Ustawieniach zmienia też kafel w panelu. */
  const SETTING_MAP = {
    "auto-obrót": "rotate",
    "oszczędzanie": "saver",
    "dźwięki": "sounds",
    "nie przeszkadzać": "dnd",
    "bluetooth": "bt",
    "tryb ciemny": "dark",
    "powiadomienia": "notifications",
    "oszczędzanie energii": "saver"
  };
  function keyFor(label) {
    const t = (label || "").toLowerCase();
    for (const k in SETTING_MAP) if (t.includes(k)) return SETTING_MAP[k];
    return null;
  }

  function bindSwitches(root) {
    $$(".switch", root).forEach(sw => {
      if (sw.dataset.sysBound) return;
      const setting = sw.closest(".setting, .set-card");
      const label = setting ? setting.textContent.trim() : "";
      const key = keyFor(label);
      sw.dataset.sysBound = "1";
      if (!key) {
        /* bez mapowania: zwykły przełącznik lokalny (zachowanie jak dotąd) */
        sw.addEventListener("click", () => {
          const on = sw.getAttribute("aria-checked") !== "true";
          sw.setAttribute("aria-checked", String(on));
        });
        return;
      }
      sw.dataset.sysKey = key;
      sw.setAttribute("aria-checked", String(!!sys.get(key)));
      sw.addEventListener("click", () => sys.toggle(key));
    });
  }

  /* malowanie przełączników + suwaków w aplikacjach Androida/Windows */
  function paintAppSwitches() {
    $$(".switch[data-sys-key]").forEach(sw => {
      sw.setAttribute("aria-checked", String(!!sys.get(sw.dataset.sysKey)));
    });
  }
  sys.subscribe(() => {
    paintAppSwitches();
    paintDs();
  });

  new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && n.querySelector && n.querySelector(".switch")) bindSwitches(n);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
  bindSwitches(document);

  /* ------------------------------------------------------------
     2. Pasek „System LuminoOS" — jeden zestaw kontrolek dla całości
     ------------------------------------------------------------ */
  if (ds) {
    ds.innerHTML = `
      <div class="ds__inner">
        <div class="ds__intro">
          <span class="ds__mark" aria-hidden="true"></span>
          <div>
            <b>LuminoOS — jeden system</b>
            <small>Telefon, tablet i laptop czytają ten sam stan. Zmień cokolwiek tutaj — zmieni się na każdym ekranie.</small>
          </div>
        </div>
        <div class="ds__group ds__group--sliders">
          <h4>Jasność i głośność</h4>
          <div class="island-sliders">${qsSliders()}</div>
        </div>
        <div class="ds__group ds__group--tiles">
          <h4>Skróty</h4>
          <div class="island-grid ds__grid">${qsGrid("island-tile")}</div>
        </div>
        <div class="ds__group ds__group--devices">
          <h4>Wszędzie to samo</h4>
          <div class="ds__devices">
            <span class="ds__dev" data-ds-dev="phone">Telefon</span>
            <span class="ds__dev" data-ds-dev="tablet">Tablet</span>
            <span class="ds__dev" data-ds-dev="laptop">Laptop</span>
          </div>
        </div>
      </div>`;

    /* kafle i suwaki w pasku mówią dokładnie tym samym stanem */
    $$("[data-qs]", ds).forEach(b => b.addEventListener("click", () => sys.toggle(b.dataset.qs)));
    $$("[data-sys-range]", ds).forEach(r => {
      r.addEventListener("input", () => sys.set(r.dataset.sysRange, Number(r.value)), { passive: true });
    });
  }

  function paintDs() {
    if (!ds) return;
    $$("[data-qs]", ds).forEach(b => {
      const on = !!sys.get(b.dataset.qs);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $$("[data-sys-range]", ds).forEach(r => {
      const v = sys.get(r.dataset.sysRange);
      if (String(r.value) !== String(v)) r.value = v;
      r.style.setProperty("--v", v + "%");
    });
    ds.classList.toggle("is-dnd", !!sys.get("dnd"));
    $$("[data-ds-dev]", ds).forEach(el => {
      const k = el.dataset.dsDev;
      el.classList.toggle("is-on", document.body.dataset.view === "all" || document.body.dataset.view === k);
    });
    /* „muzyka gra" — ten sam odtwarzacz na wszystkich ekranach */
    ds.classList.toggle("is-playing", !!player.playing);
  }
  sys.subscribe(paintDs);
  if (player && player.subscribe) player.subscribe(paintDs);
  paintDs();

  /* przycisk w belce: pokaż / schowaj pasek systemu */
  const dsBtn = document.getElementById("dsToggle");
  if (dsBtn && ds) {
    const setDs = (on) => {
      ds.classList.toggle("is-visible", on);
      ds.setAttribute("aria-hidden", String(!on));
      dsBtn.setAttribute("aria-pressed", String(on));
      dsBtn.classList.toggle("is-active", on);
      try { localStorage.setItem("lumino.ds", on ? "1" : "0"); } catch (e) { /* file:// */ }
    };
    let saved = null;
    try { saved = localStorage.getItem("lumino.ds"); } catch (e) { /* ignorujemy */ }
    setDs(saved === "1");
    dsBtn.addEventListener("click", () => setDs(!ds.classList.contains("is-visible")));
  }

  /* ------------------------------------------------------------
     3. Wspólne przejścia (jedna krzywa dla każdej zmiany ekranu)
     ------------------------------------------------------------ */
  const EASE = "cubic-bezier(.34,1.42,.64,1)";
  const OUT = "cubic-bezier(.22,1,.36,1)";

  /* aplikacja Androida: wejście z lekkim „dociśnięciem" (ta sama krzywa
     co okna Windows i panel wyspy), obsługiwane raz dla wszystkich ekranów */
  new MutationObserver(muts => {
    if (reduce) return;
    muts.forEach(m => {
      const el = m.target;
      if (!el.classList || !el.classList.contains("a-app")) return;
      if (!el.classList.contains("is-open")) return;
      if (el.dataset.osEntered) return;
      el.dataset.osEntered = "1";
      if (typeof el.animate !== "function") return;
      el.animate(
        [
          { opacity: 0, transform: "translateY(14px) scale(.985)" },
          { opacity: 1, transform: "none" }
        ],
        { duration: 340, easing: OUT, fill: "backwards" }
      );
    });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

  /* okna Windows: przy zmianie fokusu delikatne „uniesienie" — spójne z kartami */
  const winScreen = document.getElementById("winScreen");
  if (winScreen) {
    winScreen.addEventListener("click", e => {
      if (reduce) return;
      const w = e.target.closest(".win-window");
      if (!w || typeof w.animate !== "function") return;
      if (w === winScreen._osFocus) return;
      winScreen._osFocus = w;
      w.animate(
        [{ transform: "none" }, { transform: "translateY(-2px)", offset: .35 }, { transform: "none" }],
        { duration: 280, easing: EASE }
      );
    });
  }

  /* ------------------------------------------------------------
     4. Skala powłok na dużym ekranie — makieta nie „pływa" w pustce
     ------------------------------------------------------------ */
  /* os.css ustawia --stage-scale; tutaj tylko pilnujemy, żeby po zmianie
     rozmiaru okna nie została wartość z poprzedniego układu. */
  const html = document.documentElement;
  function fitStage() {
    if (html.classList.contains("is-fullscreen")) return;
    const v = document.body.dataset.view;
    html.classList.toggle("os-solo", v === "phone" || v === "tablet" || v === "laptop");
    html.classList.toggle("os-all", v === "all");
  }
  fitStage();
  document.addEventListener("lumino:view", fitStage);
  window.addEventListener("resize", () => requestAnimationFrame(fitStage), { passive: true });

  window.Lumino.os = { sys, broadcast, paintDs };
})();
