/* ============================================================
   LuminoOS — makiety: widoczne komunikaty błędów
   Zamiast cichej awarii pokazujemy pasek z treścią problemu,
   żeby łatwo było zgłosić, co nie działa.
   ============================================================ */
(function () {
  "use strict";
  let shown = 0;

  function banner(title, detail) {
    if (shown > 3) return;
    shown++;
    const el = document.createElement("div");
    el.className = "err-banner";
    el.innerHTML = `<b>${title}</b><span></span>
      <button aria-label="Zamknij">×</button>`;
    el.querySelector("span").textContent = String(detail).slice(0, 300);
    el.querySelector("button").addEventListener("click", () => el.remove());
    document.body.appendChild(el);
  }

  window.addEventListener("error", e => {
    banner("Błąd na stronie:", e.message || (e.error && e.error.message) || "nieznany");
  });
  window.addEventListener("unhandledrejection", e => {
    banner("Błąd (obietnica):", (e.reason && e.reason.message) || e.reason);
  });

  // po starcie sprawdzamy, czy powłoki faktycznie się zbudowały
  window.addEventListener("load", () => {
    setTimeout(() => {
      const missing = [];
      document.querySelectorAll("[data-android]").forEach(s => {
        if (!s.querySelector(".statusbar")) missing.push("ekran " + (s.dataset.android || "?"));
      });
      const win = document.getElementById("winScreen");
      if (win && !win.querySelector(".taskbar")) missing.push("laptop");
      if (missing.length) {
        banner("Nie udało się zbudować makiety:", missing.join(", ") +
          " — odśwież stronę (Ctrl+Shift+R).");
      }
    }, 900);
  });
})();
