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
  /* Glify w stylu „Clear” z iOS 26: JEDEN kolor (biel) + wykroje (czarne detale),
     które przez maskę stają się przezroczyste — widać przez nie tapetę. */

  phone: '<path fill="#fff" d="M7.05 2.6a1.7 1.7 0 0 1 1.75.55l2.1 2.6c.42.52.42 1.26.02 1.8l-1.2 1.6a12.6 12.6 0 0 0 5.13 5.13l1.6-1.2c.54-.4 1.28-.4 1.8.02l2.6 2.1c.6.48.8 1.3.48 2.02l-.9 2c-.36.8-1.2 1.26-2.05 1.18C10.9 19.8 4.2 13.1 3.6 5.4c-.05-.9.4-1.74 1.2-2.1l2.25-.7Z"/>',

  messages: '<path fill="#fff" d="M12 3.1c-4.9 0-8.9 3.5-8.9 7.85 0 2.2.98 4.17 2.55 5.6-.16 1.3-.72 2.55-1.6 3.5-.25.27-.05.7.3.68 1.75-.1 3.3-.65 4.55-1.4 1 .28 2.05.42 3.1.42 4.9 0 8.9-3.5 8.9-7.85S16.9 3.1 12 3.1Z"/>'
    + '<g fill="#000"><circle cx="8.5" cy="10.8" r="1.42"/><circle cx="12" cy="10.8" r="1.42"/><circle cx="15.5" cy="10.8" r="1.42"/></g>',

  spotify: '<g fill="none" stroke="#fff" stroke-linecap="round">'
    + '<path d="M5.4 8.5c4.5-1.4 9.7-.85 13.2 1.4" stroke-width="1.95"/>'
    + '<path d="M6.4 12.3c3.7-1.1 7.9-.6 10.9 1.35" stroke-width="1.8"/>'
    + '<path d="M7.5 15.9c2.8-.85 5.9-.5 8.1.9" stroke-width="1.65"/></g>',

  camera: '<path fill="#fff" d="M3.4 8.4a3 3 0 0 1 3-3h1.35l1-1.7a1.6 1.6 0 0 1 1.38-.8h3.74a1.6 1.6 0 0 1 1.38.8l1 1.7h1.35a3 3 0 0 1 3 3v8.1a3 3 0 0 1-3 3H6.4a3 3 0 0 1-3-3V8.4Z"/>'
    + '<circle cx="12" cy="12.3" r="4.15" fill="#000"/>'
    + '<circle cx="12" cy="12.3" r="2.5" fill="#fff" opacity=".92"/>'
    + '<circle cx="18.1" cy="7.9" r=".95" fill="#000"/>',

  chrome: '<circle cx="12" cy="12" r="9.05" fill="#fff"/>'
    + '<circle cx="12" cy="12" r="3.35" fill="#000"/>'
    + '<g stroke="#000" stroke-width="1.5">'
    + '<path d="M12 5.6 12 8.65"/><path d="M17.53 15.2 14.9 13.68"/><path d="M6.47 15.2 9.1 13.68"/></g>'
    + '<circle cx="12" cy="12" r="1.9" fill="#fff"/>',

  gallery: (() => {
    let out = "";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 360 + 22.5;
      out += `<ellipse cx="12" cy="7.9" rx="2.5" ry="4.05" fill="#fff" transform="rotate(${a} 12 12)"/>`;
    }
    return out;
  })(),

  youtube: '<rect x="2.2" y="5.2" width="19.6" height="13.6" rx="4.3" fill="#fff"/>'
    + '<path fill="#000" d="M10.2 8.9 16 12l-5.8 3.1V8.9Z"/>',

  calendar: '<text x="12" y="7.5" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="2.6" font-weight="700" letter-spacing=".1" fill="#fff">LISTOPAD</text>'
    + '<text x="12" y="19.1" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="10.6" font-weight="300" fill="#fff">4</text>',

  gmail: '<rect x="2.6" y="5.4" width="18.8" height="13.2" rx="2.4" fill="#fff"/>'
    + '<path d="M3.4 7.1 12 13.1l8.6-6" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',

  maps: '<path fill="#fff" d="M12 2.6c-3.95 0-7.15 3.15-7.15 7.05 0 5.2 7.15 11.75 7.15 11.75s7.15-6.55 7.15-11.75c0-3.9-3.2-7.05-7.15-7.05Z"/>'
    + '<circle cx="12" cy="9.6" r="2.9" fill="#000"/>',

  notes: '<path fill="#fff" fill-rule="evenodd" d="M5 3.4h14a2 2 0 0 1 2 2v8.3l-5.1 6.9H5a2 2 0 0 1-2-2V5.4a2 2 0 0 1 2-2Zm1.8 3.9v1.5h10.4V7.3H6.8Zm0 3.7v1.5h10.4v-1.5H6.8Zm0 3.7v1.5h6.6v-1.5H6.8Z"/>',

  calculator: '<rect x="3.6" y="2.2" width="16.8" height="19.6" rx="3.2" fill="#fff"/>'
    + '<rect x="6.2" y="4.8" width="11.6" height="4.6" rx="1.5" fill="#000"/>'
    + [[6.6, 11.9], [9.6, 11.9], [12.6, 11.9], [15.6, 11.9], [6.6, 15.2], [9.6, 15.2], [12.6, 15.2], [15.6, 15.2], [6.6, 18.5], [9.6, 18.5], [12.6, 18.5], [15.6, 18.5]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.45" fill="#000"/>`).join(""),

  files: '<path fill="#fff" d="M3.1 6.55A2.45 2.45 0 0 1 5.55 4.1h4.1c.6 0 1.17.24 1.6.66l1.35 1.35h6.85a2.45 2.45 0 0 1 2.45 2.45v8.9a2.45 2.45 0 0 1-2.45 2.45H5.55a2.45 2.45 0 0 1-2.45-2.45V6.55Z"/>'
    + '<path fill="#000" opacity=".55" d="M3.1 9.7h17.8v6.9a2.45 2.45 0 0 1-2.45 2.45H5.55A2.45 2.45 0 0 1 3.1 16.6V9.7Z"/>',

  settings: '<path fill="#fff" d="M10.15 2.05h3.7l.5 2.3c.6.2 1.15.5 1.65.9l2.25-.9 2.55 2.55-.9 2.25c.4.5.7 1.05.9 1.65l2.3.5v3.7l-2.3.5c-.2.6-.5 1.15-.9 1.65l.9 2.25-2.55 2.55-2.25-.9c-.5.4-1.05.7-1.65.9l-.5 2.3h-3.7l-.5-2.3c-.6-.2-1.15-.5-1.65-.9l-2.25.9-2.55-2.55.9-2.25a7.9 7.9 0 0 1-.9-1.65l-2.3-.5v-3.7l2.3-.5c.2-.6.5-1.15.9-1.65l-.9-2.25L4.55 4.35l2.25.9c.5-.4 1.05-.7 1.65-.9l.5-2.3Z"/>'
    + '<circle cx="12" cy="12" r="4.15" fill="#000"/>'
    + '<circle cx="12" cy="12" r="2.1" fill="#fff"/>',

  store: '<g fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M7.05 19.1 13.75 7.5"/><path d="M16.95 19.1 10.25 7.5"/>'
    + '<path d="M5.55 14.55h8.6"/><path d="M14.6 16.05h5.05"/><path d="M4.7 16.05h3.3"/></g>'
    + '<path d="M12 4.35a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1Z" fill="#fff"/>',

  youtubeMusic: '<circle cx="12" cy="12" r="9.2" fill="none" stroke="#fff" stroke-width="1.9"/>'
    + '<path d="M9.9 8.4 15.9 12l-6 3.6V8.4Z" fill="#fff"/>',

  weather: '<circle cx="9.4" cy="9.4" r="3.9" fill="#fff"/>'
    + '<g stroke="#fff" stroke-width="1.5" stroke-linecap="round">'
    + '<path d="M9.4 2.5v1.6"/><path d="M9.4 14.7v1.6"/><path d="M2.5 9.4h1.6"/><path d="M14.7 9.4h1.6"/>'
    + '<path d="M4.6 4.6 5.7 5.7"/><path d="M13.1 13.1l1.1 1.1"/><path d="M14.2 4.6 13.1 5.7"/><path d="M5.7 13.1 4.6 14.2"/></g>'
    + '<path d="M9.6 19.4a3.7 3.7 0 0 1 .4-7.38 5.1 5.1 0 0 1 9.55 1.3 3.05 3.05 0 0 1-.35 6.08H9.6Z" fill="#fff"/>'
    + '<path d="M9.6 19.4a3.7 3.7 0 0 1 .4-7.38 5.1 5.1 0 0 1 9.55 1.3 3.05 3.05 0 0 1-.35 6.08H9.6Z" fill="#000" opacity=".22"/>',

  terminal: '<rect x="2.5" y="4" width="19" height="16" rx="2.8" fill="none" stroke="#fff" stroke-width="1.8"/>'
    + '<g stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">'
    + '<path d="M6.6 9.2 9.8 12l-3.2 2.8"/><path d="M12.4 15.2h5"/></g>',

  clock: '<circle cx="12" cy="12" r="9.3" fill="none" stroke="#fff" stroke-width="1.9"/>'
    + '<g stroke="#fff" stroke-width="1.9" stroke-linecap="round">'
    + '<path d="M12 6.6V12"/><path d="M12 12l3.6 2.1"/></g>',

  trash: '<path fill="#fff" d="M9.4 2.6h5.2l.7 1.5h3.5a1.05 1.05 0 1 1 0 2.1H5.2a1.05 1.05 0 1 1 0-2.1h3.5l.7-1.5Z"/>'
    + '<path fill="#fff" d="M6.4 7.6h11.2l-.75 12.2a1.9 1.9 0 0 1-1.9 1.8H9.05a1.9 1.9 0 0 1-1.9-1.8L6.4 7.6Z"/>'
    + '<g stroke="#000" stroke-width="1.15" stroke-linecap="round" opacity=".55">'
    + '<path d="M10.3 10.6v7.4"/><path d="M12 10.6v7.4"/><path d="M13.7 10.6v7.4"/></g>',

  search: '<circle cx="10.7" cy="10.7" r="6.1" fill="none" stroke="#fff" stroke-width="2"/>'
    + '<path d="M15.3 15.3 20.2 20.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
};

const ICONS = {
  phone:        { glyph: G.phone,        sc: 0.50 },
  messages:     { glyph: G.messages,     sc: 0.48, dy: 0.6 },
  spotify:      { glyph: G.spotify,      sc: 0.60 },
  camera:       { glyph: G.camera,       sc: 0.56 },
  chrome:       { glyph: G.chrome,       sc: 0.64 },
  gallery:      { glyph: G.gallery,      sc: 0.76 },
  youtube:      { glyph: G.youtube,      sc: 0.68 },
  calendar:     { glyph: G.calendar,     sc: 0.88 },
  gmail:        { glyph: G.gmail,        sc: 0.62 },
  maps:         { glyph: G.maps,         sc: 0.56 },
  notes:        { glyph: G.notes,        sc: 0.74 },
  calculator:   { glyph: G.calculator,   sc: 0.78 },
  files:        { glyph: G.files,        sc: 0.54 },
  settings:     { glyph: G.settings,     sc: 0.58 },
  store:        { glyph: G.store,        sc: 0.64 },
  youtubeMusic: { glyph: G.youtubeMusic, sc: 0.60 },
  search:       { glyph: G.search,       sc: 0.44 },
  weather:      { glyph: G.weather,      sc: 0.60 },
  terminal:     { glyph: G.terminal,     sc: 0.66 },
  clock:        { glyph: G.clock,        sc: 0.60 },
  trash:        { glyph: G.trash,        sc: 0.56 }
};

/* Tryb „Clear” z iOS 26: glif jest JEDNOBARWNY (biały), a kafel to neutralne,
   szronione szkło — kolor pochodzi wyłącznie od tapety pod ikoną. */
function glyphFor(id, d) { return d.glyph; }

function svgFor(id) {
  const d = ICONS[id];
  const sc = (d.sc || 0.6) * 0.94;
  const gs = 100 * sc;
  const tx = (100 - gs) / 2;
  const ty = (100 - gs) / 2 + (d.dy || 0) * (100 / 24);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100">
<defs>
  <clipPath id="sq"><path d="${SQ}"/></clipPath>

  <!-- neutralna mgła: lekko ciemna, żeby biały glif był czytelny na każdej tapecie -->
  <linearGradient id="veil" x1="0.15" y1="0" x2="0.6" y2="1">
    <stop offset="0"   stop-color="#000" stop-opacity=".16"/>
    <stop offset="0.42" stop-color="#000" stop-opacity=".10"/>
    <stop offset="1"   stop-color="#000" stop-opacity=".20"/>
  </linearGradient>

  <!-- światło przechodzące przez górną krawędź szkła -->
  <linearGradient id="sheen" x1="0.2" y1="0" x2="0.45" y2="1">
    <stop offset="0"    stop-color="#fff" stop-opacity=".46"/>
    <stop offset="0.22" stop-color="#fff" stop-opacity=".18"/>
    <stop offset="0.55" stop-color="#fff" stop-opacity=".06"/>
    <stop offset="0.86" stop-color="#fff" stop-opacity=".04"/>
    <stop offset="1"    stop-color="#fff" stop-opacity=".18"/>
  </linearGradient>

  <!-- jasna krawędź squircle -->
  <linearGradient id="rim" x1="0.15" y1="0" x2="0.5" y2="1">
    <stop offset="0"    stop-color="#fff" stop-opacity=".95"/>
    <stop offset="0.26" stop-color="#fff" stop-opacity=".58"/>
    <stop offset="0.72" stop-color="#fff" stop-opacity=".34"/>
    <stop offset="1"    stop-color="#fff" stop-opacity=".65"/>
  </linearGradient>

  <radialGradient id="spec" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0"   stop-color="#fff" stop-opacity=".40"/>
    <stop offset="0.6" stop-color="#fff" stop-opacity=".10"/>
    <stop offset="1"   stop-color="#fff" stop-opacity="0"/>
  </radialGradient>

  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="2.4"/>
  </filter>
  <filter id="softer" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="5.5"/>
  </filter>
  <filter id="glyphEmboss" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="0.7" stdDeviation="1.0" flood-color="#000" flood-opacity=".38"/>
  </filter>
</defs>

<g clip-path="url(#sq)">
  <!-- 1. mgła (przyciemnienie, żeby glif miał kontrast na jasnej tapecie) -->
  <rect width="100" height="100" fill="url(#veil)"/>
  <!-- 2. szkło: rozświetlenie od góry -->
  <rect width="100" height="100" fill="url(#sheen)"/>
  <!-- 3. miękka plama światła -->
  <ellipse cx="36" cy="-4" rx="58" ry="30" fill="url(#spec)" filter="url(#softer)"/>
  <!-- 4. refleks przy górnej krawędzi -->
  <ellipse cx="44" cy="-7" rx="44" ry="13" fill="#fff" opacity=".34" filter="url(#soft)"/>
  <!-- 5. wewnętrzny cień przy krawędzi (grubość szkła) -->
  <path d="${SQ}" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="3" filter="url(#soft)"/>
  <!-- 6. jasna krawędź squircle -->
  <path d="${SQ}" fill="none" stroke="url(#rim)" stroke-width="1.35"/>
</g>

<!-- glif: biel = widoczne, czarne detale = wycięte (widać przez nie tapetę) -->
<mask id="gmask" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
  ${glyphFor(id, d)}
</mask>
<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${(gs / 24).toFixed(3)})"
   filter="url(#glyphEmboss)">
  <rect x="0" y="0" width="24" height="24" fill="#fff" mask="url(#gmask)"/>
</g>
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
