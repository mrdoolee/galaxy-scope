import { SCORE, HINT_MULT, RANKS, DECK_CARDS } from '../config/balance.js';

// 필수 카드를 다 모았는가(full 보너스).
export const isFull = (found) => found >= DECK_CARDS;

export function stageScore(cardCount, hintLevel, wrongSubmits) {
  const raw = cardCount * SCORE.sortCard * HINT_MULT[hintLevel] + wrongSubmits * SCORE.wrongSubmit;
  return Math.max(0, Math.round(raw));
}

// 별점 보너스: 필수 카드만, 별 1개를 넘는 별마다 SCORE.star. 별은 1~3으로 자른다.
export function starPoints(ratings, deckIds) {
  let total = 0;
  for (const id of deckIds) {
    const n = Number(ratings?.[id]);
    if (!Number.isFinite(n)) continue;
    total += (Math.min(3, Math.max(1, n)) - 1) * SCORE.star;
  }
  return total;
}

export function totalScore({ found, stages, typesRegistered, starBonus = 0, earlyMissions = 0 }) {
  let total = found * SCORE.find + starBonus + earlyMissions * SCORE.earlyMission;
  for (const s of stages) total += stageScore(s.cardCount, s.hintLevel, s.wrongSubmits);
  if (typesRegistered === 5) total += SCORE.allTypes;
  if (isFull(found)) total += SCORE.full;
  return total;
}

export function rankFor(score) {
  const sorted = [...RANKS].sort((a, b) => b.min - a.min);
  return (sorted.find((r) => score >= r.min) ?? sorted[sorted.length - 1]).name;
}
