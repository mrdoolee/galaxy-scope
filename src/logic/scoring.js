import { SCORE, HINT_MULT, RANKS, DECK_CARDS } from '../config/balance.js';

// 필수 카드를 다 모았는가(full 보너스).
export const isFull = (found) => found >= DECK_CARDS;

export function stageScore(cardCount, hintLevel, wrongSubmits) {
  const raw = cardCount * SCORE.sortCard * HINT_MULT[hintLevel] + wrongSubmits * SCORE.wrongSubmit;
  return Math.max(0, Math.round(raw));
}

export function totalScore({ found, stages, typesRegistered }) {
  let total = found * SCORE.find;
  for (const s of stages) total += stageScore(s.cardCount, s.hintLevel, s.wrongSubmits);
  if (typesRegistered === 5) total += SCORE.allTypes;
  if (isFull(found)) total += SCORE.full;
  return total;
}

export function rankFor(score) {
  const sorted = [...RANKS].sort((a, b) => b.min - a.min);
  return (sorted.find((r) => score >= r.min) ?? sorted[sorted.length - 1]).name;
}
