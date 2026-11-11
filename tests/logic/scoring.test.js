import { stageScore, totalScore, rankFor } from '../../src/logic/scoring.js';

describe('stageScore', () => {
  it('힌트 없이 전부 맞히면 카드당 50점', () => {
    expect(stageScore(20, 0, 0)).toBe(1000);
  });
  it('힌트 배율과 오답 감점', () => {
    expect(stageScore(20, 1, 1)).toBe(670);
  });
  it('0 미만이면 0', () => {
    expect(stageScore(8, 3, 9)).toBe(0);
  });
});

describe('totalScore', () => {
  const clean = {
    found: 20,
    typesRegistered: 5,
    stages: [
      { cardCount: 20, hintLevel: 0, wrongSubmits: 0 },
      { cardCount: 12, hintLevel: 0, wrongSubmits: 0 },
      { cardCount: 8, hintLevel: 0, wrongSubmits: 0 },
    ],
  };
  it('힌트 없이 전부 맞힌 한 판은 4800', () => {
    expect(totalScore(clean)).toBe(4800);
  });
  it('종류를 다 못 채우면 allTypes 보너스 없음', () => {
    expect(totalScore({ ...clean, typesRegistered: 4 })).toBe(4500);
  });
  it('20장 미만이면 full 보너스 없음', () => {
    expect(totalScore({ ...clean, found: 19 })).toBe(4800 - 100 - 500);
  });
});

describe('rankFor', () => {
  it('경계값', () => {
    expect(rankFor(4800)).toBe('수석 연구원');
    expect(rankFor(4000)).toBe('수석 연구원');
    expect(rankFor(3999)).toBe('정식 연구원');
    expect(rankFor(2800)).toBe('정식 연구원');
    expect(rankFor(2799)).toBe('수습 연구원');
    expect(rankFor(0)).toBe('수습 연구원');
  });
});
