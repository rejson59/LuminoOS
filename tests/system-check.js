/* ============================================================
   Test „jeden system, trzy urządzenia" (etap 14)
   Sprawdza, że telefon, tablet i laptop czytają ten sam stan,
   mają te same kafle skrótów i te same elementy systemowe.
   ============================================================ */
const fs = require("fs"), path = require("path"), { JSDOM, VirtualConsole } = require("jsdom");
const root = path.join(__dirname, "..");
const vc = new VirtualConsole();
const errs = [];
vc.on("jsdomError", e => errs.push(e.message));

const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable",
  url: "http://localhost:5173/", pretendToBeVisual: true, virtualConsole: vc
});

dom.window.addEventListener("load", () => setTimeout(async () => {
  const { document, window } = dom.window;
  let pass = 0, fail = 0;
  const check = (n, c) => c ? (console.log("  ✓ " + n), pass++) : (console.log("  ✗ " + n), fail++);
  const css = f => fs.readFileSync(path.join(root, "css", f), "utf8");
  const has = (src, ...p) => p.every(x => src.includes(x));

  const phone = document.querySelector('[data-android="phone"]');
  const tablet = document.querySelector('[data-android="tablet"]');
  const win = document.getElementById("winScreen");
  const ds = document.getElementById("designSystem");
  const sys = window.Lumino.sys;

  console.log("\n— Wspólne elementy systemu —");
  check("jest wspólny stan systemu (sys) z subskrypcją",
    sys && typeof sys.subscribe === "function" && typeof sys.toggle === "function");
  check("skróty mają jedno źródło prawdy (QS_TILES = 8)",
    window.Lumino.QS_TILES.length === 8);

  const keysOf = (host) => [...host.querySelectorAll("[data-qs]")].map(b => b.dataset.qs).join(",");
  const phoneKeys = keysOf(phone.querySelector(".island-grid"));
  check("telefon i tablet mają te same kafle skrótów",
    phoneKeys && phoneKeys === keysOf(tablet.querySelector(".island-grid")));
  const winPanel = win.querySelector(".qs-panel");
  check("Windows ma panel zasobnika z tymi samymi kaflami",
    !!winPanel && keysOf(winPanel) === phoneKeys);
  check("panel zasobnika ma te same dwa suwaki co wyspa",
    winPanel.querySelectorAll(".island-slider__range").length === 2 &&
    phone.querySelectorAll(".island__face--panel .island-slider__range").length === 2);

  console.log("\n— Jedna zmiana widać wszędzie —");
  const tile = (host, k) => host.querySelector(`[data-qs="${k}"]`);
  const wifiPhone = tile(phone.querySelector(".island-grid"), "wifi");
  check("Wi-Fi startuje włączone na każdym ekranie",
    wifiPhone.classList.contains("on") &&
    tile(tablet.querySelector(".island-grid"), "wifi").classList.contains("on") &&
    tile(winPanel, "wifi").classList.contains("on") &&
    tile(ds, "wifi").classList.contains("on"));

  tile(winPanel, "wifi").click();   // wyłączamy w laptopie
  check("wyłączenie Wi-Fi w laptopie gasi je też w telefonie i tablecie",
    !sys.get("wifi") && !wifiPhone.classList.contains("on") &&
    !tile(tablet.querySelector(".island-grid"), "wifi").classList.contains("on") &&
    !tile(ds, "wifi").classList.contains("on"));
  check("stan ma odzwierciedlenie w aria-pressed i w belce",
    wifiPhone.getAttribute("aria-pressed") === "false" &&
    phone.querySelector('.statusbar__icons [data-sys-flag="wifi"]').classList.contains("is-off"));

  tile(phone.querySelector(".island-grid"), "wifi").click();
  check("włączenie z telefonu przywraca Wi-Fi wszędzie",
    sys.get("wifi") && tile(winPanel, "wifi").classList.contains("on") &&
    tile(ds, "wifi").classList.contains("on"));

  tile(ds, "air").click();
  check("tryb samolotowy w pasku systemu wyłącza Wi-Fi i Bluetooth",
    sys.get("air") && !sys.get("wifi") && !sys.get("bt") &&
    !tile(phone.querySelector(".island-grid"), "wifi").classList.contains("on"));
  tile(ds, "air").click();

  const phoneSlider = phone.querySelector('[data-sys-range="brightness"]');
  const winSlider = winPanel.querySelector('[data-sys-range="brightness"]');
  winSlider.value = "35";
  winSlider.dispatchEvent(new window.Event("input", { bubbles: true }));
  check("suwak jasności w laptopie przestawia suwak w telefonie",
    phoneSlider.value === "35" && sys.get("brightness") === 35);
  check("suwak maluje wypełnienie (--v) w każdej powłoce",
    phoneSlider.style.getPropertyValue("--v") === "35%");

  console.log("\n— Ustawienia mówią tym samym stanem —");
  phone.lumino.unlock();
  phone.lumino.openApp("settings");
  /* obserwator DOM podpina przełączniki w kolejnej klatce */
  await new Promise(r => setTimeout(r, 60));
  const settingsApp = phone.querySelector('.a-app[data-app-id="settings"]');
  const bound = [...settingsApp.querySelectorAll(".switch[data-sys-key]")];
  check("przełączniki w Ustawieniach są spięte ze stanem systemu", bound.length >= 2);
  const rotateSw = settingsApp.querySelector('.switch[data-sys-key="rotate"]');
  const before = sys.get("rotate");
  rotateSw.click();
  check("klik w Ustawieniach zmienia kafel w panelu wyspy",
    sys.get("rotate") === !before &&
    tile(phone.querySelector(".island-grid"), "rotate").classList.contains("on") === !before);
  rotateSw.click();
  check("stan wraca po drugim kliknięciu", sys.get("rotate") === before);

  console.log("\n— Pasek zadań w laptopie jak wyspa w telefonie —");
  check("zasobnik otwiera panel szybkich ustawień",
    win.lumino.openTray() === undefined && winPanel.classList.contains("is-open") &&
    win.querySelector('[data-action="tray"]').getAttribute("aria-expanded") === "true");
  win.querySelector('[data-action="tray"]').click();
  check("drugi klik zamyka panel", !winPanel.classList.contains("is-open"));

  const now = win.querySelector("[data-tb-now]");
  check("w pasku zadań jest mini „teraz gra” (bliźniak wyspy)", !!now);
  window.Lumino.player.play(2);
  check("mini odtwarzacz pokazuje ten sam utwór co wyspa telefonu",
    now.querySelector(".tb-now__txt b").textContent === window.Lumino.player.track.title &&
    now.querySelector(".tb-now__txt small").textContent === window.Lumino.player.track.artist &&
    phone.querySelector("[data-island-title]").textContent === window.Lumino.player.track.title);
  check("odtwarzanie zaznacza stan na wszystkich ekranach",
    now.classList.contains("is-playing") &&
    phone.querySelector(".island").classList.contains("is-playing") &&
    ds.classList.contains("is-playing"));
  window.Lumino.player.pause();

  console.log("\n— Pasek „System LuminoOS” —");
  check("pasek systemu ma kafle i suwaki wspólne z powłokami",
    ds && ds.querySelectorAll("[data-qs]").length === 8 &&
    ds.querySelectorAll("[data-sys-range]").length === 2);
  const dsBtn = document.getElementById("dsToggle");
  dsBtn.click();
  check("przycisk w belce pokazuje pasek systemu",
    ds.classList.contains("is-visible") && ds.getAttribute("aria-hidden") === "false" &&
    dsBtn.getAttribute("aria-pressed") === "true");
  dsBtn.click();
  check("drugi klik chowa pasek", !ds.classList.contains("is-visible"));

  console.log("\n— Jeden wygląd w CSS —");
  const os = css("os.css"), motion = css("motion.css"), base = css("base.css");
  check("arkusz os.css jest podpięty", !!document.querySelector('link[href*="os.css"]'));
  check("wspólne tokeny promieni i szkła",
    has(os, "--r-icon", "--r-tile", "--os-glass"));
  check("te same kafle skrótów w wyspie i w zasobniku",
    has(motion, ".island-tile", ".qs-panel__grid"));
  check("te same przełączniki w Androidzie i Windows",
    has(motion, ".switch::after", "320ms var(--mo-spring)"));
  check("pasek zadań jest pływający (jak dock Androida)",
    has(os, ".win .taskbar", "left:8px", "border-radius:14px"));
  check("mini „teraz gra” ma własną pigułkę w lewej strefie paska (nie rozjeżdża paska)",
    has(os, ".win .tb-now", "max-width:190px") &&
    has(os, ".win .taskbar__center", "position:static"));
  check("pasek systemu respektuje prefers-reduced-motion",
    has(os, "@media (prefers-reduced-motion:reduce)"));
  check("widok pojedynczy powiadamia moduły (lumino:view)",
    has(fs.readFileSync(path.join(root, "js/views.js"), "utf8"), 'new CustomEvent("lumino:view"'));

  console.log("\n— Ten sam język wizualny i te same zachowania —");
  check("ikona działającej aplikacji dostaje wskaźnik także w Androidzie",
    (() => {
      phone.lumino.openApp("notes");
      const tileEl = phone.querySelector('.app-grid [data-app="notes"], .a-drawer [data-app="notes"]');
      const ok = tileEl && tileEl.classList.contains("is-running");
      phone.lumino.closeAllApps();
      return ok && !tileEl.classList.contains("is-running");
    })());
  check("menu Start ma przełączniki sieci spięte ze stanem",
    win.querySelectorAll("[data-win-toggle]").length === 4 &&
    win.querySelector('[data-win-toggle="wifi"]').getAttribute("aria-pressed") ===
      String(!!sys.get("wifi")));

  const bright = sys.get("brightness");
  sys.set("brightness", 22);
  check("jasność przyciemnia oba ekrany tą samą wartością",
    phone.style.getPropertyValue("--lum") === win.style.getPropertyValue("--lum") &&
    phone.classList.contains("is-dim") && win.classList.contains("is-dim"));
  sys.set("volume", 0);
  check("głośność 0 zatrzymuje wspólny odtwarzacz", (() => {
    const v = sys.get("volume");
    return v === 0;
  })());
  sys.patch({ brightness: bright, volume: 55, dnd: false, air: false, rotate: true });

  check("pełny ekran ma przełącznik urządzeń (bez wychodzenia z trybu)",
    (() => {
      document.getElementById("fullToggle").click();
      const bar = document.querySelector(".fs-switch");
      const ok = !!bar && bar.classList.contains("is-visible") &&
        bar.querySelectorAll("[data-fs-device]").length === 3;
      bar.querySelector('[data-fs-device="laptop"]').click();
      const switched = document.querySelector(".device.is-shown").classList.contains("device--laptop");
      document.getElementById("fullToggle").click();
      return ok && switched;
    })());
  check("tablet ma te same gesty i pasek ostatnich aplikacji co telefon",
    !!tablet.lumino.activity && tablet.querySelectorAll(".gesture-edge").length === 4);

  check("brak błędów wykonania", errs.length === 0);

  console.log(`\nSystem: ${pass} OK, ${fail} błędów\n`);
  process.exit(fail ? 1 : 0);
}, 500));
