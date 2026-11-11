// Dev-time only. NOT part of the game bundle.
//   node --env-file=.env tools/gen-art.mjs [file ...] [--force]
//   node tools/gen-art.mjs --postprocess   (alpha cleanup of existing files, no API call, no key needed)
// Reads OPENAI_API_KEY and OPENAI_IMAGE_MODEL from process.env only; never prints the key.
// Skips files that already exist in public/art unless --force is given.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/art');
const GEN_URL = 'https://api.openai.com/v1/images/generations';

const redact = (t, key) => {
  let s = String(t ?? '');
  if (key) s = s.split(key).join('[REDACTED]');
  return s.replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED]');
};

// Cut a centred circular hole (diameter = frac * width) by zeroing alpha inside it.
async function circleHole(buf, [w, h], frac) {
  const r = (w * frac) / 2;
  const { data } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2);
      const i = (y * w + x) * 4 + 3;
      if (d <= r - 1) data[i] = 0;
      else if (data[i] >= 240) data[i] = 255;
      if (d > r - 1 && d < r + 1) data[i] = Math.min(data[i], Math.round(((d - (r - 1)) / 2) * 255));
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } });
}

// Alpha cleanup for assets with transparency: snap >=240 to 255 and <=16 to 0 (edges keep their values),
// clear the card window, and remove isolated specks (components not touching the main opaque shape).
async function cleanAlpha(buf, a) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const al = (i) => data[i * 4 + 3];
  for (let i = 0; i < W * H; i++) {
    if (al(i) >= 240) data[i * 4 + 3] = 255;
    else if (al(i) <= 16) data[i * 4 + 3] = 0;
  }
  if (a.window) {
    const { x, y, w, h } = a.window;
    // flood-fill the low-alpha region inside the window from its centre, then clear a safe inset (beyond rounded corners)
    const seen = new Uint8Array(W * H);
    const st = [[x + (w >> 1), y + (h >> 1)]];
    while (st.length) {
      const [px, py] = st.pop();
      if (px < x || py < y || px >= x + w || py >= y + h) continue;
      const i = py * W + px;
      if (seen[i] || al(i) >= 200) continue;
      seen[i] = 1; data[i * 4 + 3] = 0;
      st.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
    const m = a.windowInset ?? 30;
    for (let yy = y + m; yy < y + h - m; yy++) for (let xx = x + m; xx < x + w - m; xx++) data[(yy * W + xx) * 4 + 3] = 0;
  }
  if (a.despeckle) {
    const comp = new Int32Array(W * H).fill(-1);
    const sizes = [];
    for (let s0 = 0; s0 < W * H; s0++) {
      if (comp[s0] >= 0 || al(s0) < 128) continue;
      const id = sizes.length; let n = 0; const st = [s0]; comp[s0] = id;
      while (st.length) {
        const i = st.pop(); n++;
        const px = i % W, py = (i / W) | 0;
        for (const [nx, ny] of [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]]) {
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx;
          if (comp[j] < 0 && al(j) >= 128) { comp[j] = id; st.push(j); }
        }
      }
      sizes.push(n);
    }
    const main = sizes.indexOf(Math.max(...sizes));
    const near = new Uint8Array(W * H); const R = 4;
    for (let i = 0; i < W * H; i++) if (comp[i] === main) {
      const px = i % W, py = (i / W) | 0;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) near[ny * W + nx] = 1;
      }
    }
    for (let i = 0; i < W * H; i++) if (!near[i]) data[i * 4 + 3] = 0;
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } });
}

const pngOpts = (a) => ({ compressionLevel: 9, ...(a.palette ? { palette: true, quality: 92, effort: 10 } : {}) });

async function main() {
  if (process.argv.includes('--postprocess')) {
    const manifest = JSON.parse(readFileSync(resolve(root, 'tools/art-manifest.json'), 'utf8'));
    for (const a of manifest.assets.filter((x) => x.transparent)) {
      const p = resolve(outDir, a.file);
      if (!existsSync(p)) continue;
      const out = await (await cleanAlpha(readFileSync(p), a)).png(pngOpts(a)).toBuffer();
      writeFileSync(p, out);
      console.log(`postprocessed ${a.file}`);
    }
    return;
  }
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  if (!key) throw new Error('OPENAI_API_KEY is not set (run: node --env-file=.env tools/gen-art.mjs)');
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter((a) => !a.startsWith('--'));
  const manifest = JSON.parse(readFileSync(resolve(root, 'tools/art-manifest.json'), 'utf8'));
  mkdirSync(outDir, { recursive: true });
  const todo = manifest.assets.filter((a) => (!only.length || only.includes(a.file)) && (force || !existsSync(resolve(outDir, a.file))));
  await Promise.all(todo.map(async (a) => {
    const body = { model, prompt: `${manifest.style} ${a.prompt}`, size: a.request_size, n: 1 };
    if (a.transparent) body.background = 'transparent';
    const res = await fetch(GEN_URL, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { console.error(`${a.file}: API ${res.status} ${redact(await res.text(), key).slice(0, 300)}`); return; }
    const b64 = (await res.json())?.data?.[0]?.b64_json;
    if (!b64) { console.error(`${a.file}: no image in response`); return; }
    let img = sharp(Buffer.from(b64, 'base64')).ensureAlpha().resize(a.size[0], a.size[1], { fit: 'fill' });
    if (a.cutHole) img = await circleHole(await img.png().toBuffer(), a.size, a.cutHole);
    if (a.transparent) img = await cleanAlpha(await img.png().toBuffer(), a);
    await img.png(pngOpts(a)).toFile(resolve(outDir, a.file));
    console.log(`wrote ${a.file}`);
  }));
  console.log(`done (${todo.length} requested, model ${model})`);
}
main().catch((e) => { console.error(`error: ${redact(e.message, process.env.OPENAI_API_KEY)}`); process.exit(1); });
