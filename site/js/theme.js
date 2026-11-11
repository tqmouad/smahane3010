// Runs first, before the page is drawn, so the right sky shows at once.
(function () {
  var t = null;
  try { t = localStorage.getItem("sky"); } catch (e) { /* storage can be blocked */ }
  if (t !== "golden" && t !== "night") {
    t = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "golden" : "night";
  }
  document.documentElement.setAttribute("data-theme", t);
})();
