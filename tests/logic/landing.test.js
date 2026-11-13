import { readFileSync } from 'node:fs';
import { hasSave, startLabel, LANDING_TEXT } from '../../src/landing.js';
import { SAVE_KEY } from '../../src/logic/save.js';

const store = (value) => ({ getItem: (k) => (k === SAVE_KEY ? value : null) });
const FOOTER = '© 2026 Designed &amp; Developed by 두리쌤(@trdoolee). All rights reserved.';

describe('랜딩의 시작 버튼', () => {
  it('하던 판이 없으면 시작, 있으면 이어서', () => {
    expect(startLabel(false)).toBe(LANDING_TEXT.start);
    expect(startLabel(true)).toBe(LANDING_TEXT.resume);
  });
  it('하던 판: 브리핑을 넘겼거나 카드를 찾았다', () => {
    expect(hasSave(store(null))).toBe(false);
    expect(hasSave(store(JSON.stringify({ introSeen: false, foundIds: [] })))).toBe(false);
    expect(hasSave(store(JSON.stringify({ introSeen: true, foundIds: [] })))).toBe(true);
    expect(hasSave(store(JSON.stringify({ foundIds: ['m42'] })))).toBe(true);
  });
  it('저장이 깨졌거나 저장소가 없으면 없는 것으로 본다', () => {
    expect(hasSave(store('{broken'))).toBe(false);
    expect(hasSave(null)).toBe(false);
    expect(hasSave({ getItem() { throw new Error('blocked'); } })).toBe(false);
  });
});

describe('랜딩과 교사 안내 쪽', () => {
  const index = readFileSync('index.html', 'utf8');
  const teacher = readFileSync('teacher.html', 'utf8');
  it('두 쪽 모두 제작자 푸터가 있다', () => {
    expect(index).toContain(FOOTER);
    expect(teacher).toContain(FOOTER);
  });
  it('랜딩에는 게임 제목, 시작 버튼, 교사 안내로 가는 길이 있다', () => {
    expect(index).toContain('별구름');
    expect(index).toContain('id="landing-start"');
    expect(index).toContain('href="teacher.html"');
  });
  it('랜딩 글에는 분류 용어가 없다(묶기 전이다)', () => {
    const landing = index.slice(index.indexOf('<div id="landing">'));
    for (const w of ['성운', '성단', '방출', '반사', '암흑', '산개', '구상']) expect(landing).not.toContain(w);
  });
});

describe('교사 안내의 천체 표', () => {
  it('필수 20장, 보너스, 은하로 나뉘고 31개 천체가 한 번씩 들어간다', async () => {
    const { objectGroups, typeName } = await import('../../src/teacher.js');
    const { OBJECTS } = await import('../../src/data/objects.js');
    const groups = objectGroups();
    expect(groups).toHaveLength(3);
    expect(groups[0].rows).toHaveLength(20);
    const ids = groups.flatMap((g) => g.rows.map((o) => o.id));
    expect(ids).toHaveLength(OBJECTS.length);
    expect(new Set(ids).size).toBe(OBJECTS.length);
    for (const o of OBJECTS) expect(typeName(o).length).toBeGreaterThan(0);
    expect(groups[2].rows.every((o) => o.group === 'galaxy')).toBe(true);
  });
});
