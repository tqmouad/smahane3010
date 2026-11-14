// A premium 3D chessboard drawn on a canvas, with no 3D library.
// Polished marble squares with veins, a lacquered frame with gold lines, reflections in the board,
// metal-gold pieces for her side and glossy porcelain for his.
// Her queen and his king walk towards each other, one move for each moment of the story.
// The scroll gives a number p from 0 to 1; render(p, yaw) draws the board for that moment.

const FILES = "abcdefgh";
const square = (name) => ({ f: FILES.indexOf(name[0]), r: Number(name[1]) - 1 }); // file 0-7, rank 0-7

// ---------- the story game ----------
export const START = { queen: "d8", king: "e1" };
export const MOVES = [
  { piece: "queen", from: "d8", to: "d5" },
  { piece: "king", from: "e1", to: "e2" },
  { piece: "queen", from: "d5", to: "d4" },
  { piece: "king", from: "e2", to: "e3" },
  { piece: "queen", from: "d4", to: "e4" },
];
export const notation = (move, i) => (move.piece === "queen" ? "Q" : "K") + move.to + (i === MOVES.length - 1 ? "#" : "");

const FIRST = 0.12, STEP = 0.17, LENGTH = 0.13;
export const moveStart = (i) => FIRST + i * STEP;
export function activeMove(p) { // -1 before the first move
  if (p < FIRST) return -1;
  return Math.min(MOVES.length - 1, Math.floor((p - FIRST) / STEP + 0.001));
}

// Pieces that stand still, so the board looks like a real game. They never block the story moves.
const EXTRAS = [
  ["rook", "a8", "gold"], ["bishop", "c8", "gold"], ["bishop", "f8", "gold"], ["rook", "h8", "gold"],
  ["pawn", "a7", "gold"], ["pawn", "b7", "gold"], ["pawn", "g7", "gold"], ["pawn", "h7", "gold"],
  ["rook", "a1", "ivory"], ["bishop", "c1", "ivory"], ["bishop", "f1", "ivory"], ["rook", "h1", "ivory"],
  ["pawn", "a2", "ivory"], ["pawn", "b2", "ivory"], ["pawn", "g2", "ivory"], ["pawn", "h2", "ivory"],
];

// ---------- piece shapes: [radius, height] from the bottom up, in squares ----------
const D = Math.PI / 180;
function arc(cr, ch, radius, from, to, steps) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const a = (from + ((to - from) * i) / steps) * D;
    out.push([Math.max(0, cr + radius * Math.cos(a)), ch + radius * Math.sin(a)]);
  }
  return out;
}
const FOOT = [[0, 0], [0.4, 0], [0.4, 0.05], [0.36, 0.09], [0.36, 0.13], [0.29, 0.17]];
const PROFILES = {
  pawn: [[0, 0], [0.36, 0], [0.36, 0.05], [0.32, 0.09], [0.32, 0.12], [0.26, 0.15], [0.19, 0.21], [0.15, 0.32], [0.12, 0.46],
    [0.2, 0.5], [0.2, 0.54], [0.1, 0.57], ...arc(0, 0.72, 0.16, -68, 90, 8)],
  rook: [...FOOT, [0.24, 0.24], [0.22, 0.58], [0.3, 0.62], [0.31, 0.66], [0.31, 0.84], [0.24, 0.84], [0.24, 0.77], [0, 0.77]],
  bishop: [...FOOT, [0.2, 0.25], [0.14, 0.5], [0.12, 0.62], [0.22, 0.66], [0.22, 0.7], [0.12, 0.73], [0.17, 0.8], [0.2, 0.88],
    [0.18, 0.98], [0.11, 1.07], [0.04, 1.12], ...arc(0, 1.165, 0.055, -75, 90, 4)],
  queen: [[0, 0], [0.42, 0], [0.42, 0.06], [0.37, 0.1], [0.37, 0.14], [0.28, 0.19], [0.2, 0.28], [0.15, 0.55], [0.13, 0.8],
    [0.24, 0.84], [0.24, 0.88], [0.14, 0.9], [0.16, 0.98], [0.24, 1.12], [0.3, 1.22], [0.27, 1.25], [0.2, 1.27], [0.13, 1.31],
    ...arc(0, 1.37, 0.07, -55, 90, 4)],
  king: [[0, 0], [0.43, 0], [0.43, 0.06], [0.38, 0.1], [0.38, 0.14], [0.29, 0.19], [0.21, 0.28], [0.16, 0.56], [0.14, 0.84],
    [0.25, 0.88], [0.25, 0.92], [0.15, 0.94], [0.17, 1.02], [0.25, 1.16], [0.27, 1.24], [0.22, 1.29], [0.12, 1.33], [0.06, 1.37], [0, 1.38]],
};

function soften(points) { // round every corner a little, like a piece turned on a lathe
  const out = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]];
    out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
  }
  out.push(points[points.length - 1]);
  return out;
}

function lathe(profile, segments) {
  const verts = [], quads = [];
  for (let j = 0; j < profile.length; j++) {
    for (let s = 0; s < segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      verts.push([profile[j][0] * Math.cos(a), profile[j][1], profile[j][0] * Math.sin(a)]);
    }
  }
  for (let j = 0; j < profile.length - 1; j++) {
    const [r0, h0] = profile[j], [r1, h1] = profile[j + 1];
    const len = Math.hypot(r1 - r0, h1 - h0);
    if (len < 1e-6) continue;
    const nr = (h1 - h0) / len, nh = -(r1 - r0) / len;
    for (let s = 0; s < segments; s++) {
      const s2 = (s + 1) % segments, a = ((s + 0.5) / segments) * Math.PI * 2;
      quads.push({ idx: [j * segments + s, j * segments + s2, (j + 1) * segments + s2, (j + 1) * segments + s], n: [nr * Math.cos(a), nh, nr * Math.sin(a)], y: (h0 + h1) / 2 });
    }
  }
  return { verts, quads };
}
function box(cx, cy, cz, w, h, d, shape) { // a small gold block (the king's cross)
  const o = shape.verts.length, x = w / 2, y = h / 2, z = d / 2;
  for (const [a, b, c] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) shape.verts.push([cx + a * x, cy + b * y, cz + c * z]);
  const faces = [[[0, 3, 2, 1], [0, 0, -1]], [[4, 5, 6, 7], [0, 0, 1]], [[0, 4, 7, 3], [-1, 0, 0]], [[1, 2, 6, 5], [1, 0, 0]], [[3, 7, 6, 2], [0, 1, 0]], [[0, 1, 5, 4], [0, -1, 0]]];
  faces.forEach(([f, n]) => shape.quads.push({ idx: f.map((i) => i + o), n, y: cy, accent: true }));
}
const SHAPES = {};
const LEVELS = { hero: [40, true], extra: [22, true], low: [12, false] }; // [segments, softened]
function shapeFor(kind, level) {
  const key = kind + level;
  if (!SHAPES[key]) {
    const [segments, soft] = LEVELS[level];
    const s = lathe(soft ? soften(PROFILES[kind]) : PROFILES[kind], segments);
    if (kind === "king") { box(0, 1.52, 0, 0.08, 0.3, 0.08, s); box(0, 1.55, 0, 0.26, 0.08, 0.08, s); }
    SHAPES[key] = s;
  }
  return SHAPES[key];
}

// ---------- small helpers ----------
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function rgb(hex) {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
const css = (c, a) => (a === undefined ? "rgb(" : "rgba(") + c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(",") + (a === undefined ? ")" : "," + a + ")");
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const LIGHT = norm([-0.45, 0.85, 0.4]); // the light comes from the upper left, a little in front
const WHITE = [255, 255, 255];

// Polished gold: it mirrors a bright studio above and a dark floor below, with a soft light-box shine.
function goldMetal(base, n, view, half) {
  const nv = dot(n, view), ry = 2 * nv * n[1] - view[1];
  const deep = mix(base, [96, 58, 14], 0.55);
  let c = ry < 0 ? mix(mix(base, deep, 0.5), deep, clamp(-ry * 2)) : mix(base, mix(base, WHITE, 0.65), Math.pow(ry, 1.6));
  c = mix(c, [255, 246, 222], Math.exp(-Math.pow((ry - 0.35) / 0.1, 2)) * 0.55);
  const diffuse = Math.max(0, dot(n, LIGHT)), spec = Math.pow(Math.max(0, dot(n, half)), 60);
  return c.map((v) => v * (0.78 + 0.36 * diffuse) + 255 * spec);
}
// Glossy porcelain: soft light, a sharp white shine, and a pale glow on the edges.
function porcelain(base, n, view, half) {
  const diffuse = Math.max(0, dot(n, LIGHT)), spec = Math.pow(Math.max(0, dot(n, half)), 90) * 0.95;
  const edge = Math.pow(1 - Math.max(0, dot(n, view)), 4) * 0.35;
  return mix(base.map((v) => v * (0.46 + 0.62 * diffuse)), WHITE, edge).map((v) => v + 255 * spec);
}

function loadImage(src, done) { const img = new Image(); img.onload = done; img.src = src; return img; }

// ---------- the marble: drawn once into a hidden picture, then laid on the board ----------
function random(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function marble(light, dark) {
  const SIZE = 1024, T = SIZE / 8, tex = document.createElement("canvas");
  tex.width = tex.height = SIZE;
  const g = tex.getContext("2d"), rnd = random(30102002);
  for (let f = 0; f < 8; f++) for (let row = 0; row < 8; row++) { // each square: its colour, softly lit across
    const rank = 7 - row, isDark = (f + rank) % 2 === 0, base = isDark ? dark : light, x = f * T, y = row * T;
    const grad = g.createLinearGradient(x, y, x + T, y + T);
    grad.addColorStop(0, css(mix(base, WHITE, isDark ? 0.07 : 0.04)));
    grad.addColorStop(1, css(mix(base, [0, 0, 0], isDark ? 0.12 : 0.05)));
    g.fillStyle = grad; g.fillRect(x, y, T, T);
  }
  // a few long veins that cross many squares, like one real slab of marble
  for (let v = 0; v < 9; v++) {
    const sx = rnd() * SIZE, sy = -40, ex = rnd() * SIZE, ey = SIZE + 40;
    const c1x = rnd() * SIZE, c1y = rnd() * SIZE * 0.5, c2x = rnd() * SIZE, c2y = SIZE * 0.5 + rnd() * SIZE * 0.5;
    for (const [w, a] of [[14, 0.035], [4, 0.06], [1.2, 0.12 + rnd() * 0.08]]) {
      g.strokeStyle = "rgba(140,128,116," + a + ")"; g.lineWidth = w;
      g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey); g.stroke();
    }
  }
  return tex;
}

// ---------- the board ----------
export function createChess(canvas, readColours, faces) {
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, dpr = 1, last = { p: 0, yaw: 0 }, texture = null, textureKey = "";
  const images = { queen: loadImage(faces.queen, () => render(last.p, last.yaw)), king: loadImage(faces.king, () => render(last.p, last.yaw)) };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    render(last.p, last.yaw);
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  const CAMERA = 15;
  function camera(yaw, pitch, focus, zoom) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const raw = (x, y, z) => {
      const X = x * cy + z * sy, Z = -x * sy + z * cy, depth = CAMERA - (y * sp + Z * cp), k = CAMERA / depth;
      return { x: X * k, y: -(y * cp - Z * sp) * k, k, depth };
    };
    const pts = [];
    for (const sx of [-4.7, 4.7]) for (const sz of [-4.7, 4.7]) pts.push(raw(sx, 0, sz), raw(sx, -0.5, sz));
    pts.push(raw(-3.5, 1.5, -3.5), raw(3.5, 1.5, -3.5), raw(0, 1.9, -1));
    const minX = Math.min(...pts.map((q) => q.x)), maxX = Math.max(...pts.map((q) => q.x));
    const minY = Math.min(...pts.map((q) => q.y)), maxY = Math.max(...pts.map((q) => q.y));
    const scale = Math.min((width * 0.94) / (maxX - minX), (height * 0.9) / (maxY - minY));
    const ox = width / 2 - ((minX + maxX) / 2) * scale, oy = height * 0.47 - ((minY + maxY) / 2) * scale;
    const fq = raw(focus.x, focus.y, focus.z), fx = fq.x * scale + ox, fy = fq.y * scale + oy, Z = 1 + zoom * 0.75;
    return {
      cp,
      view: norm([-cp * sy, sp, cp * cy]),
      project(x, y, z) {
        const q = raw(x, y, z), px = q.x * scale + ox, py = q.y * scale + oy;
        return { x: px + zoom * (width / 2 + (px - fx) * Z - px), y: py + zoom * (height * 0.55 + (py - fy) * Z - py), k: q.k * scale * (1 + zoom * (Z - 1)), depth: q.depth };
      },
    };
  }

  const centre = (name) => { const s = square(name); return { x: s.f - 3.5, z: 3.5 - s.r }; };

  function path(pts) { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); }
  function poly(pts, fill, stroke, lw) {
    path(pts);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  // Lay the marble picture on the board in small triangles, so it follows the 3D view.
  function drawMarble(P) {
    const N = 10, SIZE = texture.width, Y = 0.06, grid = [];
    for (let i = 0; i <= N; i++) { grid.push([]); for (let j = 0; j <= N; j++) grid[i].push(P(-4 + (8 * j) / N, Y, -4 + (8 * i) / N)); }
    const tri = (s0, s1, s2, d0, d1, d2) => {
      const du1 = s1[0] - s0[0], dv1 = s1[1] - s0[1], du2 = s2[0] - s0[0], dv2 = s2[1] - s0[1], det = du1 * dv2 - du2 * dv1;
      const dx1 = d1.x - d0.x, dy1 = d1.y - d0.y, dx2 = d2.x - d0.x, dy2 = d2.y - d0.y;
      const a = (dx1 * dv2 - dx2 * dv1) / det, c = (dx2 * du1 - dx1 * du2) / det, b = (dy1 * dv2 - dy2 * dv1) / det, d = (dy2 * du1 - dy1 * du2) / det;
      const mx = (d0.x + d1.x + d2.x) / 3, my = (d0.y + d1.y + d2.y) / 3, grow = (q) => ({ x: q.x + Math.sign(q.x - mx) * 0.6, y: q.y + Math.sign(q.y - my) * 0.6 });
      ctx.save(); path([grow(d0), grow(d1), grow(d2)]); ctx.clip();
      ctx.transform(a, b, c, d, d0.x - a * s0[0] - c * s0[1], d0.y - b * s0[0] - d * s0[1]);
      ctx.drawImage(texture, 0, 0); ctx.restore();
    };
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u0 = (j / N) * SIZE, u1 = ((j + 1) / N) * SIZE, v0 = (i / N) * SIZE, v1 = ((i + 1) / N) * SIZE;
      tri([u0, v0], [u1, v0], [u1, v1], grid[i][j], grid[i][j + 1], grid[i + 1][j + 1]);
      tri([u0, v0], [u1, v1], [u0, v1], grid[i][j], grid[i + 1][j + 1], grid[i + 1][j]);
    }
  }

  function sparkle(x, y, size, alpha, colour) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = colour; ctx.beginPath();
    ctx.moveTo(x, y - size); ctx.quadraticCurveTo(x, y, x + size, y); ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y); ctx.quadraticCurveTo(x, y, x, y - size); ctx.fill(); ctx.restore();
  }

  // Put every visible face of one piece into a drawing list. mirror=true makes its reflection in the board.
  function addPiece(list, kind, level, pos, lift, scale, look, cam, mirror) {
    const shape = shapeFor(kind, level), Y = 0.06;
    const pts = shape.verts.map(([x, y, z]) => {
      const wy = lift + y * scale;
      return cam.project(pos.x + x * scale, mirror ? 2 * Y - wy : wy, pos.z + z * scale);
    });
    const half = norm([LIGHT[0] + cam.view[0], LIGHT[1] + cam.view[1], LIGHT[2] + cam.view[2]]);
    for (const q of shape.quads) {
      const seen = mirror ? [q.n[0], -q.n[1], q.n[2]] : q.n;
      if (dot(seen, cam.view) <= 0.01) continue;
      const p4 = q.idx.map((i) => pts[i]);
      const depth = (p4[0].depth + p4[1].depth + p4[2].depth + p4[3].depth) / 4;
      const colour = q.accent ? goldMetal(look.gold, q.n, cam.view, half) : look.paint(q.n, cam.view, half);
      if (mirror) {
        const fade = 0.32 * Math.pow(clamp(1 - (lift - Y + q.y * scale) / 1.5), 2);
        if (fade > 0.01) list.push({ depth, pts: p4, fill: css(colour, fade.toFixed(3)) });
      } else list.push({ depth, pts: p4, fill: css(colour) });
    }
  }

  function render(p, yaw) {
    last = { p, yaw };
    if (!width || !height) return;
    const c = readColours();
    const gold = rgb(c.her), ivory = rgb(c.his), light = rgb(c.light), dark = rgb(c.dark), edge = rgb(c.edge);
    if (textureKey !== c.light + c.dark) { texture = marble(light, dark); textureKey = c.light + c.dark; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // where the queen and the king are now
    const where = { queen: { ...centre(START.queen), hop: 0 }, king: { ...centre(START.king), hop: 0 } };
    MOVES.forEach((m, i) => {
      const t = clamp((p - moveStart(i)) / LENGTH);
      if (t <= 0) return;
      const a = centre(m.from), b = centre(m.to);
      where[m.piece] = { x: a.x + (b.x - a.x) * ease(t), z: a.z + (b.z - a.z) * ease(t), hop: Math.sin(Math.PI * t) * 0.7 };
    });
    const finale = clamp((p - 0.9) / 0.1);

    const settle = clamp(p / 0.1), close = ease(clamp((p - 0.86) / 0.12));
    const focus = { x: (where.queen.x + where.king.x) / 2, y: 0.9, z: (where.queen.z + where.king.z) / 2 };
    const cam = camera(yaw - 0.32 + (1 - clamp(p / 0.92)) * -0.5, 1.12 - settle * 0.3 - close * 0.08, focus, close);
    const P = (x, y, z) => cam.project(x, y, z);
    const half = norm([LIGHT[0] + cam.view[0], LIGHT[1] + cam.view[1], LIGHT[2] + cam.view[2]]);

    // --- a soft shadow under the whole board, so it floats above the page ---
    const under = P(0.4, -0.55, -0.2), spread = under.k * 6.4;
    ctx.save(); ctx.translate(under.x, under.y); ctx.scale(1, 0.32 + cam.cp * 0.3);
    const ug = ctx.createRadialGradient(0, 0, spread * 0.2, 0, 0, spread);
    ug.addColorStop(0, "rgba(0,0,0,0.38)"); ug.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ug; ctx.beginPath(); ctx.arc(0, 0, spread, 0, 6.2832); ctx.fill(); ctx.restore();

    // --- the lacquered frame: sides, then a bevelled top with two thin gold lines ---
    const IN = 4, OUT = 4.7, DEEP = 0.5, TOP = 0.06;
    const sides = [
      { n: [0, 0, 1], a: [-OUT, OUT], b: [OUT, OUT] }, { n: [0, 0, -1], a: [OUT, -OUT], b: [-OUT, -OUT] },
      { n: [1, 0, 0], a: [OUT, OUT], b: [OUT, -OUT] }, { n: [-1, 0, 0], a: [-OUT, -OUT], b: [-OUT, OUT] },
    ];
    sides.forEach((s) => {
      if (dot(s.n, cam.view) <= 0) return;
      const pts = [P(s.a[0], 0, s.a[1]), P(s.b[0], 0, s.b[1]), P(s.b[0], -DEEP, s.b[1]), P(s.a[0], -DEEP, s.a[1])];
      const sg = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[3].x, pts[3].y);
      sg.addColorStop(0, css(porcelain(mix(edge, WHITE, 0.08), s.n, cam.view, half))); sg.addColorStop(1, css(mix(edge, [0, 0, 0], 0.5)));
      poly(pts, sg);
      const lip = [P(s.a[0], -0.04, s.a[1]), P(s.b[0], -0.04, s.b[1])]; // a gold line just under the top edge
      ctx.strokeStyle = css(gold, 0.85); ctx.lineWidth = Math.max(1, lip[0].k * 0.025); ctx.beginPath(); ctx.moveTo(lip[0].x, lip[0].y); ctx.lineTo(lip[1].x, lip[1].y); ctx.stroke();
    });
    const frameTop = [[-OUT, -OUT, -IN, -IN, IN, -IN, OUT, -OUT, [0, 0.6, -0.8]], [OUT, -OUT, IN, -IN, IN, IN, OUT, OUT, [0.8, 0.6, 0]],
      [OUT, OUT, IN, IN, -IN, IN, -OUT, OUT, [0, 0.6, 0.8]], [-OUT, OUT, -IN, IN, -IN, -IN, -OUT, -OUT, [-0.8, 0.6, 0]]];
    frameTop.forEach((f) => poly([P(f[0], 0, f[1]), P(f[2], TOP, f[3]), P(f[4], TOP, f[5]), P(f[6], 0, f[7])], css(porcelain(mix(edge, WHITE, 0.1), norm(f[8]), cam.view, half))));
    for (const r of [OUT - 0.14, IN + 0.06]) { // two gold lines on the frame
      const k = P(0, TOP, 0).k, y = r === IN + 0.06 ? TOP : 0.03;
      poly([P(-r, y, -r), P(r, y, -r), P(r, y, r), P(-r, y, r)], null, css(gold, 0.9), Math.max(1, k * (r === IN + 0.06 ? 0.035 : 0.02)));
    }

    // engraved gold letters a-h and numbers 1-8
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 0; i < 8; i++) {
      for (const [q, label] of [[P(i - 3.5, 0.04, 4.36), FILES[i]], [P(-4.36, 0.04, 3.5 - i), String(i + 1)]]) {
        ctx.font = "600 " + Math.max(8, q.k * 0.24).toFixed(1) + "px Fraunces, Georgia, serif";
        ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillText(label, q.x + 0.6, q.y + 0.8);
        ctx.fillStyle = css(gold, 0.95); ctx.fillText(label, q.x, q.y);
      }
    }

    // --- the marble, its spotlight, and the reflections in it ---
    const inner = [P(-IN, TOP, -IN), P(IN, TOP, -IN), P(IN, TOP, IN), P(-IN, TOP, IN)];
    drawMarble(P);
    ctx.save(); path(inner); ctx.clip();
    const spot = P(-1.2, TOP, -1.4), spotR = spot.k * 7;
    const sg = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spotR);
    sg.addColorStop(0, "rgba(255,250,235,0.2)"); sg.addColorStop(0.5, "rgba(255,250,235,0.04)"); sg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = sg; ctx.fillRect(0, 0, width, height);

    const looks = {
      gold: { gold, paint: (n, v, h) => goldMetal(gold, n, v, h) },
      goldExtra: { gold, paint: (n, v, h) => goldMetal(mix(gold, [60, 35, 10], 0.12), n, v, h) },
      ivory: { gold, paint: (n, v, h) => porcelain(ivory, n, v, h) },
    };
    const mirror = [];
    EXTRAS.forEach(([kind, sq, side]) => addPiece(mirror, kind, "low", centre(sq), TOP, 0.88, side === "gold" ? looks.goldExtra : looks.ivory, cam, true));
    addPiece(mirror, "queen", "low", where.queen, TOP + where.queen.hop, 1.12, looks.gold, cam, true);
    addPiece(mirror, "king", "low", where.king, TOP + where.king.hop, 1.12, looks.ivory, cam, true);
    mirror.sort((a, b) => b.depth - a.depth).forEach((m) => poly(m.pts, m.fill));
    ctx.restore();

    // --- the paths already walked, and the squares they arrive on ---
    ctx.lineCap = "round";
    MOVES.forEach((m, i) => {
      const t = clamp((p - moveStart(i)) / LENGTH);
      if (t <= 0) return;
      const a = centre(m.from), b = centre(m.to);
      const A = P(a.x, 0.07, a.z), B = P(a.x + (b.x - a.x) * ease(t), 0.07, a.z + (b.z - a.z) * ease(t));
      ctx.strokeStyle = c.her; ctx.globalAlpha = 0.9; ctx.lineWidth = Math.max(2, A.k * 0.08);
      ctx.setLineDash([A.k * 0.02, A.k * 0.2]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      const s = square(m.to), x0 = s.f - 4, z0 = 3 - s.r;
      poly([P(x0 + 0.08, 0.07, z0 + 0.08), P(x0 + 0.92, 0.07, z0 + 0.08), P(x0 + 0.92, 0.07, z0 + 0.92), P(x0 + 0.08, 0.07, z0 + 0.92)], css(gold, 0.16), css(gold, 0.95), Math.max(1.2, A.k * 0.035));
    });

    // --- soft contact shadows ---
    const shadow = (pos, r, lift) => {
      const s = P(pos.x + 0.08 + lift * 0.3, 0.07, pos.z - 0.06 - lift * 0.2), rr = s.k * r * (1 + lift * 0.3);
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rr);
      g.addColorStop(0, "rgba(0,0,0," + (0.5 - lift * 0.3).toFixed(3) + ")"); g.addColorStop(0.6, "rgba(0,0,0," + (0.18 - lift * 0.1).toFixed(3) + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1, cam.cp * 0.9 + 0.1); ctx.translate(-s.x, -s.y);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, rr, 0, 6.2832); ctx.fill(); ctx.restore();
    };
    EXTRAS.forEach(([, sq]) => shadow(centre(sq), 0.46, 0));
    shadow(where.queen, 0.56, where.queen.hop); shadow(where.king, 0.56, where.king.hop);

    // --- all the pieces, mixed together and drawn from far to near ---
    const list = [];
    EXTRAS.forEach(([kind, sq, side]) => addPiece(list, kind, "extra", centre(sq), TOP, 0.88, side === "gold" ? looks.goldExtra : looks.ivory, cam, false));
    addPiece(list, "queen", "hero", where.queen, TOP + where.queen.hop, 1.12, looks.gold, cam, false);
    addPiece(list, "king", "hero", where.king, TOP + where.king.hop, 1.12, looks.ivory, cam, false);

    const medallion = (kind, pos, lift, scale) => { // the face in a gold cameo, always turned towards her
      const v = cam.view, cp = P(pos.x + v[0] * 0.34, lift + 1.06 * scale + v[1] * 0.34, pos.z + v[2] * 0.34);
      list.push({ depth: cp.depth - 0.05, draw() {
        const r = cp.k * 0.25 * scale;
        if (finale > 0) {
          const halo = ctx.createRadialGradient(cp.x, cp.y, r * 0.6, cp.x, cp.y, r * 2.8);
          halo.addColorStop(0, c.glow.replace("ALPHA", String(0.6 * finale))); halo.addColorStop(1, c.glow.replace("ALPHA", "0"));
          ctx.fillStyle = halo; ctx.fillRect(cp.x - r * 3, cp.y - r * 3, r * 6, r * 6);
        }
        ctx.save(); ctx.beginPath(); ctx.arc(cp.x, cp.y, r, 0, 6.2832); ctx.fillStyle = c.paper; ctx.fill(); ctx.clip();
        const img = images[kind];
        if (img.complete && img.naturalWidth) ctx.drawImage(img, cp.x - r, cp.y - r, r * 2, r * 2);
        const glass = ctx.createLinearGradient(cp.x - r, cp.y - r, cp.x + r, cp.y + r);
        glass.addColorStop(0, "rgba(255,255,255,0.3)"); glass.addColorStop(0.4, "rgba(255,255,255,0)"); glass.addColorStop(1, "rgba(0,0,0,0.14)");
        ctx.fillStyle = glass; ctx.fillRect(cp.x - r, cp.y - r, r * 2, r * 2);
        ctx.restore();
        const ring = ctx.createLinearGradient(cp.x - r, cp.y - r, cp.x + r, cp.y + r);
        ring.addColorStop(0, css(mix(gold, WHITE, 0.6))); ring.addColorStop(0.5, c.her); ring.addColorStop(1, css(mix(gold, [0, 0, 0], 0.4)));
        ctx.beginPath(); ctx.arc(cp.x, cp.y, r * 1.06, 0, 6.2832); ctx.lineWidth = Math.max(2, r * 0.2); ctx.strokeStyle = ring; ctx.stroke();
        ctx.beginPath(); ctx.arc(cp.x, cp.y, r * 0.95, 0, 6.2832); ctx.lineWidth = Math.max(0.8, r * 0.04); ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.stroke();
      } });
      if (kind === "queen") for (let i = 0; i < 8; i++) { // pearls around her crown
        const a = (i / 8) * Math.PI * 2, pp = P(pos.x + Math.cos(a) * 0.29 * scale, lift + 1.28 * scale, pos.z + Math.sin(a) * 0.29 * scale);
        list.push({ depth: pp.depth, draw() {
          const r = pp.k * 0.05 * scale, pg = ctx.createRadialGradient(pp.x - r * 0.35, pp.y - r * 0.4, r * 0.1, pp.x, pp.y, r);
          pg.addColorStop(0, "#ffffff"); pg.addColorStop(0.45, "#f4ece0"); pg.addColorStop(1, "#9b8f84");
          ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(pp.x, pp.y, r, 0, 6.2832); ctx.fill();
        } });
      }
    };
    medallion("queen", where.queen, TOP + where.queen.hop, 1.12);
    medallion("king", where.king, TOP + where.king.hop, 1.12);

    list.sort((a, b) => b.depth - a.depth);
    ctx.lineJoin = "round";
    for (const item of list) {
      if (item.draw) { item.draw(); continue; }
      poly(item.pts, item.fill, item.fill, 0.6);
    }

    if (finale > 0) {
      const a = where.queen, b = where.king, mid = P((a.x + b.x) / 2, 1.3, (a.z + b.z) / 2);
      for (let i = 0; i < 11; i++) {
        const ang = i * 2.399, dist = (0.9 + (i % 3) * 0.55) * mid.k, rise = finale * (0.4 + (i % 4) * 0.25) * mid.k;
        const twinkle = 0.55 + 0.45 * Math.sin(finale * 9 + i * 1.7);
        sparkle(mid.x + Math.cos(ang) * dist, mid.y + Math.sin(ang) * dist * 0.55 - rise, mid.k * (0.07 + (i % 3) * 0.035), finale * twinkle, c.her);
      }
    }

    // soft edges, so a close-up never ends in a hard line
    ctx.save(); ctx.globalCompositeOperation = "destination-in";
    for (const [x1, y1, x2, y2] of [[0, 0, 0, height], [0, 0, width, 0]]) {
      const fade = ctx.createLinearGradient(x1, y1, x2, y2);
      fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(0.07, "rgba(0,0,0,1)"); fade.addColorStop(0.93, "rgba(0,0,0,1)"); fade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fade; ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  resize();
  return { render, resize };
}
