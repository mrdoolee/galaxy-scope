// 관측 사진 내려받기: node tools/fetch-photos.mjs
// OBJECTS의 photo.sourceUrl(원본 사진)을 받아 긴 변 1024px 이하 JPEG(품질 78)로 줄여 public/photos/<id>.jpg에 저장한다.
// 화면에서 가장 크게 쓰는 곳이 설계 해상도 약 544px이므로 1024px이면 충분하고, 교실 기기의 내려받기와 그래픽 메모리를 아낀다.
// 원본이 더 작으면 키우지 않는다. 이미 있는 파일은 건너뛴다. 하나라도 실패하면 0이 아닌 코드로 끝난다.
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { OBJECTS } from '../src/data/objects.js';

export const PHOTO_LONG_SIDE = 1024;
export const PHOTO_QUALITY = 78;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 받은(또는 가진) 사진을 줄여 저장한다. 원본 중에는 2억 화소가 넘는 것도 있어 sharp의 기본 화소 한도를 끈다.
export function shrink(input, out) {
  return sharp(input, { limitInputPixels: false })
    .resize(PHOTO_LONG_SIDE, PHOTO_LONG_SIDE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: PHOTO_QUALITY, mozjpeg: true })
    .toFile(out);
}

async function fetchOne(o) {
  const out = join(ROOT, 'public', o.photo.file);
  if (existsSync(out)) return 'skip';
  mkdirSync(dirname(out), { recursive: true });
  const res = await fetch(o.photo.sourceUrl, { headers: { 'User-Agent': 'galaxy-archive-photo-fetch' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${o.photo.sourceUrl}`);
  await shrink(Buffer.from(await res.arrayBuffer()), out);
  return 'saved';
}

async function main() {
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
}

// 명령줄에서 실행할 때만 내려받는다(테스트가 상수를 읽으려고 불러올 때는 아무것도 하지 않는다).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
