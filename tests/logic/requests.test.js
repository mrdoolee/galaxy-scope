import { requestKind, makeRequest, openZones, makeTermRequest, currentTermRequest } from '../../src/logic/requests.js';
import { makeRng } from '../../src/logic/rng.js';
import { ZONES } from '../../src/data/zones.js';
import { PLAIN_REQUEST } from '../../src/data/copy.js';
import { OBJECTS } from '../../src/data/objects.js';
import { termRequestText } from '../../src/scenes/ui/request.js';

const deck = [
  ...['a1', 'a2', 'a3', 'a4', 'a5'].map((id) => ({ id, zone: 'orion', type: 'emission' })),
  ...['b1', 'b2'].map((id) => ({ id, zone: 'taurus', type: 'open' })),
  { id: 'c1', zone: 'virgo', type: 'dark' },
];
const foundN = (n) => new Set(Array.from({ length: n }, (_, i) => `x${i}`));

describe('requestKind', () => {
  it('4장 미만 none, 4~9 picture, 10 이상 plain', () => {
    expect(requestKind(3)).toBe('none');
    expect(requestKind(4)).toBe('picture');
    expect(requestKind(9)).toBe('picture');
    expect(requestKind(10)).toBe('plain');
  });
});

describe('makeRequest', () => {
  it('4장 미만이면 null', () => {
    expect(makeRequest(foundN(3), deck, ['orion'], makeRng(1))).toBeNull();
  });

  it('대상은 같은 구역, 미발견, 최대 3개', () => {
    const f = foundN(4);
    for (let seed = 1; seed <= 20; seed++) {
      const r = makeRequest(f, deck, ['orion', 'taurus', 'virgo'], makeRng(seed));
      expect(r.kind).toBe('picture');
      expect(r.targetIds.length).toBeLessThanOrEqual(3);
      expect(r.targetIds.length).toBeGreaterThan(0);
      for (const id of r.targetIds) {
        const o = deck.find((d) => d.id === id);
        expect(o.zone).toBe(r.zoneId);
        expect(f.has(id)).toBe(false);
      }
    }
  });

  it('구역에 남은 것이 2개면 2개', () => {
    const f = new Set([...foundN(4), 'a1', 'a2', 'a3']);
    const r = makeRequest(f, deck, ['orion'], makeRng(5));
    expect(r.zoneId).toBe('orion');
    expect([...r.targetIds].sort()).toEqual(['a4', 'a5']);
  });

  it('열린 구역에 남은 것이 없으면 null', () => {
    const f = new Set([...foundN(4), 'b1', 'b2']);
    expect(makeRequest(f, deck, ['taurus'], makeRng(1))).toBeNull();
  });

  it('닫힌 구역의 카드는 고르지 않는다', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(makeRequest(foundN(4), deck, ['taurus'], makeRng(seed)).zoneId).toBe('taurus');
    }
  });

  it('같은 시드와 입력이면 같은 의뢰', () => {
    const a = makeRequest(foundN(10), deck, ['orion', 'taurus'], makeRng(9));
    const b = makeRequest(foundN(10), deck, ['orion', 'taurus'], makeRng(9));
    expect(a).toEqual(b);
    expect(a.kind).toBe('plain');
  });
});

describe('openZones', () => {
  it('7장이면 교과서 구역 4개, 8장이면 전부', () => {
    const textbook = ZONES.filter((z) => z.textbook).map((z) => z.id);
    expect(textbook).toHaveLength(4);
    expect(openZones(7, ZONES)).toEqual(textbook);
    expect(openZones(8, ZONES)).toEqual(ZONES.map((z) => z.id));
  });
});

describe('PLAIN_REQUEST', () => {
  it('다섯 종류 모두 있고 용어가 없다', () => {
    expect(Object.keys(PLAIN_REQUEST).sort()).toEqual(['dark', 'emission', 'globular', 'open', 'reflection']);
    for (const s of Object.values(PLAIN_REQUEST)) {
      for (const w of ['성운', '성단', '방출', '반사', '암흑', '산개', '구상']) expect(s).not.toContain(w);
    }
  });
});

describe('makeTermRequest (실제 자료)', () => {
  const none = new Set();
  for (const type of ['emission', 'reflection', 'dark', 'open', 'globular', 'spiral']) {
    it(`${type}: 대상은 보너스(deck: false)이고 종류가 맞으며 한 구역에 모여 있다`, () => {
      for (let seed = 1; seed <= 20; seed++) {
        const r = makeTermRequest(type, none, OBJECTS, makeRng(seed));
        expect(r.kind).toBe('term');
        expect(r.targetIds.length).toBeGreaterThan(0);
        for (const id of r.targetIds) {
          const o = OBJECTS.find((x) => x.id === id);
          expect(o.deck).toBe(false);
          expect(o.type).toBe(type);
          expect(o.zone).toBe(r.zoneId);
        }
      }
    });
  }

  it('구상 성단 의뢰에는 필수 20장의 구상 성단이 들어가지 않는다', () => {
    const deckGlobular = OBJECTS.filter((o) => o.deck && o.type === 'globular').map((o) => o.id);
    for (let seed = 1; seed <= 20; seed++) {
      const r = makeTermRequest('globular', none, OBJECTS, makeRng(seed));
      for (const id of r.targetIds) expect(deckGlobular).not.toContain(id);
    }
  });

  it('그 종류의 보너스를 다 찾았거나 없는 종류면 null', () => {
    const found = new Set(OBJECTS.filter((o) => !o.deck && o.type === 'globular').map((o) => o.id));
    expect(makeTermRequest('globular', found, OBJECTS, makeRng(1))).toBeNull();
    expect(makeTermRequest('nope', none, OBJECTS, makeRng(1))).toBeNull();
  });
});

describe('termRequestText (보너스 의뢰 문장)', () => {
  it('종류 이름 또는 외부 은하를 높임말로 부탁한다', () => {
    const byType = (type) => OBJECTS.find((o) => !o.deck && o.type === type);
    expect(termRequestText({ targetIds: [byType('emission').id] }, OBJECTS)).toBe('방출 성운을 하나 더 찾아 주세요.');
    expect(termRequestText({ targetIds: [byType('globular').id] }, OBJECTS)).toBe('구상 성단을 하나 더 찾아 주세요.');
    expect(termRequestText({ targetIds: [byType('spiral').id] }, OBJECTS)).toBe('우리은하 밖에 있는 은하를 찾아 주세요.');
  });
});

describe('currentTermRequest (실제 자료)', () => {
  const bonus = OBJECTS.filter((o) => !o.deck);

  it('앞 의뢰의 대상이 남아 있으면 그대로 이어 간다', () => {
    const a = currentTermRequest(null, new Set(), 5, OBJECTS);
    expect(currentTermRequest(a, new Set(), 5, OBJECTS)).toBe(a);
    if (a.targetIds.length > 1) {
      const part = new Set([a.targetIds[0]]);
      expect(currentTermRequest(a, part, 5, OBJECTS)).toBe(a);
    }
  });

  it('찾을 때마다 종류를 돌려 가며, 보너스를 다 찾을 때까지 매번 미발견 보너스를 겨눈다', () => {
    const found = new Set();
    const types = [];
    let req = null;
    for (let guard = 0; guard < 50; guard++) {
      req = currentTermRequest(req, found, 9, OBJECTS);
      if (!req) break;
      const o = OBJECTS.find((x) => x.id === req.targetIds[0]);
      expect(o.deck).toBe(false);
      expect(found.has(o.id)).toBe(false);
      types.push(o.type);
      found.add(o.id);
    }
    expect(found.size).toBe(bonus.length);
    expect(new Set(types.slice(0, 6)).size).toBe(6); // 처음 여섯 번은 서로 다른 종류
  });

  it('보너스를 모두 찾으면 null', () => {
    expect(currentTermRequest(null, new Set(bonus.map((o) => o.id)), 1, OBJECTS)).toBeNull();
  });

  it('같은 시드와 같은 진행이면 같은 의뢰(새로 고침해도 같다)', () => {
    const found = new Set([bonus[0].id, bonus[3].id]);
    expect(currentTermRequest(null, found, 42, OBJECTS)).toEqual(currentTermRequest(null, found, 42, OBJECTS));
  });
});
