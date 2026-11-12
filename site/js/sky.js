// The star field behind the page: stars twinkle and the whole sky turns very slowly, with a shooting star now and then.

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// How fast the sky turns. Bigger = faster. 0.000024 moves a star in the middle of the screen about 20 pixels a second.
const TURN_SPEED = 0.000024;

export function startSky(canvas, calm) { // calm = slower turn, no shooting stars, no sliding on scroll
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const colours = ["--star", "--star", "--star-warm", "--star-cool"].map((name) => css.getPropertyValue(name).trim() || "#fff");

  let w = 0, h = 0, field = 0, stars = [], shooting = null, nextShot = 4000, running = false;

  function build() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const rnd = seeded(30102002); // her birthday, so her sky is always the same sky
    field = Math.hypot(w, h * 1.25) + 700; // big enough that turning and scrolling never leave an empty corner
    const count = Math.min(2600, Math.round((field * field * 3.14159) / 5200));
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
    // The whole sky turns very slowly around a point above the screen, like the real night sky.
    // Stars also sit at three depths, so nearer ones slide a little more when the page scrolls.
    const turn = time * TURN_SPEED * (calm ? 0.4 : 1);
    const scroll = calm ? 0 : (window.scrollY || 0);
    const pivotX = w * 0.5, pivotY = -h * 0.25;
    for (const s of stars) {
      const angle = s.x * 3.14159 + turn;
      const reach = (0.06 + (s.y * 0.5 + 0.5) * 0.94) * field;
      const px = pivotX + Math.cos(angle) * reach;
      const py = pivotY + Math.sin(angle) * reach - scroll * (0.01 + s.z * 0.035);
      if (px < -8 || px > w + 8 || py < -8 || py > h + 8) continue;
      const twinkle = calm ? 0.75 + 0.25 * Math.sin(s.phase + (time / 1000) * s.speed * 0.5) : 0.55 + 0.45 * Math.sin(s.phase + (time / 1000) * s.speed);
      const r = s.size * (0.6 + s.z * 0.5);
      ctx.globalAlpha = twinkle * (0.4 + s.z * 0.6);
      ctx.fillStyle = s.colour;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
      if (r > 1.9) { // the brightest stars get a small sparkle
        ctx.globalAlpha *= 0.5;
        ctx.fillRect(px - r * 3.2, py - 0.3, r * 6.4, 0.6);
        ctx.fillRect(px - 0.3, py - r * 3.2, 0.6, r * 6.4);
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
    if (!calm && !shooting && time > nextShot) {
      shooting = { start: time, length: 1100, x: w * (0.15 + Math.random() * 0.6), y: h * Math.random() * 0.35, dx: w * 0.35, dy: h * 0.22 };
      nextShot = time + 6000 + Math.random() * 9000;
    }
    draw(time);
    requestAnimationFrame(loop);
  }

  function update() {
    const shouldRun = root.dataset.theme === "night" && !document.hidden;
    if (shouldRun && !running) { running = true; requestAnimationFrame(loop); }
    if (!shouldRun) { running = false; draw(0); }
  }

  build();
  update();
  window.addEventListener("resize", () => { build(); draw(performance.now()); });
  document.addEventListener("visibilitychange", update);
  new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
}
