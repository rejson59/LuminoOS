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
  const island = bar.querySelector(".island");
  check("belka ma wyspę po lewej", !!island && bar.firstElementChild === island);
  check("wyspa pokazuje zegar i datę", !!island.querySelector(".island__time") && !!island.querySelector(".island__date"));
  check("prawa strona belki: szukaj + status (panel otwiera wyspa)",
    bar.querySelectorAll("[data-action='search']").length === 1 &&
    bar.querySelector(".statusbar__right [data-action='search']") !== null &&
    island.getAttribute("data-action") === "panel" &&
    !!bar.querySelector(".statusbar__icons"));
  check("brak osobnej kropki aparatu na środku belki", !bar.querySelector(".punch") && !island.querySelector(".island__dot"));
  check("wyspa ma soczewkę aparatu", !!island.querySelector(".island__cam"));
  check("belka nie jest już wyśrodkowana (brak justyfikacji space-between na czas)",
    !bar.hasAttribute("data-action"));

  /* --- wyspa zamiast panelu --- */
  const menu = phone.querySelector(".island-menu");
  check("panel powiadomień usunięty (brak .a-panel i .a-shade)",
    !phone.querySelector(".a-panel") && !phone.querySelector(".a-shade"));
  check("wyspa ma rozwijane skróty", !!menu && !!phone.querySelector(".island-shade"));
  check("skróty: 8 kafli + 2 suwaki + powiadomienia jako ikony",
    menu.querySelectorAll(".island-tile").length === 8 &&
    menu.querySelectorAll(".island-slider").length === 2 &&
    menu.querySelectorAll(".island-notif").length >= 3);
  check("skróty to same ikony — bez podpisów tekstowych",
    [...menu.querySelectorAll(".island-tile")].every(t => !t.textContent.trim()) &&
    [...menu.querySelectorAll(".island-tile")].every(t => t.querySelector("svg.ico")));
  check("kafle to kwadraty z zaokrągleniem (nie koła)",
    /island-tile\{[\s\S]*?border-radius:\s*12px/.test(fs.readFileSync(path.join(root, "css/island.css"), "utf8")));

  island.click();
  check("klik w wyspę rozwija skróty", menu.classList.contains("is-open") &&
    island.classList.contains("is-open") && island.getAttribute("aria-expanded") === "true");
  const tile = menu.querySelector('.island-tile[data-qs="dnd"]');   /* domyślnie wyłączony */
  tile.click();
  check("kafel przełącza stan i aria-pressed", tile.classList.contains("on") && tile.getAttribute("aria-pressed") === "true");
  tile.click();
  check("kafel wyłącza się ponownym klikiem", !tile.classList.contains("on") && tile.getAttribute("aria-pressed") === "false");
  phone.querySelector(".island-shade").click();
  check("tło zamyka skróty", !menu.classList.contains("is-open") && menu.getAttribute("aria-hidden") === "true");

  /* --- 1:1 --- */
  const sizeBtn = document.getElementById("sizeToggle");
  const fullBtn = document.getElementById("fullToggle");
  check("przyciski 1:1 i pełny ekran istnieją", !!sizeBtn && !!fullBtn);

  sizeBtn.click();
  check("tryb 1:1 włącza się (aria-pressed)", sizeBtn.getAttribute("aria-pressed") === "true");
  check("tryb 1:1 wymusza widok pojedynczy", !!document.querySelector("#stage.single"));

  /* --- pełny ekran (tryb awaryjny „theater” w jsdom) --- */
  fullBtn.click();
  check("pełny ekran włącza klasę na <html>", document.documentElement.classList.contains("is-fullscreen"));
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
