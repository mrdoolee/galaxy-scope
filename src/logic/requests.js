import { FREE_UNTIL, PICTURE_UNTIL, UNLOCK_ALL_AT, REQUEST_SIZE } from '../config/balance.js';
import { makeRng, seedFor } from './rng.js';

export function requestKind(foundCount) {
  if (foundCount < FREE_UNTIL) return 'none';
  if (foundCount < PICTURE_UNTIL) return 'picture';
  return 'plain';
}

// 열린 구역 중 아직 못 찾은 카드가 있는 구역 하나를 고르고, 그 구역에서 최대 REQUEST_SIZE개를 뽑는다.
export function makeRequest(foundIds, deck, openZoneIds, rng) {
  const kind = requestKind(foundIds.size);
  if (kind === 'none') return null;
  const unfound = deck.filter((o) => !foundIds.has(o.id));
  const zoneIds = openZoneIds.filter((z) => unfound.some((o) => o.zone === z));
  if (zoneIds.length === 0) return null;
  const zoneId = zoneIds[Math.floor(rng() * zoneIds.length)];
  const pool = unfound.filter((o) => o.zone === zoneId);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { kind, zoneId, targetIds: pool.slice(0, REQUEST_SIZE).map((o) => o.id) };
}

export function openZones(foundCount, zones) {
  return zones.filter((z) => z.textbook || foundCount >= UNLOCK_ALL_AT).map((z) => z.id);
}

// 지금 보여 줄 의뢰. 앞 의뢰의 대상이 남아 있고 의뢰 종류가 그대로면 이어 가고,
// 아니면 판 시드와 찾은 수로 새로 뽑는다(새로 고침해도 같은 의뢰가 나온다).
export function currentRequest(prev, foundIds, seed, deck, openZoneIds) {
  const kind = requestKind(foundIds.size);
  if (prev && prev.kind === kind && prev.targetIds.some((id) => !foundIds.has(id))) return prev;
  return makeRequest(foundIds, deck, openZoneIds, makeRng(seedFor(seed, `request:${foundIds.size}`)));
}

// ── 보너스 용어 의뢰: 필수 20장 밖(deck: false)에서 아직 못 찾은 천체를 종류로 지정한다.
// 대상은 그 종류의 미발견 보너스 천체가 있는 구역 하나에서, 그 구역의 것을 최대 REQUEST_SIZE개.
export function makeTermRequest(type, foundIds, objects, rng) {
  const pool = objects.filter((o) => !o.deck && o.type === type && !foundIds.has(o.id));
  if (pool.length === 0) return null;
  const zoneIds = [...new Set(pool.map((o) => o.zone))];
  const zoneId = zoneIds[Math.floor(rng() * zoneIds.length)];
  return { kind: 'term', zoneId, targetIds: pool.filter((o) => o.zone === zoneId).slice(0, REQUEST_SIZE).map((o) => o.id) };
}

// 보너스 의뢰가 돌아가며 다루는 종류: 다섯 종류와 외부 은하(spiral).
export const TERM_TYPES = ['emission', 'reflection', 'dark', 'open', 'globular', 'spiral'];

// 지금 보여 줄 보너스 의뢰. 앞 의뢰의 대상이 남아 있으면 이어 가고, 아니면 아직 남은 종류를 돌아가며 낸다
// (마지막으로 찾은 종류의 다음 차례를 내고 판 시드로 구역을 뽑으므로 새로 고침해도 같다). 다 찾았으면 null.
export function currentTermRequest(prev, foundIds, seed, objects) {
  if (prev && prev.kind === 'term' && prev.targetIds.some((id) => !foundIds.has(id))) return prev;
  const left = TERM_TYPES.filter((t) => objects.some((o) => !o.deck && o.type === t && !foundIds.has(o.id)));
  if (left.length === 0) return null;
  // 마지막으로 찾은 보너스 천체의 종류 다음 차례부터, 아직 남은 첫 종류(찾은 순서는 Set의 삽입 순서).
  const bonusById = new Map(objects.filter((o) => !o.deck).map((o) => [o.id, o]));
  const lastFound = [...foundIds].filter((id) => bonusById.has(id)).pop();
  const start = lastFound ? TERM_TYPES.indexOf(bonusById.get(lastFound).type) + 1 : 0;
  const bonusFound = [...foundIds].filter((id) => bonusById.has(id)).length;
  const type = Array.from({ length: TERM_TYPES.length }, (_, i) => TERM_TYPES[(start + i) % TERM_TYPES.length]).find((t) => left.includes(t));
  return makeTermRequest(type, foundIds, objects, makeRng(seedFor(seed, `term:${bonusFound}`)));
}
