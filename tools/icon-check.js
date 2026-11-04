/* Weryfikuje jeden, finalny styl ikon: grafiki PNG w stylu Apple.
   Uruchamia stronę w jsdom, sprawdza podpięcie ikon-obrazów i pliki PNG. */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const root = path.join(__dirname, "..");

/* --- nagłówek PNG: szerokość i wysokość --- */
function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString("ascii", 1, 4) !== "PNG") return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
}

const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable",
  url: "http://localhost:5173/", pretendToBeVisual: true
});
dom.window.addEventListener("load", () => setTimeout(() => {
  const { document, window: win } = dom.window;
  let pass = 0, fail = 0;
  const check = (n, c) => c ? (console.log("  ✓ " + n), pass++) : (console.log("  ✗ " + n), fail++);

  const icons = document.querySelectorAll(".app .app__icon.bi");
  check("ikony występują na pulpicie", icons.length >= 12);
  check("brak przełącznika wariantów", document.querySelectorAll("[data-icons-set]").length === 0);
  check("brak atrybutu data-icons (jeden styl)", !document.body.dataset.icons);
  check("ikony to obrazy, nie glify w HTML",
    Array.from(icons).every(el => !el.querySelector("svg")));

  /* adresy obrazów */
  const urls = Array.from(icons).map(el => {
    const m = (el.getAttribute("style") || "").match(/--ico:\s*url\((["']?)([^"')]+)\1\)/);
    return m ? m[2] : "";
  });
  check("każda ikona ma --ico z plikiem PNG", urls.every(u => /assets\/icons\/[a-zA-Z]+\.png\?v=\d+$/.test(u)));

  const ids = [...new Set(urls.map(u => (u.match(/icons\/([a-zA-Z]+)\.png/) || [])[1]).filter(Boolean))];
  check("paleta ikon jest zróżnicowana (>= 10 grafek)", ids.length >= 10);

  /* pliki: istnieją, są kwadratowe i mają sensowny rozmiar */
  const bad = [];
  for (const id of ids) {
    const f = path.join(root, "assets/icons", id + ".png");
    if (!fs.existsSync(f)) { bad.push(id + " (brak pliku)"); continue; }
    const s = pngSize(f);
    if (!s || s.w !== s.h) bad.push(id + " (niekwadratowa)");
    else if (s.w < 256) bad.push(id + " (za mała)");
  }
  check("wszystkie grafiki istnieją i są kwadratowe 512 px", bad.length === 0);
  if (bad.length) console.log("      " + bad.join(", "));

  /* styl: brak starych warstw (maska + płytka) */
  const rules = Array.from(document.styleSheets).flatMap(sh => {
    try { return Array.from(sh.cssRules); } catch (e) { return []; }
  });
  const txt = rules.map(r => r.cssText || "").join("\n");
  check("stary styl (plate.png / mask.png) nie jest już używany",
    !/plate\.png|mask\.png/.test(txt));
  check("ikony nie mają promienia 50% (żadnych kół)",
    !Array.from(document.querySelectorAll(".bi")).some(el => win.getComputedStyle(el).borderRadius === "50%"));

  /* wszystkie użyte w kodzie ikony mają pliki */
  const js = ["js/core.js", "js/windows.js", "js/android.js", "js/apps.js"]
    .map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
  const used = new Set();
  for (const m of js.matchAll(/iconImg\(\s*"([A-Za-z]+)"/g)) used.add(m[1]);
  for (const m of js.matchAll(/\[\s*"[^"]+",\s*"[^"]+",\s*"([A-Za-z]+)"[,\]]/g)) used.add(m[1]);
  const lower = [...used].filter(i => /^[a-z]/.test(i));
  const missing = lower.filter(i => !fs.existsSync(path.join(root, "assets/icons", i + ".png")));
  check(`wszystkie ikony użyte w kodzie mają pliki (${lower.length})`, missing.length === 0);
  if (missing.length) console.log("      brakuje: " + missing.join(", "));

  console.log(`\nIkony: ${pass} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
}, 450));
