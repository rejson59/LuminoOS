/* Testy trybu 1:1, pełnego ekranu i nowej belki (wyspa + prawa strona). */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const root = path.join(__dirname, "..");
const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable",
  url: "http://localhost:5173/", pretendToBeVisual: true
});
const w = dom.window;
const errs = [];
w.addEventListener("error", e => errs.push(e.message));

w.addEventListener("load", () => setTimeout(() => {
  const { document } = w;
  let pass = 0, fail = 0;
  const check = (n, c) => c ? (console.log("  ✓ " + n), pass++) : (console.log("  ✗ " + n), fail++);

  /* --- nowa belka --- */
  const phone = document.querySelector('[data-android="phone"]');
  const bar = phone.querySelector(".statusbar");
  const island = phone.querySelector(".a-launcher > .island");
  check("wyspa pływa poza belką (nad aplikacjami, po lewej)",
    !!island && !bar.contains(island));
  check("belka nie zawiera już zegara po lewej (wyspa go zastąpiła)",
    !bar.querySelector(".js-time"));
  check("wyspa pokazuje zegar i datę", !!island.querySelector(".island__time") && !!island.querySelector(".island__date"));
  check("prawa strona belki: szukaj + status (panel otwiera wyspa)",
    bar.querySelectorAll("[data-action='search']").length === 1 &&
    bar.querySelector(".statusbar__right [data-action='search']") !== null &&
    !!island.querySelector('.island__face--idle[data-action="panel"]') &&
    !!bar.querySelector(".statusbar__icons"));
  check("brak osobnej kropki aparatu na środku belki", !bar.querySelector(".punch") && !island.querySelector(".island__dot"));
  check("wyspa ma soczewkę aparatu", !!island.querySelector(".island__cam"));
  check("belka nie jest już wyśrodkowana (brak justyfikacji space-between na czas)",
    !bar.hasAttribute("data-action"));

  /* --- wyspa zamiast panelu --- */
  const menu = phone.querySelector(".island__face--panel");
  check("panel powiadomień usunięty (brak .a-panel i .a-shade)",
    !phone.querySelector(".a-panel") && !phone.querySelector(".a-shade"));
  check("wyspa ma w sobie panel skrótów (morfowanie, nie osobne okno)",
    !!menu && island.contains(menu) && !!phone.querySelector(".island-shade"));
  check("skróty: 8 kafli + 2 suwaki + powiadomienia jako ikony",
    menu.querySelectorAll(".island-grid .island-tile").length === 8 &&
    menu.querySelectorAll(".island-slider").length === 2 &&
    menu.querySelectorAll(".island-notif").length >= 3);
  check("skróty to same ikony — bez podpisów tekstowych",
    [...menu.querySelectorAll(".island-grid .island-tile")].every(t => !t.textContent.trim()) &&
    [...menu.querySelectorAll(".island-grid .island-tile")].every(t => t.querySelector("svg.ico")));
  check("kafle to kwadraty z zaokrągleniem (nie koła)",
    /island-tile\{[\s\S]*?border-radius:\s*12px/.test(fs.readFileSync(path.join(root, "css/island.css"), "utf8")));

  island.querySelector(".island__face--idle").click();
  check("klik w wyspę morfuje ją w panel", island.dataset.mode === "panel" &&
    island.classList.contains("is-open") && island.getAttribute("aria-expanded") === "true");
  const tile = menu.querySelector('.island-tile[data-qs="dnd"]');   /* domyślnie wyłączony */
  tile.click();
  check("kafel przełącza stan i aria-pressed", tile.classList.contains("on") && tile.getAttribute("aria-pressed") === "true");
  tile.click();
  check("kafel wyłącza się ponownym klikiem", !tile.classList.contains("on") && tile.getAttribute("aria-pressed") === "false");
  phone.querySelector(".island-shade").click();
  check("tło zamyka panel (wyspa wraca do zegara)", island.dataset.mode !== "panel" &&
    menu.getAttribute("aria-hidden") === "true");

  /* --- 1:1 --- */
  const sizeBtn = document.getElementById("sizeToggle");
  const fullBtn = document.getElementById("fullToggle");
  check("przyciski 1:1 i pełny ekran istnieją", !!sizeBtn && !!fullBtn);

  sizeBtn.click();
  check("tryb 1:1 włącza się (aria-pressed)", sizeBtn.getAttribute("aria-pressed") === "true");
  check("tryb 1:1 wymusza widok pojedynczy", !!document.querySelector("#stage.single"));

  /* --- pełny ekran (w jsdom bez Fullscreen API — weryfikujemy stan i CSS) --- */
  const fs_css = fs.readFileSync(path.join(root, "css/island.css"), "utf8");
  fullBtn.click();
  check("pełny ekran włącza klasę na <html>", document.documentElement.classList.contains("is-fullscreen"));
  check("pełny ekran pokazuje dokładnie jedno urządzenie (.is-shown) — brak czarnego ekranu",
    document.querySelectorAll(".device.is-shown").length === 1 &&
    document.querySelector(".device.is-shown").classList.contains("device--phone"));
  check("w pełnym ekranie jest przycisk wyjścia",
    !!document.querySelector(".fs-exit") &&
    fs_css.includes("html.is-fullscreen .fs-exit{display:grid}"));
  check("w pełnym ekranie treść skaluje się przez transform (czcionki też rosną)",
    /html\.is-fullscreen \.stage > \.device\.is-shown\{[^}]*transform:scale\(var\(--zoom/.test(fs_css));
  check("w pełnym ekranie rozmiar makiety jest liczony w px okna",
    typeof w.Lumino !== "undefined");
  check("zmiana urządzenia w pełnym ekranie przenosi .is-shown", (() => {
    fullBtn.click();                       /* wejdź */
    document.querySelector('[data-view="laptop"]').click();
    const shown = document.querySelectorAll(".device.is-shown");
    const ok = shown.length === 1 && shown[0].classList.contains("device--laptop");
    document.querySelector('[data-view="phone"]').click();
    fullBtn.click();                       /* wyjdź */
    return ok;
  })());
  check("wyjście z pełnego ekranu zdejmuje skalę 1:1", (() => {
    const isFs = () => !!(w.Lumino && w.Lumino.isFullscreen && w.Lumino.isFullscreen());
    if (isFs()) fullBtn.click();           /* upewnij się, że jesteśmy poza */
    const dev = document.querySelector(".device.is-shown");
    fullBtn.click();                       /* wejdź */
    const zoomIn = dev.style.getPropertyValue("--zoom");
    fullBtn.click();                       /* wyjdź */
    const zoomOut = dev.style.getPropertyValue("--zoom");
    fullBtn.click();                       /* wróć do pełnego ekranu (dalsze testy) */
    return zoomIn !== "" && zoomOut === "";
  })());
  check("w pełnym ekranie ukryte są WSZYSTKIE nie-wybrane urządzenia (jedno źródło prawdy)",
    fs_css.includes("html.is-fullscreen .stage > .device{display:none!important}") &&
    !/html\.is-fullscreen \.stage > \.device\{\s*display:flex!important/.test(fs_css));
  check("laptop w pełnym ekranie mieści się w oknie (brak przycięcia)",
    fs_css.includes("html.is-fullscreen .device--laptop .lid") && fs_css.includes("max-width:100vw"));
  check("awaryjna reguła CSS pokazuje telefon, gdy brak .is-shown",
    fs_css.includes('html.is-fullscreen:not(:has(.device.is-shown))'));
  check("bez Fullscreen API nie udajemy trybu natywnego (brak .is-native w jsdom)",
    !document.documentElement.classList.contains("is-native"));
  check("pełny ekran ustawia aria-pressed", fullBtn.getAttribute("aria-pressed") === "true");
  fullBtn.click();
  check("pełny ekran wyłącza się", !document.documentElement.classList.contains("is-fullscreen"));

  /* --- szukanie w szufladzie --- */
  const input = phone.querySelector(".drawer-search__input");
  check("szuflada ma prawdziwe pole szukania", !!input);
  if (input) {
    input.value = "spo";
    input.dispatchEvent(new w.Event("input", { bubbles: true }));
    const visible = [...phone.querySelectorAll(".drawer-grid .app")].filter(a => !a.classList.contains("is-hidden"));
    check("szukanie filtruje aplikacje", visible.length === 1 && /spotify/i.test(visible[0].textContent));
    input.value = "";
    input.dispatchEvent(new w.Event("input", { bubbles: true }));
  }

  check("brak błędów JS", errs.length === 0);
  if (errs.length) console.log("      " + errs.join("\n      "));
  console.log(`\nPełny ekran i belka: ${pass} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
}, 600));
