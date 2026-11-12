import { registryOrder, zoneGroups } from '../../src/logic/catalog.js';
import { OBJECTS, TYPES } from '../../src/data/objects.js';
import { ZONES } from '../../src/data/zones.js';
import { ZONE_GROUP_LIMIT, ZONE_MIN_RATIO } from '../../src/config/balance.js';

const deck = OBJECTS.filter((o) => o.deck);

describe('registryOrder', () => {
  it('찾은 카드 20장을 종류 순서로 모은다', () => {
    const order = registryOrder(deck);
    expect(order).toHaveLength(20);
    const typeIdx = order.map((o) => TYPES.indexOf(o.type));
    expect(typeIdx).toEqual([...typeIdx].sort((a, b) => a - b));
  });
});

describe('zoneGroups (실제 자료)', () => {
  it('별자리 안은 가까운 것부터, 그 별자리 카드만', () => {
    for (const g of zoneGroups(deck, ZONES)) {
      expect(g.cards.length).toBeGreaterThanOrEqual(2);
      const d = g.cards.map((c) => c.distanceLy);
      expect(d).toEqual([...d].sort((a, b) => a - b));
      expect(g.cards.every((c) => c.zone === g.zone.id)).toBe(true);
    }
  });

  it('"거리는 서로 달라요" 화면에는 거리 차가 큰 별자리만, 차가 큰 순서로: 전갈자리, 궁수자리', () => {
    const groups = zoneGroups(deck, ZONES);
    expect(groups.map((g) => g.zone.id)).toEqual(['scorpius', 'sagittarius']);
    // 오리온자리(1,300~1,400)와 뱀주인자리(500~600)는 거리가 비슷해 보여 빠진다.
    for (const g of groups) {
      expect(g.ratio).toBeGreaterThanOrEqual(ZONE_MIN_RATIO);
      const d = g.cards.map((c) => c.distanceLy);
      expect(g.ratio).toBeCloseTo(Math.max(...d) / Math.min(...d));
    }
    expect(groups[0].ratio).toBeGreaterThan(groups[1].ratio);
    expect(ZONE_MIN_RATIO).toBe(1.5);
  });

  it('구역별 화면(2×2 칸, 칸마다 4장까지)에 들어간다', () => {
    const groups = zoneGroups(deck, ZONES);
    expect(groups.length).toBeLessThanOrEqual(ZONE_GROUP_LIMIT);
    for (const g of groups) expect(g.cards.length).toBeLessThanOrEqual(4);
  });
});

describe('zoneGroups (규칙)', () => {
  const zones = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, nameKo: id }));
  const card = (zone, distanceLy) => ({ id: `${zone}${distanceLy}`, zone, distanceLy });

  it('거리 비율이 큰 순서로 늘어놓고, 기준(1.5) 미만은 뺀다', () => {
    const cards = [card('a', 100), card('a', 140), card('b', 100), card('b', 300), card('c', 100), card('c', 1000), card('d', 50)];
    expect(zoneGroups(cards, zones).map((g) => g.zone.id)).toEqual(['c', 'b']);
  });

  it('기준을 넘는 별자리가 없으면 비율이 가장 큰 별자리 하나만', () => {
    const cards = [card('a', 100), card('a', 120), card('b', 100), card('b', 140), card('c', 100), card('c', 110)];
    const groups = zoneGroups(cards, zones);
    expect(groups.map((g) => g.zone.id)).toEqual(['b']);
  });

  it('두 장 이상인 별자리가 없으면 빈 목록', () => {
    expect(zoneGroups([card('a', 100), card('b', 900)], zones)).toEqual([]);
  });

  it(`보여 줄 별자리 수는 limit(기본 ${ZONE_GROUP_LIMIT})까지`, () => {
    const cards = zones.flatMap((z, i) => [card(z.id, 100), card(z.id, 200 + i * 100)]);
    expect(zoneGroups(cards, zones)).toHaveLength(ZONE_GROUP_LIMIT);
    expect(zoneGroups(cards, zones).map((g) => g.zone.id)).toEqual(['f', 'e', 'd', 'c']);
    expect(zoneGroups(cards, zones, { limit: 2 })).toHaveLength(2);
    expect(ZONE_GROUP_LIMIT).toBe(4);
  });
});
