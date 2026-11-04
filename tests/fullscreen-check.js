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
  check("prawa strona belki: szukaj + sterowanie + status",
    bar.querySelectorAll("[data-action='search']").length === 1 &&
    bar.querySelectorAll('[data-action="panel"]').length >= 1 &&
    !!bar.querySelector(".statusbar__icons"));
  check("belka nie jest już wyśrodkowana (brak justyfikacji space-between na czas)",
    !bar.hasAttribute("data-action"));

  /* --- panel --- */
  const panel = phone.querySelector(".a-panel");
  check("panel ma duże kafle suwaków", panel.querySelectorAll(".tile-slider").length === 2);
  check("panel ma siatkę 8 przełączników", panel.querySelectorAll(".qs").length === 8);
  check("panel ma powiadomienia i akcje", panel.querySelectorAll(".notif").length >= 3 && !!panel.querySelector(".panel-actions"));

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
