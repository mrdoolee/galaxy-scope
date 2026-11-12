import { stageScore, totalScore, rankFor, isFull } from '../../src/logic/scoring.js';
import { DECK_CARDS } from '../../src/config/balance.js';

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
    expect(isFull(19)).toBe(false);
    expect(isFull(DECK_CARDS)).toBe(true);
  });
});

describe('rankFor', () => {
  it('경계값: 수석 4000, 정식 3500, 수습 0', () => {
    expect(rankFor(4800)).toBe('수석 연구원');
    expect(rankFor(4000)).toBe('수석 연구원');
    expect(rankFor(3999)).toBe('정식 연구원');
    expect(rankFor(3500)).toBe('정식 연구원');
    expect(rankFor(3499)).toBe('수습 연구원');
    expect(rankFor(2800)).toBe('수습 연구원');
    expect(rankFor(0)).toBe('수습 연구원');
  });

  it('결과 화면에 오는 판(20장, 다섯 종류)의 최저점 2800은 수습 연구원이다', () => {
    const floor = totalScore({
      found: 20,
      typesRegistered: 5,
      stages: [
        { cardCount: 20, hintLevel: 3, wrongSubmits: 9 },
        { cardCount: 12, hintLevel: 3, wrongSubmits: 9 },
        { cardCount: 8, hintLevel: 3, wrongSubmits: 9 },
      ],
    });
    expect(floor).toBe(2800);
    expect(rankFor(floor)).toBe('수습 연구원');
  });

  it('단계마다 한 번씩 틀리면 아직 수석, 두 번씩 틀리면 수습', () => {
    const run = (w) => totalScore({
      found: 20,
      typesRegistered: 5,
      stages: [20, 12, 8].map((cardCount) => ({ cardCount, hintLevel: w, wrongSubmits: w })),
    });
    expect(run(1)).toBe(4110);
    expect(rankFor(run(1))).toBe('수석 연구원');
    expect(run(2)).toBe(3420);
    expect(rankFor(run(2))).toBe('수습 연구원');
    // 1차 두 번, 2차 한 번씩: 340 + 390 + 250 + 2800 = 3780
    const mixed = totalScore({
      found: 20,
      typesRegistered: 5,
      stages: [{ cardCount: 20, hintLevel: 2, wrongSubmits: 2 }, { cardCount: 12, hintLevel: 1, wrongSubmits: 1 }, { cardCount: 8, hintLevel: 1, wrongSubmits: 1 }],
    });
    expect(mixed).toBe(3780);
    expect(rankFor(mixed)).toBe('정식 연구원');
  });
});
