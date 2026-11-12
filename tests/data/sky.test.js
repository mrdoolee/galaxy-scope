import { SKY } from '../../src/data/sky.js';
import { ZONES } from '../../src/data/zones.js';
import { OBJECTS } from '../../src/data/objects.js';
import { projectSky } from '../../src/logic/chart.js';
import { ZONE_W, ZONE_H, EDGE_MARGIN } from '../../src/config/balance.js';

// 묶기 전 화면에는 분류 용어가 나오면 안 된다(길잡이 이름표는 구역 훑기 화면에 보인다).
const BANNED = ['성운', '성단', '방출', '반사', '암흑', '산개', '구상'];
const inside = (p, m = 0) => p.x >= m && p.x <= ZONE_W - m && p.y >= m && p.y <= ZONE_H - m;

test('ZONES의 20개 구역 모두 하늘 자료가 있다: 별 4개 이상, 길잡이 2~5개', () => {
  expect(ZONES).toHaveLength(20);
  for (const z of ZONES) {
    const s = SKY[z.id];
    expect(s, z.id).toBeDefined();
    expect(s.stars.length, z.id).toBeGreaterThanOrEqual(4);
    expect(s.guides.length, z.id).toBeGreaterThanOrEqual(2);
    expect(s.guides.length, z.id).toBeLessThanOrEqual(5);
    expect(s.spanDeg).toBeGreaterThan(0);
  }
  expect(Object.keys(SKY).sort()).toEqual(ZONES.map((z) => z.id).sort());
});

test('선은 그 구역의 별을 잇고, 별 id는 구역 안에서 겹치지 않는다', () => {
  for (const z of ZONES) {
    const { stars, segs } = SKY[z.id];
    const ids = stars.map((st) => st.id);
    expect(new Set(ids).size, z.id).toBe(ids.length);
    expect(segs.length, z.id).toBeGreaterThanOrEqual(1);
    for (const [a, b] of segs) {
      expect(ids, `${z.id} ${a}`).toContain(a);
      expect(ids, `${z.id} ${b}`).toContain(b);
      expect(a).not.toBe(b);
    }
  }
});

test('별과 길잡이 좌표가 실제 하늘의 범위(적경 0~24시, 적위 -90~90도, 등급은 유한한 수)', () => {
  for (const z of ZONES) {
    const s = SKY[z.id];
    for (const p of [s.center, ...s.stars, ...s.guides]) {
      expect(Number.isFinite(p.ra) && p.ra >= 0 && p.ra < 24, `${z.id} ${p.id ?? p.nameKo}`).toBe(true);
      expect(Number.isFinite(p.dec) && p.dec >= -90 && p.dec <= 90, `${z.id} ${p.id ?? p.nameKo}`).toBe(true);
    }
    for (const st of s.stars) expect(Number.isFinite(st.mag), `${z.id} ${st.id}`).toBe(true);
  }
});

test('모든 별은 구역 화면 안, 길잡이는 EDGE_MARGIN / 2 안쪽에 투영된다', () => {
  for (const z of ZONES) {
    const s = SKY[z.id];
    for (const st of s.stars) expect(inside(projectSky(st.ra, st.dec, s)), `${z.id} ${st.id}`).toBe(true);
    for (const g of s.guides) expect(inside(projectSky(g.ra, g.dec, s), EDGE_MARGIN / 2), `${z.id} ${g.nameKo}`).toBe(true);
  }
});

test('모든 천체가 벌리기 전 투영에서 자기 구역 화면 안에 있다', () => {
  for (const o of OBJECTS) expect(inside(projectSky(o.ra, o.dec, SKY[o.zone])), o.id).toBe(true);
});

test('길잡이 이름에 분류 용어가 없고, 한 구역 안에서 이름이 겹치지 않는다', () => {
  for (const z of ZONES) {
    const names = SKY[z.id].guides.map((g) => g.nameKo);
    expect(new Set(names).size, z.id).toBe(names.length);
    for (const n of names) {
      expect(n.length).toBeGreaterThan(0);
      for (const w of BANNED) expect(n, `${z.id} ${n}`).not.toContain(w);
    }
  }
});

test('길잡이는 그 구역에 그리는 별 자리에 있다(이름표가 빈 하늘에 뜨지 않게)', () => {
  for (const z of ZONES) {
    const { stars, guides } = SKY[z.id];
    for (const g of guides) {
      expect(stars.some((st) => st.ra === g.ra && st.dec === g.dec), `${z.id} ${g.nameKo}`).toBe(true);
    }
  }
});

test('모든 천체에 유한한 적경(0 이상 24 미만)과 적위(-90~90)가 있다', () => {
  for (const o of OBJECTS) {
    expect(Number.isFinite(o.ra) && o.ra >= 0 && o.ra < 24, o.id).toBe(true);
    expect(Number.isFinite(o.dec) && o.dec >= -90 && o.dec <= 90, o.id).toBe(true);
  }
});
