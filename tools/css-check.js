/* Sprawdza kaskadę CSS dla trybu pojedynczego podglądu (jsdom liczy display). */
const fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
const root = path.join(__dirname, "..");
const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
  runScripts: "dangerously", resources: "usable", url: "file://" + root + "/index.html", pretendToBeVisual: true
});
dom.window.addEventListener("load", () => setTimeout(() => {
  const { document, Lumino } = dom.window;
  const stage = document.getElementById("stage");
  const devs = [...document.querySelectorAll(".device")];
  const disp = () => devs.map(d => d.className.split(" ")[1] + "=" +
    dom.window.getComputedStyle(d).display);
  console.log("all    :", disp().join("  "));
  Lumino.setView("phone");
  console.log("phone  :", disp().join("  "));
  Lumino.setView("tablet");
  console.log("tablet :", disp().join("  "));
  Lumino.setView("laptop");
  console.log("laptop :", disp().join("  "));
  const bad = [];
  ["phone", "tablet", "laptop"].forEach(v => {
    Lumino.setView(v);
    devs.forEach(d => {
      const s = dom.window.getComputedStyle(d).display;
      const shouldShow = d.classList.contains("device--" + v);
      if (shouldShow && s === "none") bad.push(v + ": ukryte własne urządzenie");
      if (!shouldShow && s !== "none") bad.push(v + ": widoczne obce urządzenie (" + d.className + ")");
    });
  });
  console.log(bad.length ? "PROBLEMY:\n" + bad.join("\n") : "OK — tryby pojedyncze działają");
  process.exit(bad.length ? 1 : 0);
}, 250));
