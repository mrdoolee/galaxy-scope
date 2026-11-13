import { readFileSync } from 'node:fs';
import { collectedGame, skipTarget, load, save, repairState, SAVE_KEY } from '../../src/logic/save.js';
import { beginSort } from '../../src/logic/sortFlow.js';
import { OBJECTS } from '../../src/data/objects.js';

const DECK_IDS = OBJECTS.filter((o) => o.deck).map((o) => o.id);

describe('건너뛰기 링크(?skip=sort)', () => {
  it('교사 안내 쪽에만 링크가 있고, 하던 판이 지워진다고 알린다(학생이 보는 첫 화면에는 없다)', () => {
    const teacher = readFileSync('teacher.html', 'utf8');
    expect(teacher).toContain('href="index.html?skip=sort"');
    expect(teacher).toContain('하던 판은 지워집니다');
    expect(readFileSync('index.html', 'utf8')).not.toContain('skip=');
    expect(readFileSync('lesson.html', 'utf8')).not.toContain('skip=');
  });
  it('주소에서 아는 값만 읽는다', () => {
    expect(skipTarget('?skip=sort')).toBe('sort');
    expect(skipTarget('?a=1&skip=sort')).toBe('sort');
    expect(skipTarget('')).toBeNull();
    expect(skipTarget(undefined)).toBeNull();
    expect(skipTarget('?skip=result')).toBeNull();
    expect(skipTarget('?skip=')).toBeNull();
  });
  it('카드를 다 모아 묶기를 시작하기 직전인 판을 만든다', () => {
    const state = collectedGame(7, DECK_IDS);
    expect(state.foundIds).toEqual(DECK_IDS);
    expect(state.foundIds).toHaveLength(20);
    expect(state.phase).toBe('sort');
    expect(state.introSeen).toBe(true);
    expect(state.mission).toBeNull();
    expect(state.ratings).toEqual({});
  });
  it('저장했다가 불러와도 그대로이고, 바로잡을 것이 없으며, 1차 묶기부터 시작한다', () => {
    const state = collectedGame(7, DECK_IDS);
    const box = {};
    const storage = { setItem: (k, v) => { box[k] = v; }, getItem: (k) => box[k] ?? null };
    save(storage, state);
    expect(box[SAVE_KEY]).toBeDefined();
    const loaded = load(storage);
    expect(loaded).toEqual(state);
    expect(repairState(loaded, DECK_IDS)).toBe(loaded);
    expect(beginSort(loaded).stage).toBe('shape');
  });
});
