/* ============================================================
   LuminoOS — nowe sterowanie telefonem (gesty zamiast ostatnich zadań)
   ────────────────────────────────────────────────────────────
   • przesunięcie w GÓRĘ od dolnej krawędzi → wysuwa się PRZESUWALNY
     pasek w stylu macOS z ostatnio używanymi aplikacjami
   • pasek przewija się w poziomie (kółko, przeciąganie, strzałki)
     i podąża za palcem; klik otwiera aplikację
   • przesunięcie w górę NA TYM PASKU (schowek) → ekran główny
   • przesunięcie od LEWEJ krawędzi → wstecz
   • przesunięcie od PRAWEJ krawędzi → ekran główny
   • wszystko na transform/opacity, jeden scheduler rAF (Lumino.motion)
   ============================================================ */
(function () {
  "use strict";

  const reduce = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  /* ---------------- geometria progów ---------------- */
  const EDGE = 26;        /* szerokość strefy krawędzi (px) */
  const TRIGGER = 64;     /* min. przesunięcie, by uznać gest (px) */
  const VELOCITY = 0.45;  /* px/ms — szybki ruch działa nawet przy krótkim geście */

  /* ---------------- historia ostatnich aplikacji ---------------- */
  const MAX_RECENT = 8;
  function createRecents(Lumino) {
    let list = [];

    let queue = [];
    let removedAt = {};        /* id -> czas usunięcia (ms) */
    function push(id) {
      if (!id) return;
      /* nie wskrzeszaj karty, którą użytkownik właśnie zamknął */
      if (removedAt[id] && Date.now() - removedAt[id] < 400) return;
      queue.push(id);
    }
    /* opróżniamy kolejkę poza obsługą zdarzenia — dzięki temu kolejność
       „zapis → ewentualne zamknięcie z paska” jest zawsze poprawna */
    function flush() {
      if (!queue.length) return;
      const ids = queue; queue = [];
      ids.forEach(id => { list = [id, ...list.filter(x => x !== id)].slice(0, MAX_RECENT); });
    }
    function remove(id) { removedAt[id] = Date.now(); list = list.filter(x => x !== id); }
    function insert(id, index) {
      const at = Math.max(0, Math.min(index < 0 ? 0 : index, list.length));
      const next = list.filter(x => x !== id);
      next.splice(at, 0, id);
      list = next.slice(0, MAX_RECENT);
    }
    function all() { return list.slice(); }
    return { push, flush, remove, insert, all: () => { flush(); return list.slice(); } };
  }

  /* ---------------- budowa paska ---------------- */
  function buildBar(screen, recents, handlers) {
    const bar = document.createElement("div");
    bar.className = "a-activity";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Ostatnio używane aplikacje");
    /* pasek jak w macOS: jedna szklana wyspa unosi się NAD dołem ekranu,
       bez nagłówka z tekstem — tylko karty (ikona + nazwa) i grabber */
    bar.innerHTML = `
      <div class="a-activity__track"><div class="a-activity__rail"></div></div>
      <div class="a-activity__grabber" aria-hidden="true"></div>
    `;
    screen.appendChild(bar);

    const track = bar.querySelector(".a-activity__track");
    const rail = bar.querySelector(".a-activity__rail");

    /* stan paska */
    let open = false;
    let openedAt = 0;    /* kiedy pasek się otworzył (ms) */
    let offset = 0;      /* przesunięcie toru w px (ujemne = w prawo) */
    let maxOffset = 0;

    function measure() {
      maxOffset = Math.max(0, rail.scrollWidth - track.clientWidth + 8);
      offset = Math.min(0, Math.max(-maxOffset, offset));
      apply();
    }
    function apply() {
      rail.style.transform = `translate3d(${offset.toFixed(1)}px,0,0)`;
    }
    function scrollBy(px) {
      offset = Math.min(0, Math.max(-maxOffset, offset + px));
      apply();
    }
    function scrollToCard(id) {
      const card = rail.querySelector(`[data-recent="${id}"]`);
      if (!card) return;
      const left = card.offsetLeft - 12;
      offset = Math.min(0, Math.max(-maxOffset, -left));
      apply();
    }

    /* render kart */
    function render() {
      const ids = recents.all();
      rail.innerHTML = ids.length
        ? ids.map(id => {
            const app = (window.Lumino.appById && window.Lumino.appById(id)) || { label: id };
            return `<button class="a-card" data-recent="${id}" aria-label="${app.label}">
              ${window.Lumino.iconImg(id, "a-card__icon")}
              <span class="a-card__label">${app.label}</span>
              <span class="a-card__actions">
                <span class="a-card__x" data-close="${id}" title="Zamknij">✕</span>
              </span>
            </button>`;
          }).join("")
        : `<div class="a-card a-card--empty"><span class="a-card__label">Brak ostatnich aplikacji</span></div>`;
      /* kaskada: karty pojawiają się jedna po drugiej przy otwarciu */
      Array.from(rail.children).forEach((card, i) => {
        card.style.setProperty("--i", String(i));
      });
      requestAnimationFrame(measure);
    }

    /* otwieranie / zamykanie paska */
    function show() {
      if (open) return false;
      open = true;
      render();                       /* karty w DOM przed wejściem klasy */
      bar.classList.add("is-open");   /* synchronicznie — bez opóźnienia animacji */
      openedAt = performance.now();
      return true;
    }
    function hide() {
      if (!open) return false;
      open = false;
      bar.classList.remove("is-open");
      return true;
    }
    const isOpen = () => open;

    /* krótkie „Cofnij” — cofnięcie zamknięcia aplikacji z paska */
    let undoData = null, undoTimer = 0;
    const undoEl = document.createElement("div");
    undoEl.className = "a-undo";
    undoEl.innerHTML = `<span class="a-undo__txt"></span>
      <button class="a-undo__btn" type="button">Cofnij</button>`;
    screen.appendChild(undoEl);
    undoEl.querySelector(".a-undo__btn").addEventListener("click", e => {
      e.stopPropagation();
      if (!undoData) return;
      recents.insert(undoData.id, undoData.index);
      render();
      hideUndo();
    });

    function undoToast(id, index) {
      clearTimeout(undoTimer);
      const app = (window.Lumino.appById && window.Lumino.appById(id)) || { label: id };
      undoEl.querySelector(".a-undo__txt").textContent = `Zamknięto ${app.label}`;
      undoEl.classList.add("is-open");
      undoData = { id, index };
      undoTimer = setTimeout(hideUndo, 4000);
    }
    function hideUndo() {
      undoData = null;
      undoEl.classList.remove("is-open");
    }

    /* sterowanie paskiem */
    bar.addEventListener("click", e => {
      recents.flush();      /* zapisuję historię zanim cokolwiek zamknę */
      if (e.target.closest("[data-dir]")) {
        const dir = Number(e.target.closest("[data-dir]").dataset.dir);
        scrollBy(-dir * Math.max(140, track.clientWidth * 0.7));
        return;
      }
      const x = e.target.closest("[data-close]");
      if (x) {
        e.stopPropagation();
        const id = x.dataset.close;
        const index = recents.all().indexOf(id);
        recents.remove(id);
        render();
        undoToast(id, index);
        return;
      }
      const card = e.target.closest("[data-recent]");
      if (card) {
        hide();
        handlers.openApp(card.dataset.recent);
      }
    });

    bar.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft") scrollBy(160);
      if (e.key === "ArrowRight") scrollBy(-160);
      if (e.key === "Escape") hide();
    });

    /* przeciąganie paska w poziomie (myszka/palec) */
    let dragX = null, dragOffset = 0, dragging = false;
    track.addEventListener("pointerdown", e => {
      dragX = e.clientX;
      dragOffset = offset;
      dragging = false;
      /* UWAGA: bez setPointerCapture — przechwycenie odbierałoby gest
         przesunięcia w górę (schowek → ekran główny) */
    }, { passive: true });
    track.addEventListener("pointermove", e => {
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 4) dragging = true;
      offset = Math.min(0, Math.max(-maxOffset, dragOffset + dx));
      apply();
    }, { passive: true });
    track.addEventListener("pointerup", () => { dragX = null; });
    track.addEventListener("pointercancel", () => { dragX = null; });
    track.addEventListener("wheel", e => {
      if (!open) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      scrollBy(-d);
    }, { passive: false });
    track.addEventListener("click", e => { if (dragging) { e.stopPropagation(); dragging = false; } }, true);

    window.addEventListener("resize", () => { if (open) measure(); });

    return { bar, show, hide, isOpen, render, scrollToCard, measure, track,
             openedAt: () => openedAt };
  }

  /* ---------------- montaż ---------------- */
  function init() {
    const screens = Array.from(document.querySelectorAll("[data-android]"));
    if (!screens.length) return;

    const recents = createRecents();

    screens.forEach(screen => {
      const device = screen.dataset.android || "phone";
      /* JEDEN system: ten sam zestaw gestów i ten sam pasek ostatnich
         aplikacji działa na telefonie I na tablecie (wcześniej tablet
         miał „klasyczne” zachowanie i wyglądał jak inny system). */

      /* zamykanie aplikacji bezpośrednio w powłoce */
      const closeAppDirect = id => {
        const host = screen.querySelector(".a-apps");
        const el = host && host.querySelector(`.a-app[data-app-id="${id}"]`);
        if (el && el.animate) {
          const a = el.animate(
            [{ transform: "none", opacity: 1 }, { transform: "translateY(14px) scale(.96)", opacity: 0 }],
            { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }
          );
          a.onfinish = () => el.remove();
        } else if (el) el.remove();
        recents.remove(id);
      };

      const api = buildBar(screen, recents, {
        openApp(id) {
          /* jeśli ta aplikacja już jest otwarta, najpierw ją zamknij
             (jeden element .a-app na aplikację) */
          const host = screen.querySelector(".a-apps");
          host && host.querySelectorAll(`.a-app[data-app-id="${id}"]`).forEach(el => el.remove());
          if (window.Lumino.androidOpen) window.Lumino.androidOpen(screen, id);
          else screen.lumino && screen.lumino.openApp(id);
        }
      });

      const launcher = screen.querySelector(".a-launcher");
      const appsHost = screen.querySelector(".a-apps");
      const shade = screen.querySelector(".island-shade");

      /* --- co jest teraz na wierzchu --- */
      const topApp = () => {
        const opened = appsHost ? Array.from(appsHost.querySelectorAll(".a-app.is-open")) : [];
        return opened.length ? opened[opened.length - 1] : null;
      };
      const isLocked = () => {
        const lock = screen.querySelector(".a-lock");
        return !!lock && !lock.classList.contains("is-unlocked");
      };
      /* panel zastąpiony wyspą — zamykamy rozwijane skróty i zdejmujemy cień */
      const islandEl = screen.querySelector(".island");
      const closePanel = () => {
        if (shade) shade.classList.remove("is-open");
        if (islandEl) {
          const playing = !!(window.Lumino.player && window.Lumino.player.playing);
          islandEl.dataset.mode = playing ? "music" : "idle";
          islandEl.classList.remove("is-open");
          islandEl.setAttribute("aria-expanded", "false");
        }
      };
      const panelIsOpen = () => !!islandEl && islandEl.dataset.mode === "panel";
      const goHome = () => {
        closePanel();
        api.hide();
        const app = topApp();
        if (app) {
          const id = app.dataset.appId;
          const back = app.querySelector("[data-back]");
          if (back) back.click();               /* niech aplikacja posprząta po sobie */
          /* gwarancja: ekran główny zawsze na wierzchu, nawet gdy aplikacja
             nie zdążyła się zamknąć (np. własna obsługa „wstecz”) */
          if (app.classList.contains("is-open")) app.classList.remove("is-open");
          if (id) recents.remove(id);
        }
        if (launcher) launcher.classList.add("is-home");
      };
      const goBack = () => {
        if (api.isOpen()) { api.hide(); return; }
        if (panelIsOpen()) { closePanel(); return; }
        const app = topApp();
        if (app) {
          const back = app.querySelector("[data-back]");
          if (back) back.click();
          if (app.classList.contains("is-open")) app.classList.remove("is-open");
          if (app.dataset.appId) recents.remove(app.dataset.appId);
        }
      };

      /* --- rejestracja otwieranych aplikacji ---
         nasłuch w fazie przechwytywania: działamy zanim powłoka otworzy
         aplikację, więc historia jest gotowa od pierwszej klatki */
      const rememberFromEvent = e => {
        const btn = e.target.closest && e.target.closest("[data-app]");
        if (!btn || !screen.contains(btn)) return;
        if (btn.closest(".a-card")) return;      /* klik w kartę paska to nie otwarcie */
        if (btn.dataset.app) recents.push(btn.dataset.app);
      };
      screen.addEventListener("click", rememberFromEvent, true);

      if (appsHost) {
        /* nowe okno aplikacji chowa pasek; historia jest zapisywana przy
           kliknięciu (jedno źródło prawdy — bez podwójnego dopisywania) */
        new MutationObserver(muts => {
          muts.forEach(m => m.addedNodes && m.addedNodes.forEach(n => {
            if (!(n.nodeType === 1 && n.classList && n.classList.contains("a-app"))) return;
            /* nie zamykaj paska z powodu aplikacji dodanej PRZED jego otwarciem
               (obserwator DOM potrafi zadziałać już po geście) */
            if (performance.now() - api.openedAt() < 300) return;
            api.hide();
          }));
        }).observe(appsHost, { childList: true });
      }

      /* --- gesty: wskaźnik --- */
      let g = null;   /* {kind, startX, startY, t0} */

      function pdown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (isLocked()) return;
        /* gest z uchwytu startuje pierwszy — nie nadpisujemy go drugim
           nasłuchem (wcześniej gubił się forceEdge i gest „nie działał”) */
        if (g && g.forceEdge && g.pointerId === e.pointerId) return;
        g = {
          kind: null,
          x: e.clientX, y: e.clientY,
          t: performance.now(),
          pointerId: e.pointerId,
          target: e.target
        };
      }

      /* miejsca, w których poziomy ruch ma inne znaczenie (suwaki, karuzela) */
      function horizontalSafe(target) {
        if (!target || !target.closest) return true;
        return !target.closest("input[type=range], .slider, .launcher-pages, .a-activity__track, .sp-track");
      }

      function pmove(e) {
        if (!g) return;
        const dx = e.clientX - g.x, dy = e.clientY - g.y;
        if (!g.kind) {
          if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
            g.kind = dy < 0 ? "up" : "down";
          } else if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
            g.kind = dx > 0 ? "right" : "left";
          }
          if (!g.kind) return;
          const rb = screen.getBoundingClientRect();
          const valid = rb.width > 0 && rb.height > 0;   /* geometria bywa 0 (np. w testach) */
          const d = g.kind === "left" ? g.x - rb.left
            : g.kind === "right" ? rb.right - g.x
            : g.kind === "up" ? rb.bottom - g.y
            : g.y - rb.top;
          /* start z uchwytu = zawsze traktuj jak krawędź */
          g.edge = g.forceEdge || !valid ? 0 : d;
        }

        /* podążanie palca: pasek wysuwa się razem z gestem */
        if (g.kind === "up" && g.edge < EDGE && !api.isOpen()) {
          const d = Math.min(0, dy);
          if (d < -8) api.bar.classList.add("is-following");
          api.bar.style.setProperty("--follow", `${Math.max(d, -120).toFixed(0)}px`);
        }
        /* wizualne podążanie: w prawo = „wstecz', w lewo = „ekran główny'.
           Pokazujemy je ZAWSZE (nie tylko z krawędzi), żeby gest był czytelny. */
        if (g.kind === "right") {
          const p = Math.max(0, Math.min(1, dx / 110));
          screen.style.setProperty("--swipe-back", p.toFixed(3));
          screen.classList.toggle("is-swiping-back", p > 0.04);
        } else if (g.kind === "left") {
          const p = Math.max(0, Math.min(1, -dx / 110));
          screen.style.setProperty("--swipe-home", p.toFixed(3));
          screen.classList.toggle("is-swiping-home", p > 0.04);
        }
      }

      function pup(e) {
        if (!g) return;
        /* kończymy TYLKO gest rozpoczęty tym samym wskaźnikiem */
        if (e.pointerId !== undefined && g.pointerId !== undefined && e.pointerId !== g.pointerId) return;
        const dx = e.clientX - g.x, dy = e.clientY - g.y;
        const dt = Math.max(1, performance.now() - g.t);
        const vx = dx / dt, vy = dy / dt;
        const kind = g.kind;
        const edge = g.edge;
        const g0 = g;
        g = null;
        screen.style.removeProperty("--swipe-back");
        screen.style.removeProperty("--swipe-home");
        screen.classList.remove("is-swiping-back", "is-swiping-home");
        api.bar.classList.remove("is-following");
        api.bar.style.removeProperty("--follow");

        if (!kind) return;

        /* --- w górę --- */
        if (kind === "up") {
          const far = -dy > TRIGGER || vy < -VELOCITY;
          if (!far) { if (api.isOpen()) api.hide(); return; }
          /* otwarty pasek + ruch w górę = ekran główny (bez względu na krawędź) */
          if (api.isOpen()) { goHome(); return; }
          if (edge < EDGE) { api.show(); return; }   /* schowek z dołu → pasek aplikacji */
          goHome();                                  /* w górę nad paskiem → ekran główny */
          return;
        }
        /* --- w dół --- */
        if (kind === "down") {
          const far = dy > TRIGGER || vy > VELOCITY;
          if (far && api.isOpen()) api.hide();
          return;
        }
        /* --- w prawo → wstecz (z krawędzi wystarczy krótszy ruch) --- */
        if (kind === "right") {
          const near = edge < EDGE;
          const far = near ? (dx > 44 || vx > 0.32)
                           : (dx > TRIGGER || vx > VELOCITY);
          if (far && horizontalSafe(g0.target)) goBack();
          return;
        }
        /* --- w lewo → ekran główny --- */
        if (kind === "left") {
          const near = edge < EDGE;
          const far = near ? (-dx > 44 || vx < -0.32)
                           : (-dx > TRIGGER || vx < -VELOCITY);
          if (far && horizontalSafe(g0.target)) goHome();
          return;
        }
      }

      /* --- UCHWYTY DLA MYSZKI ---
         Kursorem nie da się „chwycić” krawędzi makiety, więc nad nią leżą
         cztery cienkie strefy. Przeciąganie zaczyna się na uchwycie,
         a kończy na oknie — bez setPointerCapture (odbierałby gest paskowi). */
      const EDGES = [
        ["top", "Przesuń w górę — wyspa i skróty"],
        ["right", "Przesuń w lewo — ekran główny"],
        ["bottom", "Przesuń w górę — ostatnie aplikacje"],
        ["left", "Przesuń w prawo — wstecz"]
      ];
      const handles = EDGES.map(([edge, hint]) => {
        const el = document.createElement("div");
        el.className = `gesture-edge gesture-edge--${edge}`;
        el.dataset.gestureEdge = edge;
        el.dataset.hint = hint;
        el.setAttribute("aria-hidden", "true");
        screen.appendChild(el);
        return el;
      });

      /* strzałki pokazujące kierunek gestu (widoczne w trakcie przeciągania) */
      ["left", "right"].forEach(side => {
        const tip = document.createElement("div");
        tip.className = `gesture-tip gesture-tip--${side}`;
        tip.textContent = side === "left" ? "‹" : "›";
        tip.setAttribute("aria-hidden", "true");
        screen.appendChild(tip);
      });

      handles.forEach(el => {
        el.addEventListener("pointerdown", e => {
          /* gest startuje z konkretnej krawędzi — nie zgadujemy po geometrii */
          pdown(e);
          if (g) g.forceEdge = true;
        });
      });

      /* nasłuchujemy na całej makiecie telefonu (krawędzie też) */
      screen.addEventListener("pointerdown", pdown, { passive: true });
      screen.addEventListener("pointermove", pmove, { passive: true });
      screen.addEventListener("pointerup", pup, { passive: true });
      /* gest myszką trwa także wtedy, gdy kursor wyjedzie poza makietę */
      window.addEventListener("pointermove", e => { if (g) pmove(e); }, { passive: true });
      window.addEventListener("pointerup", e => { if (g) pup(e); }, { passive: true });
      window.addEventListener("blur", () => {
        if (!g) return;
        g = null;
        api.bar.classList.remove("is-following");
        api.bar.style.removeProperty("--follow");
        screen.style.removeProperty("--swipe-back");
        screen.style.removeProperty("--swipe-home");
        screen.classList.remove("is-swiping-back", "is-swiping-home");
      });
      if (window.LUMINO_DEBUG) window.__luLast = () => ({ kind: "attached", g: !!g });
      screen.addEventListener("pointercancel", () => { g = null; api.bar.classList.remove("is-following"); });

      /* pasek gestów (dotychczas otwierał szufladę) — teraz pokazuje aplikacje */
      const pill = screen.querySelector(".navbar__pill");
      if (pill) {
        pill.setAttribute("title", "Ostatnio używane aplikacje (przesuń w górę)");
        pill.setAttribute("aria-label", "Ostatnio używane aplikacje");
        pill.addEventListener("click", e => {
          e.stopPropagation();
          api.isOpen() ? api.hide() : api.show();
        }, true);
      }

      /* klik w tło paska zamyka go */
      api.bar.addEventListener("pointerdown", e => {
        if (e.target === api.bar) api.hide();
      });

      /* --- stan „ekran główny": chowamy dock po powrocie? nie — tylko oznaczamy --- */
      screen.classList.add("has-activity-bar");

      /* publiczne API (dla testów i innych modułów) */
      screen.lumino = screen.lumino || {};
      screen.lumino.activity = {
        show: api.show, hide: api.hide, isOpen: api.isOpen,
        recents: () => recents.all(), goHome, goBack, closeApp: closeAppDirect
      };
      window.Lumino.androidActivity = Object.assign(window.Lumino.androidActivity || {}, {
        [device]: screen.lumino.activity
      });
    });
  }

  /* tablet i inne: bez zmian — tylko zapisujemy historię */
  function legacyRecents(screen, recents) {
    const host = screen.querySelector(".a-apps");
    if (!host) return;
    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes && m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && n.classList && n.classList.contains("a-app") && n.dataset.appId) {
          recents.push(n.dataset.appId);
        }
      }));
    }).observe(host, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else init();
})();
