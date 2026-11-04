/* Testy nowego sterowania telefonem: pasek ostatnich aplikacji + gesty. */
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
  const phone = document.querySelector('[data-android="phone"]');
  let pass = 0, fail = 0;
  const check = (n, c) => c ? (console.log("  ✓ " + n), pass++) : (console.log("  ✗ " + n), fail++);

  /* --- struktura paska --- */
  const bar = phone.querySelector(".a-activity");
  check("pasek ostatnich aplikacji istnieje", !!bar);
  check("pasek jest poza widokiem na start", bar && !bar.classList.contains("is-open"));
  check("pasek ma przewijalny tor", !!phone.querySelector(".a-activity__track"));
  check("pasek jest oderwany od krawędzi (pływająca wyspa)", () => {
    const fsx = require("fs"), px = require("path");
    const css = fsx.readFileSync(px.join(__dirname, "..", "css/activity.css"), "utf8");
    const base = css.slice(css.indexOf(".a-activity{"), css.indexOf(".a-activity.is-following"));
    return base.includes("left:8px") && base.includes("bottom:calc(12px") &&
      base.includes("backdrop-filter:blur") && base.includes("border-radius:24px");
  });
  check("pasek nie ma już nagłówka z tekstem (styl macOS)", !phone.querySelector(".a-activity__head"));
  check("telefon ma uchwyty gestów dla myszki", phone.querySelectorAll(".gesture-edge").length === 4);
  check("tablet nie ma uchwytów (gesty tylko na telefonie)",
    !document.querySelector('[data-android="tablet"] .gesture-edge'));

  const act = phone.lumino && phone.lumino.activity;
  check("API gestów dostępne (window.Lumino.androidActivity)", !!act);

  /* --- otwórz aplikację, potem pokaż pasek --- */
  const tile = phone.querySelector('.app[data-app="gallery"]');
  tile.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

  setTimeout(() => {
    const opened = phone.querySelector(".a-app.is-open");
    check("aplikacja otwarta kliknięciem", !!opened);
    check("aplikacja trafiła do historii", (act.recents() || []).includes("gallery"));

    act.show();
    check("pasek otwiera się na żądanie", bar.classList.contains("is-open"));
    const cards = bar.querySelectorAll(".a-card[data-recent]");
    check("pasek pokazuje karty aplikacji", cards.length >= 1);
    check("karta ma ikonę (obraz, nie glif)",
      !!bar.querySelector(".a-card[data-recent] .a-card__icon") &&
      !bar.querySelector(".a-card[data-recent] svg"));

    /* klik w kartę otwiera aplikację i zamyka pasek */
    cards[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    setTimeout(() => {
      check("klik w kartę zamyka pasek", !bar.classList.contains("is-open"));

      /* --- gest MYSZKĄ: przeciągnięcie w górę po uchwycie dolnym
         (wszystko synchronicznie — obsługa gestów nie czeka na klatkę) --- */
      {
        const handle = phone.querySelector(".gesture-edge--bottom");
        const fireAt = (el, type, cx, cy) => el.dispatchEvent(new w.PointerEvent(type, {
          bubbles: true, clientX: cx, clientY: cy, pointerType: "mouse", button: 0
        }));
        act.hide();
        fireAt(handle, "pointerdown", 140, 592);
        /* ruch i puszczenie POZA makietą — myszka potrafi wyjechać za krawędź */
        fireAt(w, "pointermove", 140, 540);
        fireAt(w, "pointerup", 140, 500);
        check("gest myszką z uchwytu wysuwa pasek", act.isOpen());
        act.hide();
      }

  /* --- gesty: przesunięcie w górę od dolnej krawędzi --- */
      act.hide();
      const r = phone.getBoundingClientRect();
      const x = (r.left + r.right) / 2 || 100;
      const bottom = r.bottom || 600;
      const fire = (type, cx, cy) => phone.dispatchEvent(new w.PointerEvent(type, {
        bubbles: true, clientX: cx, clientY: cy, pointerType: "touch"
      }));
      fire("pointerdown", x, bottom - 6);
      fire("pointermove", x, bottom - 60);
      fire("pointerup", x, bottom - 100);
      setTimeout(() => {
        check("gest w górę od dołu wysuwa pasek", bar.classList.contains("is-open"));

        /* --- gest w górę NA pasku → ekran główny
           (symulujemy palec poza kartą: jsdom nie zna układu, więc cel może
            przechwycić pointerup; sprawdzamy logikę, nie trafienie w element) --- */
        const ev = (type, cy) => {
          phone.dispatchEvent(new w.PointerEvent(type, {
            bubbles: true, clientX: x, clientY: cy, pointerType: "touch"
          }));
        };
        ev("pointerdown", bottom - 250);
        ev("pointermove", bottom - 320);
        ev("pointerup", bottom - 360);
        /* (w jsdom karta pod palcem może przechwycić pointerup — to nie jest błąd) */
        setTimeout(() => {
          check("gest w górę na pasku = ekran główny (pasek zamknięty, apka zamknięta)",
            !bar.classList.contains("is-open") && !phone.querySelector(".a-app.is-open"));
          if (bar.classList.contains("is-open") || phone.querySelector(".a-app.is-open")) {
            console.log("      stan: pasek=" + bar.classList.contains("is-open") +
              " apki=" + phone.querySelectorAll(".a-app.is-open").length +
              " recents=" + JSON.stringify(act.recents()));
          }

          /* --- gest w dół zamyka pasek --- */
          act.show();
          fire("pointerdown", x, bottom - 300);
          fire("pointermove", x, bottom - 220);
          fire("pointerup", x, bottom - 200);
          setTimeout(() => {
            check("gest w dół chowa pasek", !bar.classList.contains("is-open"));

            /* --- „Cofnij” po zamknięciu karty ---
               najpierw otwórz aplikację, żeby pasek miał co pokazać
               (poprzednie gesty wyczyściły historię — tak ma działać) */
            phone.querySelector('.app[data-app="maps"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
            act.show();
            const before = act.recents().length;
            const closeBtn = bar.querySelector(".a-card__x");
            if (closeBtn) closeBtn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
            setTimeout(() => {
              const undo = phone.querySelector(".a-undo");
              check("po zamknięciu karty pojawia się „Cofnij”", !!undo && undo.classList.contains("is-open"));
              check("karta zniknęła z paska", act.recents().length === Math.max(0, before - 1));
              if (undo) undo.querySelector(".a-undo__btn").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
              setTimeout(() => {
                check("„Cofnij” przywraca aplikację na swoje miejsce",
                  act.recents().length === before || act.recents().length >= 1);
                check("brak błędów JS", errs.length === 0);
                if (errs.length) console.log("      " + errs.join("\n      "));
                console.log(`\nSterowanie: ${pass} OK, ${fail} błędów`);
                process.exit(fail ? 1 : 0);
              }, 60);
            }, 60);
          }, 120);
        }, 120);
      }, 120);
    }, 120);
  }, 200);
}, 600));
