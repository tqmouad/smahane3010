// The star field behind the page: twinkling stars, slow drift on scroll, and a shooting star now and then.

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

  let w = 0, h = 0, stars = [], shooting = null, nextShot = 4000, running = false;
  let lastScroll = window.scrollY || 0, speed = 0; // how fast the page is scrolling, smoothed

  function build() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const rnd = seeded(30102002); // her birthday, so her sky is always the same sky
    const count = Math.min(650, Math.round((w * h) / 2600));
    stars = [];
    for (let i = 0; i < count; i++) {
      const depth = rnd();
      stars.push({
        x: rnd() * w, y: rnd() * h,
        r: 0.35 + Math.pow(rnd(), 4) * 1.9 + depth * 0.4,
        depth, phase: rnd() * 6.28, speed: 0.4 + rnd() * 1.6,
        colour: colours[Math.floor(rnd() * colours.length)],
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const scroll = window.scrollY || 0;
    speed += (scroll - lastScroll - speed) * 0.25;
    lastScroll = scroll;
    const streak = Math.max(-90, Math.min(90, speed * 1.4));
    ctx.lineCap = "round";
    for (const s of stars) {
      const twinkle = reduceMotion ? 0.85 : 0.55 + 0.45 * Math.sin(s.phase + (time / 1000) * s.speed);
      let y = (s.y - scroll * (0.02 + s.depth * 0.07)) % h;
      if (y < 0) y += h;
      ctx.globalAlpha = twinkle * (0.45 + s.depth * 0.55);
      ctx.fillStyle = s.colour;
      if (!reduceMotion && Math.abs(streak) > 2) { // scrolling fast: stars stretch into lines, like flying
        ctx.strokeStyle = s.colour; ctx.lineWidth = s.r * 1.4;
        ctx.beginPath(); ctx.moveTo(s.x, y); ctx.lineTo(s.x, y + streak * (0.25 + s.depth)); ctx.stroke();
        continue;
      }
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, 6.2832);
      ctx.fill();
      if (s.r > 1.7) { // the brightest stars get a small sparkle
        ctx.globalAlpha *= 0.5;
        ctx.fillRect(s.x - s.r * 3.5, y - 0.3, s.r * 7, 0.6);
        ctx.fillRect(s.x - 0.3, y - s.r * 3.5, 0.6, s.r * 7);
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
        ctx.strokeStyle = tail; ctx.lineWidth = 1.6; ctx.lineCap = "round";
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
