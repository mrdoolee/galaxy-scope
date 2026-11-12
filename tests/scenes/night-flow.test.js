// 장면 없이 밤 규칙을 이어 붙여 임무 하나, 해돋이, 새로 고침, 한 판 전체를 흉내 낸다.
import { newGame, save, load, SAVE_KEY } from '../../src/logic/save.js';
import { assignMission, tickNight, isDawn, endDay, completeMission, resumeNight, nightLength } from '../../src/logic/night.js';
import { recordCapture } from '../../src/logic/capture.js';
import { refreshRequest, bootState, DECK_IDS } from '../../src/scenes/gameState.js';
import { NIGHT_TEXT, RATING_TEXT, ratingLine } from '../../src/data/copy.js';
import { SCORE } from '../../src/config/balance.js';

const BANNED = ['성운', '성단', '방출', '반사', '암흑', '산개', '구상', '은하'];
const mission3 = { kind: 'picture', zoneId: 'orion', targetIds: ['m42', 'm78', 'b33'] };
const find = (state, id, stars = 1) => recordCapture(state, { id, stars, bonus: false, deckIds: DECK_IDS });

// registry만 있는 가짜 장면(refreshRequest, bootState가 쓰는 만큼)
function fakeScene(state) {
  const m = new Map();
  if (state) m.set('state', state);
  return { registry: { get: (k) => m.get(k), set: (k, v) => m.set(k, v), remove: (k) => m.delete(k) } };
}
function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

describe('밤 하나의 흐름', () => {
  it('하나 찾고 해가 뜨고, 다음 밤에 나머지 둘을 찾으면 보너스 없이 셋째 밤이 된다', () => {
    let s = assignMission(newGame(1), mission3);
    s = find(s, 'm42').state;
    expect(s.mission).toEqual(mission3);
    s = tickNight(s, nightLength(3));
    expect(isDawn(s)).toBe(true);
    s = endDay(s, new Set(s.foundIds));
    expect(s.nightLeftMs).toBe(nightLength(2));
    s = find(s, 'm78').state;
    const last = find(s, 'b33');
    expect(last.done).toBe(true);
    expect(last.early).toBe(false);
    expect(last.state.night).toBe(3);
    expect(last.state.earlyMissions).toBe(0);
    expect(last.state.mission).toBeNull();
  });

  it('같은 임무를 밤 안에 다 찾으면 동트기 전 완료, 둘째 밤', () => {
    let s = assignMission(newGame(1), mission3);
    s = tickNight(s, 30000);
    s = find(s, 'm42', 3).state;
    s = find(s, 'm78', 2).state;
    const last = find(s, 'b33', 1);
    expect(last.done).toBe(true);
    expect(last.early).toBe(true);
    expect(last.state.earlyMissions).toBe(1);
    expect(last.state.night).toBe(2);
    expect(last.state.ratings).toEqual({ m42: 3, m78: 2, b33: 1 });
    // 그 뒤 하늘 지도가 의뢰를 다시 정해도 두 번 세지 않는다
    const scene = fakeScene(last.state);
    refreshRequest(scene);
    const after = scene.registry.get('state');
    expect(after.earlyMissions).toBe(1);
    expect(after.night).toBe(2);
    expect(after.mission).not.toBeNull();
  });

  it('밤 시간이 0인 채 초점을 맞추다 마지막 대상을 찍으면(endDay 전) 동트기 전 완료다', () => {
    let s = assignMission(newGame(1), { ...mission3, targetIds: ['m42'] });
    s = tickNight(s, 999999);
    expect(isDawn(s)).toBe(true);
    const r = find(s, 'm42');
    expect(r.early).toBe(true);
    expect(r.state.earlyMissions).toBe(1);
  });

  it('밤을 다 쓴 채(endDay 전) 저장하고 다시 불러오면 다음 밤이 시작돼 있다', () => {
    const st = memoryStorage();
    let s = assignMission(newGame(1), mission3);
    s = find(s, 'm42').state;
    s = tickNight(s, 999999);
    save(st, s);
    const loaded = load(st);
    expect(isDawn(loaded)).toBe(true);
    const resumed = resumeNight(loaded, new Set(loaded.foundIds));
    expect(resumed.night).toBe(2);
    expect(resumed.nightLeftMs).toBe(nightLength(2));
    expect(resumed.dawned).toBe(true);
    expect(isDawn(resumed)).toBe(false);
    // 저장에는 밤 시간 0(해가 뜬 순간)이 남아 있었다
    expect(JSON.parse(st.getItem(SAVE_KEY)).nightLeftMs).toBe(0);
  });

  it('bootState는 해가 뜬 채 저장된 판을 다음 밤으로 이어 준다', () => {
    let s = assignMission(newGame(5), mission3);
    s = tickNight(s, 999999);
    const store = memoryStorage();
    save(store, s);
    const prev = globalThis.window;
    globalThis.window = { localStorage: store };
    try {
      const scene = fakeScene();
      const booted = bootState(scene.registry);
      expect(booted.night).toBe(2);
      expect(booted.nightLeftMs).toBe(nightLength(3));
      expect(JSON.parse(store.getItem(SAVE_KEY)).night).toBe(2);
    } finally {
      globalThis.window = prev;
    }
  });
});

describe('촬영 한 번의 반영(recordCapture)', () => {
  it('임무가 끝나지 않으면 done false, 상태의 임무는 그대로', () => {
    const s = assignMission(newGame(1), mission3);
    const r = find(s, 'm78', 2);
    expect(r).toMatchObject({ done: false, early: false, complete: false });
    expect(r.state.foundIds).toEqual(['m78']);
    expect(r.state.ratings).toEqual({ m78: 2 });
    expect(r.state.mission).toBe(s.mission);
    expect(r.state.nightLeftMs).toBe(s.nightLeftMs);
  });

  it('임무 밖의 천체를 찍어도 카드와 별점은 얻는다', () => {
    const s = assignMission(newGame(1), mission3);
    const r = find(s, 'm8', 3);
    expect(r.done).toBe(false);
    expect(r.state.foundIds).toEqual(['m8']);
    expect(r.state.ratings.m8).toBe(3);
  });

  it('보너스 관측: 찾은 목록에만 넣고 별점·임무·단계는 건드리지 않는다', () => {
    const s = { ...newGame(1), foundIds: [...DECK_IDS], phase: 'result', bonusOpen: true };
    const r = recordCapture(s, { id: 'ldn1622', stars: 3, bonus: true, deckIds: DECK_IDS });
    expect(r).toMatchObject({ done: false, early: false, complete: false });
    expect(r.state.foundIds).toContain('ldn1622');
    expect(r.state.ratings).toEqual({});
    expect(r.state.phase).toBe('result');
  });
});

describe('한 판 전체', () => {
  it('임무 받기 → 찾기 → 완료를 되풀이하면 묶기로 넘어가고, 모으는 동안 임무가 빈 채로 남지 않는다', () => {
    const scene = fakeScene(newGame(3));
    let early = 0;
    let guard = 0;
    while (scene.registry.get('state').phase === 'collect') {
      expect(guard++).toBeLessThan(40);
      const req = refreshRequest(scene); // 하늘 지도에 들어올 때마다
      let s = scene.registry.get('state');
      expect(req).not.toBeNull();
      expect(s.mission).toEqual(req);
      expect(s.nightLeftMs).toBe(nightLength(req.targetIds.length));
      for (const id of req.targetIds) {
        s = tickNight(s, 10000);
        expect(s.mission).not.toBeNull(); // 찾는 동안 임무는 그대로
        const r = find(s, id, 3);
        s = r.state;
        if (r.done) early += r.early ? 1 : 0;
      }
      scene.registry.set('state', s);
    }
    const end = scene.registry.get('state');
    expect(end.phase).toBe('sort');
    expect(end.foundIds).toHaveLength(DECK_IDS.length);
    expect(end.earlyMissions).toBe(early);
    expect(early).toBeGreaterThan(0);
    expect(end.mission).toBeNull();
    expect(Object.keys(end.ratings)).toHaveLength(DECK_IDS.length);
  });
});

describe('밤 글', () => {
  const all = [
    NIGHT_TEXT.nightLabel(1), NIGHT_TEXT.dawn, NIGHT_TEXT.dusk, NIGHT_TEXT.tonight(2), NIGHT_TEXT.missionEarly,
    NIGHT_TEXT.missionDone, NIGHT_TEXT.toNextMission, NIGHT_TEXT.shutter, NIGHT_TEXT.earlyBonus(SCORE.earlyMission),
    ...Object.values(RATING_TEXT),
  ];

  it('정해진 문장을 그대로 쓴다', () => {
    expect(NIGHT_TEXT.nightLabel(2)).toBe('2째 밤');
    expect(NIGHT_TEXT.dawn).toBe('해가 떴어요. 낮에는 천체를 관측할 수 없어요. 밤이 될 때까지 기다려야 해요.');
    expect(NIGHT_TEXT.dusk).toBe('다시 밤이 되었어요. 이어서 찾아봐요.');
    expect(NIGHT_TEXT.tonight(3)).toBe('오늘 밤 찍은 카드 3장');
    expect(NIGHT_TEXT.missionEarly).toBe('동트기 전에 임무를 마쳤어요!');
    expect(NIGHT_TEXT.missionDone).toBe('임무를 마쳤어요.');
    expect(NIGHT_TEXT.toNextMission).toBe('다음 임무 받기');
    expect(NIGHT_TEXT.shutter).toBe('촬영');
    expect(NIGHT_TEXT.earlyBonus(50)).toContain('50');
  });

  it('모든 문장에 분류 용어가 없다', () => {
    for (const s of all) {
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
      for (const w of BANNED) expect(s, s).not.toContain(w);
    }
  });

  it('별점 한 줄은 무엇으로 별을 얻었는지 말한다', () => {
    expect(ratingLine({ center: true, focus: true })).toBe(RATING_TEXT.both);
    expect(ratingLine({ center: true, focus: false })).toBe(RATING_TEXT.center);
    expect(ratingLine({ center: false, focus: true })).toBe(RATING_TEXT.focus);
    expect(ratingLine({ center: false, focus: false })).toBe(RATING_TEXT.base);
    expect(new Set(Object.values(RATING_TEXT)).size).toBe(4);
  });
});
