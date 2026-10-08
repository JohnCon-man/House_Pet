// Turns a pet photo into a small portrait plus coat colors for the virtual twin.
// Runs entirely on the device: no upload, no API.

const SIZE = 240;
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (c, t, k) => c.map((v, i) => v + (t[i] - v) * k);

function loadImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read that image')); };
    img.src = url;
  });
}

// Most common colors in the middle of the photo (where the pet usually is), grouped into coarse buckets.
function palette(ctx) {
  const x = SIZE * 0.2, y = SIZE * 0.2, w = SIZE * 0.6, h = SIZE * 0.65;
  const d = ctx.getImageData(x, y, w, h).data, buckets = new Map();
  for (let i = 0; i < d.length; i += 8) {
    const r = d[i], g = d[i + 1], b = d[i + 2], key = (r >> 5) << 6 | (g >> 5) << 3 | (b >> 5);
    const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b; buckets.set(key, e);
  }
  return [...buckets.values()].sort((a, b) => b.n - a.n).map(e => [e.r / e.n, e.g / e.n, e.b / e.n]);
}

export async function photoToPet(file, kind) {
  const img = await loadImage(file);
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
  const photo = c.toDataURL('image/jpeg', 0.8);

  const cols = palette(ctx), body = cols[0];
  // Belly: the most common color clearly lighter than the body; otherwise a lightened body color.
  const belly = cols.find(col => lum(col) > lum(body) + 35 && dist(col, body) > 60) || mix(body, [255, 248, 240], 0.55);
  const dark = lum(body) < 75;
  const colors = {
    body: hex(body),
    belly: hex(dark ? mix(belly, [140, 130, 150], 0.3) : belly),
    // Dogs' floppy ears read best a shade darker than the body; cats keep pink inner ears.
    accent: kind === 'dog' ? hex(mix(body, [40, 30, 35], 0.3)) : '#ffa9bd',
    dark,
    iris: dark ? (kind === 'cat' ? '#d4e157' : '#b07a45') : null,
  };
  return { photo, colors };
}
