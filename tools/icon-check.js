/* Weryfikuje jeden, finalny styl ikon (szkło w stylu Apple). */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const root = path.join(__dirname, "..");
const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable",
  url: "http://localhost:5173/", pretendToBeVisual: true
});
dom.window.addEventListener("load", () => setTimeout(() => {
  const { document } = dom.window;
  const gcs = dom.window.getComputedStyle.bind(dom.window);
  let pass = 0, fail = 0;
  const check = (n, c) => c ? (console.log("  ✓ " + n), pass++) : (console.log("  ✗ " + n), fail++);

  const tiles = document.querySelectorAll(".app .bi");
  check("ikony występują na pulpicie", tiles.length >= 12);
  check("brak przełącznika wariantów", document.querySelectorAll("[data-icons-set]").length === 0);
  check("brak atrybutu data-icons (jeden styl)", !document.body.dataset.icons);

  const el = tiles[0];
  const vars = el.getAttribute("style") || "";
  check("kolor marki w zmiennych --g1/--g2", /--g1:/.test(vars) && /--g2:/.test(vars));

  const rules = Array.from(document.styleSheets).flatMap(sh => {
    try { return Array.from(sh.cssRules); } catch (e) { return []; }
  });
  const before = rules.find(r => r.selectorText === ".bi::before");
  const after = rules.find(r => r.selectorText === ".bi::after");
  check("warstwa koloru (.bi::before) ma maskę squircle",
    !!before && /mask-image/.test(before.style.cssText || ""));
  check("warstwa szkła (.bi::after) używa plate.png",
    !!after && /plate\.png/.test(after.style.cssText || ""));
  check("promień 31% (kwadraty, nie koła)",
    rules.some(r => r.selectorText === ".bi" && /31%/.test(r.style.getPropertyValue("border-radius"))));

  const files = ["assets/icons/plate.png", "assets/icons/mask.png"];
  files.forEach(f => check(`plik ${f} istnieje`, fs.existsSync(path.join(root, f))));

  console.log(`\nIkony: ${pass} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
}, 450));
