/* ============================================================
   Przełącznik stylu ikon: liquid / frosted / gel / chrome
   ============================================================ */
(function () {
  "use strict";
  const STYLES = ["liquid", "frosted", "gel", "chrome"];
  const buttons = Array.from(document.querySelectorAll("[data-icons-set]"));

  function setStyle(name) {
    if (!STYLES.includes(name)) name = "liquid";
    document.body.dataset.icons = name;
    buttons.forEach(b => {
      const on = b.dataset.iconsSet === name;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    try {
      const url = new URL(location.href);
      url.searchParams.set("icons", name);
      history.replaceState(null, "", url.href);
    } catch (e) { /* file:// */ }

    // krótka, sprężysta animacja pokazowa na ikonach
    document.querySelectorAll(".app .bi, .dock-app .bi").forEach((el, i) => {
      if (typeof el.animate !== "function") return;
      el.animate(
        [
          { transform: "scale(.86)", opacity: .55 },
          { transform: "scale(1.06)", opacity: 1, offset: .7 },
          { transform: "scale(1)", opacity: 1 }
        ],
        { duration: 420, delay: Math.min(i * 8, 160), easing: "cubic-bezier(.22,1,.36,1)" }
      );
    });
  }

  buttons.forEach(b => b.addEventListener("click", () => setStyle(b.dataset.iconsSet)));

  const fromUrl = new URLSearchParams(location.search).get("icons");
  setStyle(fromUrl && STYLES.includes(fromUrl) ? fromUrl : "liquid");

  window.Lumino = window.Lumino || {};
  window.Lumino.setIconStyle = setStyle;
})();
