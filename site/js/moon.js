// A real 3D moon: a ball with a surface map, lit from one side by the sun.
// Changing the sun's angle makes the true shape of each phase, with a soft edge between day and night.

export function createGlobe(canvas, mapUrl, tint) {
  const N = canvas.width;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const out = ctx.createImageData(N, N);
  const R = N / 2 - 2;

  // For every pixel inside the disc: which way the surface faces there.
  const count = [];
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const x = (px + 0.5 - N / 2) / R, y = -(py + 0.5 - N / 2) / R;
      const d2 = x * x + y * y;
      if (d2 >= 1.02) continue;
      const z = Math.sqrt(Math.max(0, 1 - d2));
      const edge = Math.min(1, Math.max(0, (1.02 - d2) * R * 0.5)); // soft rim
      count.push(py * N + px, x, y, z, edge);
    }
  }
  const pixels = new Float32Array(count);
  const total = pixels.length / 5;

  let map = null, mapW = 0, mapH = 0, facing = null, last = null;
  const image = new Image();
  image.onload = () => {
    const c = document.createElement("canvas");
    c.width = mapW = image.naturalWidth; c.height = mapH = image.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(image, 0, 0);
    const data = g.getImageData(0, 0, mapW, mapH).data;
    map = new Uint8Array(mapW * mapH);
    for (let i = 0; i < map.length; i++) map[i] = data[i * 4];
    facing = null;
    if (last) render(last[0], last[1]);
  };
  image.src = mapUrl;

  function texel(x, y, z) {
    const u = Math.atan2(x, z) / 6.283185307 + 0.5;
    const v = 0.5 - Math.asin(Math.max(-1, Math.min(1, y))) / 3.141592654;
    return map[Math.min(mapH - 1, (v * mapH) | 0) * mapW + (Math.min(mapW - 1, (u * mapW) | 0))];
  }

  // angle: 0 = full moon, growing = the left side stays lit while the right goes dark (a waning moon).
  // spin: turns the ball around its axis, in radians.
  function render(angle, spin) {
    last = [angle, spin];
    const lx = -Math.sin(angle), lz = Math.cos(angle);
    const cs = Math.cos(spin), sn = Math.sin(spin);
    const still = Math.abs(spin) < 0.0005;
    if (map && still && !facing) { // the face we normally see never changes, so remember it
      facing = new Uint8Array(total);
      for (let i = 0; i < total; i++) facing[i] = texel(pixels[i * 5 + 1], pixels[i * 5 + 2], pixels[i * 5 + 3]);
    }
    const d = out.data;
    for (let i = 0; i < total; i++) {
      const o = i * 5, x = pixels[o + 1], y = pixels[o + 2], z = pixels[o + 3];
      let ground = 200;
      if (map) ground = still ? facing[i] : texel(x * cs + z * sn, y, -x * sn + z * cs);
      const sun = x * lx + z * lz;
      let day = sun <= 0 ? 0 : sun >= 0.16 ? 1 : sun / 0.16;
      day = day * day * (3 - 2 * day) * (0.8 + 0.2 * Math.max(0, sun));
      const b = (0.05 + 0.95 * day) * (ground / 255) * (0.86 + 0.14 * z); // 0.05 = faint earthshine on the night side
      const k = pixels[o] * 4;
      d[k] = tint[0] * b; d[k + 1] = tint[1] * b; d[k + 2] = tint[2] * b;
      d[k + 3] = 255 * pixels[o + 4] * (day > 0.02 ? 1 : 0.55);
    }
    ctx.putImageData(out, 0, 0);
  }
  return render;
}
