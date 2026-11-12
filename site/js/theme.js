// Runs first, before the page is drawn, so the right sky and the right motion mode show at once.
(function () {
  var root = document.documentElement, sky = null, motion = null;
  try { sky = localStorage.getItem("sky"); motion = localStorage.getItem("motion"); } catch (e) { /* storage can be blocked */ }
  if (sky !== "golden" && sky !== "night") {
    sky = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "golden" : "night";
  }
  // "full" = all the movement. "calm" = stars drift slowly and things fade in, but nothing flies or spins.
  // The site always starts with full motion (the owner's choice), whatever the device setting says.
  // It is calm only if she turned the Motion switch off herself on this device.
  if (motion !== "calm") motion = "full";
  root.setAttribute("data-theme", sky);
  root.setAttribute("data-motion", motion);
})();
