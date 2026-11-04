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
const ICONS = {
  phone:        { kind: "vivid", g1: "#6FE38A", g2: "#0F9E4C", glyph: G.phone,        sc: 0.56 },
  messages:     { kind: "vivid", g1: "#6FE38A", g2: "#0F9E4C", glyph: G.messages,     sc: 0.54, dy: 0.6 },
  spotify:      { kind: "vivid", g1: "#3AE47F", g2: "#0B9B4C", glyph: G.spotify,      sc: 0.72, drop: false },
  camera:       { kind: "metal", g1: "#A8AFBB", g2: "#3B4048", glyph: G.camera,       sc: 0.62, drop: false },
  chrome:       { kind: "light", glyph: G.chrome,                                          sc: 0.68, drop: false },
  gallery:      { kind: "light", glyph: G.gallery,                                         sc: 0.80, drop: false },
  youtube:      { kind: "vivid", g1: "#FF6A62", g2: "#C4180C", glyph: G.youtube,      sc: 0.74, drop: false },
  calendar:     { kind: "light", glyph: G.calendar,                                        sc: 0.92, drop: false },
  gmail:        { kind: "light", glyph: G.gmail,                                           sc: 0.66, drop: false },
  maps:         { kind: "vivid", g1: "#B4EFB6", g2: "#3E9BE0", glyph: G.maps,         sc: 0.62 },
  notes:        { kind: "light", glyph: G.notes,                                           sc: 0.80, drop: false },
  calculator:   { kind: "dark",  g1: "#5A5A60", g2: "#1B1B1E", glyph: G.calculator,   sc: 0.82, drop: false },
  files:        { kind: "vivid", g1: "#8FD2FF", g2: "#1567DF", glyph: G.files,        sc: 0.62, drop: true },
  settings:     { kind: "metal", g1: "#C2C7D1", g2: "#565C6B", glyph: G.settings,      sc: 0.64, drop: false },
  store:        { kind: "vivid", g1: "#63C8FF", g2: "#0A6BE0", glyph: G.store,        sc: 0.70 },
  youtubeMusic: { kind: "vivid", g1: "#FF6A62", g2: "#C4180C", glyph: G.youtubeMusic, sc: 0.66, drop: false },
  search:       { kind: "dark",  g1: "#4A4A50", g2: "#232327", glyph: G.search,       sc: 0.48, drop: false },
  weather:      { kind: "vivid", g1: "#7FC9FF", g2: "#1B67D6", glyph: G.weather,      sc: 0.66, drop: false },
  terminal:     { kind: "dark",  g1: "#3A3F47", g2: "#14171C", glyph: G.terminal,     sc: 0.72, drop: false },
  clock:        { kind: "dark",  g1: "#4A4A50", g2: "#1E1E22", glyph: G.clock,        sc: 0.66, drop: false },
  trash:        { kind: "metal", g1: "#BCC2CC", g2: "#5A606E", glyph: G.trash,        sc: 0.62, drop: false }
};

const BASE = {
  vivid: ['#FFFFFF', '0'],
  light: ['#FDFDFF', '#EFF1F6'],
  metal: null,
  dark: null
};

function svgFor(id) {
  const d = ICONS[id];
  const PAL = {
    vivid: ["#A7D8FF", "#2B6FD8"],
    light: ["#FFFFFF", "#E6EAF2"],
    metal: ["#C9CED8", "#5E6472"],
    dark:  ["#4E4E53", "#1B1B1E"]
  };
  const [dg1, dg2] = PAL[d.kind] || PAL.vivid;
  const g1 = d.g1 || dg1;
  const g2 = d.g2 || dg2;
  const sc = (d.sc || 0.6) * 0.94;      // glif zajmuje `sc` szerokości kafla
  const gs = 100 * sc;                  // rozmiar kafla w jednostkach glifu (24-box)
  const tx = (100 - gs) / 2;
  const ty = (100 - gs) / 2 + (d.dy || 0) * (100 / 24);

  /* jasność kafla — biel mocniej rozświetla górę */
  const sheen = d.kind === "light" ? 0.20 : d.kind === "metal" ? 0.16 : 0.13;
  const floor = d.kind === "light" ? 0.04 : d.kind === "dark" ? 0.24 : 0.13;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100">
<defs>
  <clipPath id="sq"><path d="${SQ}"/></clipPath>
  <linearGradient id="body" x1="0.18" y1="0" x2="0.55" y2="1">
    <stop offset="0" stop-color="${g1}"/>
    <stop offset="0.42" stop-color="${g1}"/>
    <stop offset="1" stop-color="${g2}"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="${floor}"/>
  </linearGradient>
  <radialGradient id="gloss" cx="0.40" cy="0.02" r="0.62">
    <stop offset="0" stop-color="#fff" stop-opacity="${sheen}"/>
    <stop offset="0.5" stop-color="#fff" stop-opacity="${sheen * 0.22}"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="rim" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".48"/>
    <stop offset="0.42" stop-color="#fff" stop-opacity=".14"/>
    <stop offset="0.78" stop-color="#fff" stop-opacity=".08"/>
    <stop offset="1" stop-color="#fff" stop-opacity=".20"/>
  </linearGradient>
  <linearGradient id="hook" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.78" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".13"/>
  </linearGradient>
  <linearGradient id="streak" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.45" stop-color="#fff" stop-opacity=".16"/>
    <stop offset="0.6" stop-color="#fff" stop-opacity=".05"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="metal" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset="0.5" stop-color="#D8DDE6"/>
    <stop offset="1" stop-color="#A7AEBA"/>
  </linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="2.6"/>
  </filter>
  <filter id="softer" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="5"/>
  </filter>
  <filter id="glyphShadow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="0.55" stdDeviation="0.75" flood-color="#000" flood-opacity=".28"/>
  </filter>
</defs>

<g clip-path="url(#sq)">
  <rect width="100" height="100" fill="url(#body)"/>
  <rect width="100" height="100" fill="url(#gloss)"/>
  <rect y="46" width="100" height="54" fill="url(#floor)"/>
  <!-- szeroki refleks od góry -->
  <ellipse cx="42" cy="1" rx="56" ry="24" fill="#fff" opacity="${d.kind === "light" ? 0.3 : 0.14}" filter="url(#softer)"/>
  <!-- wąski błysk krawędziowy (szkło) -->
  <path d="M-10 -4 L34 -4 L60 46 L22 54 Z" fill="url(#streak)" opacity="${d.kind === "dark" ? 0.30 : 0.42}" filter="url(#soft)"/>
  <!-- dolna krawędź materiału -->
  <rect y="60" width="100" height="40" fill="url(#hook)"/>
  <!-- rim -->
  <path d="${SQ}" fill="none" stroke="url(#rim)" stroke-width="0.9"/>
</g>

<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${(gs / 24).toFixed(3)})"
   ${d.drop === false ? "" : 'filter="url(#glyphShadow)"'}>${d.glyph}</g>
</svg>`;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const done = [];
  for (const id of Object.keys(ICONS)) {
    const svg = svgFor(id);
    const png = new Resvg(svg, { fitTo: { mode: "width", value: SIZE }, background: "rgba(0,0,0,0)" }).render().asPng();
    const file = path.join(OUT, `${id}.png`);
    fs.writeFileSync(file, png);
    done.push({ id, kb: (png.length / 1024).toFixed(1) });
  }
  console.log(`Ikony: ${done.length} plików w assets/icons (${SIZE}px)`);
  console.log(done.map(d => `  ${d.id}.png ${d.kb} KB`).join("\n"));
}

main();
module.exports = { ICONS, svgFor, SQ };
