import { CENTER_GOOD, FOCUS_GOOD } from '../config/balance.js';

// 촬영 평가: 성공하면 1개, 천체가 시야 가운데에 가까우면 1개 더, 초점이 아주 정확하면 1개 더.
export function rateCapture(centerOffsetPx, focusError) {
  return 1 + (centerOffsetPx <= CENTER_GOOD ? 1 : 0) + (focusError <= FOCUS_GOOD ? 1 : 0);
}

// 카드 한 장의 별점을 저장한다. 이미 있으면 바꾸지 않고(같은 객체), 값은 1~3으로 자른다.
export function recordRating(state, id, stars) {
  const ratings = state.ratings ?? {};
  if (ratings[id] !== undefined) return state;
  const clamped = Math.min(3, Math.max(1, Math.round(Number(stars)) || 1));
  return { ...state, ratings: { ...ratings, [id]: clamped } };
}
