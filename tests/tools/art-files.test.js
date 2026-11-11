import { existsSync, statSync } from 'node:fs';
const names = ['bg-observatory', 'eyepiece-frame', 'card-frame', 'card-back-unknown', 'agent-hq', 'bin-tray',
  'icon-zoom', 'icon-focus', 'icon-hint', 'rank-badge-1', 'rank-badge-2', 'rank-badge-3'].map((n) => `${n}.png`);
test.each(names)('public/art/%s 존재하고 700KB 미만', (n) => {
  expect(existsSync(`public/art/${n}`)).toBe(true);
  expect(statSync(`public/art/${n}`).size).toBeLessThan(700 * 1024);
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
