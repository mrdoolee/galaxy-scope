import { requestKind, makeRequest, openZones } from '../../src/logic/requests.js';
import { makeRng } from '../../src/logic/rng.js';
import { ZONES } from '../../src/data/zones.js';
import { PLAIN_REQUEST } from '../../src/data/copy.js';

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
