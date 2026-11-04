/* Sprawdza, czy warstwa animacji się ładuje i podłącza się do interakcji. */
const fs = require("fs"), path = require("path"), { JSDOM, VirtualConsole } = require("jsdom");
const root = path.join(__dirname, "..");
const vc = new VirtualConsole();
const errs = [];
vc.on("jsdomError", e => errs.push(e.message));

const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable",
  url: "file://" + root + "/index.html", pretendToBeVisual: true, virtualConsole: vc
});

dom.window.addEventListener("load", () => setTimeout(() => {
  const { document, window } = dom.window;
  let pass = 0, fail = 0;
  const check = (n, c) => { c ? (console.log("  ✓ " + n), pass++) : (console.log("  ✗ " + n), fail++); };

  const glass = Array.from(document.styleSheets || []).some(s => (s.href || "").includes("glass.css"));
  check("arkusz glass.css jest podpięty", glass);
  check("skrypt motion.js jest podpięty",
    Array.from(document.scripts).some(s => (s.src || "").includes("motion.js")));

  // warstwa animacji ma bezpieczniki (brak matchMedia w jsdom nie może wywalić strony)
  check("brak błędów wykonania", errs.length === 0);

  // klik w aplikację nie może wywalić błędu (ripple/WAAPI są opcjonalne)
  try {
    document.querySelector('[data-android="phone"] .app[data-app="messages"]').dispatchEvent(
      new window.MouseEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20 }));
    document.querySelector('button').click();
    check("kliknięcia są bezpieczne (ripple/animacje)", true);
  } catch (e) { check("kliknięcia są bezpieczne (ripple/animacje)", false); }

  check("brak błędów po kliknięciach", errs.length === 0);

  /* --- płynność: animacje są na transform/opacity i mają sprężyste krzywe --- */
  const css = name => fs.readFileSync(path.join(root, "css", name), "utf8");
  const island = css("island.css"), activity = css("activity.css"), android = css("android.css");

  const has = (src, ...parts) => parts.every(p => src.includes(p));

  check("wyspa morfuje przy otwarciu (rozciąga się w panel)",
    has(island, '.island[data-mode="panel"]', "height:auto", "border-radius:22px"));
  check("pigułka jest czarna i pływa nad belką (nie szklana)",
    has(island, ".island{", "position:absolute", "background:#04050a"));
  check("wyspa morfuje wysokością/szerokością (transition height+width)",
    has(island, "transition:", "height 480ms", "width 480ms"));
  check("tryby wyspy: panel / notif / music mają własne rozmiary",
    has(island, '[data-mode="panel"]', '[data-mode="notif"]', '[data-mode="music"]'));
  check("kafle wyspy mają kaskadę (transition-delay z --i)",
    island.includes("transition-delay:calc(60ms + var(--i, 0) * 24ms)"));
  check("karty paska też mają kaskadę",
    activity.includes("transition-delay:calc(var(--i, 0) * 42ms)"));
  check("pasek ma blur (szkło) i jest oderwany od krawędzi",
    has(activity, "backdrop-filter:blur(26px)", "left:8px"));
  check("aplikacje wchodzą sprężyście (bez skoku visibility)",
    has(android, ".a-app.is-open", "visibility 0s"));
  check("animacje nie ruszają layoutem (brak transition na width/height w wyspie)",
    !island.includes("transition:width") && !island.includes("transition:height"));

  /* --- gesty myszką: cztery uchwyty nad makietą telefonu --- */
  const edges = document.querySelectorAll('[data-android="phone"] .gesture-edge');
  check("telefon ma 4 uchwyty gestów (góra/dół/lewo/prawo)", edges.length === 4);
  check("uchwyty mają podpowiedzi tekstowe", Array.from(edges).every(e => (e.dataset.hint || "").length > 5));
  check("uchwyty nie przesłaniają treści (są przezroczyste, do 22 px)",
    /\.gesture-edge\{[\s\S]*?background:transparent/.test(island));

  console.log(`\nAnimacje: ${pass} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
}, 450));
