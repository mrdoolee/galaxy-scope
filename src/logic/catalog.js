// 도감 등록 화면의 순서와 별자리별 묶음. Phaser에 의존하지 않는다.
import { TYPES } from '../data/objects.js';

// 종류 순서(방출, 반사, 암흑, 산개, 구상)로 모은다. 같은 종류 안에서는 받은 순서.
export function registryOrder(cards) {
  return cards
    .map((o, i) => ({ o, i }))
    .sort((a, b) => TYPES.indexOf(a.o.type) - TYPES.indexOf(b.o.type) || a.i - b.i)
    .map((x) => x.o);
}

// 두 장 이상 등록된 별자리만, 구역 목록 순서로. 별자리 안은 가까운 것부터.
export function zoneGroups(cards, zones) {
  return zones
    .map((zone) => ({ zone, cards: cards.filter((o) => o.zone === zone.id).sort((a, b) => a.distanceLy - b.distanceLy) }))
    .filter((g) => g.cards.length >= 2);
}
