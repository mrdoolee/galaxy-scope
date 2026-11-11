import { layoutZone } from '../../src/logic/layout.js';
import { makeRng } from '../../src/logic/rng.js';
import { ZONE_W, ZONE_H, EDGE_MARGIN, MIN_GAP } from '../../src/config/balance.js';

const ids = (n) => Array.from({ length: n }, (_, i) => 'o' + i);

function expectValid(result, n) {
  expect(result).toHaveLength(n);
  for (const p of result) {
    expect(p.x).toBeGreaterThanOrEqual(EDGE_MARGIN);
    expect(p.x).toBeLessThanOrEqual(ZONE_W - EDGE_MARGIN);
    expect(p.y).toBeGreaterThanOrEqual(EDGE_MARGIN);
    expect(p.y).toBeLessThanOrEqual(ZONE_H - EDGE_MARGIN);
  }
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      expect(Math.hypot(result[i].x - result[j].x, result[i].y - result[j].y)).toBeGreaterThanOrEqual(MIN_GAP);
    }
  }
}

test('makeRng은 0 이상 1 미만이고 시드가 같으면 같은 수열', () => {
  const a = makeRng(7), b = makeRng(7);
  for (let i = 0; i < 50; i++) {
    const v = a();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
    expect(v).toBe(b());
  }
});

test('5개 천체: 개수, 가장자리 안쪽, 최소 거리', () => {
  const r = layoutZone(['a', 'b', 'c', 'd', 'e'], makeRng(1));
  expectValid(r, 5);
  expect(r.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
});

test('같은 시드면 같은 결과', () => {
  expect(layoutZone(ids(5), makeRng(3))).toEqual(layoutZone(ids(5), makeRng(3)));
});

test('다른 시드면 다른 결과', () => {
  expect(layoutZone(ids(5), makeRng(1))).not.toEqual(layoutZone(ids(5), makeRng(2)));
});

test('빈 배열이면 빈 배열', () => {
  expect(layoutZone([], makeRng(1))).toEqual([]);
});

test('0~9개 모두 유효하고, 9개는 여러 시드에서도 유효', () => {
  for (let n = 0; n <= 9; n++) expectValid(layoutZone(ids(n), makeRng(11)), n);
  for (let s = 1; s <= 40; s++) expectValid(layoutZone(ids(9), makeRng(s)), 9);
});

test('격자 대체 배치도 유효하다 (항상 실패하는 난수)', () => {
  // 항상 같은 값을 내는 난수는 모든 천체를 한 점에 놓으려 하므로 무작위 배치가 실패한다
  for (let n = 2; n <= 9; n++) expectValid(layoutZone(ids(n), () => 0.5), n);
});
