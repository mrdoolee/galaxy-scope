// 관측 사진 내려받기: node tools/fetch-photos.mjs
// OBJECTS의 photo.sourceUrl(원본 사진)을 받아 긴 변 1600px 이하 JPEG로 줄여 public/photos/<id>.jpg에 저장한다.
// 이미 있는 파일은 건너뛴다. 하나라도 실패하면 0이 아닌 코드로 끝난다.
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { OBJECTS } from '../src/data/objects.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LONG_SIDE = 1600;

async function fetchOne(o) {
  const out = join(ROOT, 'public', o.photo.file);
  if (existsSync(out)) return 'skip';
  mkdirSync(dirname(out), { recursive: true });
  const res = await fetch(o.photo.sourceUrl, { headers: { 'User-Agent': 'galaxy-archive-photo-fetch' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${o.photo.sourceUrl}`);
  const input = Buffer.from(await res.arrayBuffer());
  // 원본 중에는 2억 화소가 넘는 것도 있어 sharp의 기본 화소 한도를 끈다.
  await sharp(input, { limitInputPixels: false })
    .resize(LONG_SIDE, LONG_SIDE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(out);
  return 'saved';
}

let failed = 0;
for (const o of OBJECTS) {
  try {
    const result = await fetchOne(o);
    console.log(`${result.padEnd(5)} ${o.id}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${o.id}: ${err.message}`);
  }
}
if (failed > 0) {
  console.error(`${failed}개 실패`);
  process.exit(1);
}
