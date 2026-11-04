/* Podglądowa sonda płynności: wstrzykuje do strony licznik FPS i długości
   klatki (tylko w trybie dev, gdy w adresie jest ?fps=1).
   Uruchamia się po wczytaniu strony; nie zmienia zachowania UI. */
(function () {
  if (!/[?&]fps=1/.test(location.search)) return;
  const box = document.createElement("div");
  box.id = "lu-fps";
  box.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:99999;font:600 11px/1.4 ui-monospace,monospace;" +
    "padding:8px 10px;border-radius:10px;color:#dff;background:rgba(10,14,24,.82);" +
    "border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);pointer-events:none;white-space:pre";
  document.body.appendChild(box);

  let last = performance.now(), worst = 0, acc = 0, n = 0, slow = 0;
  function loop(now) {
    const dt = now - last;
    last = now;
    if (dt > 0 && dt < 500) {
      acc += dt; n++;
      if (dt > worst) worst = dt;
      if (dt > 22) slow++;      /* klatka dłuższa niż 22 ms = zgubione 60 fps */
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  setInterval(() => {
    const fps = n ? Math.round(1000 / (acc / n)) : 0;
    const jank = n ? Math.round((slow / n) * 100) : 0;
    box.textContent = `FPS ${fps}\nklatka ${(acc / Math.max(1, n)).toFixed(1)} ms\nnajgorsza ${worst.toFixed(1)} ms\nzacięcia ${jank}%`;
    worst = 0; acc = 0; n = 0; slow = 0;
  }, 700);
})();
