import { registryOrder, zoneGroups } from '../../src/logic/catalog.js';
import { OBJECTS, TYPES } from '../../src/data/objects.js';
import { ZONES } from '../../src/data/zones.js';

const deck = OBJECTS.filter((o) => o.deck);

describe('registryOrder', () => {
  it('찾은 카드 20장을 종류 순서로 모은다', () => {
    const order = registryOrder(deck);
    expect(order).toHaveLength(20);
    const typeIdx = order.map((o) => TYPES.indexOf(o.type));
    expect(typeIdx).toEqual([...typeIdx].sort((a, b) => a - b));
  });
});

describe('zoneGroups', () => {
  it('두 장 이상 등록된 별자리만, 별자리 안은 가까운 것부터', () => {
    const groups = zoneGroups(deck, ZONES);
    for (const g of groups) {
      expect(g.cards.length).toBeGreaterThanOrEqual(2);
      const d = g.cards.map((c) => c.distanceLy);
      expect(d).toEqual([...d].sort((a, b) => a - b));
      expect(g.cards.every((c) => c.zone === g.zone.id)).toBe(true);
    }
    expect(groups.map((g) => g.zone.id).sort()).toEqual(['ophiuchus', 'orion', 'sagittarius', 'scorpius']);
  });

  it('구역별 화면(2×2 칸, 칸마다 4장까지)에 들어간다', () => {
    const groups = zoneGroups(deck, ZONES);
    expect(groups.length).toBeLessThanOrEqual(4);
    for (const g of groups) expect(g.cards.length).toBeLessThanOrEqual(4);
  });

  it('같은 별자리 안에서 거리가 서로 다른 짝이 있다(오개념 바로잡기)', () => {
    const groups = zoneGroups(deck, ZONES);
    expect(groups.some((g) => new Set(g.cards.map((c) => c.distanceLy)).size > 1)).toBe(true);
  });
});
