import { newGame } from '../../src/logic/save.js';
import {
  nightLength, assignMission, tickNight, isDawn, endDay, missionDone, completeMission, resumeNight,
} from '../../src/logic/night.js';

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
