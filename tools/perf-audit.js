/* Audyt wydajności animacji: wykrywa właściwości, które wymuszają
   przeliczanie układu (layout) lub malowanie (paint) zamiast pracy na
   kompozytorze (GPU). Działa na CSS, nie wymaga przeglądarki. */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const files = fs.readdirSync(path.join(root, "css")).filter(f => f.endsWith(".css"));

const PAINT = /^(filter|backdrop-filter|box-shadow|background|background-color|background-image|border-radius|width|height|top|left|right|bottom|margin|padding|opacity)$/;
const LAYOUT = /^(width|height|top|left|right|bottom|margin|padding|font-size|line-height|border-width)$/;

let issues = [];
for (const f of files) {
  const css = fs.readFileSync(path.join(root, "css", f), "utf8");
  // transition: <prop> ...
  for (const m of css.matchAll(/transition\s*:\s*([^;}]+)[;}]/g)) {
    const parts = m[1].split(",").map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
    const bad = parts.filter(p => LAYOUT.test(p));
    if (bad.length) issues.push({ f, kind: "layout", props: bad });
  }
  // animacje klas .is-* / hover z filter lub backdrop-filter
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*backdrop-filter[^{}]*)\}/g)) {
    const sel = m[1].trim();
    if (/:hover/.test(sel) && /:hover/.test(sel)) issues.push({ f, kind: "hover-backdrop", sel });
  }
}

console.log("=== AUDYT PŁYNNOŚCI ===");
if (!issues.length) console.log("brak problemów");
for (const i of issues) {
  if (i.kind === "layout") console.log(`  ! ${i.f}: transition na właściwości układu: ${i.props.join(", ")}`);
  if (i.kind === "hover-backdrop") console.log(`  ! ${i.f}: backdrop-filter zmieniany na hover (${i.sel})`);
}
console.log(`\nplików CSS: ${files.length}, zastrzeżeń: ${issues.length}`);
