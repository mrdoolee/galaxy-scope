import { newGame, repairState, recordFind } from '../../src/logic/save.js';
import { openBonus, inBonus, recordBonusFind, bonusProgress } from '../../src/logic/bonus.js';
import { scoreReport } from '../../src/logic/result.js';
import { OBJECTS } from '../../src/data/objects.js';
import { sceneForState } from '../../src/scenes/gameState.js';
import { SCENES } from '../../src/config/game.js';

const deck = OBJECTS.filter((o) => o.deck);
const bonus = OBJECTS.filter((o) => !o.deck);
const finished = () => ({ ...newGame(3), phase: 'result', foundIds: deck.map((o) => o.id) });

describe('보너스 열기', () => {
  it('결과 단계에서만 열리고, 결과 단계는 그대로 둔다', () => {
    const s = openBonus(finished());
    expect(s.bonusOpen).toBe(true);
    expect(s.phase).toBe('result');
    expect(inBonus(s)).toBe(true);
    const c = newGame(1);
    expect(openBonus(c)).toBe(c);
    expect(inBonus(c)).toBe(false);
  });
});

describe('보너스 발견', () => {
  it('foundIds에 넣되 단계는 바꾸지 않는다(recordFind는 sort로 보냈을 것)', () => {
    const s = openBonus(finished());
    const next = recordBonusFind(s, bonus[0].id);
    expect(next.foundIds).toContain(bonus[0].id);
    expect(next.phase).toBe('result');
    expect(recordBonusFind(next, bonus[0].id)).toBe(next);
    // 결과 단계의 판에 recordFind를 썼다면 필수 카드가 다 있으니 sort로 보냈을 것이다.
    expect(recordFind(s, bonus[0].id, deck.map((o) => o.id)).phase).toBe('sort');
  });

  it('보너스를 찾아도 점수와 발견 수는 그대로다', () => {
    const s = openBonus(finished());
    const before = scoreReport(s, deck);
    const all = bonus.reduce((st, o) => recordBonusFind(st, o.id), s);
    const after = scoreReport(all, deck);
    expect(after).toEqual(before);
    expect(after.found).toBe(20);
  });

  it('진행 수', () => {
    const s = recordBonusFind(openBonus(finished()), bonus[0].id);
    expect(bonusProgress(s, OBJECTS)).toEqual({ found: 1, total: bonus.length });
  });
});

describe('불러온 판 바로잡기', () => {
  const ids = deck.map((o) => o.id);

  it('묶기 이후 단계에서 필수 카드가 모자라면 모으기로 되돌린다', () => {
    for (const phase of ['sort', 'registry', 'result']) {
      const s = { ...newGame(1), phase, stage: 'nebula', placements: { m42: 'bright' }, foundIds: ids.slice(0, 19), bonusOpen: phase === 'result' };
      const r = repairState(s, ids);
      expect(r.phase).toBe('collect');
      expect(r.stage).toBeNull();
      expect(r.placements).toEqual({});
      expect(r.bonusOpen).toBe(false);
      expect(r.foundIds).toEqual(ids.slice(0, 19));
    }
  });

  it('보너스 id만 많아도 필수 카드가 모자라면 되돌린다', () => {
    const s = { ...newGame(1), phase: 'sort', foundIds: [...ids.slice(0, 15), ...bonus.map((o) => o.id)] };
    expect(repairState(s, ids).phase).toBe('collect');
  });

  it('멀쩡한 판은 그대로(같은 객체)', () => {
    const ok = openBonus(finished());
    expect(repairState(ok, ids)).toBe(ok);
    const collecting = { ...newGame(1), foundIds: ids.slice(0, 5) };
    expect(repairState(collecting, ids)).toBe(collecting);
  });

  it('결과 단계가 아니면 bonusOpen을 끈다', () => {
    const s = { ...newGame(1), foundIds: ids, phase: 'sort', bonusOpen: true };
    expect(repairState(s, ids).bonusOpen).toBe(false);
  });
});

describe('불러오기 길', () => {
  it('결과 단계에서 보너스가 열려 있으면 하늘 지도, 아니면 결과 화면', () => {
    expect(sceneForState(openBonus(finished()))).toBe(SCENES.SKY_MAP);
    expect(sceneForState(finished())).toBe(SCENES.RESULT);
    expect(sceneForState(newGame(1))).toBe(SCENES.SKY_MAP);
    expect(sceneForState({ ...newGame(1), phase: 'sort' })).toBe(SCENES.SORT);
  });

  it('새 판은 보너스가 닫혀 있고 발견이 없다(처음부터 다시가 쓰는 판)', () => {
    const fresh = newGame(9);
    expect(fresh.bonusOpen).toBe(false);
    expect(fresh.foundIds).toEqual([]);
  });
});
