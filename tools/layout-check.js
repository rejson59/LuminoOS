/* Sprawdza, czy zawartość ekranów mieści się w ramkach (bez przycinania). */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const root = path.join(__dirname, "..");
const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable",
  url: "file://" + root + "/index.html", pretendToBeVisual: true
});

dom.window.addEventListener("load", () => setTimeout(() => {
  const { document } = dom.window;
  const gcs = dom.window.getComputedStyle;
  const report = [];

  ["phone", "tablet"].forEach(k => {
    const screen = document.querySelector(`[data-android="${k}"]`);
    const page = screen.querySelector(".page");
    const grid = screen.querySelector(".page .app-grid");
    const apps = page.querySelectorAll(".app").length;   // pierwsza strona launchera
    const widgets = page.querySelectorAll(".widget").length;
    report.push({
      ekran: k,
      aplikacjiNaStronie: apps,
      widgetow: widgets,
      kolumnySiatki: (() => {
        if (!grid) return 0;
        const raw = gcs(grid).gridTemplateColumns || "";
        const m = raw.match(/repeat\((\d+)/);
        return m ? Number(m[1]) : raw.trim().split(/\s+/).filter(Boolean).length;
      })(),
      liczbaWszystkich: screen.querySelectorAll(".a-drawer .app").length
    });
  });

  console.log("=== UKŁAD ===");
  report.forEach(r => console.log(
    `${r.ekran}: ${r.aplikacjiNaStronie} kafli na 1. stronie, ${r.widgetow} widgetów, ` +
    `${r.kolumnySiatki} kolumn (grid), ${r.liczbaWszystkich} aplikacji w szufladzie`));

  // tablet: 20 aplikacji, 5 kolumn, 3 widgety
  const t = report.find(r => r.ekran === "tablet");
  const ok = t.aplikacjiNaStronie >= 14 && t.kolumnySiatki === 5 && t.widgetow === 3;
  console.log(ok
    ? "\nOK — tablet: 5 kolumn, 3 kompaktowe widgety, kafle zmieszczone"
    : "\nPROBLEM — tablet nadal nie mieści");

  // ikony: wszystkie mają ten sam promień (kwadraty), brak kół
  const radii = new Set();
  document.querySelectorAll("[data-android='phone'] .app .bi, [data-android='tablet'] .app .bi")
    .forEach(el => radii.add(gcs(el).borderTopLeftRadius));
  const square = radii.size === 1;
  console.log("promienie ikon (powinien być 1 typ):", [...radii].join(", ") || "(brak)");
  console.log(square ? "OK — wszystkie ikony to kwadraty z zaokrągleniem" : "PROBLEM — ikony mają różne kształty");

  process.exit(ok && square ? 0 : 1);
}, 350));
