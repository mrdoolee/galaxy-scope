import { newGame } from '../../src/logic/save.js';
import {
  nightLength, assignMission, tickNight, isDawn, endDay, missionDone, completeMission, resumeNight, settleMission,
  nightTotal, dayTimeline, clockRuns,
} from '../../src/logic/night.js';
import { DAY_WAIT_MS, DAY_FADE_MS, DUSK_HOLD_MS } from '../../src/config/balance.js';

const req3 = { kind: 'picture', zoneId: 'orion', targetIds: ['a', 'b', 'c'] };
const started = () => assignMission(newGame(1), req3);

describe('nightLength', () => {
  it('기본 20초 + 대상 하나에 50초', () => {
    expect(nightLength(1)).toBe(70000);
    expect(nightLength(2)).toBe(120000);
    expect(nightLength(3)).toBe(170000);
  });
});

describe('assignMission', () => {
  it('임무가 없던 상태에 넣으면 밤이 시작된다', () => {
    const s = started();
    expect(s.mission).toEqual(req3);
    expect(s.nightLeftMs).toBe(170000);
    expect(s.dawned).toBe(false);
  });
  it('같은 임무를 다시 넣으면 같은 객체(시간이 되돌아가지 않는다)', () => {
    const s = tickNight(started(), 5000);
    expect(assignMission(s, { ...req3, targetIds: [...req3.targetIds] })).toBe(s);
    expect(assignMission(s, { ...req3, kind: 'plain' })).toBe(s);
  });
  it('대상이나 구역이 다르면 새로 시작한다', () => {
    const s = tickNight({ ...started(), dawned: true }, 5000);
    const t = assignMission(s, { ...req3, targetIds: ['a', 'b'] });
    expect(t.nightLeftMs).toBe(120000);
    expect(t.dawned).toBe(false);
    expect(assignMission(s, { ...req3, zoneId: 'taurus' }).nightLeftMs).toBe(170000);
    expect(assignMission(s, { ...req3, targetIds: ['c', 'b', 'a'] }).nightLeftMs).toBe(170000);
  });
  it('request가 null이면 임무를 비운다', () => {
    const s = assignMission(started(), null);
    expect(s.mission).toBeNull();
    expect(s.nightLeftMs).toBeNull();
    expect(s.dawned).toBe(false);
  });
  it('임무도 없는데 null이면 같은 객체', () => {
    const s = newGame(1);
    expect(assignMission(s, null)).toBe(s);
  });
});

describe('tickNight', () => {
  it('시간을 줄이고 원래 상태는 바꾸지 않는다', () => {
    const s = started();
    expect(tickNight(s, 1000).nightLeftMs).toBe(169000);
    expect(s.nightLeftMs).toBe(170000);
  });
  it('0에서 멈춘다', () => {
    expect(tickNight(started(), 999999).nightLeftMs).toBe(0);
  });
  it('null이면 같은 객체', () => {
    const s = newGame(1);
    expect(tickNight(s, 1000)).toBe(s);
  });
});

describe('isDawn', () => {
  it('임무가 있고 남은 밤이 0일 때만 참', () => {
    expect(isDawn({ ...started(), nightLeftMs: 0 })).toBe(true);
    expect(isDawn({ ...started(), nightLeftMs: 1 })).toBe(false);
    expect(isDawn({ ...newGame(1), nightLeftMs: 0 })).toBe(false);
  });
});

describe('endDay', () => {
  it('남은 대상 수로 새 밤을 주고 해가 뜬 것을 기록한다', () => {
    const s = { ...started(), nightLeftMs: 0 };
    const e = endDay(s, new Set(['a']));
    expect(e.night).toBe(2);
    expect(e.nightLeftMs).toBe(120000);
    expect(e.dawned).toBe(true);
    expect(s.night).toBe(1);
  });
  it('남은 대상이 없어도 한 개 몫의 밤을 준다', () => {
    expect(endDay(started(), new Set(['a', 'b', 'c'])).nightLeftMs).toBe(70000);
  });
});

describe('missionDone', () => {
  it('대상을 모두 찾았을 때만 참', () => {
    expect(missionDone(started(), new Set(['a', 'b']))).toBe(false);
    expect(missionDone(started(), new Set(['a', 'b', 'c', 'z']))).toBe(true);
    expect(missionDone(newGame(1), new Set(['a']))).toBe(false);
  });
});

describe('completeMission', () => {
  it('해가 뜬 적 없으면 동트기 전 완료', () => {
    const { state, early } = completeMission(started());
    expect(early).toBe(true);
    expect(state.earlyMissions).toBe(1);
    expect(state.night).toBe(2);
    expect(state.mission).toBeNull();
    expect(state.nightLeftMs).toBeNull();
    expect(state.dawned).toBe(false);
  });
  it('해가 뜬 적 있으면 보너스 없음', () => {
    const { state, early } = completeMission({ ...started(), dawned: true });
    expect(early).toBe(false);
    expect(state.earlyMissions).toBe(0);
    expect(state.night).toBe(2);
    expect(state.mission).toBeNull();
    expect(state.dawned).toBe(false);
  });
  it('시간이 0이어도 endDay 전이면 동트기 전 완료', () => {
    const s = { ...started(), nightLeftMs: 0 };
    expect(completeMission(s).early).toBe(true);
  });
});

describe('resumeNight', () => {
  it('해가 뜬 채 저장됐으면 endDay한 상태', () => {
    const s = { ...started(), nightLeftMs: 0 };
    const found = new Set(['a']);
    expect(resumeNight(s, found)).toEqual(endDay(s, found));
  });
  it('임무를 다 찾은 저장은 completeMission한 상태', () => {
    const s = tickNight(started(), 1000);
    const found = new Set(['a', 'b', 'c']);
    expect(resumeNight(s, found)).toEqual(completeMission(s).state);
  });
  it('그 밖에는 같은 객체', () => {
    const s = tickNight(started(), 1000);
    expect(resumeNight(s, new Set(['a']))).toBe(s);
    const n = newGame(1);
    expect(resumeNight(n, new Set())).toBe(n);
  });
});

describe('nightTotal', () => {
  it('해가 뜨기 전에는 임무 대상 수로 정한 밤 길이', () => {
    expect(nightTotal(tickNight(started(), 9000), new Set(['a']))).toBe(170000);
  });
  it('해가 뜬 뒤에는 그 밤에 받은 길이(남은 대상 수), 남은 시간보다 짧지 않다', () => {
    const e = endDay({ ...started(), nightLeftMs: 0 }, new Set(['a']));
    expect(nightTotal(e, new Set(['a']))).toBe(120000);
    // 다음 밤에 하나 더 찾아 남은 대상이 하나가 되어도 막대가 1을 넘지 않게 남은 시간 이상
    expect(nightTotal(e, new Set(['a', 'b']))).toBe(120000);
  });
  it('임무가 없으면 0', () => {
    expect(nightTotal(newGame(1), new Set())).toBe(0);
  });
});

describe('clockRuns', () => {
  const on = { phase: 'collect', bonus: false, mode: 'sweep', hasMission: true, dayWait: false };
  it('모으기 중 임무가 있고 훑기나 초점 상태일 때만 간다', () => {
    expect(clockRuns(on)).toBe(true);
    expect(clockRuns({ ...on, mode: 'focus' })).toBe(true);
  });
  it.each([
    ['카드 화면', { mode: 'card' }],
    ['낮 상태', { mode: 'day' }],
    ['낮 기다림 중', { dayWait: true }],
    ['초점 상태로 남은 낮 기다림 중', { mode: 'focus', dayWait: true }],
    ['보너스 관측', { bonus: true }],
    ['보너스 관측(결과 단계)', { bonus: true, phase: 'result' }],
    ['묶기 단계', { phase: 'sort' }],
    ['도감 단계', { phase: 'registry' }],
    ['결과 단계', { phase: 'result' }],
    ['임무 없음', { hasMission: false }],
  ])('%s에는 가지 않는다', (_name, patch) => {
    expect(clockRuns({ ...on, ...patch })).toBe(false);
  });
});

describe('dayTimeline', () => {
  it('밝아지고, 해가 DAY_WAIT_MS 동안 지나가고, 어두워진 뒤 잠깐 있다가 끝난다', () => {
    expect(dayTimeline(0)).toEqual({ light: 0, sun: 0, dusk: false, done: false });
    expect(dayTimeline(DAY_FADE_MS).light).toBe(1);
    const mid = dayTimeline(DAY_WAIT_MS / 2);
    expect(mid.light).toBe(1);
    expect(mid.sun).toBeCloseTo(0.5);
    expect(mid.dusk).toBe(false);
    expect(dayTimeline(DAY_WAIT_MS - 1).dusk).toBe(false);
    expect(dayTimeline(DAY_WAIT_MS)).toMatchObject({ light: 1, sun: 1, dusk: true, done: false });
    expect(dayTimeline(DAY_WAIT_MS + DAY_FADE_MS / 2).light).toBeCloseTo(0.5);
    expect(dayTimeline(DAY_WAIT_MS + DAY_FADE_MS)).toMatchObject({ light: 0, done: false });
    expect(dayTimeline(DAY_WAIT_MS + DAY_FADE_MS + DUSK_HOLD_MS)).toMatchObject({ light: 0, sun: 1, dusk: true, done: true });
  });
  it('낮 기다림은 5초', () => {
    expect(DAY_WAIT_MS).toBe(5000);
  });
});

describe('settleMission', () => {
  const all = new Set(['a', 'b', 'c']);
  it('동트기 전에 끝난 임무는 한 번만, 두 번 돌려도 한 번만 반영한다', () => {
    const once = settleMission(started(), all);
    expect(once.earlyMissions).toBe(1);
    expect(once.night).toBe(2);
    expect(once.mission).toBeNull();
    const twice = settleMission(once, all);
    expect(twice).toBe(once);
    expect(twice.earlyMissions).toBe(1);
    expect(twice.night).toBe(2);
  });
  it('해가 뜬 뒤 끝난 임무는 점수 없이 밤만 넘긴다', () => {
    const s = settleMission({ ...started(), dawned: true }, all);
    expect(s.earlyMissions).toBe(0);
    expect(s.night).toBe(2);
    expect(s.mission).toBeNull();
  });
  it('끝나지 않은 임무와 임무 없음은 같은 객체', () => {
    const s = started();
    expect(settleMission(s, new Set(['a']))).toBe(s);
    const n = newGame(1);
    expect(settleMission(n, all)).toBe(n);
  });
});
