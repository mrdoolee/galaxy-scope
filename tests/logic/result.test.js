import { newGame } from '../../src/logic/save.js';
import { scoreReport, rankLevel } from '../../src/logic/result.js';
import { totalScore, rankFor } from '../../src/logic/scoring.js';
import { OBJECTS } from '../../src/data/objects.js';

const deck = OBJECTS.filter((o) => o.deck);
const done = (wrongSubmits) => ({ ...newGame(2), foundIds: deck.map((o) => o.id), phase: 'result', wrongSubmits });

describe('scoreReport', () => {
  it('저장된 상태로 totalScore와 같은 총점과 등급을 낸다', () => {
    const s = done({ shape: 1, nebula: 2, cluster: 5 });
    const r = scoreReport(s, deck);
    const stages = [
      { cardCount: 20, hintLevel: 1, wrongSubmits: 1 },
      { cardCount: 12, hintLevel: 2, wrongSubmits: 2 },
      { cardCount: 8, hintLevel: 3, wrongSubmits: 5 },
    ];
    expect(r.total).toBe(totalScore({ found: 20, stages, typesRegistered: 5 }));
    expect(r.rank).toBe(rankFor(r.total));
    expect(r.stages.map((x) => [x.stage, x.cardCount, x.hintLevel, x.wrongSubmits])).toEqual([
      ['shape', 20, 1, 1], ['nebula', 12, 2, 2], ['cluster', 8, 3, 5],
    ]);
    expect(r.found).toBe(20);
    expect(r.findPoints).toBe(2000);
    expect(r.typesRegistered).toBe(5);
    expect(r.allTypesPoints).toBe(300);
    expect(r.fullPoints).toBe(500);
    // 항목을 더하면 총점
    expect(r.findPoints + r.stages.reduce((a, x) => a + x.points, 0) + r.allTypesPoints + r.fullPoints).toBe(r.total);
  });

  it('힌트 없이 다 맞히면 4800, 수석 연구원', () => {
    const r = scoreReport(done({ shape: 0, nebula: 0, cluster: 0 }), deck);
    expect(r.total).toBe(4800);
    expect(r.rank).toBe('수석 연구원');
    expect(r.rankLevel).toBe(3);
  });

  it('덱에 없는 id는 세지 않고, 저장된 이상한 틀린 횟수는 0 이상의 정수로 본다', () => {
    const s = { ...done({ shape: -3, nebula: 1.5, cluster: 0 }), foundIds: [...deck.map((o) => o.id), 'ghost'] };
    const r = scoreReport(s, deck);
    expect(r.found).toBe(20);
    expect(Number.isFinite(r.total)).toBe(true);
    expect(r.stages[0].wrongSubmits).toBe(0);
    expect(r.stages[1]).toMatchObject({ wrongSubmits: 1, hintLevel: 1 });
  });
});

describe('rankLevel', () => {
  it('수습 1, 정식 2, 수석 3', () => {
    expect(rankLevel('수습 연구원')).toBe(1);
    expect(rankLevel('정식 연구원')).toBe(2);
    expect(rankLevel('수석 연구원')).toBe(3);
  });
});
