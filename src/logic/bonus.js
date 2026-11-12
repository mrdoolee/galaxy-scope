// 보너스 관측 규칙. Phaser에 의존하지 않는다.

// 결과 화면의 "보너스 관측": 결과 단계는 그대로 두고 보너스만 연다(결과를 잃지 않는다).
export function openBonus(state) {
  if (state.phase !== 'result' || state.bonusOpen) return state;
  return { ...state, bonusOpen: true };
}

// 지금 보너스 관측 중인가.
export const inBonus = (state) => state.phase === 'result' && state.bonusOpen === true;

// 보너스 천체 하나를 찾았다. foundIds에는 넣지만 단계는 바꾸지 않는다(필수 카드 수와 섞이지 않게).
export function recordBonusFind(state, id) {
  if (state.foundIds.includes(id)) return state;
  return { ...state, foundIds: [...state.foundIds, id] };
}

// { found, total }: 보너스 천체(deck: false) 중 찾은 수.
export function bonusProgress(state, objects) {
  const found = new Set(state.foundIds);
  const bonus = objects.filter((o) => !o.deck);
  return { found: bonus.filter((o) => found.has(o.id)).length, total: bonus.length };
}
