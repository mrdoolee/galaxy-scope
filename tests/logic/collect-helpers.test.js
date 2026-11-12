// 수집 장면이 쓰는 작은 규칙들: 시드 파생, 초점 목표, 흐림 정도, 이어지는 의뢰.
import { seedFor } from '../../src/logic/rng.js';
import { focusTarget, focusBlur } from '../../src/logic/scan.js';
import { currentRequest } from '../../src/logic/requests.js';
import { FOCUS_TOLERANCE, FREE_UNTIL, PICTURE_UNTIL } from '../../src/config/balance.js';

describe('seedFor', () => {
  it('같은 입력이면 같은 값, 키나 시드가 다르면 다른 값', () => {
    expect(seedFor(7, 'orion')).toBe(seedFor(7, 'orion'));
    expect(seedFor(7, 'orion')).not.toBe(seedFor(7, 'taurus'));
    expect(seedFor(7, 'orion')).not.toBe(seedFor(8, 'orion'));
    expect(Number.isInteger(seedFor(7, 'orion'))).toBe(true);
    expect(seedFor(7, 'orion')).toBeGreaterThanOrEqual(0);
  });
});

describe('focusTarget', () => {
  it('0.3~0.9 사이에서 천체마다 고정', () => {
    const ids = ['m42', 'm45', 'b33', 'm13', 'm7', 'm8'];
    const values = ids.map((id) => focusTarget(5, id));
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0.3);
      expect(v).toBeLessThanOrEqual(0.9);
    }
    expect(focusTarget(5, 'm42')).toBe(values[0]);
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('눈금 시작점(0)에서는 허용 오차 밖이다', () => {
    expect(focusTarget(5, 'm42')).toBeGreaterThan(FOCUS_TOLERANCE);
  });
});

describe('focusBlur', () => {
  it('목표에서 0, 멀수록 커지고 1을 넘지 않는다', () => {
    expect(focusBlur(0.5, 0.5)).toBe(0);
    expect(focusBlur(0.6, 0.5)).toBeGreaterThan(0);
    expect(focusBlur(0.8, 0.5)).toBeGreaterThan(focusBlur(0.6, 0.5));
    expect(focusBlur(0, 0.9)).toBe(1);
  });
});

describe('currentRequest', () => {
  const deck = [
    ...['a1', 'a2', 'a3', 'a4'].map((id) => ({ id, zone: 'orion', type: 'emission' })),
    ...['b1', 'b2', 'b3'].map((id) => ({ id, zone: 'taurus', type: 'open' })),
    ...Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, zone: 'virgo', type: 'dark' })),
  ];
  const zones = ['orion', 'taurus', 'virgo'];
  const found = (...ids) => new Set(ids);

  it('의뢰가 없을 때는 null', () => {
    expect(currentRequest(null, found('x0', 'x1', 'x2'), 1, deck, zones)).toBeNull();
  });

  it('남은 대상이 있으면 같은 의뢰를 이어 간다', () => {
    const f = found('x0', 'x1', 'x2', 'x3');
    const r = currentRequest(null, f, 1, deck, zones);
    expect(r.kind).toBe('picture');
    f.add(r.targetIds[0]);
    if (r.targetIds.length > 1) expect(currentRequest(r, f, 1, deck, zones)).toBe(r);
  });

  it('대상을 다 찾으면 새 의뢰로 바뀐다', () => {
    const f = found('x0', 'x1', 'x2', 'x3');
    const r = currentRequest(null, f, 1, deck, zones);
    for (const id of r.targetIds) f.add(id);
    const next = currentRequest(r, f, 1, deck, zones);
    expect(next).not.toBe(r);
    expect(next.targetIds.some((id) => !f.has(id))).toBe(true);
  });

  it('쉬운 말 의뢰로 넘어갈 때가 되면 새 의뢰로 바뀐다', () => {
    const f = new Set(deck.slice(-PICTURE_UNTIL + 1).map((o) => o.id)); // 9장
    const r = currentRequest(null, f, 3, deck, zones);
    expect(r.kind).toBe('picture');
    const extra = deck.find((o) => !f.has(o.id) && !r.targetIds.includes(o.id));
    f.add(extra.id);
    expect(f.size).toBe(PICTURE_UNTIL);
    expect(currentRequest(r, f, 3, deck, zones).kind).toBe('plain');
  });

  it('새로 고침 뒤에도 같은 의뢰가 다시 나온다 (시드와 찾은 수가 같으면)', () => {
    const f = found('x0', 'x1', 'x2', 'x3', 'x4');
    expect(currentRequest(null, f, 9, deck, zones)).toEqual(currentRequest(null, new Set(f), 9, deck, zones));
    expect(FREE_UNTIL).toBeLessThanOrEqual(5);
  });
});
