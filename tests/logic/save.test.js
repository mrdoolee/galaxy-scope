import { SAVE_KEY, newGame, load, save, clear, recordFind, repairState } from '../../src/logic/save.js';

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
