// 카드 한 장을 찍은 순간의 반영: 찾은 목록, 별점, 임무 완료를 한 번에. Phaser에 의존하지 않는다.
import { recordFind } from './save.js';
import { recordBonusFind } from './bonus.js';
import { recordRating } from './rating.js';
import { missionDone, completeMission } from './night.js';

/**
 * recordCapture(state, { id, stars, bonus, deckIds }) -> { state, done, early, complete }
 *   done:     이 카드로 임무를 마쳤다(completeMission을 여기서 한 번 한다. 임무가 비므로 뒤에 settleMission이 다시 세지 않는다)
 *   early:    동트기 전 완료(endDay 전이면 밤 시간이 0이어도 참)
 *   complete: 필수 카드를 다 모아 묶기 단계가 되었다
 * 보너스 관측에서는 찾은 목록에만 넣는다(별점은 보여 주기만 하고 저장하지 않는다, 임무·단계는 그대로).
 */
export function recordCapture(state, { id, stars, bonus, deckIds }) {
  if (bonus) return { state: recordBonusFind(state, id), done: false, early: false, complete: false };
  const found = recordRating(recordFind(state, id, deckIds), id, stars);
  const complete = found.phase === 'sort';
  if (!missionDone(found, new Set(found.foundIds))) return { state: found, done: false, early: false, complete };
  const { state: next, early } = completeMission(found);
  return { state: next, done: true, early, complete };
}
