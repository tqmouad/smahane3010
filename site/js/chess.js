// A real 3D chessboard drawn on a canvas, with no 3D library.
// Every piece is a turned shape (like wood on a lathe), lit by one light, with shine and soft shadows.
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
// "gold" is her side (far), "ivory" is his side (near).
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

// Turn a profile into a 3D shape: rings of points, and four-sided faces between them.
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
    const len = Math.hypot(r1 - r0, h1 - h0) || 1;
    const nr = (h1 - h0) / len, nh = -(r1 - r0) / len; // the outward direction of this band
    for (let s = 0; s < segments; s++) {
      const s2 = (s + 1) % segments, a = ((s + 0.5) / segments) * Math.PI * 2;
      quads.push({ idx: [j * segments + s, j * segments + s2, (j + 1) * segments + s2, (j + 1) * segments + s], n: [nr * Math.cos(a), nh, nr * Math.sin(a)] });
    }
  }
  return { verts, quads };
}
function box(cx, cy, cz, w, h, d, shape) { // add a small block (for the king's cross)
  const o = shape.verts.length, x = w / 2, y = h / 2, z = d / 2;
  for (const [a, b, c] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) shape.verts.push([cx + a * x, cy + b * y, cz + c * z]);
  const faces = [[[0, 3, 2, 1], [0, 0, -1]], [[4, 5, 6, 7], [0, 0, 1]], [[0, 4, 7, 3], [-1, 0, 0]], [[1, 2, 6, 5], [1, 0, 0]], [[3, 7, 6, 2], [0, 1, 0]], [[0, 1, 5, 4], [0, -1, 0]]];
  faces.forEach(([f, n]) => shape.quads.push({ idx: f.map((i) => i + o), n }));
}
const SHAPES = {};
function shapeFor(kind, fine) {
  const key = kind + (fine ? "+" : "");
  if (!SHAPES[key]) {
    const s = lathe(PROFILES[kind], fine ? 30 : 18);
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
const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const LIGHT = norm([-0.45, 0.85, 0.4]); // the light comes from the upper left, a little in front

function loadImage(src, done) { const img = new Image(); img.onload = done; img.src = src; return img; }

// ---------- the board ----------
export function createChess(canvas, readColours, faces) {
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, dpr = 1, last = { p: 0, yaw: 0 };
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
    const scale = Math.min((width * 0.96) / (maxX - minX), (height * 0.95) / (maxY - minY));
    const ox = width / 2 - ((minX + maxX) / 2) * scale, oy = height / 2 - ((minY + maxY) / 2) * scale;
    // At the end the camera moves closer to the two of them: zoom 0 = whole board, 1 = close up.
    const fq = raw(focus.x, focus.y, focus.z), fx = fq.x * scale + ox, fy = fq.y * scale + oy, Z = 1 + zoom * 0.75;
    return {
      cp,
      view: norm([-cp * sy, sp, cp * cy]), // the direction towards the viewer, in board space
      project(x, y, z) {
        const q = raw(x, y, z), px = q.x * scale + ox, py = q.y * scale + oy;
        return { x: px + zoom * (width / 2 + (px - fx) * Z - px), y: py + zoom * (height * 0.55 + (py - fy) * Z - py), k: q.k * scale * (1 + zoom * (Z - 1)), depth: q.depth };
      },
    };
  }

  const centre = (name) => { const s = square(name); return { x: s.f - 3.5, z: 3.5 - s.r }; };

  function poly(pts, fill, stroke, lw) {
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  function shade(base, n, view, shine) { // light on one face: soft shadow side, bright side, a white shine, a glowing rim
    const diffuse = Math.max(0, dot(n, LIGHT));
    const half = norm([LIGHT[0] + view[0], LIGHT[1] + view[1], LIGHT[2] + view[2]]);
    const spec = Math.pow(Math.max(0, dot(n, half)), 28) * shine;
    const rim = Math.pow(1 - Math.max(0, dot(n, view)), 3) * 0.35;
    const lit = 0.34 + 0.78 * diffuse + rim;
    return css(base.map((v) => v * lit + 255 * spec));
  }

  function sparkle(x, y, size, alpha, colour) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = colour; ctx.beginPath();
    ctx.moveTo(x, y - size); ctx.quadraticCurveTo(x, y, x + size, y); ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y); ctx.quadraticCurveTo(x, y, x, y - size); ctx.fill(); ctx.restore();
  }

  // Put every face of one piece into the drawing list. Far faces are drawn first.
  function addPiece(list, kind, pos, lift, scale, base, shine, cam, extras) {
    const shape = shapeFor(kind, scale > 1);
    const pts = shape.verts.map(([x, y, z]) => cam.project(pos.x + x * scale, lift + y * scale, pos.z + z * scale));
    for (const q of shape.quads) {
      if (dot(q.n, cam.view) <= 0.01) continue; // faces turned away cannot be seen
      const p4 = q.idx.map((i) => pts[i]);
      const depth = (p4[0].depth + p4[1].depth + p4[2].depth + p4[3].depth) / 4;
      list.push({ depth, pts: p4, fill: shade(base, q.n, cam.view, shine) });
    }
    if (extras) extras(list, pos, lift, scale);
  }

  function render(p, yaw) {
    last = { p, yaw };
    if (!width || !height) return;
    const c = readColours();
    const gold = rgb(c.her), ivory = rgb(c.his), ink = rgb(c.ink), light = rgb(c.light), dark = rgb(c.dark), edge = rgb(c.edge);
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

    // the camera starts low and turned, settles, and always keeps a small angle so the board looks 3D
    const settle = clamp(p / 0.1), close = ease(clamp((p - 0.86) / 0.12));
    const focus = { x: (where.queen.x + where.king.x) / 2, y: 0.9, z: (where.queen.z + where.king.z) / 2 };
    const cam = camera(yaw - 0.32 + (1 - clamp(p / 0.92)) * -0.5, 1.12 - settle * 0.3 - close * 0.08, focus, close);
    const P = (x, y, z) => cam.project(x, y, z);

    // --- the frame: thick sides, then a bevelled top with letters ---
    const IN = 4, OUT = 4.65, DEEP = 0.5;
    const sides = [
      { n: [0, 0, 1], pts: [[-OUT, OUT], [OUT, OUT]] }, { n: [0, 0, -1], pts: [[OUT, -OUT], [-OUT, -OUT]] },
      { n: [1, 0, 0], pts: [[OUT, OUT], [OUT, -OUT]] }, { n: [-1, 0, 0], pts: [[-OUT, -OUT], [-OUT, OUT]] },
    ];
    sides.forEach((s) => {
      if (dot(s.n, cam.view) <= 0) return;
      const [[x1, z1], [x2, z2]] = s.pts;
      poly([P(x1, 0, z1), P(x2, 0, z2), P(x2, -DEEP, z2), P(x1, -DEEP, z1)], shade(mixRgb(edge, [0, 0, 0], 0.15), s.n, cam.view, 0.3));
    });
    const frameTop = [[-OUT, -OUT, -IN, -IN, IN, -IN, OUT, -OUT, [0, 0.45, -0.9]], [OUT, -OUT, IN, -IN, IN, IN, OUT, OUT, [0.9, 0.45, 0]],
      [OUT, OUT, IN, IN, -IN, IN, -OUT, OUT, [0, 0.45, 0.9]], [-OUT, OUT, -IN, IN, -IN, -IN, -OUT, -OUT, [-0.9, 0.45, 0]]];
    frameTop.forEach((f) => {
      const n = norm(f[8]);
      poly([P(f[0], 0, f[1]), P(f[2], 0.06, f[3]), P(f[4], 0.06, f[5]), P(f[6], 0, f[7])], shade(edge, n, cam.view, 0.5));
    });

    // --- the 64 squares, a thin gold line around them, and a glossy shine ---
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      const x0 = f - 4, z0 = 3 - r;
      poly([P(x0, 0.06, z0), P(x0 + 1, 0.06, z0), P(x0 + 1, 0.06, z0 + 1), P(x0, 0.06, z0 + 1)], css((f + r) % 2 === 0 ? dark : light));
    }
    const inner = [P(-IN, 0.06, -IN), P(IN, 0.06, -IN), P(IN, 0.06, IN), P(-IN, 0.06, IN)];
    ctx.save();
    poly(inner, null, c.her, Math.max(1.2, inner[0].k * 0.04));
    ctx.beginPath(); inner.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.clip();
    const g = ctx.createLinearGradient(inner[0].x, inner[0].y, inner[2].x, inner[2].y);
    g.addColorStop(0, "rgba(255,255,255,0.22)"); g.addColorStop(0.45, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // letters a-h and numbers 1-8 on the frame
    ctx.fillStyle = css(gold, 0.85); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let i = 0; i < 8; i++) {
      const a = P(i - 3.5, 0.03, 4.33), b = P(-4.33, 0.03, 3.5 - i);
      ctx.font = "600 " + Math.max(8, a.k * 0.26).toFixed(1) + "px Fraunces, Georgia, serif";
      ctx.fillText(FILES[i], a.x, a.y);
      ctx.font = "600 " + Math.max(8, b.k * 0.26).toFixed(1) + "px Fraunces, Georgia, serif";
      ctx.fillText(String(i + 1), b.x, b.y);
    }

    // --- the paths already walked, and the squares they arrive on ---
    ctx.lineCap = "round";
    MOVES.forEach((m, i) => {
      const t = clamp((p - moveStart(i)) / LENGTH);
      if (t <= 0) return;
      const a = centre(m.from), b = centre(m.to);
      const A = P(a.x, 0.07, a.z), B = P(a.x + (b.x - a.x) * ease(t), 0.07, a.z + (b.z - a.z) * ease(t));
      ctx.strokeStyle = c.her; ctx.globalAlpha = 0.9; ctx.lineWidth = Math.max(2, A.k * 0.09);
      ctx.setLineDash([A.k * 0.02, A.k * 0.2]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      const s = square(m.to), x0 = s.f - 4, z0 = 3 - s.r;
      poly([P(x0 + 0.06, 0.07, z0 + 0.06), P(x0 + 0.94, 0.07, z0 + 0.06), P(x0 + 0.94, 0.07, z0 + 0.94), P(x0 + 0.06, 0.07, z0 + 0.94)], css(gold, 0.18), c.her, Math.max(1.5, A.k * 0.05));
    });


    // --- soft shadows on the board (they fall away from the light) ---
    const shadow = (pos, r, lift) => {
      const s = P(pos.x + 0.1 + lift * 0.3, 0.07, pos.z - 0.08 - lift * 0.2);
      const rr = s.k * r * (1 + lift * 0.3);
      const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rr);
      sg.addColorStop(0, "rgba(0,0,0," + (0.42 - lift * 0.25).toFixed(3) + ")"); sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.translate(s.x, s.y); ctx.scale(1, cam.cp * 0.9 + 0.1); ctx.translate(-s.x, -s.y);
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(s.x, s.y, rr, 0, 6.2832); ctx.fill(); ctx.restore();
    };
    EXTRAS.forEach(([, sq]) => shadow(centre(sq), 0.5, 0));
    shadow(where.queen, 0.6, where.queen.hop); shadow(where.king, 0.6, where.king.hop);

    // --- all the pieces, mixed together and drawn from far to near ---
    const list = [];
    EXTRAS.forEach(([kind, sq, side]) => addPiece(list, kind, centre(sq), 0.06, 0.88, side === "gold" ? mixRgb(gold, ink, 0.12) : mixRgb(ivory, ink, 0.06), side === "gold" ? 0.9 : 0.55, cam));

    const face = (kind) => (l, pos, lift, scale) => { // the round face, a pearl crown and a glow, kept facing her
      const h = 1.06 * scale, v = cam.view, centreP = P(pos.x + v[0] * 0.34, lift + h + v[1] * 0.34, pos.z + v[2] * 0.34);
      l.push({
        depth: centreP.depth - 0.05,
        draw() {
          const r = centreP.k * 0.25 * scale;
          if (finale > 0) {
            const halo = ctx.createRadialGradient(centreP.x, centreP.y, r * 0.6, centreP.x, centreP.y, r * 2.8);
            halo.addColorStop(0, c.glow.replace("ALPHA", String(0.6 * finale))); halo.addColorStop(1, c.glow.replace("ALPHA", "0"));
            ctx.fillStyle = halo; ctx.fillRect(centreP.x - r * 3, centreP.y - r * 3, r * 6, r * 6);
          }
          ctx.save(); ctx.beginPath(); ctx.arc(centreP.x, centreP.y, r, 0, 6.2832); ctx.fillStyle = c.paper; ctx.fill(); ctx.clip();
          const img = images[kind];
          if (img.complete && img.naturalWidth) ctx.drawImage(img, centreP.x - r, centreP.y - r, r * 2, r * 2);
          const gl = ctx.createLinearGradient(centreP.x - r, centreP.y - r, centreP.x + r, centreP.y + r); // glass shine
          gl.addColorStop(0, "rgba(255,255,255,0.28)"); gl.addColorStop(0.4, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,0.12)");
          ctx.fillStyle = gl; ctx.fillRect(centreP.x - r, centreP.y - r, r * 2, r * 2);
          ctx.restore();
          const ring = ctx.createLinearGradient(centreP.x - r, centreP.y - r, centreP.x + r, centreP.y + r);
          ring.addColorStop(0, css(mixRgb(gold, [255, 255, 255], 0.55))); ring.addColorStop(0.5, c.her); ring.addColorStop(1, css(mixRgb(gold, [0, 0, 0], 0.35)));
          ctx.beginPath(); ctx.arc(centreP.x, centreP.y, r, 0, 6.2832); ctx.lineWidth = Math.max(2, r * 0.18); ctx.strokeStyle = ring; ctx.stroke();
        },
      });
      if (kind === "queen") { // eight pearls around the crown
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2, pp = P(pos.x + Math.cos(a) * 0.29 * scale, lift + 1.28 * scale, pos.z + Math.sin(a) * 0.29 * scale);
          l.push({ depth: pp.depth, draw() {
            const r = pp.k * 0.05 * scale, pg = ctx.createRadialGradient(pp.x - r * 0.35, pp.y - r * 0.35, r * 0.1, pp.x, pp.y, r);
            pg.addColorStop(0, "#ffffff"); pg.addColorStop(0.5, c.her); pg.addColorStop(1, css(mixRgb(gold, [0, 0, 0], 0.4)));
            ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(pp.x, pp.y, r, 0, 6.2832); ctx.fill();
          } });
        }
      }
    };
    addPiece(list, "queen", where.queen, 0.06 + where.queen.hop, 1.12, gold, 1, cam, face("queen"));
    addPiece(list, "king", where.king, 0.06 + where.king.hop, 1.12, ivory, 0.7, cam, face("king"));

    list.sort((a, b) => b.depth - a.depth);
    ctx.lineJoin = "round";
    for (const item of list) {
      if (item.draw) { item.draw(); continue; }
      poly(item.pts, item.fill, item.fill, 0.7); // the thin edge in the same colour hides tiny gaps between faces
    }

    if (finale > 0) { // stars rise around the two of them
      const a = where.queen, b = where.king, mid = P((a.x + b.x) / 2, 1.3, (a.z + b.z) / 2);
      for (let i = 0; i < 11; i++) {
        const ang = i * 2.399, dist = (0.9 + (i % 3) * 0.55) * mid.k, rise = finale * (0.4 + (i % 4) * 0.25) * mid.k;
        const twinkle = 0.55 + 0.45 * Math.sin(finale * 9 + i * 1.7);
        sparkle(mid.x + Math.cos(ang) * dist, mid.y + Math.sin(ang) * dist * 0.55 - rise, mid.k * (0.07 + (i % 3) * 0.035), finale * twinkle, c.her);
      }
    }
  }

  resize();
  return { render, resize };
}
