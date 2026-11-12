import { newGame } from '../../src/logic/save.js';
import { rateCapture, captureRating, recordRating } from '../../src/logic/rating.js';

describe('rateCapture', () => {
  it('중심과 초점 두 가지로 1~3개', () => {
    expect(rateCapture(80, 0.07)).toBe(1);
    expect(rateCapture(30, 0.07)).toBe(2);
    expect(rateCapture(80, 0.02)).toBe(2);
    expect(rateCapture(30, 0.02)).toBe(3);
  });
  it('경계값은 좋은 쪽', () => {
    expect(rateCapture(35, 0.03)).toBe(3);
    expect(rateCapture(35.1, 0.031)).toBe(1);
  });
});

describe('captureRating', () => {
  it('별 수와 함께 무엇으로 별을 더 얻었는지 알려 준다(rateCapture와 같은 수)', () => {
    expect(captureRating(30, 0.02)).toEqual({ stars: 3, center: true, focus: true });
    expect(captureRating(30, 0.07)).toEqual({ stars: 2, center: true, focus: false });
    expect(captureRating(80, 0.02)).toEqual({ stars: 2, center: false, focus: true });
    expect(captureRating(80, 0.07)).toEqual({ stars: 1, center: false, focus: false });
    for (const [c, f] of [[35, 0.03], [35.1, 0.031], [0, 0], [200, 0.08]]) expect(captureRating(c, f).stars).toBe(rateCapture(c, f));
  });
});

describe('recordRating', () => {
  it('원래 상태를 바꾸지 않고 새 상태를 돌려준다', () => {
    const s = newGame(1);
    const t = recordRating(s, 'a', 2);
    expect(t.ratings).toEqual({ a: 2 });
    expect(s.ratings).toEqual({});
  });
  it('이미 평가가 있으면 그대로(같은 객체)', () => {
    const t = recordRating(newGame(1), 'a', 2);
    expect(recordRating(t, 'a', 3)).toBe(t);
  });
  it('1~3 밖의 값은 1~3으로 자른다', () => {
    expect(recordRating(newGame(1), 'a', 5).ratings.a).toBe(3);
    expect(recordRating(newGame(1), 'a', 0).ratings.a).toBe(1);
    expect(recordRating(newGame(1), 'a', -2).ratings.a).toBe(1);
  });
});
