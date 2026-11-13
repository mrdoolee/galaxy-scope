import { newGame } from '../../src/logic/save.js';
import { FOCUS_TOLERANCE, FOCUS_STAR2, FOCUS_STAR3 } from '../../src/config/balance.js';
import { shotStars, recordRating } from '../../src/logic/rating.js';

describe('shotStars', () => {
  it('초점이 잘 맞으면 별 3개, 조금 흐리면 2개, 흐리면 1개', () => {
    expect(shotStars(0)).toBe(3);
    expect(shotStars(0.02)).toBe(3);
    expect(shotStars(0.07)).toBe(2);
    expect(shotStars(0.12)).toBe(1);
  });
  it('너무 어긋나면 0(촬영 실패, 다시 찍는다)', () => {
    expect(shotStars(0.2)).toBe(0);
    expect(shotStars(1)).toBe(0);
    expect(shotStars(NaN)).toBe(0);
  });
  it('경계값은 좋은 쪽으로, 오차의 부호는 보지 않는다', () => {
    expect(shotStars(FOCUS_STAR3)).toBe(3);
    expect(shotStars(FOCUS_STAR2)).toBe(2);
    expect(shotStars(FOCUS_TOLERANCE)).toBe(1);
    expect(shotStars(FOCUS_TOLERANCE + 0.001)).toBe(0);
    expect(shotStars(-0.02)).toBe(3);
    expect(FOCUS_STAR3).toBeLessThan(FOCUS_STAR2);
    expect(FOCUS_STAR2).toBeLessThan(FOCUS_TOLERANCE);
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
