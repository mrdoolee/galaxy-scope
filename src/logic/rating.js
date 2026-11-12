import { CENTER_GOOD, FOCUS_GOOD } from '../config/balance.js';

// 촬영 평가: 성공하면 1개, 천체가 시야 가운데에 가까우면 1개 더, 초점이 아주 정확하면 1개 더.
// center, focus는 카드 화면에서 무엇으로 별을 얻었는지 말할 때 쓴다.
export function captureRating(centerOffsetPx, focusError) {
  const center = centerOffsetPx <= CENTER_GOOD;
  const focus = focusError <= FOCUS_GOOD;
  return { stars: 1 + (center ? 1 : 0) + (focus ? 1 : 0), center, focus };
}

export function rateCapture(centerOffsetPx, focusError) {
  return captureRating(centerOffsetPx, focusError).stars;
}

// 카드 한 장의 별점을 저장한다. 이미 있으면 바꾸지 않고(같은 객체), 값은 1~3으로 자른다.
export function recordRating(state, id, stars) {
  const ratings = state.ratings ?? {};
  if (ratings[id] !== undefined) return state;
  const clamped = Math.min(3, Math.max(1, Math.round(Number(stars)) || 1));
  return { ...state, ratings: { ...ratings, [id]: clamped } };
}
