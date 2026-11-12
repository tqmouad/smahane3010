// A small 3D chessboard drawn on a canvas, with no 3D library.
// Her queen and his king walk towards each other, one move for each moment of the story.
// The scroll gives a number p from 0 to 1; render(p) draws the board for that moment.

const FILES = "abcdefgh";
const square = (name) => ({ f: FILES.indexOf(name[0]), r: Number(name[1]) - 1 }); // file 0-7, rank 0-7

// The game. Squares are named the chess way: a-h from left to right, 1-8 from near to far.
export const START = { queen: "d8", king: "e1" };
export const MOVES = [
  { piece: "queen", from: "d8", to: "d5" },
  { piece: "king", from: "e1", to: "e2" },
  { piece: "queen", from: "d5", to: "d4" },
  { piece: "king", from: "e2", to: "e3" },
  { piece: "queen", from: "d4", to: "e4" },
];
export const notation = (move, i) => (move.piece === "queen" ? "Q" : "K") + move.to + (i === MOVES.length - 1 ? "#" : "");

// When each move happens along the scroll (0 to 1).
const FIRST = 0.12, STEP = 0.17, LENGTH = 0.13;
export const moveStart = (i) => FIRST + i * STEP;
export function activeMove(p) { // -1 before the first move
  if (p < FIRST) return -1;
  return Math.min(MOVES.length - 1, Math.floor((p - FIRST) / STEP + 0.001));
}

// Piece shapes: half-width and height, in squares. Each piece has a stem and a round head that holds a face.
const STEM = [[0.44, 0], [0.44, 0.09], [0.34, 0.16], [0.21, 0.36], [0.17, 0.62], [0.28, 0.72], [0.23, 0.84]];
const PIECES = {
  queen: { stem: STEM, head: 1.22, headR: 0.43 },
  king: { stem: STEM.map(([r, h]) => [r, h * 1.06]), head: 1.3, headR: 0.45 },
};

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function hexToRgb(hex) {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
function mix(a, b, t) { // two #rrggbb colours, t from 0 to 1
  const x = hexToRgb(a), y = hexToRgb(b);
  return "rgb(" + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",") + ")";
}

function loadImage(src, done) {
  const img = new Image();
  img.onload = done;
  img.src = src;
  return img;
}

export function createChess(canvas, readColours, faces) {
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, dpr = 1;
  let last = { p: 0, yaw: 0 };
  const images = {
    queen: loadImage(faces.queen, () => render(last.p, last.yaw)),
    king: loadImage(faces.king, () => render(last.p, last.yaw)),
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    render(last.p, last.yaw);
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  // ----- a camera that looks down at the board -----
  const CAMERA = 16;
  function camera(yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const raw = (x, y, z) => {
      const X = x * cy + z * sy, Z = -x * sy + z * cy;
      const depth = CAMERA - (y * sp + Z * cp);
      const k = CAMERA / depth;
      return { x: X * k, y: -(y * cp - Z * sp) * k, k, depth };
    };
    // Fit the board into the canvas for this angle: measure it, then scale and centre it.
    const pts = [];
    for (const sx of [-4.5, 4.5]) for (const sz of [-4.5, 4.5]) { pts.push(raw(sx, 0, sz), raw(sx, -0.45, sz)); }
    pts.push(raw(-1, 2.4, -3.5), raw(1, 2.4, -3.5));
    const minX = Math.min(...pts.map((q) => q.x)), maxX = Math.max(...pts.map((q) => q.x));
    const minY = Math.min(...pts.map((q) => q.y)), maxY = Math.max(...pts.map((q) => q.y));
    const scale = Math.min((width * 0.96) / (maxX - minX), (height * 0.96) / (maxY - minY));
    const ox = width / 2 - ((minX + maxX) / 2) * scale, oy = height / 2 - ((minY + maxY) / 2) * scale;
    return { cp, project(x, y, z) { const q = raw(x, y, z); return { x: q.x * scale + ox, y: q.y * scale + oy, k: q.k * scale, depth: q.depth }; } };
  }

  const centre = (name) => { const s = square(name); return { x: s.f - 3.5, z: 3.5 - s.r }; }; // rank 1 is near the viewer

  function polygon(points, fill, stroke, lineWidth) {
    ctx.beginPath();
    points.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth || 1; ctx.stroke(); }
  }

  function sparkle(x, y, size, alpha, colour) { // a small four-point star
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(x, y - size); ctx.quadraticCurveTo(x, y, x + size, y); ctx.quadraticCurveTo(x, y, x, y + size);
    ctx.quadraticCurveTo(x, y, x - size, y); ctx.quadraticCurveTo(x, y, x, y - size);
    ctx.fill();
    ctx.restore();
  }

  function drawPiece(kind, cam, pos, hop, c, glow) {
    const def = PIECES[kind];
    const base = cam.project(pos.x, hop, pos.z);
    const k = base.k, ky = k * cam.cp; // sideways size, and up-and-down size
    const main = kind === "queen" ? c.her : c.his;
    // the stem: one shape, lit from the left
    ctx.beginPath();
    def.stem.forEach(([r, h], i) => (i ? ctx.lineTo(base.x + r * k, base.y - h * ky) : ctx.moveTo(base.x + r * k, base.y - h * ky)));
    for (let i = def.stem.length - 1; i >= 0; i--) ctx.lineTo(base.x - def.stem[i][0] * k, base.y - def.stem[i][1] * ky);
    ctx.closePath();
    const g = ctx.createLinearGradient(base.x - 0.44 * k, 0, base.x + 0.44 * k, 0);
    g.addColorStop(0, mix(main, "#ffffff", 0.45));
    g.addColorStop(0.45, main);
    g.addColorStop(1, mix(main, c.ink, 0.55));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(1, k * 0.045);
    ctx.strokeStyle = c.ink;
    ctx.lineJoin = "round";
    ctx.stroke();
    // a thin ring where the stem meets the head
    const hx = base.x, hy = base.y - def.head * ky, hr = def.headR * k;
    if (glow > 0) { // the finale: a soft glow behind the head
      const halo = ctx.createRadialGradient(hx, hy, hr * 0.6, hx, hy, hr * 2.6);
      halo.addColorStop(0, c.glow.replace("ALPHA", String(0.55 * glow)));
      halo.addColorStop(1, c.glow.replace("ALPHA", "0"));
      ctx.fillStyle = halo;
      ctx.fillRect(hx - hr * 3, hy - hr * 3, hr * 6, hr * 6);
    }
    // the crown or the cross, drawn behind the face
    ctx.fillStyle = c.her;
    ctx.strokeStyle = c.ink;
    ctx.lineWidth = Math.max(1, k * 0.04);
    if (kind === "queen") {
      for (const a of [-62, -31, 0, 31, 62]) {
        const t = (a * Math.PI) / 180, ux = Math.sin(t), uy = -Math.cos(t);
        const bx = hx + ux * hr * 1.02, by = hy + uy * hr * 1.02, w = 0.11 * k;
        ctx.beginPath();
        ctx.moveTo(bx - uy * w, by + ux * w);
        ctx.lineTo(bx + ux * 0.3 * k, by + uy * 0.3 * k);
        ctx.lineTo(bx + uy * w, by - ux * w);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(bx + ux * 0.36 * k, by + uy * 0.36 * k, 0.065 * k, 0, 6.2832); ctx.fill(); ctx.stroke();
      }
    } else {
      const bar = 0.07 * k, top = hy - hr * 1.02;
      ctx.beginPath(); ctx.rect(hx - bar, top - 0.5 * k, bar * 2, 0.52 * k); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(hx - 0.22 * k, top - 0.36 * k, 0.44 * k, bar * 2); ctx.fill(); ctx.stroke();
    }
    // the face in a gold ring
    ctx.save();
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 6.2832);
    ctx.fillStyle = c.paper; ctx.fill();
    ctx.clip();
    const img = images[kind];
    if (img.complete && img.naturalWidth) ctx.drawImage(img, hx - hr, hy - hr, hr * 2, hr * 2);
    ctx.restore();
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 6.2832);
    ctx.lineWidth = Math.max(2, k * 0.12); ctx.strokeStyle = c.her; ctx.stroke();
    ctx.lineWidth = Math.max(1, k * 0.035); ctx.strokeStyle = c.ink;
    ctx.beginPath(); ctx.arc(hx, hy, hr + k * 0.06, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, hy, hr - k * 0.06, 0, 6.2832); ctx.stroke();
  }

  function render(p, yaw) {
    last = { p, yaw };
    if (!width || !height) return;
    const c = readColours();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const settle = clamp(p / 0.1); // at the start the board leans back, then settles
    const cam = camera(yaw + (1 - clamp(p / 0.92)) * -0.5, 1.28 - settle * 0.32);
    const P = (x, y, z) => cam.project(x, y, z);

    // the board's thick edge, then its top
    const edge = 4.5, deep = 0.45;
    const corner = (sx, sy, sz) => P(sx * edge, sy, sz * edge);
    polygon([corner(-1, 0, 1), corner(1, 0, 1), corner(1, -deep, 1), corner(-1, -deep, 1)], c.edge);
    polygon([corner(-1, 0, -1), corner(-1, 0, 1), corner(-1, -deep, 1), corner(-1, -deep, -1)], mix(c.edge, "#000000", 0.25));
    polygon([corner(1, 0, -1), corner(1, 0, 1), corner(1, -deep, 1), corner(1, -deep, -1)], mix(c.edge, "#000000", 0.25));
    polygon([corner(-1, 0, -1), corner(1, 0, -1), corner(1, 0, 1), corner(-1, 0, 1)], c.edge, c.her, 1.5);

    const done = new Set();
    MOVES.forEach((m, i) => { if (p >= moveStart(i) + 0.02) done.add(m.from); });
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const x0 = f - 4, z0 = 3 - r;
        const tile = [P(x0, 0, z0), P(x0 + 1, 0, z0), P(x0 + 1, 0, z0 + 1), P(x0, 0, z0 + 1)];
        polygon(tile, (f + r) % 2 === 0 ? c.dark : c.light);
      }
    }
    // the path each piece has walked, drawn as a glowing line on the board
    ctx.lineCap = "round";
    MOVES.forEach((m, i) => {
      const t = clamp((p - moveStart(i)) / LENGTH);
      if (t <= 0) return;
      const a = centre(m.from), b = centre(m.to);
      const A = P(a.x, 0, a.z), B = P(a.x + (b.x - a.x) * ease(t), 0, a.z + (b.z - a.z) * ease(t));
      ctx.strokeStyle = c.her; ctx.globalAlpha = 0.9; ctx.lineWidth = Math.max(2, A.k * 0.1);
      ctx.setLineDash([A.k * 0.02, A.k * 0.2]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      const s = square(m.to), x0 = s.f - 4, z0 = 3 - s.r; // the square she or he arrives on glows
      polygon([P(x0 + 0.06, 0, z0 + 0.06), P(x0 + 0.94, 0, z0 + 0.06), P(x0 + 0.94, 0, z0 + 0.94), P(x0 + 0.06, 0, z0 + 0.94)], null, c.her, Math.max(1.5, A.k * 0.06));
    });

    // where each piece is now
    const where = { queen: { ...centre(START.queen), hop: 0 }, king: { ...centre(START.king), hop: 0 } };
    MOVES.forEach((m, i) => {
      const t = clamp((p - moveStart(i)) / LENGTH);
      if (t <= 0) return;
      const a = centre(m.from), b = centre(m.to);
      where[m.piece] = { x: a.x + (b.x - a.x) * ease(t), z: a.z + (b.z - a.z) * ease(t), hop: Math.sin(Math.PI * t) * 0.75 };
    });
    const finale = clamp((p - 0.9) / 0.1);

    // the one in the back is drawn first
    const order = ["queen", "king"].sort((a, b) => P(where[b].x, 0, where[b].z).depth - P(where[a].x, 0, where[a].z).depth);
    order.forEach((kind) => { // soft shadow on the board
      const w = where[kind], s = P(w.x, 0, w.z);
      ctx.fillStyle = "rgba(0,0,0," + (0.3 - w.hop * 0.18).toFixed(3) + ")";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.k * 0.46, s.k * 0.46 * cam.cp, 0, 0, 6.2832);
      ctx.fill();
    });
    order.forEach((kind) => drawPiece(kind, cam, where[kind], where[kind].hop, c, finale));

    if (finale > 0) { // a few stars rise around the two of them
      const a = where.queen, b = where.king, mid = P((a.x + b.x) / 2, 1.1, (a.z + b.z) / 2);
      for (let i = 0; i < 9; i++) {
        const ang = i * 2.399, dist = (0.9 + (i % 3) * 0.55) * mid.k, rise = finale * (0.4 + (i % 4) * 0.25) * mid.k;
        const twinkle = 0.55 + 0.45 * Math.sin(finale * 9 + i * 1.7);
        sparkle(mid.x + Math.cos(ang) * dist, mid.y + Math.sin(ang) * dist * 0.55 - rise, mid.k * (0.07 + (i % 3) * 0.035), finale * twinkle, c.her);
      }
    }
  }

  resize();
  return { render, resize };
}
