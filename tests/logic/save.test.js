import { SAVE_KEY, newGame, load, save, clear, recordFind, repairState, withDefaults } from '../../src/logic/save.js';

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

const throwing = () => ({
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
});

describe('newGame', () => {
  it('starts a fresh collect-phase state', () => {
    expect(newGame(42)).toEqual({
      version: 1,
      seed: 42,
      foundIds: [],
      phase: 'collect',
      stage: null,
      placements: {},
      wrongSubmits: { shape: 0, nebula: 0, cluster: 0 },
      bonusOpen: false,
      mission: null,
      night: 1,
      nightLeftMs: null,
      dawned: false,
      earlyMissions: 0,
      ratings: {},
      introSeen: false,
    });
  });
});

describe('save / load', () => {
  it('round-trips a state', () => {
    const s = fakeStorage();
    const state = { ...newGame(7), foundIds: ['a', 'b'], phase: 'sort', stage: 'nebula', placements: { a: 'x' }, bonusOpen: true };
    state.wrongSubmits = { shape: 1, nebula: 2, cluster: 0 };
    save(s, state);
    expect(load(s)).toEqual(state);
  });

  it('returns null when nothing is saved', () => {
    expect(load(fakeStorage())).toBeNull();
  });

  it('returns null when getItem throws', () => {
    expect(load(throwing())).toBeNull();
  });

  const good = () => newGame(5);
  const bad = [
    ['non-JSON text', 'not json{'],
    ['null', 'null'],
    ['a number', '5'],
    ['an array', '[]'],
    ['version 2', JSON.stringify({ ...good(), version: 2 })],
    ['foundIds not array', JSON.stringify({ ...good(), foundIds: 'a' })],
    ['foundIds with non-string', JSON.stringify({ ...good(), foundIds: ['a', 3] })],
    ['bad phase', JSON.stringify({ ...good(), phase: 'nope' })],
    ['bad stage', JSON.stringify({ ...good(), stage: 'galaxy' })],
    ['stage undefined', JSON.stringify({ ...good(), stage: undefined })],
    ['placements null', JSON.stringify({ ...good(), placements: null })],
    ['placements array', JSON.stringify({ ...good(), placements: [] })],
    ['wrongSubmits missing', JSON.stringify({ ...good(), wrongSubmits: undefined })],
    ['wrongSubmits missing counter', JSON.stringify({ ...good(), wrongSubmits: { shape: 0, nebula: 0 } })],
    ['wrongSubmits non-numeric', JSON.stringify({ ...good(), wrongSubmits: { shape: 0, nebula: '1', cluster: 0 } })],
    ['seed string', JSON.stringify({ ...good(), seed: '5' })],
    ['seed null', JSON.stringify({ ...good(), seed: null })],
    ['bonusOpen not boolean', JSON.stringify({ ...good(), bonusOpen: 1 })],
  ];
  it.each(bad)('returns null for %s', (_name, text) => {
    expect(load(fakeStorage({ [SAVE_KEY]: text }))).toBeNull();
  });

  it.each(['collect', 'sort', 'registry', 'result'])('accepts phase %s', (phase) => {
    const s = fakeStorage();
    save(s, { ...good(), phase });
    expect(load(s).phase).toBe(phase);
  });

  it('save does not throw when storage throws', () => {
    expect(() => save(throwing(), newGame(1))).not.toThrow();
  });
});

describe('clear', () => {
  it('removes the saved state', () => {
    const s = fakeStorage();
    save(s, newGame(1));
    clear(s);
    expect(load(s)).toBeNull();
  });

  it('does not throw when storage throws', () => {
    expect(() => clear(throwing())).not.toThrow();
  });
});

describe('recordFind', () => {
  const DECK_IDS = Array.from({ length: 20 }, (_, i) => `c${i}`);

  it('찾은 카드를 더한 새 상태를 돌려주고, 원래 상태는 바꾸지 않는다', () => {
    const s0 = newGame(3);
    const s1 = recordFind(s0, 'c0', DECK_IDS);
    expect(s1.foundIds).toEqual(['c0']);
    expect(s1.phase).toBe('collect');
    expect(s0.foundIds).toEqual([]);
    expect(s1).not.toBe(s0);
  });

  it('이미 찾은 id는 다시 더하지 않는다', () => {
    const s1 = recordFind(newGame(3), 'c0', DECK_IDS);
    const s2 = recordFind(s1, 'c0', DECK_IDS);
    expect(s2.foundIds).toEqual(['c0']);
    expect(s2.phase).toBe('collect');
  });

  it('필수 카드 20장째에 묶기 단계로 넘어간다', () => {
    let s = newGame(3);
    for (let i = 0; i < 19; i++) s = recordFind(s, `c${i}`, DECK_IDS);
    expect(s.phase).toBe('collect');
    s = recordFind(s, 'c19', DECK_IDS);
    expect(s.foundIds).toHaveLength(20);
    expect(s.phase).toBe('sort');
  });

  it('필수 카드가 아닌 id(손으로 고친 저장의 보너스 id)는 20장 셈에 들어가지 않는다', () => {
    let s = { ...newGame(3), foundIds: ['bonus1', 'bonus2', 'bonus3'] };
    for (let i = 0; i < 17; i++) s = recordFind(s, `c${i}`, DECK_IDS);
    expect(s.foundIds).toHaveLength(20);
    expect(s.phase).toBe('collect');
    s = recordFind(s, 'c17', DECK_IDS);
    s = recordFind(s, 'c18', DECK_IDS);
    expect(s.phase).toBe('collect');
    s = recordFind(s, 'c19', DECK_IDS);
    expect(s.phase).toBe('sort');
  });
});

describe('repairState: 모으기 단계인데 필수 카드가 다 있으면', () => {
  const DECK_IDS = ['a', 'b', 'c'];

  it('묶기 단계로 올린다(놓기와 단계는 비운 채로)', () => {
    const s = { ...newGame(4), foundIds: ['c', 'a', 'b'], phase: 'collect' };
    const r = repairState(s, DECK_IDS);
    expect(r.phase).toBe('sort');
    expect(r.stage).toBeNull();
    expect(r.placements).toEqual({});
    expect(r.foundIds).toEqual(['c', 'a', 'b']);
  });

  it('하나라도 모자라면 그대로(같은 객체)', () => {
    const s = { ...newGame(4), foundIds: ['a', 'b', 'x'], phase: 'collect' };
    expect(repairState(s, DECK_IDS)).toBe(s);
  });
});

const NEW_KEYS = ['mission', 'night', 'nightLeftMs', 'dawned', 'earlyMissions', 'ratings', 'introSeen'];
const oldFormat = (extra = {}) => {
  const s = { ...newGame(9), foundIds: ['a', 'b', 'c', 'd', 'e'], ...extra };
  for (const k of NEW_KEYS) if (!(k in extra)) delete s[k];
  return s;
};
const loadOf = (obj) => load(fakeStorage({ [SAVE_KEY]: JSON.stringify(obj) }));

describe('load: 예전 저장(새 항목 없음)', () => {
  it('찾은 카드는 그대로이고 새 항목은 기본값', () => {
    const r = loadOf(oldFormat());
    expect(r.foundIds).toEqual(['a', 'b', 'c', 'd', 'e']);
    const fresh = newGame(9);
    for (const k of NEW_KEYS) expect(r[k]).toEqual(fresh[k]);
  });

  it('여전히 필수 항목이 깨진 저장은 거부한다', () => {
    expect(loadOf({ ...oldFormat(), foundIds: 'a' })).toBeNull();
  });
});

describe('withDefaults: 이상한 값은 그 항목만 기본값으로', () => {
  const okMission = { kind: 'plain', zoneId: 'orion', targetIds: ['a', 'b'] };
  const cases = [
    ['night 0', { night: 0 }, 'night', 1],
    ['night 음수', { night: -3 }, 'night', 1],
    ['night 문자열', { night: '2' }, 'night', 1],
    ['night 소수', { night: 1.5 }, 'night', 1],
    ['nightLeftMs 음수', { nightLeftMs: -5 }, 'nightLeftMs', null],
    ['nightLeftMs NaN', { nightLeftMs: NaN }, 'nightLeftMs', null],
    ['nightLeftMs 문자열', { nightLeftMs: '9' }, 'nightLeftMs', null],
    ['dawned 숫자', { dawned: 1 }, 'dawned', false],
    ['introSeen 문자열', { introSeen: 'yes' }, 'introSeen', false],
    ['earlyMissions 음수', { earlyMissions: -1 }, 'earlyMissions', 0],
    ['earlyMissions 소수', { earlyMissions: 0.5 }, 'earlyMissions', 0],
    ['ratings 에 5', { ratings: { a: 5 } }, 'ratings', {}],
    ['ratings 문자열', { ratings: { a: '2' } }, 'ratings', {}],
    ['ratings 배열', { ratings: [] }, 'ratings', {}],
    ['mission targetIds 빈 배열', { mission: { ...okMission, targetIds: [] } }, 'mission', null],
    ['mission targetIds 4개', { mission: { ...okMission, targetIds: ['a', 'b', 'c', 'd'] } }, 'mission', null],
    ['mission targetIds 숫자 섞임', { mission: { ...okMission, targetIds: ['a', 2] } }, 'mission', null],
    ['mission kind 모르는 값', { mission: { ...okMission, kind: 'term' } }, 'mission', null],
    ['mission zoneId 숫자', { mission: { ...okMission, zoneId: 3 } }, 'mission', null],
    ['mission 문자열', { mission: 'x' }, 'mission', null],
  ];
  it.each(cases)('%s', (_name, patch, key, expected) => {
    const r = loadOf(oldFormat(patch));
    expect(r).not.toBeNull();
    expect(r[key]).toEqual(expected);
    // 다른 새 항목은 그대로 기본값, 필수 항목은 건드리지 않는다
    expect(r.foundIds).toEqual(['a', 'b', 'c', 'd', 'e']);
    for (const k of NEW_KEYS.filter((x) => x !== key)) expect(r[k]).toEqual(newGame(9)[k]);
  });

  it('올바른 값은 그대로 둔다', () => {
    const good = { ...newGame(9), mission: okMission, night: 4, nightLeftMs: 0, dawned: true, earlyMissions: 2, ratings: { a: 3, b: 1 }, introSeen: true };
    expect(loadOf(good)).toEqual(good);
  });

  it('고칠 것이 없으면 같은 객체, 입력은 바꾸지 않는다', () => {
    const s = newGame(1);
    expect(withDefaults(s)).toBe(s);
    const broken = oldFormat({ night: -1 });
    withDefaults(broken);
    expect(broken.night).toBe(-1);
  });
});

describe('repairState: 임무 정리', () => {
  const m = { kind: 'picture', zoneId: 'orion', targetIds: ['a'] };
  it('모으기로 되돌릴 때 임무와 밤을 비운다', () => {
    const s = { ...newGame(4), foundIds: ['a'], phase: 'sort', mission: m, nightLeftMs: 5, dawned: true };
    const r = repairState(s, ['a', 'b']);
    expect(r.phase).toBe('collect');
    expect(r.mission).toBeNull();
    expect(r.nightLeftMs).toBeNull();
    expect(r.dawned).toBe(false);
  });
  it('묶기로 올릴 때 임무와 밤을 비운다', () => {
    const s = { ...newGame(4), foundIds: ['a', 'b'], mission: m, nightLeftMs: 5, dawned: true };
    const r = repairState(s, ['a', 'b']);
    expect(r.phase).toBe('sort');
    expect(r.mission).toBeNull();
    expect(r.nightLeftMs).toBeNull();
    expect(r.dawned).toBe(false);
  });
});
