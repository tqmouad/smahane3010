import T from "./text.en.js?v=10";
import FULL_MOONS from "./fullmoons.js?v=10";
import { startSky } from "./sky.js?v=10";
import { createGlobe } from "./moon.js?v=10";

// ---------- facts about her day (see docs/BIRTH_SKY.md) ----------
const BIRTH = Date.UTC(2002, 9, 30, 17, 0, 0); // 5:00 pm in Morocco, which was on UTC that day
const BIRTH_YEAR = 2002;
const BIRTH_MONTH = 9; // October (months start at 0)
const BIRTH_DAY = 30;
const MOON_LIT = 0.34; // part of the moon that was lit
const MOON_WANING = true;
const HIS_MOON_LIT = 0.998; // the moon on 13 July 2003, the day the maker of this sky was born: full

const SVG = "http://www.w3.org/2000/svg";
const root = document.documentElement;
const reduceMotion = root.dataset.motion === "calm"; // calm mode: gentle fades only (see js/theme.js)
const nf = new Intl.NumberFormat("en-US");

const $ = (id) => document.getElementById(id);
const text = (key) => key.split(".").reduce((o, part) => (o == null ? o : o[part]), T);
const fill = (s, values) => s.replace(/\{(\w+)\}/g, (_, k) => values[k]);
function el(tag, cls, content) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content != null) node.textContent = content;
  return node;
}
function svg(tag, attrs) {
  const node = document.createElementNS(SVG, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

// ---------- words ----------
document.title = T.meta.title;
document.querySelectorAll("[data-t]").forEach((node) => {
  node.textContent = text(node.dataset.t);
});
document.querySelectorAll("[data-facts]").forEach((list) => {
  text(list.dataset.facts).forEach((f) => {
    const li = el("li", "fact");
    li.append(el("span", "fact__big", f.big), el("span", "fact__small", f.small));
    list.append(li);
  });
});

// ---------- the sky switch ----------
const themeSwitch = $("themeSwitch");
function showTheme() {
  themeSwitch.setAttribute("aria-checked", String(root.dataset.theme === "night"));
}
themeSwitch.setAttribute("aria-label", T.nav.switchLabel);
themeSwitch.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "night" ? "golden" : "night";
  try { localStorage.setItem("sky", root.dataset.theme); } catch (e) { /* storage can be blocked */ }
  showTheme();
});
showTheme();

const motionSwitch = $("motionSwitch");
motionSwitch.setAttribute("aria-label", T.nav.motionLabel);
motionSwitch.setAttribute("aria-checked", String(!reduceMotion));
motionSwitch.addEventListener("click", () => { // the page is rebuilt in the other mode
  try { localStorage.setItem("motion", reduceMotion ? "full" : "calm"); } catch (e) { /* storage can be blocked */ }
  root.dataset.motion = reduceMotion ? "full" : "calm";
  location.reload();
});
startSky($("stars"), reduceMotion);

// ---------- her moon ----------
function moonPath(lit, waning, cx = 100, cy = 100, r = 80) {
  const rx = (r * Math.abs(1 - 2 * lit)).toFixed(1);
  const limb = waning ? 0 : 1; // waning: the left side is lit (seen from the north)
  const inner = lit < 0.5 ? 1 - limb : limb;
  return `M${cx},${cy - r} A${r},${r} 0 0 ${limb} ${cx},${cy + r} A${rx},${r} 0 0 ${inner} ${cx},${cy - r} Z`;
}
$("moonLit").setAttribute("d", moonPath(MOON_LIT, MOON_WANING));

// The moon was full 9.4 days before she was born, then waned to 34%.
const NIGHTS_FROM_FULL = 9.4;
const FINAL_ANGLE = Math.acos(2 * MOON_LIT - 1);
const moonCanvas = $("moonGlobe");
moonCanvas.setAttribute("aria-label", T.moon.alt);
const moonTint = getComputedStyle(root).getPropertyValue("--moon-rgb").split(",").map(Number);
const renderGlobe = createGlobe(moonCanvas, "img/moon-map.jpg", moonTint);
const hand = { spin: 0 }; // extra turn added by her finger
let moonAt = 0;
function showMoon(p) { // p goes from 0 to 1: the globe turns to face her, then wanes from full to her moon
  moonAt = p;
  const spin = (1 - clamp(p / 0.22)) * 1.9 + hand.spin;
  const t = clamp((p - 0.18) / 0.67);
  renderGlobe(t * FINAL_ANGLE, spin);
  const nights = Math.round(NIGHTS_FROM_FULL * (1 - t));
  $("moonWhen").textContent =
    t <= 0.02 ? T.moon.full : nights > 1 ? fill(T.moon.nights, { n: nights }) : nights === 1 ? T.moon.oneNight : T.moon.yours;
}

{ // slide a finger (or the mouse) sideways across the moon to turn it; it swings back when she lets go
  let from = null;
  moonCanvas.addEventListener("pointerdown", (e) => { from = e.clientX - hand.spin * 90; moonCanvas.setPointerCapture(e.pointerId); if (window.gsap) window.gsap.killTweensOf(hand); });
  moonCanvas.addEventListener("pointermove", (e) => { if (from === null) return; hand.spin = (e.clientX - from) / 90; showMoon(moonAt); });
  const release = () => {
    if (from === null) return;
    from = null;
    if (window.gsap && !reduceMotion) window.gsap.to(hand, { spin: 0, duration: 2.2, ease: "elastic.out(1, 0.6)", onUpdate: () => showMoon(moonAt) });
    else { hand.spin = 0; showMoon(moonAt); }
  };
  moonCanvas.addEventListener("pointerup", release);
  moonCanvas.addEventListener("pointercancel", release);
}

// ---------- counting her days ----------
function lifeNumbers(now) {
  const ms = now - BIRTH;
  const d = new Date(now);
  let trips = d.getFullYear() - BIRTH_YEAR;
  const hadBirthday = d.getMonth() > BIRTH_MONTH || (d.getMonth() === BIRTH_MONTH && d.getDate() >= BIRTH_DAY);
  if (!hadBirthday) trips -= 1;
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let next = new Date(d.getFullYear(), BIRTH_MONTH, BIRTH_DAY);
  if (next < today) next = new Date(d.getFullYear() + 1, BIRTH_MONTH, BIRTH_DAY);
  const nowMinutes = now / 60000;
  return {
    daysAlive: Math.floor(ms / 86400000),
    hoursAlive: Math.floor(ms / 3600000),
    moonsAlive: FULL_MOONS.filter((m) => m <= nowMinutes).length,
    tripsAlive: trips,
    daysToNext: Math.round((next - today) / 86400000),
  };
}
let daysShown = 1; // 0 to 1 while the big number counts up with the scroll
function showNumbers() {
  const n = lifeNumbers(Date.now());
  for (const id in n) $(id).textContent = nf.format(id === "daysAlive" ? Math.round(n[id] * daysShown) : n[id]);
}
function showDays(p) {
  const t = Math.min(1, p / 0.8);
  daysShown = 1 - Math.pow(1 - t, 3);
  showNumbers();
}
showNumbers();
setInterval(showNumbers, 60000);

// ---------- Scorpio ----------
// [right ascension in hours, declination in degrees, size]. Positions are approximate.
const SCORPIUS = [
  [16.091, -19.81, 3.4], // Acrab
  [16.006, -22.62, 3.6], // Dschubba
  [15.981, -26.11, 3.2], // Pi
  [16.353, -25.59, 3.0], // Sigma
  [16.490, -26.43, 6.0], // Antares
  [16.598, -28.22, 3.0], // Tau
  [16.836, -34.29, 3.6], // Epsilon
  [16.864, -38.05, 3.0], // Mu
  [16.910, -42.36, 2.8], // Zeta
  [17.203, -43.24, 3.0], // Eta
  [17.622, -43.00, 3.8], // Sargas
  [17.793, -40.13, 3.0], // Iota
  [17.708, -39.03, 3.4], // Kappa
  [17.560, -37.10, 4.2], // Shaula
  [17.513, -37.30, 3.2], // Lesath
];
const HEART = 4;
function drawScorpio(target) {
  const scale = 19;
  const pts = SCORPIUS.map(([ra, dec]) => [
    90 + (17.793 - ra) * 15 * 0.84 * scale, // east is on the left, as in the real sky
    40 + (-19.81 - dec) * scale,
  ]);
  const line = (order, cls) => {
    const d = order.map((i, n) => (n ? "L" : "M") + pts[i][0].toFixed(1) + "," + pts[i][1].toFixed(1)).join(" ");
    const path = svg("path", { d, class: "scorpio__line " + cls, pathLength: 1 });
    target.append(path);
    return path;
  };
  const head = line([0, 1, 2], "scorpio__line--head");
  const body = line([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], "scorpio__line--body");
  pts.forEach(([x, y], i) => {
    const star = svg("circle", {
      cx: x.toFixed(1), cy: y.toFixed(1), r: SCORPIUS[i][2],
      class: "scorpio__star" + (i === HEART ? " scorpio__star--heart" : ""),
    });
    star.style.setProperty("--i", i);
    target.append(star);
  });
  const label = svg("text", { x: (pts[HEART][0] - 22).toFixed(1), y: (pts[HEART][1] + 8).toFixed(1), "text-anchor": "end", class: "scorpio__label" });
  label.textContent = T.scorpio.heart;
  target.append(label);
  return (p) => { // the scroll draws the lines
    head.style.strokeDashoffset = clamp(1 - p * 7);
    body.style.strokeDashoffset = clamp(1 - (p - 0.1) * 1.4);
  };
}
const showScorpio = drawScorpio($("scorpio"));

// ---------- songs ----------
T.songs.list.forEach((song) => {
  const li = el("li", "song");
  const words = el("div");
  words.append(el("span", "song__title", song.title), el("span", "song__artist", song.artist));
  if (song.tag) words.append(el("span", "song__tag", song.tag));
  const link = el("a", "btn", T.songs.listen);
  link.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(song.title + " " + song.artist);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", fill(T.songs.listenAria, song));
  li.append(words, link);
  $("songs").append(li);
});

// ---------- the garden ----------
function seeded(n) { // small repeatable random, so each year always grows the same flower
  let a = (n * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeFlower(n) {
  const rnd = seeded(n);
  const petals = 5 + Math.floor(rnd() * 5);
  const colour = 1 + Math.floor(rnd() * 6);
  const long = 17 + rnd() * 9, wide = 6 + rnd() * 5;
  const lean = (rnd() - 0.5) * 16;
  const s = svg("svg", { viewBox: "0 0 100 140", "aria-hidden": "true", focusable: "false" });
  s.append(svg("path", { d: `M50,138 C${50 + lean},110 ${50 - lean},85 50,56`, class: "flower__stem", pathLength: 1 }));
  s.append(svg("path", { d: `M50,108 C${68 + lean},100 74,88 ${76 + lean},82 C62,84 54,94 50,108 Z`, class: "flower__leaf" }));
  const head = svg("g", { class: "flower__head" });
  for (let i = 0; i < petals; i++) {
    for (let pass = 0; pass < 2; pass++) { // each petal is drawn twice, a little off, like a quick ink sketch
      head.append(svg("ellipse", {
        cx: (50 + pass * (rnd() - 0.5) * 3).toFixed(1), cy: (52 - long * 0.62).toFixed(1),
        rx: (wide + pass * (rnd() - 0.3) * 2).toFixed(1), ry: (long * 0.62 + pass * rnd() * 2).toFixed(1),
        transform: `rotate(${((360 / petals) * i + pass * (rnd() - 0.5) * 9).toFixed(1)} 50 52)`, class: "petal petal-" + colour,
      }));
    }
  }
  head.append(svg("circle", { cx: 50, cy: 52, r: (5 + rnd() * 3).toFixed(1), class: "flower__heart" }));
  s.append(head);
  return s;
}
// A quiet ink drawing for her father's year: a simple grave, one flower beside it, one star above.
function makeGrave(label) {
  const s = svg("svg", { viewBox: "0 0 100 140", role: "img", "aria-label": label, class: "grave" });
  s.append(svg("path", { d: "M8,122 C30,118 70,119 94,123", class: "grave__ink" }));
  s.append(svg("path", { d: "M32,121 L32,84 C32,62 68,62 68,84 L68,121", class: "grave__ink" }));
  s.append(svg("path", { d: "M34,120 L34,85 C35,66 66,65 66,85", class: "grave__ink grave__ink--soft" }));
  s.append(svg("path", { d: "M14,121 l2,-7 M19,121 l-1,-6 M88,122 l-2,-7 M24,121 l2,-5", class: "grave__ink" }));
  s.append(svg("path", { d: "M80,121 C79,110 82,104 80,97", class: "grave__ink" }));
  for (let i = 0; i < 6; i++) s.append(svg("ellipse", { cx: 80, cy: 91, rx: 2.6, ry: 6, transform: `rotate(${i * 60} 80 97)`, class: "grave__ink" }));
  s.append(svg("circle", { cx: 80, cy: 97, r: 2, class: "grave__heart" }));
  s.append(svg("path", { d: "M50,20 L52.5,29 L61,31 L52.5,33.5 L50,42 L47.5,33.5 L39,31 L47.5,29 Z", class: "grave__star" }));
  return s;
}

const memory = $("memory");
const flowers = [];
const totalFlowers = lifeNumbers(Date.now()).tripsAlive;
for (let n = 1; n <= totalFlowers; n++) {
  const year = BIRTH_YEAR + n;
  const li = el("li");
  const button = el("button", "flower");
  button.type = "button";
  button.style.setProperty("--i", n);
  button.setAttribute("aria-label", fill(T.garden.flowerAria, { n, total: totalFlowers, year }));
  if (typeof T.garden.memories[n - 1] === "object") button.classList.add("flower--star");
  button.append(makeFlower(n), el("span", "flower__year", String(year)));
  button.addEventListener("click", () => {
    const saved = T.garden.memories[n - 1];
    const memoryOf = typeof saved === "object" ? saved : { text: saved };
    $("memoryFlower").replaceChildren(memoryOf.dua ? makeGrave(memoryOf.drawing) : makeFlower(n));
    $("memoryPrayer").hidden = !memoryOf.dua;
    if (memoryOf.dua) {
      $("memoryName").replaceChildren(memoryOf.name + " \u00b7 ");
      const mercy = el("span", null, memoryOf.mercy);
      mercy.lang = "ar"; mercy.dir = "rtl";
      $("memoryName").append(mercy);
      $("memoryDua").textContent = memoryOf.dua;
      $("memoryDuaMeaning").textContent = memoryOf.duaMeaning;
    }
    $("memoryTitle").textContent = fill(T.garden.year, { n });
    $("memoryYear").textContent = String(year);
    $("memoryText").textContent = memoryOf.text || fill(T.garden.wishes[n % T.garden.wishes.length], { year });
    memory.showModal();
  });
  li.append(button);
  $("garden").append(li);
  flowers.push(button);
}
memory.addEventListener("click", (e) => { if (e.target === memory) memory.close(); });
$("memoryClose").addEventListener("click", () => memory.close());

// ---------- voice (hidden until audio files are added) ----------
if (T.voice.files.length) {
  $("voice").hidden = false;
  const bars = seeded(3010);
  for (let i = 0; i < 44; i++) {
    const bar = el("span");
    bar.style.setProperty("--i", i);
    bar.style.setProperty("--h", (0.2 + bars() * 0.8).toFixed(2));
    $("voiceBars").append(bar);
  }
}

// ---------- her drawings ----------
const viewer = $("viewer");
function frameFor(art) { // a framed picture that opens bigger when touched
  const button = el("button", "frame");
  button.type = "button";
  button.setAttribute("aria-label", T.gallery.open + ": " + art.alt);
  const img = el("img");
  img.src = "img/" + art.file;
  img.alt = "";
  img.width = art.w; img.height = art.h;
  img.loading = "lazy"; img.decoding = "async";
  button.append(img);
  button.addEventListener("click", () => {
    $("viewerImage").src = img.src;
    $("viewerImage").alt = art.alt;
    viewer.showModal();
  });
  return button;
}
T.gallery.list.forEach((art, i) => { // her drawings stand in a ring that turns in 3D with the scroll
  const li = el("li", "ring__item");
  li.style.setProperty("--i", i);
  li.append(frameFor(art));
  $("gallery").append(li);
});
$("gallery").style.setProperty("--count", T.gallery.list.length);
$("portrait").append(frameFor(T.portrait.art));
viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
$("viewerClose").addEventListener("click", () => viewer.close());

// ---------- the letter and the signature ----------
T.letter.body.forEach((p) => $("letter").append(el("p", null, p)));

// The signature has no name: two knots of ink tied by one line, drawn in one stroke like her scribble art.
function drawSignature(target) {
  const rnd = seeded(2002);
  const pts = [];
  const knot = (cx, cy, turns) => {
    const steps = turns * 26, start = rnd() * 6.28;
    for (let i = 0; i < steps; i++) {
      const a = start + (i / 26) * 6.2832;
      const r = 2 + rnd() * 17;
      pts.push([cx + Math.cos(a) * r * 1.15, cy + Math.sin(a) * r]);
    }
  };
  knot(62, 62, 9);
  for (let i = 0; i <= 110; i++) { // the long looping line between the two
    const t = i / 110, a = t * 6.2832 * 4.5;
    pts.push([62 + t * 176 + Math.cos(a) * 26 * Math.sin(t * Math.PI), 62 - Math.sin(t * Math.PI) * 14 + Math.sin(a) * 34 * Math.sin(t * Math.PI)]);
  }
  knot(238, 62, 9);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) { // smooth curve through the middle of each pair of points
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const path = svg("path", { d, class: "signature__line", pathLength: 1 });
  target.append(path);
  const moons = svg("g", { class: "signature__moons" });
  [[62, MOON_LIT], [238, HIS_MOON_LIT]].forEach(([x, lit]) => { // her crescent on the left, his full moon on the right
    moons.append(svg("circle", { cx: x, cy: 62, r: 15, class: "signature__disc" }));
    moons.append(svg("path", { d: moonPath(lit, true, x, 62, 15), class: "moon__lit" }));
  });
  target.append(moons);
  return path;
}
const signatureLine = drawSignature($("signature"));

// ---------- scroll scenes (GSAP ScrollTrigger) ----------
// Each followed thing gets a number from 0 to 1 that glides after the scroll.
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
const animated = Boolean(gsap && ScrollTrigger);
function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

const RANGES = { // where each kind of motion starts and ends: "part of the thing" + "part of the screen"
  pin: ["top top", "bottom bottom", 0.9],
  in: ["top 100%", "top 48%", 0.8],
  read: ["top 92%", "top 48%", 0.5],
  sign: ["top 95%", "top 60%", 0.9],
  out: ["bottom 28%", "bottom top", 0.5],
};
const followed = [];
const follow = (node, mode, apply) => followed.push({ node, mode, apply });
const setVar = (node, name) => (p) => node.style.setProperty(name, p);

function pinScene(id, extra) {
  const scene = $(id);
  follow(scene.parentElement, "pin", (p) => { scene.style.setProperty("--p", p); if (extra) extra(p); });
}
pinScene("heroScene");
pinScene("moonScene", showMoon);
pinScene("daysScene", showDays);
pinScene("scorpioScene", showScorpio);
pinScene("wallScene");

document.querySelectorAll(".reveal").forEach((block) => {
  follow(block, "in", setVar(block, "--in"));
  follow(block, "out", setVar(block, "--out"));
});
document.querySelectorAll(".reveal .lead").forEach((lead) => { // split into words that light up one by one
  const words = lead.textContent.split(" ");
  lead.textContent = "";
  words.forEach((word, i) => {
    const span = el("span", "w", word);
    span.style.setProperty("--w", i);
    lead.append(span, i < words.length - 1 ? " " : "");
  });
  lead.style.setProperty("--n", words.length);
  follow(lead, "read", setVar(lead, "--lp"));
});
document.querySelectorAll(".song, .portrait, .letter").forEach((node) => follow(node, "in", setVar(node, "--p")));
follow($("signature"), "sign", (p) => { signatureLine.style.strokeDashoffset = 1 - p; $("signature").style.setProperty("--p", p); });
flowers.forEach((flower) => {
  const stem = flower.querySelector(".flower__stem");
  follow(flower, "in", (p) => { flower.style.setProperty("--p", p); stem.style.strokeDashoffset = clamp(1 - p * 1.8); });
});

if (!animated) {
  // The animation files did not load: show everything finished.
  followed.forEach((f) => f.apply(f.mode === "out" ? 0 : 1));
  root.style.setProperty("--page", 1);
} else {
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("is-animated");
  const top = (node) => node.getBoundingClientRect().top + window.scrollY;
  followed.sort((a, b) => top(a.node) - top(b.node)); // ScrollTrigger wants them made in page order
  followed.forEach((f) => {
    if (reduceMotion && (f.mode === "pin" || f.mode === "out")) { f.apply(f.mode === "out" ? 0 : 1); return; } // calm mode: no held scenes
    const [start, end, glide] = RANGES[f.mode];
    const state = { p: 0 };
    f.apply(0);
    gsap.to(state, {
      p: 1, ease: "none",
      onUpdate: () => f.apply(Math.round(state.p * 1000) / 1000),
      scrollTrigger: { trigger: f.node, start, end, scrub: glide },
    });
  });
  ScrollTrigger.create({ // the thin line at the top, and the dawn at the end of the night
    start: 0, end: "max",
    onUpdate: (self) => {
      root.style.setProperty("--page", self.progress.toFixed(4));
      root.style.setProperty("--dawn", clamp((self.progress - 0.8) / 0.2).toFixed(3));
    },
  });

  if (!reduceMotion) {
  // Her name arrives letter by letter, each one turning in from deep space.
  const name = $("heroName");
  const letters = [...name.textContent].map((ch) => el("span", "hero__letter", ch));
  name.setAttribute("aria-label", name.textContent);
  const row = el("span", "hero__letters");
  row.setAttribute("aria-hidden", "true");
  row.append(...letters);
  name.replaceChildren(row);
  gsap.from(letters, { rotationY: -100, z: -500, y: 30, opacity: 0, duration: 1.5, ease: "power3.out", stagger: 0.09, delay: 0.25, transformPerspective: 700 });

  // On a laptop, her portrait leans in 3D towards the mouse.
  document.querySelectorAll(".portrait").forEach((holder) => {
    gsap.set(holder, { transformPerspective: 800 });
    const tiltX = gsap.quickTo(holder, "rotationX", { duration: 0.5, ease: "power3" });
    const tiltY = gsap.quickTo(holder, "rotationY", { duration: 0.5, ease: "power3" });
    holder.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = holder.getBoundingClientRect();
      tiltY(((e.clientX - r.left) / r.width - 0.5) * 22);
      tiltX(-((e.clientY - r.top) / r.height - 0.5) * 22);
    });
    holder.addEventListener("pointerleave", () => { tiltX(0); tiltY(0); });
  });
  }

  // Fonts and pictures can change the page height after it first appears.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
