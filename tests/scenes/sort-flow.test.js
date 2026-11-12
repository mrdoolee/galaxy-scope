// 장면 없이 로직만 이어 붙여 한 판의 묶기, 도감 등록, 결과를 흉내 낸다.
import { newGame } from '../../src/logic/save.js';
import { judge, correctBin, nextHintLevel } from '../../src/logic/sorting.js';
import { totalScore, rankFor } from '../../src/logic/scoring.js';
import { beginSort, stageCards, placeCard, submitSort, hintLevel, finishRegistry } from '../../src/logic/sortFlow.js';
import { scoreReport } from '../../src/logic/result.js';
import { OBJECTS } from '../../src/data/objects.js';

const deck = OBJECTS.filter((o) => o.deck);
const collected = () => ({ ...newGame(9), foundIds: deck.map((o) => o.id), phase: 'sort' });

// 지금 단계의 카드를 bin(card)대로 모두 놓는다.
function placeAll(state, binOf) {
  let s = state;
  for (const o of stageCards(s.stage, deck)) s = placeCard(s, o.id, binOf(o), deck);
  return s;
}

describe('한 판의 묶기 흐름', () => {
  it('세 단계를 모두 한 번에 맞히면 도감 등록으로 넘어가고 총점은 4800', () => {
    let s = beginSort(collected());
    expect(s.stage).toBe('shape');
    expect(stageCards('shape', deck)).toHaveLength(20);

    s = placeAll(s, (o) => correctBin('shape', o));
    expect(judge('shape', s.placements, stageCards('shape', deck)).correct).toBe(true);
    let r = submitSort(s, deck);
    expect(r.outcome).toBe('correct');
    s = r.state;

    // 2차: 성운만 추린다
    expect(s.stage).toBe('nebula');
    expect(s.placements).toEqual({});
    expect(stageCards('nebula', deck).every((o) => o.group === 'nebula')).toBe(true);
    s = placeAll(s, (o) => correctBin('nebula', o));
    r = submitSort(s, deck);
    expect(r.outcome).toBe('correct');
    s = r.state;

    // 2차: 성단만 추린다
    expect(s.stage).toBe('cluster');
    expect(stageCards('cluster', deck).every((o) => o.group === 'cluster')).toBe(true);
    expect(stageCards('nebula', deck).length + stageCards('cluster', deck).length).toBe(20);
    s = placeAll(s, (o) => correctBin('cluster', o));
    r = submitSort(s, deck);
    expect(r.outcome).toBe('correct');
    s = r.state;

    expect(s.phase).toBe('registry');
    expect(s.stage).toBeNull();
    expect(s.wrongSubmits).toEqual({ shape: 0, nebula: 0, cluster: 0 });

    s = finishRegistry(s);
    expect(s.phase).toBe('result');
    const report = scoreReport(s, deck);
    const stages = ['shape', 'nebula', 'cluster'].map((st) => ({ cardCount: stageCards(st, deck).length, hintLevel: 0, wrongSubmits: 0 }));
    expect(totalScore({ found: 20, stages, typesRegistered: 5 })).toBe(4800);
    expect(report.total).toBe(4800);
    expect(report.rank).toBe('수석 연구원');
    expect(rankFor(report.total)).toBe('수석 연구원');
  });

  it('1차에서 색으로 묶으면(푸른 반사 성운을 별 무리 쪽에) wrongIds가 나오고 힌트 1단계', () => {
    let s = beginSort(collected());
    s = placeAll(s, (o) => (o.type === 'reflection' ? 'stars' : correctBin('shape', o)));
    const verdict = judge('shape', s.placements, stageCards('shape', deck));
    expect(verdict.complete).toBe(true);
    expect(verdict.correct).toBe(false);
    expect(verdict.wrongIds.sort()).toEqual(deck.filter((o) => o.type === 'reflection').map((o) => o.id).sort());

    const r = submitSort(s, deck);
    expect(r.outcome).toBe('wrong');
    expect(r.state.wrongSubmits.shape).toBe(1);
    expect(nextHintLevel(r.state.wrongSubmits.shape)).toBe(1);
    expect(hintLevel(r.state)).toBe(1);
    expect(r.state.stage).toBe('shape');
    expect(r.state.placements).toEqual(s.placements); // 놓은 카드는 그대로
  });

  it('틀릴수록 힌트가 3단계까지 강해지고, 힌트를 다 써도 끝까지 갈 수 있다', () => {
    let s = beginSort(collected());
    s = placeAll(s, (o) => (o.type === 'reflection' ? 'stars' : correctBin('shape', o)));
    const levels = [];
    for (let i = 0; i < 4; i++) {
      const r = submitSort(s, deck);
      s = r.state;
      levels.push(r.hintLevel);
    }
    expect(levels).toEqual([1, 2, 3, 3]);
    s = placeAll(s, (o) => correctBin('shape', o));
    s = submitSort(s, deck).state;
    s = submitSort(placeAll(s, (o) => correctBin('nebula', o)), deck).state;
    s = submitSort(placeAll(s, (o) => correctBin('cluster', o)), deck).state;
    expect(s.phase).toBe('registry');
    const report = scoreReport(finishRegistry(s), deck);
    // 마구 찍은 만큼 깎인다: 1차는 힌트 3단계 배율과 오답 4번 감점
    expect(report.stages[0].points).toBe(Math.round(20 * 50 * 0.2 - 4 * 30));
    expect(report.total).toBeLessThan(4800);
  });
});
