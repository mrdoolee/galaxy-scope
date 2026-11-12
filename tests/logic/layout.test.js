// 구역 안 천체 배치는 tests/logic/chart.test.js가 맡는다(chartLayout).
import { mapZoneIds } from '../../src/logic/layout.js';
import { makeRng } from '../../src/logic/rng.js';

test('makeRng은 0 이상 1 미만이고 시드가 같으면 같은 수열', () => {
  const a = makeRng(7), b = makeRng(7);
  for (let i = 0; i < 50; i++) {
    const v = a();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
    expect(v).toBe(b());
  }
});

test('mapZoneIds: 천체가 있는 구역만, 구역 목록 순서대로', () => {
  const zones = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  expect(mapZoneIds([{ zone: 'c' }, { zone: 'a' }, { zone: 'c' }], zones)).toEqual(['a', 'c']);
  expect(mapZoneIds([], zones)).toEqual([]);
});
