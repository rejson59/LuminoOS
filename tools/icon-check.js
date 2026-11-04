/* Sprawdza, że 4 warianty ikon działają i faktycznie różnią się stylem. */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const root = path.join(__dirname, "..");
const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable",
  url: "http://localhost:5173/", pretendToBeVisual: true
});
dom.window.addEventListener("load", () => setTimeout(() => {
  const { document } = dom.window;
  const getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  const L = dom.window.Lumino;
  const icon = () => document.querySelector('[data-android="phone"] .app .bi');
  let pass = 0, fail = 0;
  const check = (n, c) => c ? (console.log("  ✓ " + n), pass++) : (console.log("  ✗ " + n), fail++);

  check("przełącznik ma 4 warianty", document.querySelectorAll("[data-icons-set]").length === 4);

  const seen = new Set();
  ["glass", "clear", "gel", "chrome"].forEach(name => {
    L.setIconStyle(name);
    const el = icon();
    const cs = getComputedStyle(el);
    seen.add(cs.backgroundImage + "|" + cs.boxShadow);
    check(`wariant "${name}" ustawiony`, document.body.dataset.icons === name);
    check(`  ikona ma tło i cień (${name})`, cs.backgroundImage !== "none" && cs.boxShadow !== "none");
    check(`  ikona ma warstwy tła i cień (${name})`,
      cs.backgroundImage !== "none" && cs.boxShadow !== "none");
  });
  check("warianty różnią się wyglądem (4 unikalne style)", seen.size === 4);
  const sheet = Array.from(document.styleSheets)
    .flatMap(sh => { try { return Array.from(sh.cssRules); } catch (e) { return []; } })
    .filter(r => r.selectorText === ".bi")
    .map(r => r.style.getPropertyValue("border-radius"))
    .join(" ");
  check("wszystkie ikony kwadratowe (promień 31%)", /31%/.test(sheet));

  console.log(`\nIkony: ${pass} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
}, 450));
