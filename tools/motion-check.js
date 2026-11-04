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

  console.log(`\nAnimacje: ${pass} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
}, 450));
