import { SAVE_KEY, newGame, load, save, clear, recordFind } from '../../src/logic/save.js';

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
  it('찾은 카드를 더한 새 상태를 돌려주고, 원래 상태는 바꾸지 않는다', () => {
    const s0 = newGame(3);
    const s1 = recordFind(s0, 'm42', 20);
    expect(s1.foundIds).toEqual(['m42']);
    expect(s1.phase).toBe('collect');
    expect(s0.foundIds).toEqual([]);
    expect(s1).not.toBe(s0);
  });

  it('이미 찾은 id는 다시 더하지 않는다', () => {
    const s1 = recordFind(newGame(3), 'm42', 20);
    const s2 = recordFind(s1, 'm42', 20);
    expect(s2.foundIds).toEqual(['m42']);
    expect(s2.phase).toBe('collect');
  });

  it('20장째에 묶기 단계로 넘어간다', () => {
    let s = newGame(3);
    for (let i = 0; i < 19; i++) s = recordFind(s, `c${i}`, 20);
    expect(s.phase).toBe('collect');
    s = recordFind(s, 'c19', 20);
    expect(s.foundIds).toHaveLength(20);
    expect(s.phase).toBe('sort');
  });
});
