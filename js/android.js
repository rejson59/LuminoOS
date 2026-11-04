/* ============================================================
   LuminoOS — makiety: powłoka Androida (telefon + tablet)
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, icon, iconImg, player, tracks, androidApps, notifications, APP, brandIcon } = window.Lumino;
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
    const dev = root.dataset.device || "phone";

    root.innerHTML = `
      <!-- ===== launcher ===== -->
      <div class="a-layer a-launcher">
        <div class="statusbar" data-action="panel">
          <span class="js-time">09:41</span>
          <span class="statusbar__icons">
            ${icon("i-signal")}${icon("i-wifi")}<span class="batt">78<span>%</span></span>${icon("i-battery")}
          </span>
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
          <div class="drawer-search">${icon("i-search")} Wyszukaj aplikacje</div>
          <div class="drawer-grid">
            ${androidApps.map(a => appTile(a)).join("")}
          </div>
        </div>
      </div>

      <!-- ===== ekran blokady ===== -->
      <div class="a-layer a-lock">
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
          <div class="lock-hint">Przesuń w górę, aby odblokować</div>
          <div class="navbar__pill" style="position:static;transform:none;margin-bottom:4px" data-action="unlock"></div>
        </div>
      </div>

      <!-- ===== panel powiadomień ===== -->
      <div class="a-shade"></div>
      <div class="a-panel">
        <div class="a-panel__handle"></div>
        <div class="a-panel__top">
          <span class="js-time">09:41</span>
          <span style="display:flex;gap:8px;align-items:center">
            ${icon("i-wifi")}<span class="batt">78<span>%</span></span>${icon("i-battery")}
            <button class="iconbtn" data-action="close-panel" style="width:20px;height:20px;background:rgba(255,255,255,.12)">${icon("i-close")}</button>
          </span>
        </div>
        <div class="qs-grid">
          <button class="qs qs--wide on" data-qs="wifi">
            <span class="qs__ic">${icon("i-wifi")}</span>
            <span class="qs__txt"><b>Internet</b><small>Lumino_5G</small></span>
          </button>
          <button class="qs qs--wide on" data-qs="bt">
            <span class="qs__ic">${icon("i-bluetooth")}</span>
            <span class="qs__txt"><b>Bluetooth</b><small>2 urządzenia</small></span>
          </button>
          <button class="qs qs--wide" data-qs="dnd">
            <span class="qs__ic">${icon("i-bell-off")}</span>
            <span class="qs__txt"><b>Nie przeszkadzać</b><small>Wyłączone</small></span>
          </button>
          <button class="qs qs--wide" data-qs="saver">
            <span class="qs__ic">${icon("i-saver")}</span>
            <span class="qs__txt"><b>Oszczędzanie</b><small>Wyłączone</small></span>
          </button>
          <button class="qs" data-qs="flash" title="Latarka">${icon("i-flash")}</button>
          <button class="qs" data-qs="rotate" title="Auto-obrót">${icon("i-rotate")}</button>
          <button class="qs" data-qs="air" title="Tryb samolotowy">${icon("i-airplane")}</button>
          <button class="qs" data-qs="cast" title="Przesyłanie">${icon("i-cast")}</button>
        </div>
        <div class="slider-row">
          <span class="slider-ico">${icon("i-sun")}</span>
          <input class="slider slider--bright" type="range" min="0" max="100" value="70" aria-label="Jasność">
        </div>
        <div class="slider-row">
          <span class="slider-ico">${icon("i-volume")}</span>
          <input class="slider slider--vol" type="range" min="0" max="100" value="55" aria-label="Głośność">
        </div>
        <div class="panel-notifs">
          ${notifications.map(n => {
            const a = androidApps.find(x => x.id === n.app);
            return `<div class="notif">${iconImg(a.id, "notif__ico")}
              <div><b>${n.title}</b><p>${n.text}</p></div><small>${n.time}</small></div>`;
          }).join("")}
        </div>
        <div class="panel-actions">
          <button data-action="close-panel">Wyczyść wszystko</button>
          <button data-action="lock">Zablokuj</button>
        </div>
      </div>

      <!-- ===== aplikacje ===== -->
      <div class="a-apps"></div>

      <!-- otwór aparatu: zawsze widoczny -->
      <div class="punch"></div>
    `;

    /* ---------------- referencje ---------------- */
    const lock = $(".a-lock", root);
    const shade = $(".a-shade", root);
    const panel = $(".a-panel", root);
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
    lock.addEventListener("click", e => {
      if (e.target.closest("[data-app]")) return;
      if (e.target.closest('[data-action="unlock"]')) { unlock(); return; }
      // klik gdziekolwiek w tło też odblokowuje (wygodne w podglądzie)
      if (!e.target.closest(".lock-notif")) unlock();
    });
    let dragStartY = null;
    lock.addEventListener("pointerdown", e => { dragStartY = e.clientY; });
    lock.addEventListener("pointerup", e => {
      if (dragStartY !== null && dragStartY - e.clientY > 26) unlock();
      dragStartY = null;
    });

    /* ---------------- panel powiadomień ---------------- */
    function openPanel() { panel.classList.add("is-open"); shade.classList.add("is-open"); }
    function closePanel() { panel.classList.remove("is-open"); shade.classList.remove("is-open"); }

    $(".statusbar", root).addEventListener("click", () => {
      panel.classList.contains("is-open") ? closePanel() : openPanel();
    });
    shade.addEventListener("click", closePanel);
    $$("[data-action='close-panel']", root).forEach(b => b.addEventListener("click", closePanel));

    $$(".qs", root).forEach(b => b.addEventListener("click", () => b.classList.toggle("on")));
    $$(".slider", root).forEach(s => {
      const update = () => s.style.setProperty("--v", s.value + "%");
      s.addEventListener("input", update); update();
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

    /* ---------------- przełączanie stron ---------------- */
    const pages = $(".launcher-pages", root);
    const dots = $$(".page-dots i", root);
    pages.addEventListener("scroll", () => {
      const i = Math.round(pages.scrollLeft / pages.clientWidth);
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }, { passive: true });

    /* ---------------- aplikacje ---------------- */
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

    /* ---------------- publiczne API ---------------- */
    root.lumino = {
      unlock,
      lockScreen,
      openApp,
      closeAllApps,
      closePanel,
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
  }

  window.Lumino.buildAndroid = buildAndroid;
  window.Lumino.paintClock = paintClock;
})();
