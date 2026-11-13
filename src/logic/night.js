import { NIGHT_BASE_MS, NIGHT_PER_TARGET_MS, DAY_WAIT_MS, DAY_FADE_MS, DAY_GLOW_MS, DUSK_HOLD_MS } from '../config/balance.js';

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

// 끝난 임무를 한 번만 반영한다: 임무가 있고 대상을 다 찾았으면 completeMission(임무가 비므로 다시 불러도 두 번 세지 않는다),
// 아니면 같은 객체. 어느 장면이 먼저 알아채도 같은 결과다.
export function settleMission(state, foundIds) {
  return missionDone(state, foundIds) ? completeMission(state).state : state;
}

// 지금 밤의 전체 길이(시간 막대의 분모). 해가 뜨기 전에는 임무 대상 수로, 뜬 뒤에는 남은 대상 수로 받은 길이.
// 다음 밤에 대상을 더 찾아도 막대가 넘치지 않게 남은 시간보다 짧지 않다. 임무가 없으면 0.
export function nightTotal(state, foundIds) {
  if (!state.mission) return 0;
  const base = nightLength(state.dawned ? Math.max(1, remaining(state, foundIds)) : state.mission.targetIds.length);
  return Math.max(base, state.nightLeftMs ?? 0);
}

// 지금 밤 시계가 가야 하는가: 모으기 단계, 보너스 관측이 아님, 훑기나 초점 상태, 임무가 있음, 낮 기다림 중이 아님.
// (카드 화면·낮·보너스에서는 멈춘다. 임무 구역이 아닌 구역을 훑어도 간다.)
export function clockRuns({ phase, bonus, mode, hasMission, dayWait }) {
  return phase === 'collect' && !bonus && (mode === 'sweep' || mode === 'focus') && hasMission && !dayWait;
}

// 낮 기다림의 흐름(경과 시간 → 보이는 모습). 밤하늘 위에 세 겹을 차례로 덮는다.
//   sunrise: DAY_FADE_MS 동안 해돋이 빛이 번진다(0→1)
//   day:     이어서 DAY_GLOW_MS 동안 밝은 낮이 된다(0→1)
//   sunset:  DAY_WAIT_MS가 되기 DAY_GLOW_MS 전부터 해넘이 빛이 덮고(0→1), DAY_WAIT_MS부터 DAY_FADE_MS 동안 밤으로 사라진다(1→0)
//   light:   하늘 전체의 밝기(별과 얼룩이 이만큼 사라진다)
// 다 어두워지면 DUSK_HOLD_MS만큼 "다시 밤" 말을 보여 준 뒤 끝난다(done).
export function dayTimeline(elapsedMs) {
  const t = Math.max(0, elapsedMs);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const rise = clamp01(t / DAY_FADE_MS);
  const toDay = clamp01((t - DAY_FADE_MS) / DAY_GLOW_MS);
  const toSet = clamp01((t - (DAY_WAIT_MS - DAY_GLOW_MS)) / DAY_GLOW_MS);
  const fall = clamp01((t - DAY_WAIT_MS) / DAY_FADE_MS);
  const covered = toSet >= 1; // 해넘이 빛이 다 덮은 뒤에는 아래 두 겹을 치운다
  return {
    sunrise: covered ? 0 : rise,
    day: covered ? 0 : toDay,
    sunset: toSet * (1 - fall),
    light: Math.min(rise, 1 - fall),
    dusk: t >= DAY_WAIT_MS,
    done: t >= DAY_WAIT_MS + DAY_FADE_MS + DUSK_HOLD_MS,
  };
}

// 불러온 뒤: 끝난 임무는 settleMission, 해가 뜬 채 저장됐으면 endDay.
// 다 찾은 임무는 해가 뜬 것으로 치지 않는다(마지막 대상을 찾은 순간 시간이 0이었어도 동트기 전 완료).
export function resumeNight(state, foundIds) {
  const settled = settleMission(state, foundIds);
  if (settled !== state) return settled;
  if (isDawn(state)) return endDay(state, foundIds);
  return state;
}
