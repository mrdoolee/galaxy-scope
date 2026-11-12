import { projectSky, chartStars, chartSegs, chartGuides, chartLayout, miniFigure } from '../../src/logic/chart.js';
import { SKY } from '../../src/data/sky.js';
import { ZONES } from '../../src/data/zones.js';
import { OBJECTS } from '../../src/data/objects.js';
import { ZONE_W, ZONE_H, EDGE_MARGIN, CHART_MIN_GAP } from '../../src/config/balance.js';

const deck = OBJECTS.filter((o) => o.deck);
const bonus = OBJECTS.filter((o) => !o.deck);
const byId = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));
const rawOf = (id, zoneId) => projectSky(byId[id].ra, byId[id].dec, SKY[zoneId]);

describe('projectSky', () => {
  it('창의 가운데는 구역 화면의 가운데', () => {
    for (const z of ZONES) {
      const s = SKY[z.id];
      expect(projectSky(s.center.ra, s.center.dec, s)).toEqual({ x: ZONE_W / 2, y: ZONE_H / 2 });
    }
  });

  it('동쪽(적경이 큰 쪽)이 왼쪽, 북쪽(적위가 큰 쪽)이 위', () => {
    for (const z of ZONES) {
      const s = SKY[z.id];
      const c = projectSky(s.center.ra, s.center.dec, s);
      expect(projectSky(s.center.ra + 0.2, s.center.dec, s).x).toBeLessThan(c.x);
      expect(projectSky(s.center.ra - 0.2, s.center.dec, s).x).toBeGreaterThan(c.x);
      expect(projectSky(s.center.ra, s.center.dec + 1, s).y).toBeLessThan(c.y);
      expect(projectSky(s.center.ra, s.center.dec - 1, s).y).toBeGreaterThan(c.y);
    }
  });

  it('가로 1도는 ZONE_W / spanDeg px, 적경 차에는 cos(가운데 적위)를 곱한다', () => {
    const s = { center: { ra: 6, dec: 60 }, spanDeg: 30 };
    const k = ZONE_W / 30;
    expect(projectSky(6, 61, s).y).toBeCloseTo(ZONE_H / 2 - k, 6);
    expect(projectSky(6 + 1 / 15, 60, s).x).toBeCloseTo(ZONE_W / 2 - k * 0.5, 6);
  });

  it('적경 0시를 넘는 창: 23.9시와 0.1시가 가운데 양쪽에 가깝게 놓인다', () => {
    for (const s of [{ center: { ra: 0, dec: -60 }, spanDeg: 30 }, SKY.tucana]) {
      const a = projectSky(23.9, s.center.dec, s);
      const b = projectSky(0.1, s.center.dec, s);
      expect(a.x).toBeGreaterThan(ZONE_W / 2);
      expect(b.x).toBeLessThan(ZONE_W / 2);
      expect(a.x - b.x).toBeLessThan(ZONE_W / 4);
    }
  });
});

describe('chartStars, chartSegs, chartGuides', () => {
  it('자료를 투영한 자리', () => {
    for (const z of ZONES) {
      const s = SKY[z.id];
      const stars = chartStars(z.id);
      expect(stars).toHaveLength(s.stars.length);
      stars.forEach((p, i) => {
        expect(p.id).toBe(s.stars[i].id);
        expect(p.mag).toBe(s.stars[i].mag);
        expect(p).toMatchObject(projectSky(s.stars[i].ra, s.stars[i].dec, s));
      });
      const at = Object.fromEntries(stars.map((p) => [p.id, { x: p.x, y: p.y }]));
      expect(chartSegs(z.id)).toEqual(s.segs.map(([a, b]) => [at[a], at[b]]));
      expect(chartGuides(z.id)).toEqual(s.guides.map((g) => ({ nameKo: g.nameKo, ...projectSky(g.ra, g.dec, s) })));
    }
  });
});

describe('chartLayout', () => {
  it('31개 천체 모두 자기 구역의 여백 안쪽, 같은 구역끼리 CHART_MIN_GAP 이상, 두 번 불러도 같다', () => {
    let total = 0;
    for (const z of ZONES) {
      const r = chartLayout(z.id, deck, bonus);
      total += r.length;
      expect(r.map((p) => p.id).sort()).toEqual(OBJECTS.filter((o) => o.zone === z.id).map((o) => o.id).sort());
      for (const p of r) {
        expect(p.x).toBeGreaterThanOrEqual(EDGE_MARGIN);
        expect(p.x).toBeLessThanOrEqual(ZONE_W - EDGE_MARGIN);
        expect(p.y).toBeGreaterThanOrEqual(EDGE_MARGIN);
        expect(p.y).toBeLessThanOrEqual(ZONE_H - EDGE_MARGIN);
      }
      for (let i = 0; i < r.length; i++) {
        for (let j = i + 1; j < r.length; j++) {
          expect(Math.hypot(r[i].x - r[j].x, r[i].y - r[j].y), `${r[i].id}-${r[j].id}`).toBeGreaterThanOrEqual(CHART_MIN_GAP);
        }
      }
      expect(chartLayout(z.id, deck, bonus)).toEqual(r);
    }
    expect(total).toBe(31);
  });

  it('필수 카드를 먼저 놓고, 보너스를 더해도 필수 카드 자리는 그대로다', () => {
    for (const z of ZONES) {
      const base = chartLayout(z.id, deck);
      expect(base.map((p) => p.id)).toEqual(deck.filter((o) => o.zone === z.id).map((o) => o.id));
      expect(chartLayout(z.id, deck, bonus).slice(0, base.length)).toEqual(base);
    }
  });

  it('방향 보존: 투영 자리의 차가 60 이상인 쌍은 벌린 뒤에도 x 순서와 y 순서가 같다', () => {
    for (const z of ZONES) {
      const r = chartLayout(z.id, deck, bonus);
      for (let i = 0; i < r.length; i++) {
        for (let j = i + 1; j < r.length; j++) {
          const a = rawOf(r[i].id, z.id), b = rawOf(r[j].id, z.id);
          const pair = `${z.id}: ${r[i].id}-${r[j].id}`;
          if (Math.abs(a.x - b.x) >= 60) expect(Math.sign(r[i].x - r[j].x), pair).toBe(Math.sign(a.x - b.x));
          if (Math.abs(a.y - b.y) >= 60) expect(Math.sign(r[i].y - r[j].y), pair).toBe(Math.sign(a.y - b.y));
        }
      }
    }
  });

  it('오리온자리: 북쪽에서 남쪽으로 M78, 말머리성운, M42', () => {
    const at = Object.fromEntries(chartLayout('orion', deck, bonus).map((p) => [p.id, p]));
    expect(at.m78.y).toBeLessThan(at.b33.y);
    expect(at.b33.y).toBeLessThan(at.m42.y);
  });

  it('구역에 없는 천체는 놓지 않는다', () => {
    expect(chartLayout('virgo', deck)).toEqual([]);
    expect(chartLayout('virgo', deck, bonus).map((p) => p.id)).toEqual(['m104']);
  });
});

describe('miniFigure', () => {
  it('모든 점이 ±44 안이고, 선의 번호가 별 범위 안이다', () => {
    for (const z of ZONES) {
      const { stars, segs } = miniFigure(z.id, 44);
      expect(stars.length).toBeGreaterThanOrEqual(2);
      expect(segs.length).toBeGreaterThanOrEqual(1);
      for (const [dx, dy] of stars) {
        expect(Math.abs(dx)).toBeLessThanOrEqual(44 + 1e-9);
        expect(Math.abs(dy)).toBeLessThanOrEqual(44 + 1e-9);
      }
      for (const [i, j] of segs) {
        expect(Number.isInteger(i) && i >= 0 && i < stars.length).toBe(true);
        expect(Number.isInteger(j) && j >= 0 && j < stars.length).toBe(true);
      }
    }
  });

  it('하늘에서 본 방향을 그대로 줄인다(오리온자리: 베텔게우스가 리겔보다 왼쪽 위)', () => {
    const s = SKY.orion;
    const { stars } = miniFigure('orion', 44);
    const used = s.stars.filter((st) => s.segs.some(([a, b]) => a === st.id || b === st.id));
    const bet = stars[used.findIndex((st) => st.id === 'betelgeuse')];
    const rig = stars[used.findIndex((st) => st.id === 'rigel')];
    expect(bet[0]).toBeLessThan(rig[0]);
    expect(bet[1]).toBeLessThan(rig[1]);
  });
});
