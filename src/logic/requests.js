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
