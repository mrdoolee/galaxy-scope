import { STAGE_ORDER as STAGES } from './sorting.js';

export const SAVE_KEY = 'galaxy-archive-save-v1';

const PHASES = ['collect', 'sort', 'registry', 'result'];

export function newGame(seed) {
  return {
    version: 1,
    seed,
    foundIds: [],
    phase: 'collect',
    stage: null,
    placements: {},
    wrongSubmits: Object.fromEntries(STAGES.map((s) => [s, 0])),
    bonusOpen: false,
    mission: null,
    night: 1,
    nightLeftMs: null,
    dawned: false,
    earlyMissions: 0,
    ratings: {},
    introSeen: false,
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

const isCount = (n, min) => Number.isInteger(n) && n >= min;
const isMission = (m) =>
  isPlainObject(m) &&
  (m.kind === 'picture' || m.kind === 'plain') &&
  typeof m.zoneId === 'string' &&
  Array.isArray(m.targetIds) &&
  m.targetIds.length >= 1 && m.targetIds.length <= 3 &&
  m.targetIds.every((id) => typeof id === 'string');
const isRatings = (r) => isPlainObject(r) && Object.values(r).every((v) => v === 1 || v === 2 || v === 3);

// 없는 항목과 이상한 값을 항목별로 기본값으로 바꾼다. 고칠 것이 없으면 같은 객체. 필수 항목은 건드리지 않는다.
export function withDefaults(state) {
  const d = newGame(state.seed);
  const patch = {};
  if (!(state.mission === null || isMission(state.mission))) patch.mission = d.mission;
  if (state.mission === undefined) patch.mission = d.mission;
  if (!isCount(state.night, 1)) patch.night = d.night;
  if (!(state.nightLeftMs === null || (typeof state.nightLeftMs === 'number' && Number.isFinite(state.nightLeftMs) && state.nightLeftMs >= 0))) {
    patch.nightLeftMs = d.nightLeftMs;
  }
  if (state.nightLeftMs === undefined) patch.nightLeftMs = d.nightLeftMs;
  if (typeof state.dawned !== 'boolean') patch.dawned = d.dawned;
  if (!isCount(state.earlyMissions, 0)) patch.earlyMissions = d.earlyMissions;
  if (!isRatings(state.ratings)) patch.ratings = {};
  if (typeof state.introSeen !== 'boolean') patch.introSeen = d.introSeen;
  return Object.keys(patch).length === 0 ? state : { ...state, ...patch };
}

export function load(storage) {
  try {
    const text = storage.getItem(SAVE_KEY);
    if (text === null || text === undefined) return null;
    const state = JSON.parse(text);
    return isValid(state) ? withDefaults(state) : null;
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

// 필수 카드(deckIds)를 모두 찾았는가. 필수 카드가 아닌 id는 세지 않는다.
const hasAll = (foundIds, deckIds) => {
  const have = new Set(foundIds);
  return deckIds.every((id) => have.has(id));
};

// 카드 한 장을 찾았을 때의 다음 상태. 이미 찾은 id는 무시한다.
// 필수 카드(deckIds)를 다 모으면 묶기 단계('sort')로 넘어간다.
export function recordFind(state, id, deckIds) {
  if (state.foundIds.includes(id)) return state;
  const foundIds = [...state.foundIds, id];
  return { ...state, foundIds, phase: hasAll(foundIds, deckIds) ? 'sort' : state.phase };
}

// 불러온 판 바로잡기: 묶기 이후 단계인데 필수 카드가 모자라면(저장을 손으로 고친 경우) 모으기로 되돌리고,
// 모으기 단계인데 필수 카드가 다 있으면 묶기로 올린다. 결과 단계가 아닌데 bonusOpen이면 끈다.
// 바뀐 것이 없으면 같은 객체를 돌려준다.
const NO_MISSION = { mission: null, nightLeftMs: null, dawned: false };

export function repairState(state, deckIds) {
  let next = state;
  const complete = hasAll(state.foundIds, deckIds);
  if (state.phase !== 'collect' && !complete) {
    next = { ...next, phase: 'collect', stage: null, placements: {}, bonusOpen: false, ...NO_MISSION };
  } else if (state.phase === 'collect' && complete) {
    next = { ...next, phase: 'sort', stage: null, placements: {}, ...NO_MISSION };
  }
  if (next.bonusOpen && next.phase !== 'result') next = { ...next, bonusOpen: false };
  return next;
}
