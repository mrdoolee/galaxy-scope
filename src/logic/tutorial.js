// 첫 탐사 안내: 새 판에서 첫 카드를 얻을 때까지, 무엇을 할 차례인지 한 단계씩 알려 준다.
// (처음 해 본 학생이 흐릿한 얼룩이 찾는 천체라는 것을 알아보지 못했다.) Phaser에 의존하지 않는다.
import { SMUDGE_SPEED } from '../config/balance.js';

// 안내를 하는가: 모으기 단계이고 아직 한 장도 찾지 못했다. 첫 카드를 얻으면 끝난다(따로 저장하지 않는다).
export const tutorialOn = (state) => state.phase === 'collect' && state.foundIds.length === 0;

// 안내할 대상: 이 구역이 임무 구역이면 임무 순서로 아직 못 찾은 첫 천체의 자리. 다른 구역이거나 임무가 없으면 null.
export function tutorialTarget(request, zoneId, placed, foundIds) {
  if (!request || request.zoneId !== zoneId) return null;
  for (const id of request.targetIds) {
    if (foundIds.has(id)) continue;
    const p = placed.find((q) => q.id === id);
    if (p) return p;
  }
  return null;
}

/**
 * 지금 단계.
 *   shoot     확대 화면: 또렷한 순간에 촬영
 *   zoom      얼룩이 가운데 원 안에 왔다: 확대를 누른다(어느 천체든)
 *   elsewhere 임무 구역이 아니다: 지도로 돌아간다
 *   slow      너무 빨리 끈다
 *   center    대상 얼룩이 시야에 들어왔다: 가운데 원 안으로 옮긴다
 *   follow    아직 보이지 않는다: 화살표 쪽 하늘을 끌어 온다
 * 훑기·확대가 아닌 상태(카드, 낮)에서는 null.
 */
export function tutorialStep({ mode, hasTarget, speed, locked, targetVisible }) {
  if (mode === 'focus') return 'shoot';
  if (mode !== 'sweep') return null;
  if (locked) return 'zoom';
  if (!hasTarget) return 'elsewhere';
  if (speed >= SMUDGE_SPEED) return 'slow';
  return targetVisible ? 'center' : 'follow';
}
