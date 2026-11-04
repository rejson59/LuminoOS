/* ============================================================
   Test CONTINUITY + PULSE (etap 15)
   • przeciągnięcie ikony aplikacji na inne urządzenie otwiera ją tam
   • Pulse zbiera zdarzenia z całego systemu (aplikacje, stan, muzyka)
   ============================================================ */
const fs = require("fs"), path = require("path"), { JSDOM, VirtualConsole } = require("jsdom");
const root = path.join(__dirname, "..");
const vc = new VirtualConsole();
const errs = [];
vc.on("jsdomError", e => errs.push(e.message));
vc.on("error", e => errs.push(String(e)));

const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable",
  url: "http://localhost:5173/", pretendToBeVisual: true, virtualConsole: vc
});

const wait = ms => new Promise(r => setTimeout(r, ms));

dom.window.addEventListener("load", () => setTimeout(async () => {
  const { document, window } = dom.window;
  const L = window.Lumino;
  let pass = 0, fail = 0;
  const check = (n, c) => c ? (console.log("  ✓ " + n), pass++) : (console.log("  ✗ " + n), fail++);

  const phone = document.querySelector('[data-android="phone"]');
  const tablet = document.querySelector('[data-android="tablet"]');
  const win = document.getElementById("winScreen");
  const pulseEl = document.getElementById("pulse");

  console.log("\n— Continuity: ten sam system, przenoszenie aplikacji —");
  check("moduł ciągłości działa (API + mapa odpowiedników)",
    !!L.continuity && typeof L.continuity.openOn === "function" &&
    L.continuity.ALIAS.chrome === "edge" && L.continuity.ALIAS.edge === "chrome");
  check("Pulse jest w DOM i ma przycisk w belce",
    !!pulseEl && !!document.getElementById("pulseToggle") &&
    !!document.querySelector('link[href*="continuity.css"]'));

  /* przeniesienie: aplikacja z telefonu na tablet (odpowiednik 1:1) */
  phone.lumino.unlock();
  tablet.lumino.unlock();
  window.Lumino.player.pause();
  tablet.lumino.openApp("notes");
  tablet.lumino.closeAllApps();

  /* bezpośrednio API: telefon → tablet */
  L.continuity.openOn("tablet", "calculator");
  check("aplikacja otwarta na tablecie po przeniesieniu",
    !!tablet.querySelector('.a-app[data-app-id="calculator"]'));

  /* laptop: nazwa z Androida mapuje się na aplikację Windows */
  const okLaptop = L.continuity.openOn("laptop", "chrome");
  check("aplikacja z Androida otwiera odpowiednik w Windows (Chrome → Edge)",
    okLaptop && !!win.querySelector('[data-win="edge"]'));

  /* pełny gest: pointerdown + ruch + puszczenie nad tabletem */
  const srcTile = phone.querySelector('.page .app[data-app="camera"]');
  check("ikona aplikacji jest uchwytem przeciągania", !!srcTile);
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return r.width ? r : { left: 0, top: 0, width: 300, height: 600, right: 300, bottom: 600 };
  };
  /* jsdom nie liczy geometrii — podstawiamy strefy urządzeń */
  const zones = { phone: [0, 0, 300, 600], tablet: [400, 0, 700, 600], laptop: [800, 0, 1200, 600] };
  ["phone", "tablet", "laptop"].forEach(d => {
    const el = document.querySelector(`.device[data-device="${d}"]`);
    const [l, t, r, b] = zones[d];
    Object.defineProperty(el, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t, x: l, y: t })
    });
  });
  Object.defineProperty(srcTile, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ left: 10, top: 10, right: 50, bottom: 50, width: 40, height: 40, x: 10, y: 10 })
  });
  const pe = (type, x, y) => new window.PointerEvent(type, {
    bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 3, pointerType: "mouse", button: 0
  });
  srcTile.dispatchEvent(pe("pointerdown", 30, 30));
  window.dispatchEvent(pe("pointermove", 60, 120));
  const ghost = document.querySelector(".cont-ghost");
  check("przeciąganie pokazuje unoszącą się ikonę", !!ghost);
  window.dispatchEvent(pe("pointermove", 520, 300));
  window.dispatchEvent(pe("pointermove", 521, 301));
  const tabletDevice = document.querySelector('.device[data-device="tablet"]');
  check("makieta docelowa podświetla się jako strefa upuszczenia",
    tabletDevice.classList.contains("is-drop-target"));
  check("podświetlona jest tylko makieta docelowa (jedna)",
    document.querySelectorAll(".device.is-drop-target").length === 1);
  window.dispatchEvent(pe("pointerup", 520, 300));
  await wait(60);
  check("puszczenie na tablecie otwiera tam aplikację",
    !!tablet.querySelector('.a-app[data-app-id="camera"]'));
  await wait(520);
  check("po upuszczeniu nie zostaje duch ani podświetlenie",
    !document.querySelector(".cont-ghost") && !tabletDevice.classList.contains("is-drop-target"));

  console.log("\n— Pulse: dziennik zdarzeń całego systemu —");
  const toggle = document.getElementById("pulseToggle");
  toggle.click();
  check("przycisk Pulse pokazuje dziennik",
    pulseEl.classList.contains("is-visible") && toggle.getAttribute("aria-pressed") === "true");
  const rows = () => [...pulseEl.querySelectorAll(".pulse__row")];
  check("dziennik ma wpisy (start + przeniesienie)",
    rows().length > 0 && rows().some(r => /przeniesione/i.test(r.textContent)));
  check("wpis o przeniesieniu ma własny kolor kropki",
    !!pulseEl.querySelector(".pulse__dot--move"));

  phone.lumino.openApp("settings");
  await wait(40);
  check("otwarcie aplikacji trafia do dziennika",
    rows().some(r => /Ustawienia/.test(r.textContent)));
  L.sys.toggle("dnd");
  await wait(20);
  check("zmiana stanu systemu trafia do dziennika (wszystkie ekrany)",
    rows().some(r => /Nie przeszkadzać/.test(r.textContent)));
  L.sys.toggle("dnd");

  L.player.play(3);
  await wait(30);
  check("muzyka trafia do dziennika",
    rows().some(r => /Muzyka:/.test(r.textContent)));
  L.player.pause();

  toggle.click();
  check("drugi klik chowa dziennik",
    !pulseEl.classList.contains("is-visible") && toggle.getAttribute("aria-pressed") === "false");

  console.log("\n— Znacznik wspólnej sesji —");
  L.player.pause();
  phone.lumino.openApp("notes");
  L.continuity.openOn("tablet", "notes");
  await wait(40);                       /* aplikacja na tablecie dojeżdża w DOM */
  L.continuity.paintShared();
  await wait(120);
  const sharedTags = [...document.querySelectorAll("[data-cont-shared]")];
  const sharedOk = sharedTags.length >= 1;
  check("ta sama aplikacja na dwóch ekranach dostaje wspólny znacznik", sharedOk);
  check("znacznik pokazuje nazwę wspólnej aplikacji",
    sharedOk && /Notatki|notat/i.test(sharedTags.map(t => t.textContent).join(" ")));
  phone.lumino.closeAllApps();
  tablet.lumino.closeAllApps();
  await wait(120);
  check("po zamknięciu aplikacji znacznik znika",
    document.querySelectorAll("[data-cont-shared]").length === 0);

  console.log("\n— Jakość —");
  const cssTxt = fs.readFileSync(path.join(root, "css/continuity.css"), "utf8");
  check("przeciąganie i iskra idą tylko na transform/opacity",
    /@keyframes cont-spark[\s\S]{0,120}scale\(/.test(cssTxt) &&
    !/transition:[^;}]*\b(width|height|left|top)\b/.test(cssTxt));
  check("respektuje prefers-reduced-motion",
    cssTxt.includes("@media (prefers-reduced-motion:reduce)"));
  check("brak błędów wykonania", errs.length === 0);
  if (errs.length) console.log("      " + errs.join(" | "));

  console.log(`\nContinuity: ${pass} OK, ${fail} błędów\n`);
  process.exit(fail ? 1 : 0);
}, 550));
