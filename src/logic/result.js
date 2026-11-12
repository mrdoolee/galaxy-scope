// 결과 화면의 점수 내역. Phaser에 의존하지 않는다.
import { SCORE, RANKS } from '../config/balance.js';
import { nextHintLevel } from './sorting.js';
import { stageScore, totalScore, rankFor } from './scoring.js';
import { STAGE_ORDER, stageCards, foundCards, safeCount } from './sortFlow.js';

// 수습 1, 정식 2, 수석 3(rank-badge-N.png).
export function rankLevel(name) {
  const asc = [...RANKS].sort((a, b) => a.min - b.min);
  return asc.findIndex((r) => r.name === name) + 1;
}

/**
 * 저장된 상태에서 점수 내역을 낸다. cards는 덱 전체.
 * -> { found, findPoints, stages: [{ stage, cardCount, hintLevel, wrongSubmits, points }],
 *      typesRegistered, allTypesPoints, fullPoints, total, rank, rankLevel }
 */
export function scoreReport(state, cards) {
  const mine = foundCards(state, cards);
  const found = mine.length;
  const stages = STAGE_ORDER.map((stage) => {
    const wrongSubmits = safeCount(state.wrongSubmits?.[stage]);
    const hintLevel = nextHintLevel(wrongSubmits);
    const cardCount = stageCards(stage, mine).length;
    return { stage, cardCount, hintLevel, wrongSubmits, points: stageScore(cardCount, hintLevel, wrongSubmits) };
  });
  const typesRegistered = new Set(mine.map((o) => o.type)).size;
  const total = totalScore({ found, stages, typesRegistered });
  const rank = rankFor(total);
  return {
    found,
    findPoints: found * SCORE.find,
    stages,
    typesRegistered,
    allTypesPoints: typesRegistered === 5 ? SCORE.allTypes : 0,
    fullPoints: found >= 20 ? SCORE.full : 0,
    total,
    rank,
    rankLevel: rankLevel(rank),
  };
}
