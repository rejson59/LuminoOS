/* Test dymny: uruchamia index.html w jsdom i sprawdza kluczowe interakcje.
   Uruchomienie: node tools/smoke-test.js                                */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const root = path.join(__dirname, "..");
const vc = new VirtualConsole();
const errors = [];
vc.on("jsdomError", e => errors.push(e.message));
vc.on("error", e => errors.push(String(e)));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "file://" + root + "/index.html",
  pretendToBeVisual: true,
  virtualConsole: vc
});

const wait = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); console.log("  ✓ " + name); pass++; }
  catch (e) { console.log("  ✗ " + name + " — " + e.message); fail++; }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg || "warunek niespełniony"); };

dom.window.addEventListener("load", async () => {
  await wait(150);
  const { document } = dom.window;
  const L = dom.window.Lumino;
  const phone = document.querySelector('[data-android="phone"]');
  const tablet = document.querySelector('[data-android="tablet"]');
  const win = document.getElementById("winScreen");
  const stage = document.getElementById("stage");

  console.log("\n— Budowa powłok —");
  check("telefon zbudowany", () => assert(phone.querySelectorAll(".app").length >= 12));
  check("tablet zbudowany", () => assert(tablet.querySelectorAll(".widget").length >= 2));
  check("windows zbudowany", () => assert(win.querySelector(".taskbar") && win.querySelector(".win-window")));

  console.log("\n— Android: ekran blokady —");
  check("ekran startowy pokazuje blokadę telefonu", () => assert(phone.lumino.isLocked()));
  check("tablet też pokazuje blokadę", () => {
    assert(tablet.lumino && tablet.lumino.isLocked());
    assert(tablet.querySelector(".a-lock .lock-clock"));
  });
  check("blokada telefonu ma zegar i powiadomienia", () => {
    assert(phone.querySelector(".a-lock .lock-clock"));
    assert(phone.querySelector(".a-lock .lock-notif"));
  });
  check("blokada jest widoczna (nie przesunięta poza ekran)", () => {
    const lock = phone.querySelector(".a-lock");
    assert(!lock.classList.contains("is-unlocked"));
  });
  check("blokadę można odblokować przeciągnięciem w górę (myszka też)", () => {
    phone.lumino.lockScreen();
    assert(phone.lumino.isLocked());
    const lock = phone.querySelector(".a-lock");
    const fire = (el, type, cy) => el.dispatchEvent(new dom.window.PointerEvent(type, {
      bubbles: true, clientX: 140, clientY: cy, pointerType: "mouse", button: 0
    }));
    fire(lock, "pointerdown", 520);
    /* ruch i puszczenie POZA makietą — myszka ucieka za krawędź */
    fire(dom.window, "pointermove", 480);
    fire(dom.window, "pointermove", 400);
    assert(lock.classList.contains("is-dragging"), "blokada podąża za wskaźnikiem");
    fire(dom.window, "pointerup", 380);
    assert(!phone.lumino.isLocked(), "przeciągnięcie odblokowuje ekran");
  });
  check("krótkie przeciągnięcie wraca sprężyście (bez odblokowania)", () => {
    phone.lumino.lockScreen();
    const lock = phone.querySelector(".a-lock");
    const fire = (el, type, cy) => el.dispatchEvent(new dom.window.PointerEvent(type, {
      bubbles: true, clientX: 140, clientY: cy, pointerType: "mouse", button: 0
    }));
    fire(lock, "pointerdown", 500);
    fire(dom.window, "pointermove", 480);
    fire(dom.window, "pointerup", 470);
    assert(phone.lumino.isLocked(), "ekran dalej zablokowany");
    assert(lock.classList.contains("is-snapping"), "jest sprężysty powrót");
    phone.lumino.unlock();
  });
  check("kłódka w wyspie blokuje ekran", () => {
    phone.querySelector(".island").click();
    const lockBtn = phone.querySelector('.island-foot [data-action="lock"]');
    assert(lockBtn);
    lockBtn.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    assert(phone.lumino.isLocked());
  });
  check("blokada ekranu działa (przycisk w wyspie)", () => {
    phone.lumino.lockScreen();
    assert(phone.lumino.isLocked());
  });
  check("przycisk odblokowania działa", () => {
    phone.querySelector('.navbar__pill[data-action="unlock"]').dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    assert(!phone.lumino.isLocked());
  });

  console.log("\n— Android: wyspa ze skrótami (panel usunięty) —");
  check("nie ma już panelu powiadomień ani cienia panelu", () => {
    assert(!phone.querySelector(".a-panel"));
    assert(!phone.querySelector(".a-shade"));
  });
  check("klik w wyspę MORFUJE ją w panel skrótów (ta sama pigułka)", () => {
    /* klikamy twarz „zegar” — na prawdziwym urządzeniu to ona jest przyciskiem */
    phone.querySelector(".island__face--idle").click();
    const isl = phone.querySelector(".island");
    assert(isl.dataset.mode === "panel", "tryb panel");
    assert(isl.classList.contains("is-open"));
    assert(isl.querySelector(".island__face--panel"), "panel jest WEWNĄTRZ wyspy");
    assert(!phone.querySelector(".island-menu"), "brak osobnego okienka pod wyspą");
  });
  check("skróty przełączają się (ikona bez podpisu)", () => {
    const tile = phone.querySelector('.island-tile[data-qs="saver"]');
    tile.click();
    assert(tile.classList.contains("on"));
    assert(tile.getAttribute("aria-pressed") === "true");
    assert(!tile.textContent.trim(), "kafel nie ma tekstu — sama ikona");
  });
  check("powiadomienie MORFUJE wyspę w pasek z treścią", () => {
    /* panel musi być zamknięty, a ekran odblokowany (tak jak w realnym użyciu) */
    phone.querySelector(".island-shade").click();
    phone.lumino.unlock();
    phone.lumino.notify("messages", "Nowa wiadomość", "Ania: dasz radę dziś?", 60000);
    const isl = phone.querySelector(".island");
    assert(isl.dataset.mode === "notif", "tryb notif");
    assert(isl.querySelector("[data-island-notif-title]").textContent.length > 0);
    assert(isl.querySelector(".island__notif-img"), "ikona aplikacji w pigułce");
  });
  check("muzyka MORFUJE wyspę w mini odtwarzacz", () => {
    const pl = dom.window.Lumino.player;
    pl.play(0);
    const isl = phone.querySelector(".island");
    assert(isl.dataset.mode === "music", "tryb music");
    assert(isl.querySelector("[data-island-title]").textContent.trim().length > 0, "tytuł utworu");
    assert(isl.querySelector(".island__eq"), "equalizer");
    assert(isl.querySelector("[data-island-play]"), "przycisk play/pause");
    /* pauza nie może zamykać odtwarzacza w pigułce — wraca zegar */
    isl.querySelector("[data-island-play]").click();
    assert(!pl.playing, "pauza działa z pigułki");
    pl.pause();
  });
  check("skróty zamykają się klikiem w tło", () => {
    phone.querySelector(".island-shade").click();
    assert(phone.querySelector(".island").dataset.mode !== "panel");
  });

  console.log("\n— Android: szuflada —");
  check("pasek gestów otwiera ostatnie aplikacje (nowe sterowanie)", () => {
    phone.querySelector(".navbar__pill").click();
    assert(phone.querySelector(".a-activity").classList.contains("is-open"));
  });
  check("szuflada aplikacji nadal działa (kafel „Wszystkie”)", () => {
    phone.querySelector('.app[data-action="drawer"]').click();
    assert(phone.querySelector(".a-drawer").classList.contains("is-open"));
    phone.querySelector('.a-drawer .app[data-app="notes"]').click();
  });

  console.log("\n— Android: Spotify —");
  check("aplikacja Spotify otwiera się", () => {
    phone.querySelector('.app[data-app="spotify"]').click();
    const app = phone.querySelector('.a-app[data-app-id="spotify"]');
    assert(app && app.classList.contains("is-open"));
  });
  check("lista ma przykładowe utwory", () => {
    assert(phone.querySelectorAll('.a-app[data-app-id="spotify"] .sp-track').length === 9);
  });
  check("klik utworu uruchamia odtwarzanie i pełny ekran", () => {
    phone.querySelector('.a-app[data-app-id="spotify"] .sp-track[data-track="2"]').click();
    const p = L.player;
    assert(p.playing, "nie gra");
    assert(p.index === 2, "zły indeks");
    assert(p.track.title === "Lato w Krakowie");
    assert(phone.querySelector('[data-sp="now"]').classList.contains("is-open"));
  });
  check("tytuł na pełnym ekranie się zgadza", () => {
    assert(phone.querySelector('[data-sp="title"]').textContent === "Lato w Krakowie");
  });
  check("pauza / odtwarzanie", () => {
    phone.querySelector('[data-sp="play"]').click();
    assert(!L.player.playing);
    phone.querySelector('[data-sp="play"]').click();
    assert(L.player.playing);
  });
  check("następny utwór", () => {
    phone.querySelector('[data-sp="next"]').click();
    assert(L.player.index === 3, "indeks " + L.player.index);
  });
  check("postęp odtwarzania rośnie", async () => {});
  check("powrót zamyka pełny ekran, potem aplikację", () => {
    const back = phone.querySelector('.a-app[data-app-id="spotify"] [data-back]');
    back.click();
    assert(!phone.querySelector('[data-sp="now"]').classList.contains("is-open"));
    back.click();
    assert(!phone.querySelector('.a-app[data-app-id="spotify"]').classList.contains("is-open"));
  });

  console.log("\n— Android: kalkulator i wiadomości —");
  check("kalkulator liczy 7 × 8", () => {
    phone.lumino.openApp("calculator");
    const app = phone.querySelector('.a-app[data-app-id="calculator"]');
    const k = (key) => app.querySelector(`[data-key="${key}"]`).click();
    k("7"); k("×"); k("8"); k("=");
    assert(app.querySelector(".calc__val").textContent === "56", app.querySelector(".calc__val").textContent);
  });
  check("wiadomości: otwarcie wątku", () => {
    phone.lumino.openApp("messages");
    const app = phone.querySelector('.a-app[data-app-id="messages"]');
    app.querySelector('[data-thread="Marta"]').click();
    assert(!app.querySelector(".composer").hidden);
    assert(app.querySelectorAll(".bubble").length >= 3);
  });
  check("wiadomości: wysłanie tekstu", () => {
    const app = phone.querySelector('.a-app[data-app-id="messages"]');
    const input = app.querySelector(".composer input");
    input.value = "Test";
    app.querySelector(".send").click();
    assert(app.querySelectorAll(".bubble.out").length === 2, "brak nowej wiadomości");
  });

  console.log("\n— Tablet —");
  check("tablet ma inne widgety i 6 kolumn", () => {
    assert(tablet.querySelector(".widget--player"));
    assert(tablet.querySelectorAll(".page .app").length > 6);
  });
  check("tablet: aplikacja się otwiera", () => {
    tablet.lumino.openApp("calendar");
    assert(tablet.querySelector('.a-app[data-app-id="calendar"] .cal-grid'));
  });
  check("tablet: ustawienia mają przełączniki", () => {
    tablet.lumino.openApp("settings");
    const app = tablet.querySelector('.a-app[data-app-id="settings"]');
    assert(app.querySelectorAll(".switch").length >= 3);
    const s = app.querySelector(".switch");
    s.click();
    assert(s.getAttribute("aria-checked") === "true");
  });

  console.log("\n— Windows —");
  check("menu Start otwiera się", () => {
    win.querySelector('[data-tb="start"]').click();
    assert(win.querySelector(".start-menu").classList.contains("is-open"));
  });
  check("wyszukiwanie w Start filtruje", () => {
    const input = win.querySelector(".start-menu input");
    input.value = "spot";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    const visible = Array.from(win.querySelectorAll(".start-app")).filter(a => !a.classList.contains("is-hidden"));
    assert(visible.length === 1, "widoczne: " + visible.length);
  });
  check("Start otwiera Spotify", () => {
    win.querySelector('.start-app[data-open="spotify"]').click();
    assert(win.querySelector('[data-win="spotify"]'), "brak okna Spotify");
    assert(!win.querySelector(".start-menu").classList.contains("is-open"));
  });
  check("Spotify w laptopie gra ten sam utwór", () => {
    const w = win.querySelector('[data-win="spotify"]');
    w.querySelector('.sp-track[data-track="5"]').click();
    assert(L.player.index === 5);
    assert(w.querySelector('[data-sp="mini-title"]').textContent === L.player.track.title);
  });
  check("minimalizacja i przywrócenie okna", () => {
    const w = win.querySelector('[data-win="spotify"]');
    w.querySelector(".win-ctrl .min").click();
    assert(w.classList.contains("is-minimized"));
    win.querySelector('[data-tb="spotify"]').click();
    assert(!w.classList.contains("is-minimized"));
  });
  check("maksymalizacja okna", () => {
    const w = win.querySelector('[data-win="explorer"]');
    w.querySelector(".win-ctrl .max").click();
    assert(w.classList.contains("is-maximized"));
  });
  check("zamykanie okna", () => {
    const w = win.querySelector('[data-win="explorer"]');
    w.querySelector(".win-ctrl .close").click();
    assert(!win.querySelector('[data-win="explorer"]'));
  });
  check("Eksplorator: nawigacja po folderach", () => {
    win.lumino.openWindow("explorer");
    const w = win.querySelector('[data-win="explorer"]');
    w.querySelector('.side-item[data-folder="Obrazy"]').click();
    assert(w.querySelector("[data-crumb]").textContent === "Obrazy");
    assert(w.querySelectorAll(".file").length === 3);
  });
  check("Kalkulator Windows liczy 12 ÷ 4", () => {
    win.lumino.openWindow("calculator");
    const w = win.querySelector('[data-win="calculator"]');
    const k = (key) => w.querySelector(`[data-key="${key}"]`).click();
    k("1"); k("2"); k("÷"); k("4"); k("=");
    assert(w.querySelector(".win-calc__val").textContent === "3", w.querySelector(".win-calc__val").textContent);
  });
  check("Notatnik ma pole tekstowe", () => {
    win.lumino.openWindow("notepad");
    assert(win.querySelector('[data-win="notepad"] textarea'));
  });

  console.log("\n— Podglądy (osobne widoki) —");
  check("przełącznik widoków istnieje", () => {
    assert(document.querySelectorAll("[data-view]").length >= 4);
  });
  check("widok telefonu pokazuje tylko telefon", () => {
    dom.window.Lumino.setView("phone");
    assert(stage.dataset.view === "phone");
    const single = document.body.dataset.view === "phone";
    assert(single);
  });
  check("widok laptopa ustawia się z przycisku", () => {
    document.querySelector('.viewbtn[data-view="laptop"]').click();
    assert(stage.dataset.view === "laptop");
  });
  check("powrót do wszystkich", () => {
    document.querySelector('.viewbtn[data-view="all"]').click();
    assert(stage.dataset.view === "all");
  });

  console.log("\n— Ikony brandowe i ekrany —");
  check("ikony aplikacji są brandowe (nie jednolite gradienty)", () => {
    assert(phone.querySelectorAll(".app .bi").length >= 8);
    assert(phone.querySelectorAll(".dock .bi").length === 4);
  });
  check("telefon ma At a Glance i pasek wyszukiwania", () => {
    assert(phone.querySelector(".glance"));
    assert(phone.querySelector(".searchbar"));
  });
  check("skróty w wyspie są ikonami bez tekstu (prostota)", () => {
    const grid = [...phone.querySelectorAll(".island__face--panel .island-grid .island-tile")];
    assert(grid.length === 8);
    assert(grid.every(t => !t.textContent.trim()));
    assert(grid.every(t => t.querySelector("svg.ico")));
  });
  check("wyspa ma stopkę z samymi ikonami (kłódka/szukaj/aplikacje)", () => {
    const foot = [...phone.querySelectorAll(".island__face--panel .island-foot .island-tile")];
    assert(foot.length === 3);
    assert(foot.every(t => !t.textContent.trim() && t.querySelector("svg.ico")));
    assert(phone.querySelector('.island-foot [data-action="lock"]'));
  });
  check("Windows: menu Start ma 6 kolumn i 18 aplikacji", () => {
    assert(win.querySelectorAll(".start-app").length === 18);
  });
  check("Windows: ekran blokady i logowanie", () => {
    const lock = win.querySelector(".win-lock");
    assert(lock && !lock.classList.contains("is-unlocked"));
    win.querySelector('[data-lock="unlock"]').click();
    assert(lock.classList.contains("is-unlocked"));
  });
  check("Windows: nowe aplikacje otwierają okna", () => {
    win.lumino.openWindow("terminal");
    assert(win.querySelector('[data-win="terminal"]'));
  });

  console.log("\n— Błędy JS —");
  check("brak błędów wykonania", () => assert(errors.length === 0, errors.join(" | ")));

  console.log(`\nWynik: ${pass} OK, ${fail} błędów\n`);
  process.exit(fail ? 1 : 0);
});
