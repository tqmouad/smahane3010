// The star field behind the page. The stars have real depth: scrolling flies you forward through them.

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function startSky(canvas, reduceMotion) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const colours = ["--star", "--star", "--star-warm", "--star-cool"].map((name) => css.getPropertyValue(name).trim() || "#fff");

  const TRAVEL = 0.00022; // how far one pixel of scrolling moves you through the stars
  let w = 0, h = 0, stars = [], shooting = null, nextShot = 4000, running = false;
  let camera = (window.scrollY || 0) * TRAVEL, speed = 0;

  function build() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const rnd = seeded(30102002); // her birthday, so her sky is always the same sky
    const count = Math.min(700, Math.round((w * h) / 2300));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rnd() * 2 - 1, y: rnd() * 2 - 1, z: rnd(),
        size: 0.5 + Math.pow(rnd(), 4) * 1.8,
        phase: rnd() * 6.28, speed: 0.4 + rnd() * 1.6,
        colour: colours[Math.floor(rnd() * colours.length)],
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const target = (window.scrollY || 0) * TRAVEL;
    const before = camera;
    camera = reduceMotion ? target : camera + (target - camera) * 0.12; // glide towards where the scroll is
    speed = camera - before;
    const cx = w / 2, cy = h * 0.46, reach = Math.max(w, h) * 0.62;
    ctx.lineCap = "round";
    for (const s of stars) {
      let z = (s.z - camera) % 1;
      if (z < 0) z += 1;
      const depth = 0.07 + z * 0.93; // 0.07 = right in front of you, 1 = far away
      const px = cx + (s.x / depth) * reach * 0.55, py = cy + (s.y / depth) * reach * 0.55;
      if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;
      const twinkle = reduceMotion ? 0.85 : 0.6 + 0.4 * Math.sin(s.phase + (time / 1000) * s.speed);
      const near = 1 - z;
      const fade = Math.min(1, z * 9) * Math.min(1, (1 - z) * 6 + 0.25); // no popping in or out
      const r = s.size * (0.45 + near * near * 1.9);
      ctx.globalAlpha = twinkle * fade * (0.35 + near * 0.65);
      ctx.fillStyle = s.colour;
      const stretch = Math.abs(speed) > 0.0006 ? Math.min(0.5, Math.abs(speed) * 55) * near : 0;
      if (stretch > 0.01) { // moving fast: each star leaves a short trail pointing away from the centre
        ctx.strokeStyle = s.colour; ctx.lineWidth = r * 1.3;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - (px - cx) * stretch, py - (py - cy) * stretch); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
        if (r > 2) { // the nearest stars get a small sparkle
          ctx.globalAlpha *= 0.5;
          ctx.fillRect(px - r * 3.2, py - 0.3, r * 6.4, 0.6);
          ctx.fillRect(px - 0.3, py - r * 3.2, 0.6, r * 6.4);
        }
      }
    }
    if (shooting) {
      const p = (time - shooting.start) / shooting.length;
      if (p >= 1) shooting = null;
      else {
        const x = shooting.x + shooting.dx * p, y = shooting.y + shooting.dy * p;
        const tail = ctx.createLinearGradient(x, y, x - shooting.dx * 0.22, y - shooting.dy * 0.22);
        tail.addColorStop(0, colours[0]);
        tail.addColorStop(1, "transparent");
        ctx.globalAlpha = Math.sin(p * Math.PI);
        ctx.strokeStyle = tail; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - shooting.dx * 0.22, y - shooting.dy * 0.22); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(time) {
    if (!running) return;
    if (!shooting && time > nextShot) {
      shooting = { start: time, length: 1100, x: w * (0.15 + Math.random() * 0.6), y: h * Math.random() * 0.35, dx: w * 0.35, dy: h * 0.22 };
      nextShot = time + 6000 + Math.random() * 9000;
    }
    draw(time);
    requestAnimationFrame(loop);
  }

  function update() {
    const shouldRun = !reduceMotion && root.dataset.theme === "night" && !document.hidden;
    if (shouldRun && !running) { running = true; requestAnimationFrame(loop); }
    if (!shouldRun) { running = false; draw(0); }
  }

  build();
  update();
  window.addEventListener("resize", () => { build(); draw(performance.now()); });
  document.addEventListener("visibilitychange", update);
  new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  if (reduceMotion) window.addEventListener("scroll", () => draw(0), { passive: true });
}
