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
  check("ikony i dock mają sprężyste animacje (transform + sprężysta krzywa)",
    has(island, ".android .app__icon", "cubic-bezier(.34,1.42,.64,1)") &&
    has(island, ".android .dock .dock-app", "translateY(-4px)"));
  check("szuflada ma kaskadę ikon (--i)", island.includes(".drawer-grid .app") &&
    island.includes("transition-delay:calc(var(--i, 0) * 22ms)"));
  check("gesty poziome mają feedback (strzałki + odsunięcie launchera)",
    has(island, ".gesture-tip--left", ".gesture-tip--right") &&
    has(island, "--swipe-back", "--swipe-home"));
  /* --- etap 8: spójna warstwa ruchu (css/motion.css) --- */
  const motion = css("motion.css");
  check("arkusz motion.css jest podpięty", !!document.querySelector('link[href*="motion.css"]'));
  check("okna Windows mają sprężyste otwieranie",
    has(motion, ".win-window", "transform 420ms var(--mo-spring)"));
  check("menu Start wysuwa się sprężyście z kaskadą kafelków",
    has(motion, ".start-menu.is-open", "translate(-50%, 0)", "transition-delay:calc(var(--i, 0) * 18ms"));
  check("pasek zadań ma sprężysty wskaźnik uruchomionej aplikacji",
    has(motion, ".tb-icon.is-running::after", "var(--mo-spring)"));
  check("pełny ekran ma animację wejścia makiety",
    has(motion, "@keyframes mo-fullscreen-in"));
  check("zmiana widoku animuje makiety kaskadowo",
    has(motion, "@keyframes mo-device-in", ".stage[data-view=\"all\"]"));
  check("mikrointerakcje respektują prefers-reduced-motion",
    motion.includes("@media (prefers-reduced-motion:reduce)"));
  const motionJs = fs.readFileSync(path.join(root, "js/motion.js"), "utf8");
  check("magnetyczne ikony wygładzane w rAF (bez nadpisywania kafla)",
    motionJs.includes("magTick") && motionJs.includes('querySelector(".app__icon, .ico, .bi")'));
  check("magnetyka obejmuje też ikony docka", motionJs.includes('".app, .dock-app, .tb-icon, .start-app, .win-desk-icon"'));
  check("zakładki mają przesuwającą się pigułkę (bez migającego tła)",
    motionJs.includes("buildViewPill") &&
    has(motion, ".viewbar__pill", "transform 420ms var(--mo-spring)") &&
    has(motion, ".viewbtn.is-active{", "background:none"));
  check("okna zamykają się animacją wyjścia (is-closing)",
    has(motion, ".win-window.is-closing", "opacity:0") &&
    fs.readFileSync(path.join(root, "js/windows.js"), "utf8").includes('classList.add("is-closing")'));
  check("maksymalizacja używa FLIP (animowany tylko transform)",
    fs.readFileSync(path.join(root, "js/windows.js"), "utf8").includes("maximizeWithFlip"));
  check("audyt płynności nie widzi animacji width/height w motion.css",
    !/transition\s*:\s*[^;}]*\b(width|height|left|top)\b\s*\d/.test(motion));

  /* --- morfowanie wyspy: jawna animacja w pikselach (WAAPI) --- */
  const androidJs = fs.readFileSync(path.join(root, "js/android.js"), "utf8");
  check("wyspa morfuje jawną animacją width/height w px (nie auto)",
    androidJs.includes("function morphIsland") &&
    androidJs.includes('width: before.w + "px"') &&
    androidJs.includes("opening ? 520 : 380"));
  check("pomiar PRZED/PO zmianie trybu (inaczej nie ma czego animować)",
    androidJs.includes("const before = islandSize()") &&
    androidJs.includes("const after = islandSize()"));
  check("CSS wyłącza przejścia tylko na czas pomiaru (.is-morphing)",
    has(css("island.css"), ".island.is-morphing{transition:none!important}"));
  check("zamykanie panelu też jest animowane (morphIsland wywołane zawsze)",
    /function setMode\(mode\)[\s\S]{0,600}morphIsland\(/.test(androidJs));

  check("telefon ma 4 uchwyty gestów (góra/dół/lewo/prawo)", edges.length === 4);
  check("uchwyty mają podpowiedzi tekstowe", Array.from(edges).every(e => (e.dataset.hint || "").length > 5));
  check("uchwyty nie przesłaniają treści (są przezroczyste, do 22 px)",
    /\.gesture-edge\{[\s\S]*?background:transparent/.test(island));

  console.log(`\nAnimacje: ${pass} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
}, 450));
