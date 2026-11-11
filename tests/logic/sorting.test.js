import { STAGES, correctBin, judge, nextHintLevel } from '../../src/logic/sorting.js';
import { HINTS, BIN_LABELS } from '../../src/data/copy.js';

const o = (id, group, type) => ({ id, group, type });
const NEBULA = [o('a', 'nebula', 'emission'), o('b', 'nebula', 'reflection'), o('c', 'nebula', 'dark')];
const CLUSTER = [o('d', 'cluster', 'open'), o('e', 'cluster', 'globular')];
const ALL = [...NEBULA, ...CLUSTER];

describe('correctBin', () => {
  it('shape: 성운은 cloud, 성단은 stars', () => {
    expect(correctBin('shape', NEBULA[0])).toBe('cloud');
    expect(correctBin('shape', NEBULA[1])).toBe('cloud');
    expect(correctBin('shape', NEBULA[2])).toBe('cloud');
    expect(correctBin('shape', CLUSTER[0])).toBe('stars');
    expect(correctBin('shape', CLUSTER[1])).toBe('stars');
  });
  it('nebula: 방출·반사는 bright, 암흑은 dark', () => {
    expect(correctBin('nebula', NEBULA[0])).toBe('bright');
    expect(correctBin('nebula', NEBULA[1])).toBe('bright');
    expect(correctBin('nebula', NEBULA[2])).toBe('dark');
  });
  it('cluster: 산개는 loose, 구상은 dense', () => {
    expect(correctBin('cluster', CLUSTER[0])).toBe('loose');
    expect(correctBin('cluster', CLUSTER[1])).toBe('dense');
  });
  it('STAGES의 묶음 이름이 BIN_LABELS에 모두 있다', () => {
    for (const s of Object.values(STAGES)) for (const b of s.bins) expect(BIN_LABELS[b]).toBeTruthy();
  });
});

describe('judge', () => {
  const right = { a: 'cloud', b: 'cloud', c: 'cloud', d: 'stars', e: 'stars' };
  it('전부 맞게 놓으면 통과', () => {
    expect(judge('shape', right, ALL)).toEqual({ complete: true, correct: true, wrongIds: [] });
  });
  it('한 장을 틀리게 놓으면 그 id만 wrongIds', () => {
    expect(judge('shape', { ...right, d: 'cloud' }, ALL)).toEqual({ complete: true, correct: false, wrongIds: ['d'] });
  });
  it('한 장을 안 놓으면(null) 판정하지 않는다', () => {
    expect(judge('shape', { ...right, c: null }, ALL)).toEqual({ complete: false, correct: false, wrongIds: [] });
  });
  it('placements에 없는 id도 안 놓은 것으로 센다', () => {
    const { c, ...rest } = right;
    expect(judge('shape', rest, ALL)).toEqual({ complete: false, correct: false, wrongIds: [] });
  });
  it('단계별 objects만 본다', () => {
    expect(judge('nebula', { a: 'bright', b: 'bright', c: 'dark' }, NEBULA).correct).toBe(true);
    expect(judge('nebula', { a: 'bright', b: 'dark', c: 'dark' }, NEBULA).wrongIds).toEqual(['b']);
    expect(judge('cluster', { d: 'loose', e: 'dense' }, CLUSTER).correct).toBe(true);
  });
});

describe('nextHintLevel', () => {
  it('틀린 횟수에 따라 오르고 3에서 멈춘다', () => {
    expect([0, 1, 2, 3, 7].map(nextHintLevel)).toEqual([0, 1, 2, 3, 3]);
  });
});

describe('HINTS', () => {
  it('단계마다 비어 있지 않은 문장 3개', () => {
    for (const stage of Object.keys(STAGES)) {
      expect(HINTS[stage]).toHaveLength(3);
      for (const s of HINTS[stage]) expect(s.trim().length).toBeGreaterThan(0);
    }
  });
  it('nebula 3단계와 모든 2단계는 정해진 문장', () => {
    expect(HINTS.nebula[2]).toBe('색 말고 밝은지 어두운지로 나눠 보세요.');
    for (const stage of Object.keys(STAGES)) expect(HINTS[stage][1]).toBe('이 카드는 다른 묶음과 더 닮았어요.');
    expect(HINTS.shape[0]).toBe('이 묶음의 카드들, 별이 하나하나 보이나요?');
  });
  it('shape 문장과 cloud/stars 이름에는 성운·성단이 없다', () => {
    const texts = [...HINTS.shape, BIN_LABELS.cloud, BIN_LABELS.stars];
    for (const t of texts) expect(t).not.toMatch(/성운|성단/);
  });
});
