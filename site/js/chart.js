// Her birth chart as a round drawing (SVG), plus the counts that go with it.
// The numbers come from js/skydata.js. The words come from js/text.en.js.

const SVG = "http://www.w3.org/2000/svg";
const node = (tag, attrs) => {
  const n = document.createElementNS(SVG, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

export const signOf = (lon) => Math.floor(lon / 30) % 12;
export const degreeIn = (lon) => lon % 30;
export const houseOf = (lon, asc) => ((signOf(lon) - signOf(asc) + 12) % 12) + 1; // whole-sign houses

// Fire, Earth, Air, Water repeat around the circle starting with Aries; so do Cardinal, Fixed, Mutable.
export function counts(chart) {
  const points = [...chart.bodies.map((b) => b.lon), chart.asc]; // ten bodies and the rising point
  const element = [0, 0, 0, 0], mode = [0, 0, 0];
  points.forEach((lon) => { element[signOf(lon) % 4] += 1; mode[signOf(lon) % 3] += 1; });
  return { element, mode, total: points.length };
}

export function drawChart(target, chart, T) {
  const CX = 220, CY = 220, R_OUT = 190, R_SIGN = 158, R_HOUSE = 104, R_CENTRE = 80;
  const asc = chart.asc;
  // The rising point sits on the left. Signs run round the wheel against the clock, like in the real sky.
  const at = (r, lon) => {
    const a = ((180 + (lon - asc)) * Math.PI) / 180;
    return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
  };
  const line = (r1, r2, lon, cls) => {
    const [x1, y1] = at(r1, lon), [x2, y2] = at(r2, lon);
    return node("line", { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), class: cls });
  };
  const text = (content, x, y, cls) => {
    const t = node("text", { x: x.toFixed(1), y: y.toFixed(1), class: cls, "text-anchor": "middle", "dominant-baseline": "central" });
    t.textContent = content;
    return t;
  };

  const rings = node("g", { class: "chart__rings" });
  [R_OUT, R_SIGN, R_HOUSE, R_CENTRE].forEach((r, i) => rings.append(node("circle", { cx: CX, cy: CY, r, class: "chart__ring chart__ring--" + i, pathLength: 1 })));
  target.append(rings);

  const signs = node("g", { class: "chart__signs" });
  for (let s = 0; s < 12; s++) {
    signs.append(line(R_HOUSE, R_OUT, s * 30, "chart__divider"));
    const [x, y] = at((R_OUT + R_SIGN) / 2, s * 30 + 15);
    signs.append(text(T.chart.signShort[s], x, y, "chart__sign"));
    const [hx, hy] = at((R_HOUSE + R_CENTRE) / 2, s * 30 + 15);
    signs.append(text(String(((s - signOf(asc) + 12) % 12) + 1), hx, hy, "chart__house"));
  }
  target.append(signs);

  // the two main lines: where the sun rises (left) and the top of the sky
  const axes = node("g", { class: "chart__axes" });
  axes.append(line(R_CENTRE, R_OUT, asc, "chart__axis"), line(R_CENTRE, R_OUT, asc + 180, "chart__axis chart__axis--soft"));
  axes.append(line(R_CENTRE, R_OUT, chart.mc, "chart__axis chart__axis--soft"), line(R_CENTRE, R_OUT, chart.mc + 180, "chart__axis chart__axis--soft"));
  const [ax, ay] = at(R_OUT + 17, asc), [mx, my] = at(R_OUT + 17, chart.mc);
  axes.append(text(T.chart.risingShort, ax, ay, "chart__axislabel"), text(T.chart.topShort, mx, my, "chart__axislabel"));
  target.append(axes);

  // the planets: a small mark on the ring at the true place, and a round badge a little way in
  const order = chart.bodies.map((b, i) => ({ ...b, i })).sort((a, b) => a.lon - b.lon);
  let level = 0, previous = null;
  const badges = node("g", { class: "chart__planets" });
  order.forEach((b, n) => {
    if (previous !== null && b.lon - previous < 12) level = 1 - level; else level = 0;
    previous = b.lon;
    const [tx1, ty1] = at(R_SIGN, b.lon), [tx2, ty2] = at(R_SIGN - 9, b.lon);
    const [x, y] = at(level ? R_SIGN - 40 : R_SIGN - 20, b.lon);
    const g = node("g", { class: "chart__planet chart__planet--" + b.name.toLowerCase() });
    g.style.setProperty("--i", n);
    g.append(node("line", { x1: tx1.toFixed(1), y1: ty1.toFixed(1), x2: tx2.toFixed(1), y2: ty2.toFixed(1), class: "chart__tick" }));
    g.append(node("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 12, class: "chart__badge" }));
    g.append(text(T.chart.planets[b.name].short, x, y + 0.5, "chart__code"));
    badges.append(g);
  });
  target.append(badges);

  // the middle of the wheel
  const mid = node("g", { class: "chart__middle" });
  T.chart.centre.forEach((word, i) => mid.append(text(word, CX, CY + (i - 1) * 20, i === 0 ? "chart__date" : "chart__where")));
  target.append(mid);

  const rings3 = rings.querySelectorAll(".chart__ring");
  return (p) => { // the scroll draws the circles first, then the planets arrive one by one
    rings3.forEach((ring, i) => { ring.style.strokeDashoffset = Math.max(0, 1 - p * 3 + i * 0.1); });
    target.style.setProperty("--p", p);
  };
}
