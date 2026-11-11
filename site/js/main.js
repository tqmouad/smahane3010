import T from "./text.en.js";
import FULL_MOONS from "./fullmoons.js";
import { startSky } from "./sky.js";

// ---------- facts about her day (see docs/BIRTH_SKY.md) ----------
const BIRTH = Date.UTC(2002, 9, 30, 17, 0, 0); // 5:00 pm in Morocco, which was on UTC that day
const BIRTH_YEAR = 2002;
const BIRTH_MONTH = 9; // October (months start at 0)
const BIRTH_DAY = 30;
const MOON_LIT = 0.34; // part of the moon that was lit
const MOON_WANING = true;

const SVG = "http://www.w3.org/2000/svg";
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
startSky($("stars"), reduceMotion);

// ---------- her moon ----------
function moonPath(lit, waning) {
  const cx = 100, cy = 100, r = 80;
  const rx = (r * Math.abs(1 - 2 * lit)).toFixed(1);
  const limb = waning ? 0 : 1; // waning: the left side is lit (seen from the north)
  const inner = lit < 0.5 ? 1 - limb : limb;
  return `M${cx},${cy - r} A${r},${r} 0 0 ${limb} ${cx},${cy + r} A${rx},${r} 0 0 ${inner} ${cx},${cy - r} Z`;
}
$("moonLit").setAttribute("d", moonPath(MOON_LIT, MOON_WANING));

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
function showNumbers(scale) {
  const n = lifeNumbers(Date.now());
  for (const id in n) $(id).textContent = nf.format(Math.round(n[id] * scale));
}
function countUp() {
  if (reduceMotion) { showNumbers(1); return; }
  const start = performance.now(), length = 2600;
  (function step(t) {
    const p = Math.min(1, (t - start) / length);
    showNumbers(1 - Math.pow(1 - p, 4));
    if (p < 1) requestAnimationFrame(step);
  })(start);
}
showNumbers(1);
setInterval(() => showNumbers(1), 60000);

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
    target.append(svg("path", { d, class: "scorpio__line " + cls, pathLength: 1 }));
  };
  line([0, 1, 2], "scorpio__line--head");
  line([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], "scorpio__line--body");
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
}
drawScorpio($("scorpio"));

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
    head.append(svg("ellipse", {
      cx: 50, cy: 52 - long * 0.62, rx: wide.toFixed(1), ry: (long * 0.62).toFixed(1),
      transform: `rotate(${((360 / petals) * i).toFixed(1)} 50 52)`, class: "petal-" + colour,
    }));
  }
  head.append(svg("circle", { cx: 50, cy: 52, r: (5 + rnd() * 3).toFixed(1), class: "flower__heart" }));
  s.append(head);
  return s;
}
const memory = $("memory");
const totalFlowers = lifeNumbers(Date.now()).tripsAlive;
for (let n = 1; n <= totalFlowers; n++) {
  const year = BIRTH_YEAR + n;
  const li = el("li");
  const button = el("button", "flower");
  button.type = "button";
  button.style.setProperty("--i", n);
  button.setAttribute("aria-label", fill(T.garden.flowerAria, { n, total: totalFlowers, year }));
  button.append(makeFlower(n), el("span", "flower__year", String(year)));
  button.addEventListener("click", () => {
    $("memoryFlower").replaceChildren(makeFlower(n));
    $("memoryFlower").classList.add("is-in");
    $("memoryTitle").textContent = fill(T.garden.year, { n });
    $("memoryYear").textContent = String(year);
    $("memoryText").textContent = T.garden.memories[n - 1] || fill(T.garden.empty, { year });
    memory.showModal();
  });
  li.append(button);
  $("garden").append(li);
}
memory.addEventListener("click", (e) => { if (e.target === memory) memory.close(); });
$("memoryClose").addEventListener("click", () => memory.close());

// ---------- voice, gallery, letter (waiting for her things) ----------
const bars = seeded(3010);
for (let i = 0; i < 44; i++) {
  const bar = el("span");
  bar.style.setProperty("--i", i);
  bar.style.setProperty("--h", (0.2 + bars() * 0.8).toFixed(2));
  $("voiceBars").append(bar);
}
for (let i = 0; i < 3; i++) $("gallery").append(el("li", "frame", T.gallery.placeholder));
T.letter.body.forEach((p) => $("letter").append(el("p", null, p)));

// ---------- show each part as it scrolls into view ----------
const daysBlock = $("daysTitle").parentElement;
if ("IntersectionObserver" in window) {
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      if (entry.target === daysBlock) countUp();
      seen.unobserve(entry.target);
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach((node) => seen.observe(node));
} else {
  document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-in"));
}
