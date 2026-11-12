// 장면 없이 로직만 이어 붙여 한 판의 수집을 흉내 낸다.
import { newGame } from '../../src/logic/save.js';
import { zoneLayout, mapZoneIds } from '../../src/logic/layout.js';
import { lockTarget, visibleSmudges } from '../../src/logic/scan.js';
import { makeRequest, openZones, currentRequest } from '../../src/logic/requests.js';
import { makeRng } from '../../src/logic/rng.js';
import { OBJECTS } from '../../src/data/objects.js';
import { ZONES } from '../../src/data/zones.js';
import { FREE_UNTIL, UNLOCK_ALL_AT } from '../../src/config/balance.js';

const deck = OBJECTS.filter((o) => o.deck);

// 지금 열려 있고 하늘 지도에 보이는 구역(필수 카드가 있는 구역)
function playableZones(foundCount) {
  const shown = new Set(mapZoneIds(deck, ZONES));
  return openZones(foundCount, ZONES).filter((id) => shown.has(id));
}

describe('한 판의 수집 흐름', () => {
  it('newGame(1)에서 20장을 모두 찾을 수 있다', () => {
    const state = newGame(1);
    const found = new Set(state.foundIds);
    const opened = [];
    let request = null;

    while (found.size < 20) {
      const n = found.size;
      opened.push(playableZones(n).length);

      // 의뢰: FREE_UNTIL 미만이면 없고, 그 뒤로는 20장을 다 찾을 때까지 늘 있다
      const r = makeRequest(found, deck, openZones(n, ZONES), makeRng(n + 1));
      if (n < FREE_UNTIL) expect(r).toBeNull();
      else expect(r).not.toBeNull();
      request = currentRequest(request, found, state.seed, deck, openZones(n, ZONES));
      if (n < FREE_UNTIL) expect(request).toBeNull();
      else expect(request.targetIds.some((id) => !found.has(id))).toBe(true);

      // 열린 구역 중 아직 남은 천체가 있는 첫 구역에 들어가 한 장을 찾는다
      const zoneId = playableZones(n).find((z) => deck.some((o) => o.zone === z && !found.has(o.id)));
      expect(zoneId).toBeDefined();
      const placed = zoneLayout(state.seed, zoneId, deck);
      const target = placed.find((p) => !found.has(p.id));
      const view = { x: target.x, y: target.y };
      expect(visibleSmudges(view, 0, placed, found)).toContain(target.id);
      expect(lockTarget(view, 0, placed, found)).toBe(target.id);
      // 빠르게 움직이면 잡히지 않는다
      expect(lockTarget(view, 1000, placed, found)).toBeNull();
      found.add(target.id);
    }

    expect(found.size).toBe(20);
    expect(makeRequest(found, deck, openZones(20, ZONES), makeRng(1))).toBeNull();
    // UNLOCK_ALL_AT(8)장째에 열린 구역이 늘어난다
    expect(opened[UNLOCK_ALL_AT - 1]).toBe(4);
    expect(opened[UNLOCK_ALL_AT]).toBeGreaterThan(4);
    expect(opened[UNLOCK_ALL_AT]).toBe(mapZoneIds(deck, ZONES).length);
  });

  it('같은 시드와 구역이면 새로 고침해도 배치가 같고, 구역마다 다르다', () => {
    const a = zoneLayout(42, 'sagittarius', deck);
    const b = zoneLayout(42, 'sagittarius', deck);
    expect(a).toEqual(b);
    expect(a.map((p) => p.id).sort()).toEqual(deck.filter((o) => o.zone === 'sagittarius').map((o) => o.id).sort());
    expect(zoneLayout(43, 'sagittarius', deck)).not.toEqual(a);
  });

  it('지도에는 필수 카드가 있는 구역만 나온다', () => {
    const ids = mapZoneIds(deck, ZONES);
    for (const id of ids) expect(deck.some((o) => o.zone === id)).toBe(true);
    expect(ids).not.toContain('virgo');
    expect(ids).toContain('orion');
  });
});
