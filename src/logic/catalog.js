// 도감 등록 화면의 순서와 별자리별 묶음. Phaser에 의존하지 않는다.
import { TYPES } from '../data/objects.js';
import { ZONE_MIN_RATIO, ZONE_GROUP_LIMIT } from '../config/balance.js';

// 종류 순서(방출, 반사, 암흑, 산개, 구상)로 모은다. 같은 종류 안에서는 받은 순서.
export function registryOrder(cards) {
  return cards
    .map((o, i) => ({ o, i }))
    .sort((a, b) => TYPES.indexOf(a.o.type) - TYPES.indexOf(b.o.type) || a.i - b.i)
    .map((x) => x.o);
}

// "같은 별자리 방향에 보여도 거리는 서로 달라요" 화면의 별자리 묶음. 별자리 안은 가까운 것부터.
// 두 장 이상 등록된 별자리마다 거리 비율(가장 먼 것 / 가장 가까운 것)을 재어, 비율이 큰 순서로
// minRatio 이상인 것만 limit개까지 고른다. 하나도 없으면 비율이 가장 큰 별자리 하나를 보인다.
// -> [{ zone, cards, ratio }]
export function zoneGroups(cards, zones, { minRatio = ZONE_MIN_RATIO, limit = ZONE_GROUP_LIMIT } = {}) {
  const groups = zones
    .map((zone) => ({ zone, cards: cards.filter((o) => o.zone === zone.id).sort((a, b) => a.distanceLy - b.distanceLy) }))
    .filter((g) => g.cards.length >= 2)
    .map((g) => ({ ...g, ratio: g.cards[g.cards.length - 1].distanceLy / g.cards[0].distanceLy }))
    .sort((a, b) => b.ratio - a.ratio);
  const wide = groups.filter((g) => g.ratio >= minRatio);
  return (wide.length > 0 ? wide : groups.slice(0, 1)).slice(0, limit);
}
