// 묶기 단계의 진행 상태 바꾸기. Phaser에 의존하지 않는다.
// 모두 새 상태를 돌려주고 받은 상태는 바꾸지 않는다(저장은 장면이 한다).
import { STAGES, STAGE_ORDER, judge, nextHintLevel } from './sorting.js';
import { makeRng, seedFor } from './rng.js';
import { HIGHLIGHT_MAX } from '../config/balance.js';

export { STAGE_ORDER };

// 저장된 틀린 횟수가 이상해도(음수, 소수) 0 이상의 정수로 본다.
export const safeCount = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

// 단계별 카드: shape는 전부, nebula는 성운만, cluster는 성단만.
export function stageCards(stage, cards) {
  if (stage === 'shape') return cards;
  if (stage === 'nebula' || stage === 'cluster') return cards.filter((o) => o.group === stage);
  return [];
}

// 찾은 카드만(덱 순서). cards는 덱 전체.
export function foundCards(state, cards) {
  const found = new Set(state.foundIds);
  return cards.filter((o) => found.has(o.id));
}

// 묶기 단계에 처음 들어오면 1차부터 시작한다.
export function beginSort(state) {
  if (state.phase !== 'sort' || STAGE_ORDER.includes(state.stage)) return state;
  return { ...state, stage: STAGE_ORDER[0], placements: {} };
}

// 지금 단계 카드가 그 단계 묶음에 놓인 것만 남긴다(저장된 값은 검사되지 않았다).
export function validPlacements(state, cards) {
  const bins = STAGES[state.stage]?.bins ?? [];
  const ids = new Set(stageCards(state.stage, foundCards(state, cards)).map((o) => o.id));
  const out = {};
  for (const [id, bin] of Object.entries(state.placements ?? {})) {
    if (ids.has(id) && bins.includes(bin)) out[id] = bin;
  }
  return out;
}

// 카드 한 장을 묶음에 놓는다(bin이 null이면 꺼낸다). 옮긴 카드는 그 묶음 맨 뒤에 놓인다.
export function placeCard(state, id, bin, cards) {
  const placements = validPlacements(state, cards);
  const ids = new Set(stageCards(state.stage, foundCards(state, cards)).map((o) => o.id));
  const bins = STAGES[state.stage]?.bins ?? [];
  if (ids.has(id) && (bin === null || bins.includes(bin))) {
    delete placements[id];
    if (bin !== null) placements[id] = bin;
  }
  return { ...state, placements };
}

export function hintLevel(state) {
  if (!STAGE_ORDER.includes(state.stage)) return 0;
  return nextHintLevel(safeCount(state.wrongSubmits?.[state.stage]));
}

/**
 * 판정 버튼.
 *   incomplete: 다 놓지 않음. 상태를 바꾸지 않는다(틀린 횟수와 점수 그대로).
 *   wrong:      그 단계 틀린 횟수 +1. 놓은 카드는 그대로.
 *   correct:    다음 단계로(놓은 카드 비움). cluster 다음은 도감 등록.
 * -> { state, outcome, wrongIds, hintLevel }
 */
export function submitSort(state, cards) {
  const stage = state.stage;
  const objs = stageCards(stage, foundCards(state, cards));
  const verdict = judge(stage, validPlacements(state, cards), objs);
  if (!verdict.complete) return { state, outcome: 'incomplete', wrongIds: [], hintLevel: hintLevel(state) };
  if (!verdict.correct) {
    const wrongSubmits = { ...state.wrongSubmits, [stage]: safeCount(state.wrongSubmits?.[stage]) + 1 };
    const next = { ...state, wrongSubmits };
    return { state: next, outcome: 'wrong', wrongIds: verdict.wrongIds, hintLevel: hintLevel(next) };
  }
  const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1] ?? null;
  const next = nextStage
    ? { ...state, stage: nextStage, placements: {} }
    : { ...state, phase: 'registry', stage: null, placements: {} };
  return { state: next, outcome: 'correct', wrongIds: [], hintLevel: 0 };
}

export function finishRegistry(state) {
  return { ...state, phase: 'result' };
}

// 힌트 2단계부터 짚어 줄 어긋난 카드. 다 짚으면 찍기만으로 통과하므로 판정 한 번에 HIGHLIGHT_MAX장까지만,
// 판 시드와 단계, 그 단계의 틀린 판정 횟수로 고른다(새로 고침해도 같고, 판정할 때마다 달라질 수 있다).
export function pickHighlights(wrongIds, level, seed, stage, submitCount) {
  if (level < 2) return [];
  const rng = makeRng(seedFor(seed, `glow:${stage}:${submitCount}`));
  const out = [...wrongIds];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, HIGHLIGHT_MAX);
}

// 카드 줄 순서. 자료 순서(종류별로 모여 있다)대로 늘어놓으면 답이 드러나므로 판마다 섞는다.
// 같은 판 같은 단계면 새로 고침해도 같은 순서.
export function shuffledIds(seed, stage, ids) {
  const rng = makeRng(seedFor(seed, `sort:${stage}`));
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
