import { existsSync, statSync } from 'node:fs';
const names = ['bg-observatory', 'eyepiece-frame', 'card-frame', 'card-back-unknown', 'agent-hq', 'bin-tray',
  'icon-zoom', 'icon-focus', 'icon-hint', 'rank-badge-1', 'rank-badge-2', 'rank-badge-3'].map((n) => `${n}.png`);
test.each(names)('public/art/%s 존재하고 700KB 미만', (n) => {
  expect(existsSync(`public/art/${n}`)).toBe(true);
  expect(statSync(`public/art/${n}`).size).toBeLessThan(700 * 1024);
});
