import { existsSync, statSync } from 'node:fs';
const names = ['bg-observatory', 'eyepiece-frame', 'card-frame', 'card-back-unknown', 'agent-hq', 'bin-tray',
  'icon-zoom', 'icon-focus', 'icon-hint', 'rank-badge-1', 'rank-badge-2', 'rank-badge-3',
  'btn-plate', 'btn-plate-round', 'panel-plate',
  'icon-shutter', 'icon-star', 'icon-star-empty', 'icon-sun', 'icon-moon'].map((n) => `${n}.png`);
test.each(names)('public/art/%s 존재하고 700KB 미만', (n) => {
  expect(existsSync(`public/art/${n}`)).toBe(true);
  expect(statSync(`public/art/${n}`).size).toBeLessThan(700 * 1024);
});

test('랜딩 그림 landing-hero.jpg: 있고 500KB 미만, 가로 그림', async () => {
  expect(existsSync('public/art/landing-hero.jpg')).toBe(true);
  expect(statSync('public/art/landing-hero.jpg').size).toBeLessThan(500 * 1024);
  const meta = await sharp('public/art/landing-hero.jpg').metadata();
  expect(meta.width).toBeGreaterThan(meta.height);
});

import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const raw = async (f) => {
  const { data, info } = await sharp(`public/art/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, alpha: (x, y) => data[(y * info.width + x) * 4 + 3] };
};

describe('알파 채널', () => {
  test('eyepiece-frame: 1024x1024, 가운데 투명, 모서리 불투명', async () => {
    const e = await raw('eyepiece-frame.png');
    expect([e.w, e.h]).toEqual([1024, 1024]);
    expect(e.alpha(512, 512)).toBe(0);
    for (const [x, y] of [[0, 0], [1023, 0], [0, 1023], [1023, 1023]]) expect(e.alpha(x, y)).toBe(255);
  });

  test('card-frame 사진 창 안쪽은 전부 alpha 0', async () => {
    const m = JSON.parse(readFileSync('tools/art-manifest.json', 'utf8'));
    const a = m.assets.find((x) => x.file === 'card-frame.png');
    const { x, y, w, h } = a.window;
    const c = await raw('card-frame.png');
    const k = a.windowInset ?? 30;
    let bad = 0;
    for (let yy = y + k; yy < y + h - k; yy++) for (let xx = x + k; xx < x + w - k; xx++) if (c.alpha(xx, yy) !== 0) bad++;
    expect(bad).toBe(0);
  });

  test('card-back-unknown: 가운데 불투명, card-frame과 같은 크기', async () => {
    const b = await raw('card-back-unknown.png');
    const c = await raw('card-frame.png');
    expect(b.alpha(b.w >> 1, b.h >> 1)).toBe(255);
    expect([b.w, b.h]).toEqual([c.w, c.h]);
  });
});

describe('밤 그림 다섯 장', () => {
  const five = ['icon-shutter', 'icon-star', 'icon-star-empty', 'icon-sun', 'icon-moon'].map((n) => `${n}.png`);
  test.each(five)('%s: 256x256, 네 모서리 alpha 0', async (f) => {
    const r = await raw(f);
    expect([r.w, r.h]).toEqual([256, 256]);
    for (const [x, y] of [[0, 0], [255, 0], [0, 255], [255, 255]]) expect(r.alpha(x, y)).toBe(0);
  });

  const bbox = (r) => {
    let x0 = r.w, y0 = r.h, x1 = -1, y1 = -1;
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.alpha(x, y) > 0) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return [x0, y0, x1, y1];
  };
  test('icon-star와 icon-star-empty는 같은 자리(알파 상자 2px 이내)', async () => {
    const a = bbox(await raw('icon-star.png'));
    const b = bbox(await raw('icon-star-empty.png'));
    for (let i = 0; i < 4; i++) expect(Math.abs(a[i] - b[i])).toBeLessThanOrEqual(2);
  });
});
