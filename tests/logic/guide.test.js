import { DIRECTIONS, guideFor, zoneClues, startGuide } from '../../src/logic/guide.js';
import { chartLayout, chartGuides } from '../../src/logic/chart.js';
import { GUIDE_TEXT, DIR_KO, withRo } from '../../src/data/copy.js';
import { GUIDE_NEAR, GUIDE_MID, VIEW_RADIUS } from '../../src/config/balance.js';
import { ZONES } from '../../src/data/zones.js';
import { OBJECTS } from '../../src/data/objects.js';

const deck = OBJECTS.filter((o) => o.deck);
const bonus = OBJECTS.filter((o) => !o.deck);
const G = { nameKo: '삼태성', x: 1000, y: 500 };
// 위쪽이 0도, 시계 방향으로 커지는 각도(도)와 거리로 대상을 놓는다(화면 좌표, y는 아래로 커진다).
const at = (deg, d) => ({ x: G.x + d * Math.sin((deg * Math.PI) / 180), y: G.y - d * Math.cos((deg * Math.PI) / 180) });

describe('guideFor', () => {
  it('거리 칸: 가깝고, 조금, 멀리', () => {
    expect(guideFor({ x: 1000, y: 900 }, [G])).toEqual({ nameKo: '삼태성', dir: 'down', band: 'mid' });
    expect(guideFor({ x: 1000, y: 700 }, [G]).band).toBe('near');
    expect(guideFor({ x: 1000, y: 1300 }, [G]).band).toBe('far');
    expect(guideFor(at(0, GUIDE_NEAR - 1), [G]).band).toBe('near');
    expect(guideFor(at(0, GUIDE_NEAR + 1), [G]).band).toBe('mid');
    expect(guideFor(at(0, GUIDE_MID - 1), [G]).band).toBe('mid');
    expect(guideFor(at(0, GUIDE_MID + 1), [G]).band).toBe('far');
  });

  it('여덟 방향: 칸의 가운데와 가장자리 안쪽 몇 도', () => {
    DIRECTIONS.forEach((dir, i) => {
      for (const off of [0, -20, 20]) {
        expect(guideFor(at(i * 45 + off, 400), [G]).dir).toBe(dir);
      }
    });
  });

  it('길잡이가 둘이면 가까운 쪽, 없으면 null', () => {
    const far = { nameKo: '먼별', x: 100, y: 100 };
    expect(guideFor({ x: 1000, y: 900 }, [far, G]).nameKo).toBe('삼태성');
    expect(guideFor({ x: 1000, y: 900 }, [G, far]).nameKo).toBe('삼태성');
    expect(guideFor({ x: 1, y: 1 }, [])).toBeNull();
  });

  it('길잡이와 겹치면 위쪽, 바로 옆(NaN 없음)', () => {
    expect(guideFor({ x: G.x, y: G.y }, [G])).toEqual({ nameKo: '삼태성', dir: 'up', band: 'near' });
  });
});

describe('zoneClues', () => {
  it('31개 천체 모두 단서가 있고 방향·거리 칸이 배치와 맞는다', () => {
    let count = 0;
    for (const z of ZONES) {
      const clues = zoneClues(z.id, deck, bonus);
      const guides = chartGuides(z.id);
      for (const p of chartLayout(z.id, deck, bonus)) {
        const c = clues[p.id];
        expect(c, p.id).toBeDefined();
        const g = guides.find((x) => x.nameKo === c.nameKo);
        const d = Math.hypot(p.x - g.x, p.y - g.y);
        // 가장 가까운 길잡이인지
        expect(d).toBeLessThanOrEqual(Math.min(...guides.map((q) => Math.hypot(p.x - q.x, p.y - q.y))) + 1e-9);
        expect(guideFor(p, [g]).dir).toBe(c.dir);
        expect(c.band).toBe(d < GUIDE_NEAR ? 'near' : d < GUIDE_MID ? 'mid' : 'far');
        count++;
      }
    }
    expect(count).toBe(31);
  });

  it('단서 문장에 종류 이름이 없다', () => {
    for (const z of ZONES) {
      for (const c of Object.values(zoneClues(z.id, deck, bonus))) {
        expect(GUIDE_TEXT(c)).not.toMatch(/성운|성단|방출|반사|암흑|산개|구상/);
      }
    }
  });
});

describe('startGuide', () => {
  const minDist = (g, pts) => Math.min(...pts.map((p) => Math.hypot(p.x - g.x, p.y - g.y)));

  it('못 찾은 천체 모두에서 가장 먼(가장 가까운 천체까지가 가장 먼) 길잡이를 고른다', () => {
    const a = { nameKo: 'A', x: 100, y: 100 }, b = { nameKo: 'B', x: 1000, y: 100 }, c = { nameKo: 'C', x: 2000, y: 100 };
    const placed = [{ id: 'p', x: 150, y: 100 }, { id: 'q', x: 1900, y: 100 }];
    expect(startGuide([a, b, c], placed, new Set())).toBe(b);
    // q를 찾으면 q는 따지지 않는다: p에서 가장 먼 C
    expect(startGuide([a, b, c], placed, new Set(['q']))).toBe(c);
  });

  it('다 찾았으면 첫 길잡이, 길잡이가 없으면 null', () => {
    const a = { nameKo: 'A', x: 1, y: 1 }, b = { nameKo: 'B', x: 2, y: 2 };
    expect(startGuide([a, b], [{ id: 'p', x: 0, y: 0 }], new Set(['p']))).toBe(a);
    expect(startGuide([], [{ id: 'p', x: 0, y: 0 }], new Set())).toBeNull();
  });

  it('모든 구역에서 고른 길잡이가 최선이고, 오리온자리에서는 시작 시야에 천체가 없다', () => {
    for (const z of ZONES) {
      for (const pool of [deck, [...deck, ...bonus]]) {
        const placed = chartLayout(z.id, deck, pool === deck ? [] : bonus);
        if (placed.length === 0) continue;
        const guides = chartGuides(z.id);
        const g = startGuide(guides, placed, new Set());
        for (const other of guides) expect(minDist(g, placed)).toBeGreaterThanOrEqual(minDist(other, placed));
      }
    }
    const orion = chartLayout('orion', deck);
    const g = startGuide(chartGuides('orion'), orion, new Set());
    expect(minDist(g, orion)).toBeGreaterThan(VIEW_RADIUS);
  });
});

describe('GUIDE_TEXT', () => {
  it('세 가지 문장', () => {
    expect(GUIDE_TEXT({ nameKo: '삼태성', dir: 'down', band: 'mid' })).toBe('삼태성에서 아래로 조금 가 보세요.');
    expect(GUIDE_TEXT({ nameKo: '삼태성', dir: 'left', band: 'far' })).toBe('삼태성에서 왼쪽으로 멀리 가 보세요.');
    expect(GUIDE_TEXT({ nameKo: '삼태성', dir: 'upRight', band: 'near' })).toBe('삼태성 바로 오른쪽 위에 있어요.');
  });

  it('조사: 받침 없음·ㄹ은 "로", 그 밖은 "으로"', () => {
    expect(withRo('위')).toBe('위로');
    expect(withRo('아래')).toBe('아래로');
    expect(withRo('오른쪽')).toBe('오른쪽으로');
    expect(withRo('왼쪽 아래')).toBe('왼쪽 아래로');
    expect(withRo('길')).toBe('길로');
    expect(withRo('집')).toBe('집으로');
  });

  it('모든 방향·거리에서 문장이 만들어진다', () => {
    for (const dir of DIRECTIONS) {
      expect(DIR_KO[dir]).toBeTruthy();
      for (const band of ['near', 'mid', 'far']) expect(GUIDE_TEXT({ nameKo: '별', dir, band })).not.toMatch(/undefined/);
    }
  });
});
