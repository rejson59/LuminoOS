/* ============================================================
   LuminoOS — makiety: powłoka Androida (telefon + tablet)
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, icon, iconImg, player, tracks, androidApps, notifications, APP, brandIcon,
          sys, qsGrid, qsSliders } = window.Lumino;
  const fmtTime = window.Lumino.fmtTime;

  const DOCK = ["phone", "messages", "chrome", "spotify"];

  const appTile = (app, cls = "app") => `
    <button class="${cls}" data-app="${app.id}">
      <span class="app__wrap">
        ${brandIcon(app.id)}
        ${app.badge ? `<span class="app__badge">${app.badge}</span>` : ""}
      </span>
      <span class="app__label">${app.label}</span>
    </button>`;

  /* ------------------------------------------------------------
     Budowa jednej instancji (telefon lub tablet)
     ------------------------------------------------------------ */
  function buildAndroid(root) {
    const isTablet = root.dataset.android === "tablet";
    /* margines pigułki + panel liczymy z tego samego miejsca, więc panel
       nigdy nie wyjedzie za krawędź ekranu */
    const PANEL_MARGIN = isTablet ? 14 : 10;
    const dev = root.dataset.device || "phone";

    root.innerHTML = `
      <!-- ===== launcher ===== -->
      <div class="a-layer a-launcher">
        <div class="statusbar">
          <!-- WYSPA jest poza belką (niżej w DOM) — pływa nad aplikacjami -->
          <div class="statusbar__right">
            <button class="statusbar__btn" data-action="search" aria-label="Szukaj">${icon("i-search")}</button>
            <span class="statusbar__icons">
              ${icon("i-signal")}
              <span class="sys-wifi" data-sys-flag="wifi">${icon("i-wifi")}</span>
              <span class="batt" data-sys-batt>${sys.get("battery")}<span>%</span></span>${icon("i-battery")}
            </span>
          </div>
        </div>

        <div class="launcher-pages">
          <div class="page">
            ${isTablet ? `
              <div class="tablet-top">
                <div class="tablet-greeting"><span class="js-date">poniedziałek</span><b>Dzień dobry</b></div>
                <div style="display:flex;gap:8px;align-items:center">
                  <button class="search-pill" data-action="drawer">${icon("i-search", "ico--tiny")} Szukaj</button>
                  <button class="tablet-all" data-action="drawer" aria-label="Wszystkie aplikacje">${icon("i-plus")}</button>
                </div>
              </div>
              <div class="widgets">
                <div class="widget widget--weather widget--compact">
                  <div class="widget__row"><div><b>12°</b><span>Kraków · pochmurno</span></div><span class="sun"></span></div>
                </div>
                <div class="widget widget--calendar widget--compact">
                  <div class="widget__head">${icon("i-calendar", "ico--tiny")} Dziś</div>
                  <ul>
                    <li><i></i><span>10:00</span> Projekt Lumino</li>
                    <li><i style="background:#ffca58"></i><span>13:30</span> Zespół</li>
                  </ul>
                </div>
                <div class="widget widget--player widget--compact" data-app="spotify">
                  <span class="cover cv-1 widget-cover"></span>
                  <div style="min-width:0;flex:1">
                    <b data-w="title">Spotify</b><span data-w="artist">Wybierz utwór</span>
                  </div>
                  <button class="wp-btn" data-w="play" aria-label="Odtwórz">${icon("i-play")}</button>
                </div>
              </div>
              <div class="app-grid app-grid--tablet-home">
                ${androidApps.slice(0, 20).map(a => appTile(a)).join("")}
              </div>
            ` : `
              <div class="glance">
                <div class="glance__main">
                  <span class="glance__ico">${icon("i-calendar")}</span>
                  <div><b>10:00 · Projekt Lumino</b><span>Spotkanie online</span></div>
                </div>
                <div class="glance__weather"><span class="sun"></span> 12°</div>
              </div>
              <div class="clock-widget clock-widget--home">
                <div class="clock-widget__time js-time">09:41</div>
                <div class="clock-widget__date js-date">poniedziałek, 4 listopada</div>
              </div>
              <div class="searchbar">
                <span class="searchbar__g">G</span>
                <span>Szukaj w telefonie</span>
                <span class="searchbar__mic">${icon("i-mic")}</span>
                <span class="searchbar__lens">${icon("i-camera")}</span>
              </div>
              <div class="app-grid">
                ${androidApps.slice(0, 8).map(a => appTile(a)).join("")}
              </div>
              <div class="page-dots page-dots--inline"><i class="on"></i><i></i></div>
              <div class="app-grid app-grid--second">
                ${androidApps.slice(8, 12).map(a => appTile(a)).join("")}
              </div>
            `}
          </div>

          <div class="page page--apps">
            <div class="page-hint">Aplikacje</div>
            <div class="app-grid app-grid--all">
              ${androidApps.map(a => appTile(a)).join("")}
              <button class="app" data-action="drawer">
                ${iconImg("search")}
                <span class="app__label">Wszystkie</span>
              </button>
            </div>
          </div>
        </div>

        <div class="dock">
          ${DOCK.map(id => {
            const a = androidApps.find(x => x.id === id);
            return `<button class="dock-app" data-app="${id}" aria-label="${a.label}">${brandIcon(id)}</button>`;
          }).join("")}
        </div>

        <div class="navbar">
          <button class="navbar__pill" data-action="drawer" title="Wszystkie aplikacje" aria-label="Wszystkie aplikacje"></button>
        </div>

        <!-- szuflada aplikacji -->
        <div class="a-drawer">
          <label class="drawer-search">
            ${icon("i-search")}
            <input class="drawer-search__input" type="search" placeholder="Wyszukaj aplikacje" aria-label="Wyszukaj aplikacje">
          </label>
          <div class="drawer-grid">
            ${androidApps.map((a, i) => appTile(a).replace('class="app"', `class="app" style="--i:${i}"`)).join("")}
          </div>
        </div>
      </div>

      <!-- ===== ekran blokady ===== -->
      <div class="a-layer a-lock">
        <div class="lock-content">
        <div class="lock-clock">
          <b class="js-time">09:41</b>
          <span class="js-date">poniedziałek, 4 listopada</span>
        </div>
        <div class="lock-lockicon">${icon("i-lock")}</div>
        <div class="lock-notif">
          ${notifications.slice(0, 2).map(n => {
            const a = androidApps.find(x => x.id === n.app);
            return `<div class="ln">${iconImg(a.id, "ln__ico")}
              <div><b>${n.title}</b><span>${n.text}</span></div></div>`;
          }).join("")}
        </div>
        <div class="lock-bottom">
          <div class="lock-actions">
            <button class="lock-action" title="Latarka">${icon("i-flash")}</button>
            <button class="lock-action" title="Aparat" data-app="camera">${icon("i-camera")}</button>
          </div>
          <div class="lock-hint"><span>Przesuń w górę, aby odblokować</span></div>
          <div class="navbar__pill" style="position:static;transform:none;margin-bottom:4px" data-action="unlock"></div>
        </div>
        </div>
        <div class="lock-veil" aria-hidden="true"></div>
      </div>

      <div class="island-shade"></div>

      <!-- PŁYWAJĄCA PIGUŁKA (Dynamic Island) — MUSI być bezpośrednim
           dzieckiem powłoki, nie launchera. Launcher ma własny kontekst
           warstw (transform + z-index), więc wyspa w nim była rysowana
           POD przyciemnieniem panelu i POD aplikacjami: kafle nie dały
           się kliknąć, a po otwarciu aplikacji wyspa znikała. -->
      <!-- PŁYWAJĄCA PIGUŁKA (Dynamic Island) — po lewej, nad aplikacjami.
           To DIV, nie BUTTON: w HTML nie wolno zagnieżdżać przycisków,
           a panel skrótów ma własne kafle. Wcześniej zagnieżdżony <button>
           ZAMYKAŁ pigułkę i panel w ogóle nie trafiał do DOM — stąd brak
           morfowania. JEDEN element, 4 tryby. -->
      <div class="island" data-mode="idle" aria-label="Wyspa — skróty, powiadomienia, muzyka" aria-expanded="false">
        <span class="island__cam" aria-hidden="true"></span>

        <button class="island__face island__face--idle" type="button" data-action="panel"
                aria-label="Rozwiń skróty">
          <span class="island__time js-time">09:41</span>
          <span class="island__date js-date-short">4 lis</span>
        </button>

        <button class="island__face island__face--notif" type="button" data-island-notif
                aria-label="Powiadomienie">
          <span class="island__notif-ico" data-island-notif-ico></span>
          <span class="island__notif-txt">
            <b data-island-notif-title>Nowa wiadomość</b>
            <small data-island-notif-text>Ania: dasz radę dziś?</small>
          </span>
        </button>

        <div class="island__face island__face--music" role="button" tabindex="0"
             aria-label="Odtwarzacz — otwórz Spotify">
          <span class="island__cover" data-island-cover></span>
          <span class="island__music-txt">
            <b data-island-title>Nocna Jazda</b>
            <small data-island-artist>Mira Kova</small>
          </span>
          <span class="island__eq" aria-hidden="true"><i></i><i></i><i></i></span>
          <button class="island__play" type="button" data-island-play aria-label="Odtwórz / pauza">${icon("i-pause")}</button>
        </div>

        <div class="island__face island__face--panel">
          <span class="island__grip" aria-hidden="true"></span>
          <!-- „teraz gra": muzyka i skróty jednocześnie -->
          <div class="island__now">
            <span class="island__cover" data-island-cover></span>
            <span class="island__music-txt">
              <b data-island-title>Nocna Jazda</b>
              <small data-island-artist>Mira Kova</small>
            </span>
            <span class="island__eq" aria-hidden="true"><i></i><i></i><i></i></span>
            <button class="island__play" type="button" data-island-play aria-label="Odtwórz / pauza">${icon("i-pause")}</button>
          </div>
          <div class="island-sliders">${qsSliders()}</div>
          <div class="island-grid">${qsGrid("island-tile")}</div>
          <div class="island-bar">
            <div class="island-foot">
              <button class="island-tile island-tile--sm" style="--i:8" type="button" data-action="lock" aria-label="Zablokuj ekran" title="Zablokuj ekran">${icon("i-lock")}</button>
              <button class="island-tile island-tile--sm" style="--i:9" type="button" data-action="search" aria-label="Szukaj aplikacji" title="Szukaj aplikacji">${icon("i-search")}</button>
              <button class="island-tile island-tile--sm" style="--i:10" type="button" data-action="drawer" aria-label="Wszystkie aplikacje" title="Wszystkie aplikacje">${icon("i-grid")}</button>
            </div>
            <div class="island-notifs">
              ${notifications.map((n, ni) => {
                const a = androidApps.find(x => x.id === n.app);
                return `<button class="island-notif" type="button" style="--i:${ni}" title="${n.title} — ${n.text}">
                  ${iconImg(a.id, "notif__ico")}<span class="island__notif-dot"></span></button>`;
              }).join("")}
            </div>
          </div>
        </div>
      </div>



      <!-- ===== aplikacje ===== -->
      <div class="a-apps"></div>

    `;

    /* ---------------- referencje ---------------- */
    const lock = $(".a-lock", root);
    const islandShade = $(".island-shade", root);
    const islandBtn = $(".island", root);
    const islandFaces = $$(".island__face", islandBtn);
    const drawer = $(".a-drawer", root);
    const appsHost = $(".a-apps", root);
    const launcher = $(".a-launcher", root);
    let openStack = [];      // otwarte aplikacje
    let appCleanups = {};    // sprzątanie per aplikacja

    /* ---------------- ekran blokady ---------------- */
    function unlock() { lock.classList.add("is-unlocked"); }
    function lockScreen() {
      closeAllApps();
      closePanel();
      drawer.classList.remove("is-open");
      lock.classList.remove("is-unlocked");
    }
    /* ---------------- odblokowanie przeciągnięciem (iOS 26) ----------------
       Blokada podąża za palcem/myszką (--lock-drag), a po przekroczeniu progu
       „wysysa się” w górę: zegar i powiadomienia rozjeżdżają się, tło jaśnieje,
       a launcher wjeżdża spod spodu. Wszystko na transform/opacity. */
    let dragStartY = null, dragging = false, dragDist = 0;
    const RELEASE = 96;          /* px — poniżej tego blokada wraca na miejsce */

    function lockPaint(dy) {
      const h = lock.clientHeight || 600;
      const d = Math.max(0, Math.min(dy, h));
      const p = (d / Math.max(1, h)).toFixed(3);
      lock.style.setProperty("--lock-drag", d.toFixed(1) + "px");
      lock.style.setProperty("--lock-p", p);
      root.style.setProperty("--lock-p", p);   /* launcher też to czyta */
    }
    function lockReset(withAnim) {
      lock.classList.remove("is-dragging");
      lock.style.removeProperty("--lock-drag");
      lock.style.removeProperty("--lock-p");
      root.style.removeProperty("--lock-p");
      if (withAnim) {
        lock.classList.add("is-snapping");
        setTimeout(() => lock.classList.remove("is-snapping"), 420);
      }
    }

    lock.addEventListener("pointerdown", e => {
      if (e.target.closest("[data-app], .lock-action, [data-action]")) return;
      if (lock.classList.contains("is-unlocked")) return;
      dragStartY = e.clientY;
      dragDist = 0;
      dragging = false;
    });
    /* ruch i puszczenie także poza blokadą — myszka łatwo ucieka za makietę */
    window.addEventListener("pointermove", e => {
      if (dragStartY === null) return;
      dragDist = dragStartY - e.clientY;
      if (!dragging && dragDist > 4) {
        dragging = true;
        lock.classList.add("is-dragging");
      }
      if (dragging) lockPaint(dragDist);
    }, { passive: true });
    window.addEventListener("pointerup", () => {
      if (dragStartY === null) return;
      const far = dragDist > RELEASE;
      dragStartY = null; dragging = false;
      if (far) { unlock(); lockReset(false); }
      else lockReset(true);
    });
    /* przycisk „odblokuj” (pigułka) działa jak dotąd */
    lock.querySelectorAll('[data-action="unlock"]').forEach(b =>
      b.addEventListener("click", e => { e.stopPropagation(); unlock(); }));

    /* klik w tło bez przeciągania też odblokowuje (wygodne w podglądzie) */
    lock.addEventListener("click", e => {
      if (e.target.closest("[data-app], .lock-action, [data-action], .lock-notif")) return;
      if (!dragging) unlock();
    });

    /* ============================================================
       WYSPA: JEDEN element, który morfuje między trybami
       idle (zegar) · panel (skróty) · notif (przychodzi powiadomienie)
       · music (muzyka gra). Panel NIE jest osobnym okienkiem — to ta
       sama pigułka, która rozciąga się w górę i w dół.
       ============================================================ */
    let islandMode = "idle";

    /* ------------------------------------------------------------
       PANEL MUSI ZAWSZE ZMIEŚCIĆ SIĘ W EKRANIE
       Na tablecie pigułka stoi 14 px od lewej, a panel miał szerokość
       „100% - 20px” — wychodził 14 px za prawą krawędź i był przycięty.
       Zamiast polegać tylko na CSS, mierzymy realny ekran i ustawiamy
       panel dokładnie między marginesami (działa też po zmianie rozmiaru
       i w trybie 1:1, gdzie makieta jest przeskalowana).
       ------------------------------------------------------------ */
    function fitIslandPanel() {
      const w = Math.max(0, (root.clientWidth || 0) - 2 * PANEL_MARGIN);
      if (w > 0) islandBtn.style.setProperty("--panel-w", w + "px");
      measurePanel();
    }

    /* ------------------------------------------------------------
       MORFOWANIE, KTÓRE NAPRAWDĘ SIĘ ANIMUJE
       `height:auto` nie da się interpolować — dlatego wcześniej panel
       „przeskakiwał” bez animacji. Mierzymy naturalną wysokość zawartości
       i podajemy ją jako liczbę (--panel-h) TYLKO na czas przejścia;
       po zakończeniu wracamy do auto, żeby panel rósł z treścią.
       ------------------------------------------------------------ */
    const panelFace = islandBtn.querySelector(".island__face--panel");
    let panelTimer = 0;
    function measurePanel() {
      if (!panelFace) return 0;
      const h = panelFace.scrollHeight || 0;
      if (h > 0) islandBtn.style.setProperty("--panel-h", h + "px");
      return h;
    }
    /* wysokość panelu aktualizuje się na bieżąco (np. gdy dojdzie pasek
       „teraz gra”), ale NIE w trakcie morfowania — inaczej animacja drga */
    let panelObserver = null;
    function watchPanelHeight() {
      if (panelObserver || typeof ResizeObserver !== "function" || !panelFace) return;
      panelObserver = new ResizeObserver(() => {
        if (islandMode !== "panel" || islandAnim) return;
        const h = panelFace.scrollHeight;
        if (h) islandBtn.style.setProperty("--panel-h", h + "px");
      });
      try { panelObserver.observe(panelFace); } catch (e) { /* ignorujemy */ }
    }
    if (typeof ResizeObserver === "function") {
      try { new ResizeObserver(fitIslandPanel).observe(root); } catch (e) { /* starsze przeglądarki */ }
    }
    window.addEventListener("resize", fitIslandPanel, { passive: true });
    fitIslandPanel();
    let modeTimer = 0;
    const musicOn = () => !!(player && player.playing);

    /* ------------------------------------------------------------
       PRAWDZIWA ANIMACJA MORFOWANIA (WAAPI, wartości w pikselach)
       Dlaczego dotąd nie animowało:
       • `height:auto` NIE jest interpolowane → panel przeskakiwał,
       • a gdy tylko ustawialiśmy tryb, przeglądarka liczyła już NOWĄ
         szerokość/wysokość, więc nie było stanu „przed” do animowania.
       Rozwiązanie: mierzymy prostokąt PRZED zmianą, wyłączamy przejścia,
       ustawiamy tryb, mierzymy prostokąt PO zmianie i animujemy jawnie
       width/height/border-radius z „przed” do „po”. To zawsze działa,
       niezależnie od tego, czy wysokość jest auto, w px, czy z `calc()`.
       ------------------------------------------------------------ */
    let islandAnim = null;
    const REDUCE_MOTION = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

    /* rozmiar wyspy w pikselach (offsetWidth/Height — bez wpływu transformacji
       i efektu hover, więc pomiar jest zawsze dokładny) */
    function islandSize() {
      return { w: islandBtn.offsetWidth || 0, h: islandBtn.offsetHeight || 0 };
    }

    /* ------------------------------------------------------------
       MORFOWANIE WYSPY — JEDNA, JAWNA ANIMACJA (Web Animations API)
       Dlaczego wcześniej „nie było animacji":
       • `height:auto` nie jest interpolowane → skok,
       • po zmianie trybu przeglądarka liczy już NOWY rozmiar, więc nie ma
         stanu „przed” do animowania.
       Teraz: mierzymy rozmiar PRZED, wyłączamy przejścia CSS na jedną
       klatkę, zmieniamy tryb, mierzymy rozmiar PO i animujemy jawnie
       width/height/border-radius od „przed” do „po”. Zawsze widoczne,
       niezależnie od tego, czy wysokość jest w px, auto czy calc().
       ------------------------------------------------------------ */
    function morphIsland(applyMode, opening) {
      const before = islandSize();
      islandBtn.classList.add("is-morphing");
      applyMode();
      const after = islandSize();
      islandBtn.classList.remove("is-morphing");

      if (!islandAnim && typeof islandBtn.animate !== "function") return;
      if (islandAnim) { islandAnim.cancel(); islandAnim = null; }
      if (REDUCE_MOTION) return;
      if (!before.w || !after.w) return;                       /* brak geometrii (testy) */
      if (before.w === after.w && before.h === after.h) return; /* nic się nie zmienia */

      const radiusBefore = "13px";
      islandAnim = islandBtn.animate(
        [
          { width: before.w + "px", height: before.h + "px", borderRadius: radiusBefore },
          {
            width: (after.w + (after.w - before.w) * 0.015) + "px",
            height: (after.h + (after.h - before.h) * 0.03) + "px",
            offset: opening ? 0.6 : 0.45
          },
          { width: after.w + "px", height: after.h + "px", borderRadius: afterRadius() }
        ],
        {
          duration: opening ? 520 : 380,
          easing: "cubic-bezier(.32,1.06,.36,1)",
          fill: "none"
        }
      );
      islandAnim.onfinish = islandAnim.oncancel = () => { islandAnim = null; };
    }

    function afterRadius() {
      return islandMode === "panel" ? (isTablet ? "24px" : "22px") : "13px";
    }

    function setMode(mode) {
      if (mode !== "panel") {
        /* muzyka i powiadomienia są ważniejsze niż powrót do zegara */
        if (musicOn() && mode === "idle") mode = "music";
      }
      const opening = mode === "panel";
      morphIsland(() => {
        islandMode = mode;
        if (opening) fitIslandPanel();     /* najpierw szerokość panelu */
        islandBtn.dataset.mode = mode;
        if (opening) measurePanel();       /* potem wysokość zawartości w px */
      }, opening);
      if (opening) watchPanelHeight();

      /* --- reszta stanu: klasy, atrybuty ARIA i cień pod panelem ---
         (wcześniej wykonywała się razem z ustawieniem trybu; po wydzieleniu
         morfowania trzeba ją przenieść tutaj, inaczej panel nie dostawał
         klasy is-open i aria-expanded) */
      islandBtn.classList.toggle("is-open", mode === "panel");
      islandBtn.classList.toggle("is-music", mode === "music");
      islandBtn.classList.toggle("is-notif", mode === "notif");
      islandBtn.setAttribute("aria-expanded", mode === "panel" ? "true" : "false");
      islandShade.classList.toggle("is-open", mode === "panel");
      islandFaces.forEach(f => f.setAttribute("aria-hidden",
        f.classList.contains(`island__face--${mode}`) ? "false" : "true"));
    }

    /* widok pojedynczy zmienia rozmiar ekranu — panel musi przeliczyć wymiary,
       a nie tylko „przeskoczyć” (to była druga przyczyna braku animacji) */
    window.addEventListener("resize", () => {
      if (islandMode !== "panel") return;
      const h = panelFace ? panelFace.scrollHeight : 0;
      islandBtn.style.setProperty("--panel-w", Math.max(0, (root.clientWidth || 0) - 2 * PANEL_MARGIN) + "px");
      if (h) islandBtn.style.setProperty("--panel-h", h + "px");
    }, { passive: true });

    function openPanel() {
      /* na blokadzie pigułka jest tylko kropką aparatu — panel nie może
         wyskoczyć nad ekranem blokady */
      if (!lock.classList.contains("is-unlocked")) return;
      setMode("panel");
    }
    /* zamknięcie panelu: wracamy do odtwarzacza, jeśli muzyka nadal gra */
    function closePanel() { setMode(musicOn() ? "music" : "idle"); }
    const panelOpen = () => islandMode === "panel";

    /* --- powiadomienie w wyspie: morfuje na ~4,5 s, potem wraca --- */
    const nIco = $("[data-island-notif-ico]", islandBtn);
    const nTitle = $("[data-island-notif-title]", islandBtn);
    const nText = $("[data-island-notif-text]", islandBtn);

    function showNotif(appId, title, text, ms = 4500) {
      if (islandMode === "panel") return;
      if (!lock.classList.contains("is-unlocked")) return;   /* nie na blokadzie */
      if (nIco) nIco.innerHTML = iconImg(appId, "island__notif-img");
      if (nTitle) nTitle.textContent = title;
      if (nText) nText.textContent = text;
      setMode("notif");
      clearTimeout(modeTimer);
      modeTimer = setTimeout(() => { if (islandMode === "notif") setMode("idle"); }, ms);
    }

    /* --- mini odtwarzacz w wyspie --- */
    const mCovers = $$("[data-island-cover]", islandBtn);
    const mTitles = $$("[data-island-title]", islandBtn);
    const mArtists = $$("[data-island-artist]", islandBtn);
    const mPlays = $$("[data-island-play]", islandBtn);

    function paintMusic() {
      const t = player.track;
      mCovers.forEach(el => { el.className = `island__cover ${t.cover}`; });
      mTitles.forEach(el => { el.textContent = t.title; });
      mArtists.forEach(el => { el.textContent = t.artist; });
      mPlays.forEach(el => { el.innerHTML = icon(player.playing ? "i-pause" : "i-play"); });
      islandBtn.classList.toggle("is-playing", !!player.playing);
      /* panel pokazuje pasek „teraz gra", gdy muzyka leci */
      islandBtn.classList.toggle("has-music", !!player.playing);
    }
    if (player && player.subscribe) {
      player.subscribe(() => {
        paintMusic();
        if (islandMode === "panel") return;              /* panel ma priorytet */
        if (player.playing) { clearTimeout(modeTimer); setMode("music"); }
        else if (islandMode === "music") setMode("idle");
      });
      paintMusic();
    }
    mPlays.forEach(el => el.addEventListener("click", e => {
      e.stopPropagation();
      player.toggle();
    }));
    /* zachowanie twarzy wyspy */
    const faceIdle = $(".island__face--idle", islandBtn);
    const faceNotif = $("[data-island-notif]", islandBtn);
    const faceMusic = $(".island__face--music", islandBtn);
    if (faceIdle) faceIdle.addEventListener("click", e => {
      e.stopPropagation();
      panelOpen() ? closePanel() : openPanel();
    });
    if (faceNotif) faceNotif.addEventListener("click", e => {
      e.stopPropagation();
      setMode("idle");
    });
    /* W trybie muzyki klik w pigułkę otwiera PANEL (tam jest „teraz gra"),
       a Spotify otwiera dopiero klik w samą okładkę. Dzięki temu panel jest
       zawsze dostępny — także gdy muzyka gra. */
    const onMusicFace = e => {
      if (e.target.closest("[data-island-play]")) return;   /* play/pauza */
      e.stopPropagation();
      if (e.target.closest(".island__cover")) { openApp("spotify"); return; }
      openPanel();
    };
    if (faceMusic) {
      faceMusic.addEventListener("click", onMusicFace);
      faceMusic.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onMusicFace(e); }
      });
    }

    /* --- WYSPA NA EKRANIE BLOKADY (iOS 26) -------------------------------
       Wyspa jest teraz dzieckiem powłoki (a nie launchera), więc nie znika
       razem z launcherem pod blokadą — trzeba ją ukryć świadomie, inaczej
       zegar blokady i pigułka z zegarem nachodzą na siebie.
       Na blokadzie pigułka pokazuje tylko kropkę aparatu; panel zostaje
       zablokowany, a po odblokowaniu wyspa wraca płynnie. */
    const lockEl = $(".a-lock", root);
    const paintLockIsland = () => {
      const locked = !lockEl.classList.contains("is-unlocked");
      islandBtn.classList.toggle("is-locked-out", locked);
      if (locked && islandMode === "panel") closePanel();
    };
    paintLockIsland();
    if (typeof MutationObserver === "function") {
      new MutationObserver(paintLockIsland)
        .observe(lockEl, { attributes: true, attributeFilter: ["class"] });
    }

    /* wyspa (pływająca pigułka) rozwija skróty; belka tylko szuka */
    $(".statusbar", root).addEventListener("click", e => {
      if (e.target.closest('[data-action="search"]')) {
        e.stopPropagation();
        toggleDrawer(true);
        const input = drawer.querySelector("input");
        if (input) setTimeout(() => input.focus(), 180);
      }
    });
    islandShade.addEventListener("click", closePanel);
    $$("[data-action='close-panel']", root).forEach(b => b.addEventListener("click", closePanel));

    /* ikony powiadomień w panelu: klik „otwiera” powiadomienie w pigułce */
    $$(".island-notifs .island-notif", root).forEach((b, i) => {
      const n = notifications[i];
      if (!n) return;
      b.addEventListener("click", e => {
        e.stopPropagation();
        closePanel();
        showNotif(n.app, n.title, n.text);
      });
    });

    /* stopka wyspy: kłódka blokuje ekran, pozostałe otwierają szufladę */
    $$(".island-foot [data-action]", root).forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      const action = b.dataset.action;
      if (action === "lock") { lockScreen(); return; }
      closePanel();
      toggleDrawer(true);
      if (action === "search") {
        const input = drawer.querySelector("input");
        if (input) setTimeout(() => input.focus(), 180);
      }
    }));

    /* przełączniki: jedno źródło prawdy (sys) — panel, Ustawienia i Windows
       pokazują ten sam stan, więc nic się nie rozjeżdża między urządzeniami */
    $$(".island-tile[data-qs]", root).forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      sys.toggle(b.dataset.qs);
    }));
    /* Escape / klawisz zamykają wyspę także w podglądzie na desktopie */
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && panelOpen()) closePanel();
    });
    $$(".slider", root).forEach(s => {
      const update = () => s.style.setProperty("--v", s.value + "%");
      s.addEventListener("input", update); update();
    });

    /* ============================================================
       WSPÓLNY STAN → TA POWŁOKA
       Telefon i tablet czytają dokładnie ten sam stan co laptop,
       więc przełącznik w telefonie zmienia też ikonę w Windows.
       ============================================================ */
    function paintSys() {
      $$("[data-qs]", root).forEach(b => {
        const on = !!sys.get(b.dataset.qs);
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      $$("[data-sys-range]", root).forEach(r => {
        const v = sys.get(r.dataset.sysRange);
        if (String(r.value) !== String(v)) r.value = v;
        r.style.setProperty("--v", v + "%");
      });
      $$("[data-sys-flag]", root).forEach(el => {
        el.classList.toggle("is-off", !sys.get(el.dataset.sysFlag));
      });
      $$("[data-sys-batt]", root).forEach(el => {
        const t = el.firstChild;
        if (t && t.nodeType === 3) t.textContent = sys.get("battery");
      });
      root.classList.toggle("sys-dnd", !!sys.get("dnd"));
      root.classList.toggle("sys-air", !!sys.get("air"));
    }
    $$("[data-sys-range]", root).forEach(r => {
      r.addEventListener("input", () => sys.set(r.dataset.sysRange, Number(r.value)), { passive: true });
    });
    sys.subscribe(paintSys);

    /* ------------------------------------------------------------
       JEDEN SYSTEM: jasność i głośność z suwaków naprawdę działają.
       Głośność ustawia poziom wspólnego odtwarzacza (ta sama wartość
       co suwak w Windows), jasność rozjaśnia/przyciemnia ekran tak samo
       w każdej powłoce.
       ------------------------------------------------------------ */
    let _lastVol = sys.get("volume");
    let volTimer = 0;
    function applyBrightness() {
      const v = sys.get("brightness");
      const k = 0.55 + (v / 100) * 0.45;         /* ekran nigdy nie gaśnie do zera */
      root.style.setProperty("--lum", k.toFixed(3));
      root.classList.toggle("is-dim", v < 30);
    }
    function applyVolume() {
      const v = sys.get("volume");
      player.volume = v;
      if (v === 0 && player.playing) player.pause();
    }
    sys.subscribe((state, key) => {
      if (key === "brightness" || key === null) applyBrightness();
      if (key === "volume" || key === null) {
        if (sys.get("volume") !== _lastVol) {
          _lastVol = sys.get("volume");
          clearTimeout(volTimer);
          volTimer = setTimeout(applyVolume, 140);   /* debounce: bez skoków w trakcie */
        }
      }
    });

    /* ---------------- szuflada ---------------- */
    function toggleDrawer(force) {
      const open = force !== undefined ? force : !drawer.classList.contains("is-open");
      drawer.classList.toggle("is-open", open);
    }
    $$("[data-action='drawer']", root).forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      toggleDrawer();
    }));

    /* szukanie aplikacji w szufladzie */
    const searchInput = $(".drawer-search__input", root);
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        $$(".drawer-grid .app", root).forEach(app => {
          const label = (app.querySelector(".app__label") || {}).textContent || "";
          app.classList.toggle("is-hidden", !!q && !label.toLowerCase().includes(q));
        });
      }, { passive: true });
    }

    /* ---------------- przełączanie stron ---------------- */
    const pages = $(".launcher-pages", root);
    const dots = $$(".page-dots i", root);
    pages.addEventListener("scroll", () => {
      const i = Math.round(pages.scrollLeft / pages.clientWidth);
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }, { passive: true });

    /* ---------------- aplikacje ---------------- */
    /* kropeczka „aplikacja działa" — dokładnie jak wskaźnik w pasku zadań
       Windows, żeby obie powłoki opowiadały ten sam stan */
    function markRunning(id, on) {
      $$(`[data-app="${id}"]`, root).forEach(el => {
        if (el.closest(".dock") || el.closest(".app-grid")) el.classList.toggle("is-running", on);
      });
    }

    function openApp(id, originIcon) {
      const meta = APP[id];
      if (!meta) return;
      const el = document.createElement("div");
      el.className = "a-app" + (id === "spotify" ? " sp" : "");
      el.dataset.appId = id;
      el.innerHTML = `
        <div class="appbar">
          <button class="iconbtn" data-back aria-label="Wstecz">${icon("i-back")}</button>
          <h3>${meta.title}</h3>
          <button class="iconbtn" aria-label="Więcej">${icon("i-more")}</button>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;min-height:0;position:relative">
          ${meta.html()}
        </div>`;
      appsHost.appendChild(el);
      // animacja wejścia (klasa od razu, aby stan był poprawny także bez animacji)
      el.classList.add("is-open");
      growFromIcon(el, appsHost, originIcon);

      if (meta.init) appCleanups[id] = meta.init(el, root);

      const back = () => closeApp(id);
      el.querySelector("[data-back]").addEventListener("click", back);
      openStack.push(id);
      markRunning(id, true);
      refreshWidget();
    }

    /* sprężyste „wyrastanie” aplikacji z ikony — 100% transform/opacity */
    function growFromIcon(el, host, iconEl) {
      if (!iconEl || !el.animate) return;
      const a = iconEl.getBoundingClientRect(), b = host.getBoundingClientRect();
      if (!a.width || !b.width) return;
      const dx = a.left + a.width / 2 - (b.left + b.width / 2);
      const dy = a.top + a.height / 2 - (b.top + b.height / 2);
      const s = Math.max(.04, a.width / b.width);
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0, borderRadius: "40%" },
          { transform: "none", opacity: 1, borderRadius: "0%" }
        ],
        { duration: 460, easing: "cubic-bezier(.32,.72,0,1)", fill: "backwards" }
      );
    }

    function shrinkToIcon(el, host, iconEl) {
      if (!iconEl || !el.animate) return false;
      const a = iconEl.getBoundingClientRect(), b = host.getBoundingClientRect();
      if (!a.width || !b.width) return false;
      const dx = a.left + a.width / 2 - (b.left + b.width / 2);
      const dy = a.top + a.height / 2 - (b.top + b.height / 2);
      const s = Math.max(.04, a.width / b.width);
      const anim = el.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 }
        ],
        { duration: 320, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }
      );
      anim.onfinish = () => el.remove();
      return true;
    }

    function closeApp(id) {
      const el = appsHost.querySelector(`.a-app[data-app-id="${id}"]`);
      if (!el) return;
      const cleanup = appCleanups[id];
      // aplikacja może przechwycić "wstecz" (np. Spotify: pełny ekran → lista)
      if (cleanup && typeof cleanup.onBack === "function" && cleanup.onBack()) return;
      if (typeof cleanup === "function") cleanup();
      else if (cleanup && typeof cleanup.dispose === "function") cleanup.dispose();
      delete appCleanups[id];
      el.classList.remove("is-open");
      if (!shrinkToIcon(el, appsHost, root.querySelector(`[data-app="${id}"] .app__icon`))) {
        setTimeout(() => el.remove(), 240);
      }
      openStack = openStack.filter(x => x !== id);
      if (!openStack.includes(id)) markRunning(id, false);
    }

    function closeAllApps() {
      openStack.slice().forEach(id => {
        const el = appsHost.querySelector(`.a-app[data-app-id="${id}"]`);
        if (el) el.remove();
        const c = appCleanups[id];
        if (typeof c === "function") c();
        else if (c && typeof c.dispose === "function") c.dispose();
        delete appCleanups[id];
      });
      openStack = [];
      $$("[data-app].is-running", root).forEach(el => el.classList.remove("is-running"));
    }

    root.addEventListener("click", e => {
      const appBtn = e.target.closest("[data-app]");
      if (appBtn) {
        const id = appBtn.dataset.app;
        if (root.querySelector(".a-lock:not(.is-unlocked)")) { unlock(); }
        if (openStack.includes(id)) {
          const el = appsHost.querySelector(`.a-app[data-app-id="${id}"]`);
          if (el) el.classList.remove("is-open");
        }
        openApp(id, appBtn.querySelector(".app__icon") || appBtn);
        toggleDrawer(false);
        return;
      }
      if (e.target.closest('[data-action="lock"]')) { lockScreen(); return; }
    });

    /* przechwytywanie kliknięć w tło blokady, aby nie otwierać aplikacji */
    lock.addEventListener("click", e => {
      const btn = e.target.closest("[data-app]");
      if (btn) { unlock(); openApp(btn.dataset.app, btn.querySelector(".app__icon") || btn); e.stopPropagation(); }
    }, true);

    /* ---------------- widget Spotify na tablecie ---------------- */
    const widget = root.querySelector(".widget--player");
    function refreshWidget() {
      if (!widget) return;
      widget.querySelector('[data-w="title"]').textContent = player.track.title;
      widget.querySelector('[data-w="artist"]').textContent = player.playing
        ? player.track.artist
        : "Dotknij, aby odtwarzać";
      widget.querySelector('[data-w="play"]').innerHTML = icon(player.playing ? "i-pause" : "i-play");
      widget.querySelector(".widget-cover").className = `cover ${player.track.cover} widget-cover`;
    }
    if (widget) {
      player.subscribe(refreshWidget);
      widget.querySelector('[data-w="play"]').addEventListener("click", e => {
        e.stopPropagation();
        player.toggle();
      });
    }

    /* API dla modułu gestów (js/gestures.js): otwieranie aplikacji w powłoce */
    window.Lumino.androidOpen = window.Lumino.androidOpen || function (screen, id) {
      const btn = screen.querySelector(`[data-app="${id}"]`);
      if (btn) btn.click();
      else if (screen.lumino && screen.lumino.openApp) screen.lumino.openApp(id);
    };

    /* ---------------- publiczne API ---------------- */
    root.lumino = {
      unlock,
      /* demo: pokaż powiadomienie w wyspie (używane przez testy i przycisk) */
      notify: (appId, title, text, ms) => showNotif(appId, title, text, ms),
      /* nowe powiadomienie „przychodzi” → wyspa morfuje na chwilę */
      pushNotification: (appId, title, text) => showNotif(appId, title, text),
      islandMode: () => islandMode,
      lockScreen,
      openApp,
      closeAllApps,
      closePanel,
      isPanelOpen: panelOpen,
      /* szerokość panelu policzona z realnego ekranu (testy + responsywność) */
      fitPanel: fitIslandPanel,
      isLocked: () => !lock.classList.contains("is-unlocked")
    };
  }

  /* ---------------- czas ---------------- */
  function paintClock() {
    const now = new Date();
    const time = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    const long = now.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
    $$(".js-time").forEach(el => { el.textContent = time; });
    $$(".js-date").forEach(el => { el.textContent = long; });
    const short = now.toLocaleDateString("pl-PL", { day: "numeric", month: "short" }).replace(".", "");
    $$(".js-date-short").forEach(el => { el.textContent = short; });
  }

  window.Lumino.buildAndroid = buildAndroid;
  window.Lumino.paintClock = paintClock;
})();
