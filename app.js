/* LuminoOS — makiety: interakcje podglądu */
(() => {
  "use strict";

  /* ---------- 1. Żywy zegar i data ---------- */
  const now = new Date();
  const time = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  const dateLong = now.toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long"
  });
  const dateShort = now.toLocaleDateString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  document.querySelectorAll(".js-time").forEach(el => { el.textContent = time; });
  document.querySelectorAll(".js-date").forEach(el => { el.textContent = dateLong; });
  document.querySelectorAll(".js-date-short").forEach(el => { el.textContent = dateShort; });

  /* ---------- 2. Wyróżnianie urządzenia ---------- */
  const stage = document.getElementById("stage");
  const devices = Array.from(document.querySelectorAll(".device"));

  function focusDevice(el) {
    devices.forEach(d => d.classList.toggle("is-focus", d === el));
    stage.classList.toggle("has-focus", Boolean(el));
  }

  devices.forEach(el => {
    el.addEventListener("click", e => {
      // klik w przycisk Start nie ma przenosić fokusu na całe urządzenie
      if (e.target.closest("#startBtn, .start-menu")) return;
      focusDevice(el.classList.contains("is-focus") ? null : el);
    });
    el.addEventListener("dblclick", () => focusDevice(null));
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusDevice(el); }
      if (e.key === "Escape") focusDevice(null);
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { focusDevice(null); closeStart(); }
  });

  /* ---------- 3. Menu Start w laptopie ---------- */
  const startBtn = document.getElementById("startBtn");
  const startMenu = document.getElementById("startMenu");

  function openStart() {
    startMenu.classList.add("is-open");
    startMenu.setAttribute("aria-hidden", "false");
    startBtn.setAttribute("aria-expanded", "true");
  }
  function closeStart() {
    startMenu.classList.remove("is-open");
    startMenu.setAttribute("aria-hidden", "true");
    startBtn.setAttribute("aria-expanded", "false");
  }

  startBtn.addEventListener("click", e => {
    e.stopPropagation();
    startMenu.classList.contains("is-open") ? closeStart() : openStart();
  });

  document.addEventListener("click", e => {
    if (!e.target.closest("#startMenu, #startBtn")) closeStart();
  });

  /* ---------- 4. Delikatny podgląd kliknięć w aplikacje ---------- */
  document.querySelectorAll(".app, .dock-app, .start-app").forEach(app => {
    app.addEventListener("click", e => {
      e.stopPropagation();
      app.animate(
        [{ transform: "scale(1)" }, { transform: "scale(.92)" }, { transform: "scale(1)" }],
        { duration: 220, easing: "ease-out" }
      );
    });
  });
})();
