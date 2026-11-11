// Dev-time only. NOT part of the game bundle.
//   node --env-file=.env tools/gen-art.mjs [file ...] [--force]
// Reads OPENAI_API_KEY and OPENAI_IMAGE_MODEL from process.env only; never prints the key.
// Skips files that already exist in public/art unless --force is given.
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
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

async function main() {
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
    await img.png({ compressionLevel: 9, ...(a.palette ? { palette: true, quality: 92, effort: 10 } : {}) }).toFile(resolve(outDir, a.file));
    console.log(`wrote ${a.file}`);
  }));
  console.log(`done (${todo.length} requested, model ${model})`);
}
main().catch((e) => { console.error(`error: ${redact(e.message, process.env.OPENAI_API_KEY)}`); process.exit(1); });
