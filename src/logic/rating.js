import { FOCUS_TOLERANCE, FOCUS_STAR2, FOCUS_STAR3 } from '../config/balance.js';

// 촬영 평가: 혼자 오가는 초점 눈금이 목표에 얼마나 가까울 때 촬영 버튼을 눌렀는가.
// 아주 또렷하면 별 3개, 조금 흐리면 2개, 흐리지만 찍혔으면 1개, 너무 어긋나면 0(촬영 실패, 다시 찍는다).
export function shotStars(focusError) {
  const e = Math.abs(focusError);
  if (!(e <= FOCUS_TOLERANCE)) return 0;
  if (e <= FOCUS_STAR3) return 3;
  if (e <= FOCUS_STAR2) return 2;
  return 1;
}

// 카드 한 장의 별점을 저장한다. 이미 있으면 바꾸지 않고(같은 객체), 값은 1~3으로 자른다.
export function recordRating(state, id, stars) {
  const ratings = state.ratings ?? {};
  if (ratings[id] !== undefined) return state;
  const clamped = Math.min(3, Math.max(1, Math.round(Number(stars)) || 1));
  return { ...state, ratings: { ...ratings, [id]: clamped } };
}
