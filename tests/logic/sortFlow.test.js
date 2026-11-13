import { newGame } from '../../src/logic/save.js';
import { beginSort, stageCards, validPlacements, placeCard, submitSort, hintLevel, finishRegistry, shuffledIds, pickHighlights } from '../../src/logic/sortFlow.js';
import { HIGHLIGHT_MAX } from '../../src/config/balance.js';

const o = (id, group, type) => ({ id, group, type });
const CARDS = [o('a', 'nebula', 'emission'), o('b', 'nebula', 'dark'), o('c', 'cluster', 'open'), o('d', 'cluster', 'globular')];
const sorting = (extra = {}) => ({ ...newGame(1), foundIds: ['a', 'b', 'c', 'd'], phase: 'sort', stage: 'shape', ...extra });

describe('beginSort', () => {
  it('묶기 단계에 처음 들어오면 1차(shape)부터', () => {
    const s = beginSort({ ...newGame(1), phase: 'sort' });
    expect(s.stage).toBe('shape');
    expect(s.placements).toEqual({});
  });
  it('이미 진행 중이면 그대로 둔다', () => {
    const s0 = sorting({ stage: 'nebula', placements: { a: 'bright' } });
    expect(beginSort(s0)).toBe(s0);
  });
});

describe('stageCards', () => {
  it('shape는 전부, nebula는 성운, cluster는 성단', () => {
    expect(stageCards('shape', CARDS).map((c) => c.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(stageCards('nebula', CARDS).map((c) => c.id)).toEqual(['a', 'b']);
    expect(stageCards('cluster', CARDS).map((c) => c.id)).toEqual(['c', 'd']);
    expect(stageCards(null, CARDS)).toEqual([]);
  });
});

describe('validPlacements', () => {
  it('지금 단계 카드와 묶음이 아닌 것은 놓지 않은 것으로 본다', () => {
    const s = sorting({ stage: 'nebula', placements: { a: 'bright', b: 'cloud', c: 'dark', zz: 'dark', d: 7 } });
    expect(validPlacements(s, CARDS)).toEqual({ a: 'bright' });
  });
  it('찾지 않은 카드는 단계 카드가 아니다', () => {
    const s = sorting({ foundIds: ['a', 'c'], placements: { a: 'cloud', b: 'cloud' } });
    expect(validPlacements(s, CARDS)).toEqual({ a: 'cloud' });
  });
});

describe('placeCard', () => {
  it('카드를 묶음에 놓은 새 상태를 돌려주고 원래 상태는 그대로', () => {
    const s0 = sorting();
    const s1 = placeCard(s0, 'a', 'cloud', CARDS);
    expect(s1.placements).toEqual({ a: 'cloud' });
    expect(s0.placements).toEqual({});
  });
  it('다른 묶음으로 옮기면 맨 뒤에 놓인다', () => {
    let s = sorting();
    s = placeCard(s, 'a', 'cloud', CARDS);
    s = placeCard(s, 'b', 'cloud', CARDS);
    s = placeCard(s, 'a', 'stars', CARDS);
    s = placeCard(s, 'a', 'cloud', CARDS);
    expect(Object.keys(s.placements)).toEqual(['b', 'a']);
  });
  it('null이면 꺼낸다', () => {
    const s = placeCard(placeCard(sorting(), 'a', 'cloud', CARDS), 'a', null, CARDS);
    expect(s.placements).toEqual({});
  });
  it('단계 밖 카드나 없는 묶음은 무시하고, 저장된 이상한 값은 정리한다', () => {
    const s0 = sorting({ placements: { zz: 'cloud', b: 'bright' } });
    expect(placeCard(s0, 'a', 'bright', CARDS).placements).toEqual({});
    expect(placeCard(s0, 'zz', 'cloud', CARDS).placements).toEqual({});
    expect(placeCard(s0, 'c', 'stars', CARDS).placements).toEqual({ c: 'stars' });
  });
});

describe('submitSort', () => {
  const all = { a: 'cloud', b: 'cloud', c: 'stars', d: 'stars' };

  it('다 놓지 않았으면 아무것도 바꾸지 않는다(틀린 횟수, 점수 그대로)', () => {
    const s0 = sorting({ placements: { a: 'cloud', b: 'cloud', c: 'stars' } });
    const r = submitSort(s0, CARDS);
    expect(r.outcome).toBe('incomplete');
    expect(r.state).toBe(s0);
    expect(r.wrongIds).toEqual([]);
    expect(r.hintLevel).toBe(0);
  });

  it('저장된 엉뚱한 묶음 이름은 놓지 않은 것으로 센다', () => {
    const s0 = sorting({ placements: { ...all, d: 'dense' } });
    expect(submitSort(s0, CARDS).outcome).toBe('incomplete');
  });

  it('틀리면 그 단계 틀린 횟수만 오르고 놓은 카드는 그대로', () => {
    const s0 = sorting({ placements: { ...all, d: 'cloud' }, wrongSubmits: { shape: 0, nebula: 2, cluster: 0 } });
    const r = submitSort(s0, CARDS);
    expect(r.outcome).toBe('wrong');
    expect(r.wrongIds).toEqual(['d']);
    expect(r.state.wrongSubmits).toEqual({ shape: 1, nebula: 2, cluster: 0 });
    expect(r.state.placements).toEqual(s0.placements);
    expect(r.hintLevel).toBe(1);
  });

  it('맞으면 다음 단계로 가고 놓은 카드를 비운다', () => {
    const r = submitSort(sorting({ placements: all }), CARDS);
    expect(r.outcome).toBe('correct');
    expect(r.state.stage).toBe('nebula');
    expect(r.state.placements).toEqual({});
    expect(r.state.phase).toBe('sort');
  });

  it('cluster를 맞히면 도감 등록 단계', () => {
    const r = submitSort(sorting({ stage: 'cluster', placements: { c: 'loose', d: 'dense' } }), CARDS);
    expect(r.state.phase).toBe('registry');
    expect(r.state.stage).toBeNull();
  });
});

describe('hintLevel', () => {
  it('그 단계 틀린 횟수로 0~3', () => {
    expect(hintLevel(sorting({ wrongSubmits: { shape: 2, nebula: 0, cluster: 0 } }))).toBe(2);
    expect(hintLevel(sorting({ wrongSubmits: { shape: 9, nebula: 0, cluster: 0 } }))).toBe(3);
    expect(hintLevel(sorting({ stage: null }))).toBe(0);
  });
  it('저장된 값이 음수나 소수여도 0~3의 정수', () => {
    expect(hintLevel(sorting({ wrongSubmits: { shape: -4, nebula: 0, cluster: 0 } }))).toBe(0);
    expect(hintLevel(sorting({ wrongSubmits: { shape: 1.7, nebula: 0, cluster: 0 } }))).toBe(1);
  });
});

describe('finishRegistry', () => {
  it('registry에서 result로', () => {
    expect(finishRegistry({ ...sorting(), phase: 'registry', stage: null }).phase).toBe('result');
  });
});

describe('pickHighlights: 힌트 2단계부터 어긋난 카드를 짚되 한 번에 최대 3장', () => {
  const wrong = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'];

  it('힌트 0~1단계에서는 아무것도 짚지 않는다', () => {
    expect(pickHighlights(wrong, 0, 5, 'shape', 1)).toEqual([]);
    expect(pickHighlights(wrong, 1, 5, 'shape', 1)).toEqual([]);
  });

  it('2단계 이상: 어긋난 카드 중 HIGHLIGHT_MAX(3)장까지', () => {
    expect(HIGHLIGHT_MAX).toBe(3);
    for (const level of [2, 3]) {
      const ids = pickHighlights(wrong, level, 5, 'shape', 2);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      for (const id of ids) expect(wrong).toContain(id);
    }
  });

  it('어긋난 카드가 3장 이하면 모두', () => {
    expect([...pickHighlights(['a', 'b'], 2, 5, 'shape', 2)].sort()).toEqual(['a', 'b']);
    expect(pickHighlights([], 3, 5, 'shape', 2)).toEqual([]);
  });

  it('같은 시드, 단계, 판정 횟수면 같은 카드(새로 고침해도 같다)', () => {
    expect(pickHighlights(wrong, 2, 7, 'nebula', 3)).toEqual(pickHighlights([...wrong], 2, 7, 'nebula', 3));
  });

  it('판정을 거듭하면 짚는 카드가 바뀔 수 있다', () => {
    const picks = new Set();
    for (let n = 2; n <= 12; n++) picks.add(pickHighlights(wrong, 3, 7, 'shape', n).slice().sort().join());
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe('shuffledIds', () => {
  it('같은 시드면 같은 순서, 원소는 그대로', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const x = shuffledIds(5, 'shape', ids);
    expect(shuffledIds(5, 'shape', ids)).toEqual(x);
    expect([...x].sort()).toEqual(ids);
    expect(ids).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
  });
});

describe('처음 틀렸을 때의 말', () => {
  it('몇 장이 어긋났는지와 다시 살펴보라는 말만 한다(분류 용어 없음)', async () => {
    const { SORT_TEXT } = await import('../../src/data/copy.js');
    const s = SORT_TEXT.wrongCount(3);
    expect(s).toContain('3장');
    expect(s).toContain('다시 살펴보세요');
    for (const w of ['성운', '성단', '방출', '반사', '암흑', '산개', '구상']) expect(s).not.toContain(w);
  });
});
