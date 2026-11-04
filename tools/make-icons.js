#!/usr/bin/env node
/* ============================================================
   Generator ikon LuminoOS w stylu Apple (iOS 18 / macOS Sequoia).
   Każda ikona rysowana jest jako pełna grafika SVG:
     • squircle (superelipsa n=5) — dokładnie jak maska iOS,
     • gradient bazowy + rozświetlenie od góry + przyciemnienie dołu,
     • szkło: szeroki, miękki refleks górny i wąski błysk krawędziowy,
     • rim: jasna krawędź u góry, ciemna linia u dołu (grubość materiału),
     • glif wyśrodkowany, ~56% szerokości, z delikatnym cieniem.
   Następnie renderuje PNG 512×512 przez @resvg/resvg-js.

   Użycie:  node tools/make-icons.js [--sheet] [--size=512]
   ============================================================ */
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets/icons");
const argv = process.argv.slice(2);
const SIZE = Number((argv.find(a => a.startsWith("--size=")) || "--size=512").split("=")[1]);

/* ---------- geometria squircle ---------- */
function squircle(size = 100, n = 5, steps = 720) {
  const c = size / 2;
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const co = Math.cos(t), si = Math.sin(t);
    const x = c + Math.sign(co) * Math.pow(Math.abs(co), 2 / n) * c;
    const y = c + Math.sign(si) * Math.pow(Math.abs(si), 2 / n) * c;
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return "M" + pts.join("L") + "Z";
}
const SQ = squircle(100, 5);

/* ---------- glify (przestrzeń 24×24, jak SF Symbols) ---------- */
const G = {
  /* --- podstawowe, białe glify na kolorowych kaflach --- */
  phone: '<path fill="#fff" d="M7.05 2.6a1.7 1.7 0 0 1 1.75.55l2.1 2.6c.42.52.42 1.26.02 1.8l-1.2 1.6a12.6 12.6 0 0 0 5.13 5.13l1.6-1.2c.54-.4 1.28-.4 1.8.02l2.6 2.1c.6.48.8 1.3.48 2.02l-.9 2c-.36.8-1.2 1.26-2.05 1.18C10.9 19.8 4.2 13.1 3.6 5.4c-.05-.9.4-1.74 1.2-2.1l2.25-.7Z"/>',

  messages: '<path fill="#fff" d="M12 3.1c-4.9 0-8.9 3.5-8.9 7.85 0 2.2.98 4.17 2.55 5.6-.16 1.3-.72 2.55-1.6 3.5-.25.27-.05.7.3.68 1.75-.1 3.3-.65 4.55-1.4 1 .28 2.05.42 3.1.42 4.9 0 8.9-3.5 8.9-7.85S16.9 3.1 12 3.1Z"/>',

  spotify: '<g fill="none" stroke="#062414" stroke-linecap="round">'
    + '<path d="M6.2 8.9c3.9-1.2 8.4-.7 11.6 1.3" stroke-width="1.95"/>'
    + '<path d="M7.1 12.4c3.2-.95 6.9-.5 9.5 1.1" stroke-width="1.8"/>'
    + '<path d="M8.1 15.8c2.4-.7 5.1-.35 7 .85" stroke-width="1.65"/></g>',

  camera: '<rect x="2.6" y="6.4" width="18.8" height="12.2" rx="3.1" fill="#fff"/>'
    + '<path d="M9.1 3.6h5.8l1.15 2.8H7.95L9.1 3.6Z" fill="#fff"/>'
    + '<circle cx="12" cy="12.5" r="3.55" fill="#5A6270"/>'
    + '<circle cx="12" cy="12.5" r="2.35" fill="#20242B"/>'
    + '<circle cx="12" cy="12.5" r="1.15" fill="#8FA6C4"/>'
    + '<circle cx="18.1" cy="9.3" r=".85" fill="#C9CFD8"/>',

  gallery: (() => {
    const petals = ['#FFD60A', '#FF9F0A', '#FF453A', '#FF2D87', '#BF5AF2', '#5E5CE6', '#0A84FF', '#32D74B'];
    return petals.map((c, i) => {
      const a = (i / petals.length) * 360 + 22.5;
      return `<ellipse cx="12" cy="7.9" rx="2.5" ry="4.05" fill="${c}" transform="rotate(${a} 12 12)"/>`;
    }).join("");
  })(),

  youtube: '<rect x="2.2" y="5.2" width="19.6" height="13.6" rx="4.3" fill="#fff"/>'
    + '<path d="M10.2 8.9 16 12l-5.8 3.1V8.9Z" fill="#E62117"/>',

  maps: '<path fill="#fff" d="M12 2.6c-3.95 0-7.15 3.15-7.15 7.05 0 5.2 7.15 11.75 7.15 11.75s7.15-6.55 7.15-11.75c0-3.9-3.2-7.05-7.15-7.05Z"/>'
    + '<circle cx="12" cy="9.5" r="2.6" fill="#2C86E0"/>',

  files: '<path fill="#fff" d="M3.1 6.55A2.45 2.45 0 0 1 5.55 4.1h4.1c.6 0 1.17.24 1.6.66l1.35 1.35h6.85a2.45 2.45 0 0 1 2.45 2.45v8.9a2.45 2.45 0 0 1-2.45 2.45H5.55a2.45 2.45 0 0 1-2.45-2.45V6.55Z"/>'
    + '<path fill="#C9E2FF" opacity=".55" d="M3.1 9.6h17.8v7.85a2.45 2.45 0 0 1-2.45 2.45H5.55A2.45 2.45 0 0 1 3.1 17.45V9.6Z"/>',

  settings: '<path fill="#F3F5F9" d="M10.15 2.05h3.7l.5 2.3c.6.2 1.15.5 1.65.9l2.25-.9 2.55 2.55-.9 2.25c.4.5.7 1.05.9 1.65l2.3.5v3.7l-2.3.5c-.2.6-.5 1.15-.9 1.65l.9 2.25-2.55 2.55-2.25-.9c-.5.4-1.05.7-1.65.9l-.5 2.3h-3.7l-.5-2.3c-.6-.2-1.15-.5-1.65-.9l-2.25.9-2.55-2.55.9-2.25a7.9 7.9 0 0 1-.9-1.65l-2.3-.5v-3.7l2.3-.5c.2-.6.5-1.15.9-1.65l-.9-2.25L4.55 4.35l2.25.9c.5-.4 1.05-.7 1.65-.9l.5-2.3Z"/>'
    + '<circle cx="12" cy="12" r="4.1" fill="url(#metal)"/>'
    + '<circle cx="12" cy="12" r="2.6" fill="#3A3F49"/>',

  /* --- jasne kafle (białe), kolorowe glify --- */
  chrome: '<g fill="none" stroke-width="3.2">'
    + '<circle cx="12" cy="12" r="9.1" stroke="#EA4335" stroke-dasharray="19.1 38.1"/>'
    + '<circle cx="12" cy="12" r="9.1" stroke="#FBBC05" stroke-dasharray="19.1 38.1" stroke-dashoffset="-19.1"/>'
    + '<circle cx="12" cy="12" r="9.1" stroke="#34A853" stroke-dasharray="19.1 38.1" stroke-dashoffset="-38.2"/></g>'
    + '<circle cx="12" cy="12" r="4.85" fill="#fff"/><circle cx="12" cy="12" r="3.5" fill="#4285F4"/>',

  gmail: '<path fill="#EA4335" d="M2.6 7.9v10.4h3.2V10.2L12 14.9l6.2-4.7v8.1h3.2V7.9L12 14.7 2.6 7.9Z"/>'
    + '<path fill="#4285F4" d="M2.6 7.9 12 14.7 21.4 7.9v-1a1.9 1.9 0 0 0-3-1.5L12 10.1 5.6 5.4a1.9 1.9 0 0 0-3 1.5v1Z" opacity=".95"/>'
    + '<path fill="#FBBC05" d="M2.6 7.9v2.3L12 14.7V10.7L2.6 7.9Z" opacity="0"/>',

  calendar: '<text x="12" y="7.4" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="2.5" font-weight="700" letter-spacing=".12" fill="#E8483F">LISTOPAD</text>'
    + '<text x="12" y="18.9" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="10.4" font-weight="300" fill="#1C1C1E">4</text>',

  notes: '<rect x="3.2" y="3" width="17.6" height="18" rx="2.6" fill="#FFF6D2"/>'
    + '<path d="M3.2 5.6A2.6 2.6 0 0 1 5.8 3h12.4a2.6 2.6 0 0 1 2.6 2.6v2.1H3.2V5.6Z" fill="#FFC61E"/>'
    + '<g stroke="#C9B77A" stroke-width="1.15" stroke-linecap="round">'
    + '<path d="M6.4 11.4h11.2"/><path d="M6.4 14.3h11.2"/><path d="M6.4 17.2h7"/></g>',

  calculator: '<rect x="3.6" y="2.2" width="16.8" height="19.6" rx="3.1" fill="#2C2C2E"/>'
    + '<rect x="6" y="4.6" width="12" height="5" rx="1.6" fill="#1C1C1E"/>'
    + '<text x="17.1" y="8.5" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="3.6" font-weight="400" fill="#F5F5F7">128</text>'
    + [[6.1, 11.3], [10.1, 11.3], [14.1, 11.3], [18.0, 11.3], [6.1, 15.1], [10.1, 15.1], [14.1, 15.1], [18.0, 15.1], [6.1, 18.9], [10.1, 18.9], [14.1, 18.9]]
      .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.55" fill="${x > 17 ? "#FF9F0A" : (y > 18 ? "#8E8E93" : "#4A4A4D")}"/>`).join("")
    + '<rect x="14.1" y="17.35" width="3.2" height="3.1" rx="1.55" fill="#FF9F0A"/>',

  store: '<g fill="none" stroke="#fff" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M7.05 19.1 13.75 7.5"/><path d="M16.95 19.1 10.25 7.5"/>'
    + '<path d="M5.55 14.55h8.6"/><path d="M14.6 16.05h5.05"/><path d="M4.7 16.05h3.3"/>'
    + '</g>'
    + '<path d="M12 4.35a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1Z" fill="#fff"/>',

  trash: '<path fill="#fff" d="M9.4 2.6h5.2l.7 1.5h3.5a1.05 1.05 0 1 1 0 2.1H5.2a1.05 1.05 0 1 1 0-2.1h3.5l.7-1.5Z"/>'
    + '<path fill="#fff" d="M6.4 7.6h11.2l-.75 12.2a1.9 1.9 0 0 1-1.9 1.8H9.05a1.9 1.9 0 0 1-1.9-1.8L6.4 7.6Z"/>'
    + '<g stroke="rgba(30,40,55,.45)" stroke-width="1.15" stroke-linecap="round">'
    + '<path d="M10.3 11v7"/><path d="M12 11v7"/><path d="M13.7 11v7"/></g>',

  weather: '<circle cx="9.2" cy="9.2" r="3.9" fill="#FFD60A"/>'
    + '<g stroke="#FFD60A" stroke-width="1.5" stroke-linecap="round">'
    + '<path d="M9.2 2.4v1.6"/><path d="M9.2 14.4v1.6"/><path d="M2.4 9.2h1.6"/><path d="M14.4 9.2h1.6"/>'
    + '<path d="M4.4 4.4 5.5 5.5"/><path d="M12.9 12.9l1.1 1.1"/><path d="M14 4.4 12.9 5.5"/><path d="M5.5 12.9 4.4 14"/></g>'
    + '<path d="M9.6 19.4a3.7 3.7 0 0 1 .4-7.38 5.1 5.1 0 0 1 9.55 1.3 3.05 3.05 0 0 1-.35 6.08H9.6Z" fill="#fff"/>',

  terminal: '<rect x="2.5" y="4" width="19" height="16" rx="2.6" fill="#101318" stroke="#3B4048" stroke-width="1"/>'
    + '<g stroke="#4BE38A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none">'
    + '<path d="M6.4 9.2 9.6 12l-3.2 2.8"/><path d="M12.2 15.2h5.2"/></g>',

  clock: '<circle cx="12" cy="12" r="9.3" fill="none" stroke="#fff" stroke-width="1.8"/>'
    + '<g stroke="#fff" stroke-width="1.9" stroke-linecap="round">'
    + '<path d="M12 6.6V12"/><path d="M12 12l3.6 2.1"/></g>',

  search: '<circle cx="10.7" cy="10.7" r="6.1" fill="none" stroke="#fff" stroke-width="2"/>'
    + '<path d="M15.3 15.3 20.2 20.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',

  youtubeMusic: '<circle cx="12" cy="12" r="9.2" fill="#fff"/>'
    + '<circle cx="12" cy="12" r="9.2" fill="none" stroke="#E62117" stroke-width="1.1" opacity=".35"/>'
    + '<path d="M9.9 8.4 15.9 12l-6 3.6V8.4Z" fill="#E62117"/>'
};

/* ---------- definicje ikon ----------
   kind:
     vivid  — kolorowy kafel (g1 → g2), biały glif
     light  — jasny kafel (biel → chłodna biel), kolorowy glif
     metal  — stalowy kafel, jasny glif
     dark   — ciemny kafel, kolorowy glif
   ------------------------------------------------------------ */
/* ---------- definicje ikon ----------
   hue   — kolor szkła (barwnik kafla, podawany jako półprzezroczysty)
   tint  — krycie barwnika (0..1). Im mniej, tym bardziej „szkło”
   ink   — kolor glifu; domyślnie biel, logotypy zachowują własne kolory
   sc    — szerokość glifu względem kafla
   ------------------------------------------------------------ */
const ICONS = {
  phone:        { hue: "#2FD35B", tint: 0.38, glyph: G.phone,        sc: 0.52 },
  messages:     { hue: "#2FD35B", tint: 0.36, glyph: G.messages,     sc: 0.50, dy: 0.6 },
  spotify:      { hue: "#1ED760", tint: 0.30, glyph: G.spotify,      sc: 0.62, ink: "#0A2A18" },
  camera:       { hue: "#6E7A88", tint: 0.38, glyph: G.camera,       sc: 0.58, ink: "#FFFFFF" },
  chrome:       { hue: "#EEF2F8", tint: 0.26, glyph: G.chrome,       sc: 0.66, keep: true },
  gallery:      { hue: "#F6F8FC", tint: 0.20, glyph: G.gallery,      sc: 0.78, keep: true },
  youtube:      { hue: "#FF3B30", tint: 0.38, glyph: G.youtube,      sc: 0.70, ink: "#FFFFFF" },
  calendar:     { hue: "#FFFFFF", tint: 0.26, glyph: G.calendar,     sc: 0.90, keep: true },
  gmail:        { hue: "#FFFFFF", tint: 0.24, glyph: G.gmail,        sc: 0.64, keep: true },
  maps:         { hue: "#2FA8D8", tint: 0.36, glyph: G.maps,         sc: 0.58 },
  notes:        { hue: "#FFC61E", tint: 0.34, glyph: G.notes,        sc: 0.76, keep: true },
  calculator:   { hue: "#3A3A3C", tint: 0.40, glyph: G.calculator,   sc: 0.80, ink: "#FFFFFF" },
  files:        { hue: "#0A84FF", tint: 0.38, glyph: G.files,        sc: 0.56, ink: "#FFFFFF" },
  settings:     { hue: "#6E7480", tint: 0.38, glyph: G.settings,     sc: 0.60, ink: "#FFFFFF" },
  store:        { hue: "#0A84FF", tint: 0.38, glyph: G.store,        sc: 0.66, ink: "#FFFFFF" },
  youtubeMusic: { hue: "#FF3B30", tint: 0.32, glyph: G.youtubeMusic, sc: 0.62, keep: true },
  search:       { hue: "#8E8E93", tint: 0.26, glyph: G.search,       sc: 0.46, ink: "#FFFFFF" },
  weather:      { hue: "#0A84FF", tint: 0.34, glyph: G.weather,      sc: 0.62, keep: true },
  terminal:     { hue: "#1C1C1E", tint: 0.38, glyph: G.terminal,     sc: 0.68, ink: "#FFFFFF" },
  clock:        { hue: "#1C1C1E", tint: 0.34, glyph: G.clock,        sc: 0.62, ink: "#FFFFFF" },
  trash:        { hue: "#8E8E93", tint: 0.28, glyph: G.trash,        sc: 0.58, ink: "#FFFFFF" }
};

/* glif przepuszczony przez kolor — zostawiamy tylko biel/zieleń marki */
function glyphFor(id, d) {
  const g = d.glyph;
  if (d.keep) return g;
  /* wszystko, co białe lub currentColor, staje się kolorem `ink` */
  return g
    .replace(/fill="currentColor"/g, `fill="${d.ink || "#fff"}"`)
    .replace(/fill="#fff"/g, `fill="${d.ink || "#fff"}"`)
    .replace(/stroke="currentColor"/g, `stroke="${d.ink || "#fff"}"`)
    .replace(/fill="#0B3B24"/g, `fill="${d.ink || "#fff"}"`);
}

function svgFor(id) {
  const d = ICONS[id];
  const sc = (d.sc || 0.6) * 0.94;
  const gs = 100 * sc;
  const tx = (100 - gs) / 2;
  const ty = (100 - gs) / 2 + (d.dy || 0) * (100 / 24);
  const tint = d.tint == null ? 0.3 : d.tint;
  const hue = d.hue || "#8E8E93";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100">
<defs>
  <clipPath id="sq"><path d="${SQ}"/></clipPath>

  <!-- barwnik szkła: pełny kolor, ale mocno przezroczysty -->
  <linearGradient id="dye" x1="0.1" y1="0" x2="0.7" y2="1">
    <stop offset="0"   stop-color="${hue}" stop-opacity="${(tint * 0.78).toFixed(3)}"/>
    <stop offset="0.45" stop-color="${hue}" stop-opacity="${tint.toFixed(3)}"/>
    <stop offset="1"   stop-color="${hue}" stop-opacity="${(tint * 1.05).toFixed(3)}"/>
  </linearGradient>

  <!-- światło: góra kafla jaśniejsza (szkło grubsze u góry) -->
  <linearGradient id="sheen" x1="0.2" y1="0" x2="0.5" y2="1">
    <stop offset="0"    stop-color="#fff" stop-opacity=".34"/>
    <stop offset="0.28" stop-color="#fff" stop-opacity=".13"/>
    <stop offset="0.62" stop-color="#fff" stop-opacity=".05"/>
    <stop offset="1"    stop-color="#fff" stop-opacity=".16"/>
  </linearGradient>

  <!-- ciemniejsza „grubość” materiału przy dolnej krawędzi -->
  <linearGradient id="body" x1="0" y1="0.55" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".11"/>
  </linearGradient>

  <!-- jasna krawędź szkła -->
  <linearGradient id="rim" x1="0.15" y1="0" x2="0.5" y2="1">
    <stop offset="0"    stop-color="#fff" stop-opacity=".92"/>
    <stop offset="0.3"  stop-color="#fff" stop-opacity=".52"/>
    <stop offset="0.68" stop-color="#fff" stop-opacity=".30"/>
    <stop offset="1"    stop-color="#fff" stop-opacity=".60"/>
  </linearGradient>

  <!-- błysk krawędziowy (refrakcja) -->
  <linearGradient id="streak" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0"    stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.42" stop-color="#fff" stop-opacity=".34"/>
    <stop offset="0.58" stop-color="#fff" stop-opacity=".08"/>
    <stop offset="1"    stop-color="#fff" stop-opacity="0"/>
  </linearGradient>

  <radialGradient id="spec" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0"   stop-color="#fff" stop-opacity=".55"/>
    <stop offset="0.6" stop-color="#fff" stop-opacity=".14"/>
    <stop offset="1"   stop-color="#fff" stop-opacity="0"/>
  </radialGradient>

  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="2.4"/>
  </filter>
  <filter id="softer" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="5.5"/>
  </filter>
  <filter id="glyphDrop" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="0.7" stdDeviation="1.0" flood-color="#000" flood-opacity=".30"/>
  </filter>
</defs>

<g clip-path="url(#sq)">
  <!-- 1. barwnik -->
  <rect width="100" height="100" fill="url(#dye)"/>
  <!-- 2. rozświetlenie od góry (światło przechodzące przez szkło) -->
  <rect width="100" height="100" fill="url(#sheen)"/>
  <!-- 3. duża, miękka plama światła -->
  <ellipse cx="38" cy="-2" rx="62" ry="34" fill="url(#spec)" filter="url(#softer)"/>
  <!-- 4. błysk biegnący po przekątnej -->
  <path d="M-14 -6 L26 -6 L64 44 L24 56 Z" fill="url(#streak)" filter="url(#soft)"/>
  <!-- 5. grubość materiału u dołu -->
  <rect y="48" width="100" height="52" fill="url(#body)"/>
  <!-- 6. wewnętrzny cień tuż przy krawędzi (grubość szkła, poprawia kontrast glifu) -->
  <path d="${SQ}" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="3.2" filter="url(#soft)"/>
  <!-- 7. jasna krawędź squircle -->
  <path d="${SQ}" fill="none" stroke="url(#rim)" stroke-width="1.15"/>
</g>

<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${(gs / 24).toFixed(3)})"
   filter="url(#glyphDrop)">${glyphFor(id, d)}</g>
</svg>`;
}

/* ---------- maska squircle dla CSS (do backdrop-filter) ---------- */
function maskSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100">
<path d="${SQ}" fill="#fff"/></svg>`;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  /* maska: tylko kształt, używana w CSS przy rozmywaniu tła pod ikoną */
  fs.writeFileSync(path.join(OUT, "mask.png"),
    new Resvg(maskSvg(), { fitTo: { mode: "width", value: SIZE } }).render().asPng());
  const done = [];
  for (const id of Object.keys(ICONS)) {
    const svg = svgFor(id);
    const png = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } }).render().asPng();
    fs.writeFileSync(path.join(OUT, `${id}.png`), png);
    done.push({ id, kb: (png.length / 1024).toFixed(1) });
  }
  console.log(`Ikony (liquid glass): ${done.length} plików w assets/icons (${SIZE}px)`);
  console.log(done.map(d => `  ${d.id}.png ${d.kb} KB`).join("\n"));
}

main();
module.exports = { ICONS, svgFor, SQ };
