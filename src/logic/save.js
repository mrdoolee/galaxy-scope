export const SAVE_KEY = 'galaxy-archive-save-v1';

const PHASES = ['collect', 'sort', 'registry', 'result'];
const STAGES = ['shape', 'nebula', 'cluster'];

export function newGame(seed) {
  return {
    version: 1,
    seed,
    foundIds: [],
    phase: 'collect',
    stage: null,
    placements: {},
    wrongSubmits: { shape: 0, nebula: 0, cluster: 0 },
    bonusOpen: false,
  };
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isValid(s) {
  if (!isPlainObject(s)) return false;
  if (s.version !== 1) return false;
  if (typeof s.seed !== 'number' || !Number.isFinite(s.seed)) return false;
  if (!Array.isArray(s.foundIds) || !s.foundIds.every((id) => typeof id === 'string')) return false;
  if (!PHASES.includes(s.phase)) return false;
  if (s.stage !== null && !STAGES.includes(s.stage)) return false;
  if (!isPlainObject(s.placements)) return false;
  if (!isPlainObject(s.wrongSubmits)) return false;
  for (const k of STAGES) {
    if (typeof s.wrongSubmits[k] !== 'number' || !Number.isFinite(s.wrongSubmits[k])) return false;
  }
  if (typeof s.bonusOpen !== 'boolean') return false;
  return true;
}

export function load(storage) {
  try {
    const text = storage.getItem(SAVE_KEY);
    if (text === null || text === undefined) return null;
    const state = JSON.parse(text);
    return isValid(state) ? state : null;
  } catch {
    return null;
  }
}

export function save(storage, state) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // 사생활 보호 모드 등에서 저장이 막혀도 게임은 계속된다.
  }
}

export function clear(storage) {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // 무시
  }
}

// 카드 한 장을 찾았을 때의 다음 상태. 이미 찾은 id는 무시한다.
// 필수 카드(deckSize장)를 다 모으면 묶기 단계('sort')로 넘어간다.
export function recordFind(state, id, deckSize) {
  if (state.foundIds.includes(id)) return state;
  const foundIds = [...state.foundIds, id];
  return { ...state, foundIds, phase: foundIds.length >= deckSize ? 'sort' : state.phase };
}

// 불러온 판 바로잡기: 묶기 이후 단계인데 필수 카드가 모자라면(저장을 손으로 고친 경우) 모으기로 되돌린다.
// 결과 단계가 아닌데 bonusOpen이면 끈다. 바뀐 것이 없으면 같은 객체를 돌려준다.
export function repairState(state, deckIds) {
  let next = state;
  const have = new Set(state.foundIds);
  const complete = deckIds.every((id) => have.has(id));
  if (state.phase !== 'collect' && !complete) {
    next = { ...next, phase: 'collect', stage: null, placements: {}, bonusOpen: false };
  }
  if (next.bonusOpen && next.phase !== 'result') next = { ...next, bonusOpen: false };
  return next;
}
