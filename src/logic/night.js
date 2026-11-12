import { NIGHT_BASE_MS, NIGHT_PER_TARGET_MS } from '../config/balance.js';

export function nightLength(targetCount) {
  return NIGHT_BASE_MS + targetCount * NIGHT_PER_TARGET_MS;
}

// 같은 임무: 대상이 순서까지 같고 구역이 같다(종류는 보지 않는다).
const sameMission = (a, b) =>
  a.zoneId === b.zoneId && a.targetIds.length === b.targetIds.length && a.targetIds.every((id, i) => id === b.targetIds[i]);

// 임무가 바뀌면 밤을 새로 시작하고, 같은 임무면 같은 객체를 돌려준다(시간이 되돌아가지 않는다).
export function assignMission(state, request) {
  if (!request) {
    if (!state.mission && state.nightLeftMs === null && !state.dawned) return state;
    return { ...state, mission: null, nightLeftMs: null, dawned: false };
  }
  if (state.mission && sameMission(state.mission, request)) return state;
  return { ...state, mission: request, nightLeftMs: nightLength(request.targetIds.length), dawned: false };
}

// 남은 밤을 줄인다. 0에서 멈추고, 아직 시작 안 했으면(null) 그대로.
export function tickNight(state, deltaMs) {
  if (state.nightLeftMs === null || state.nightLeftMs === undefined) return state;
  return { ...state, nightLeftMs: Math.max(0, state.nightLeftMs - deltaMs) };
}

export const isDawn = (state) => !!state.mission && state.nightLeftMs === 0;

const remaining = (state, foundIds) =>
  (state.mission ? state.mission.targetIds.filter((id) => !foundIds.has(id)).length : 0);

// 해가 떴다: 다음 밤으로 넘기고, 남은 대상 수로 밤을 새로 준다. 남은 대상이 없어도 한 개 몫은 준다.
export function endDay(state, foundIds) {
  return {
    ...state,
    night: state.night + 1,
    nightLeftMs: nightLength(Math.max(1, remaining(state, foundIds))),
    dawned: true,
  };
}

export function missionDone(state, foundIds) {
  return !!state.mission && remaining(state, foundIds) === 0;
}

// 임무를 마쳤다. 해가 뜬 적이 없으면 동트기 전 완료(early). 시간이 0이어도 endDay 전이면 dawned가 false라 early다.
export function completeMission(state) {
  const early = !state.dawned;
  return {
    state: {
      ...state,
      earlyMissions: state.earlyMissions + (early ? 1 : 0),
      night: state.night + 1,
      mission: null,
      nightLeftMs: null,
      dawned: false,
    },
    early,
  };
}

// 불러온 뒤: 임무를 이미 다 찾았으면 completeMission, 해가 뜬 채 저장됐으면 endDay.
// 다 찾은 임무는 해가 뜬 것으로 치지 않는다(마지막 대상을 찾은 순간 시간이 0이었어도 동트기 전 완료).
export function resumeNight(state, foundIds) {
  if (missionDone(state, foundIds)) return completeMission(state).state;
  if (isDawn(state)) return endDay(state, foundIds);
  return state;
}
