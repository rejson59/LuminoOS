/* ============================================================
   LuminoOS — makiety: start strony i spięcie urządzeń
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, buildAndroid, buildWindows, paintClock } = window.Lumino;

  paintClock();
  setInterval(paintClock, 20000);

  // data skrócona w Windows
  const shortDate = new Date().toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
  /* krótka data w wyspie telefonu/tabletu: „4 lis” */
  const islandDate = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "short" }).replace(".", "");
  $$(".js-date-short").forEach(el => { el.textContent = islandDate; });
  const longDate = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
  $$(".js-date-long").forEach(el => { el.textContent = longDate; });

  // telefony / tablety
  const androidScreens = $$("[data-android]");
  androidScreens.forEach(screen => buildAndroid(screen));

  // laptop
  buildWindows(document.getElementById("winScreen"));

  // skróty klawiszowe (wygodne w podglądzie na desktopie)
  document.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    const win = document.getElementById("winScreen");
    if (e.key === "Escape") {
      if (win && win.lumino) win.lumino.closeStart();
      if (win && win.lumino) win.lumino.unlockPC();
      androidScreens.forEach(s => {
        const api = s.lumino;
        if (!api) return;
        api.closePanel();
      });
    }
  });

  // na starcie: jedna makiety "żywa" — reszta czeka w tle (czytelniejszy podgląd)
  // (ekrany działają niezależnie; to tylko stan początkowy)
  androidScreens.forEach(s => { if (s.lumino && s.lumino.isLocked()) s.lumino.unlock(); });

  // przywrócenie stanu po zmianie rozmiaru (scroll-snap potrafi przeskoczyć)
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      $$(".launcher-pages").forEach(p => { p.scrollLeft = 0; });
    }, 200);
  });
})();
