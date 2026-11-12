import { existsSync } from 'node:fs';
import { OBJECTS, TYPES } from '../../src/data/objects.js';
import { ZONES } from '../../src/data/zones.js';
const deck = OBJECTS.filter((o) => o.deck);
test('필수 카드는 20장', () => { expect(deck).toHaveLength(20); });
test('다섯 종류가 각각 3장 이상', () => {
  for (const t of TYPES) expect(deck.filter((o) => o.type === t).length).toBeGreaterThanOrEqual(3);
});
test('필수 카드에 외부 은하 없음', () => { expect(deck.some((o) => o.group === 'galaxy')).toBe(false); });
test('id가 겹치지 않음', () => { expect(new Set(OBJECTS.map((o) => o.id)).size).toBe(OBJECTS.length); });
test('모든 천체의 구역이 구역 목록에 있음', () => {
  const ids = new Set(ZONES.map((z) => z.id));
  for (const o of OBJECTS) expect(ids.has(o.zone)).toBe(true);
});
test('사진 파일과 출처가 모두 있음', () => {
  for (const o of OBJECTS) {
    expect(existsSync(`public/${o.photo.file}`)).toBe(true);
    expect(o.photo.pageUrl).toMatch(/^https:\/\//);
    expect(o.photo.credit.length).toBeGreaterThan(0);
    expect(o.photo.license.length).toBeGreaterThan(0);
  }
});
test('교과서 지정 네 구역이 있음', () => {
  expect(ZONES.filter((z) => z.textbook).map((z) => z.id).sort()).toEqual(['orion', 'sagittarius', 'scorpius', 'taurus']);
});

// 8장을 찾아야 다른 구역이 열리므로, 교과서 네 구역에 필수 카드가 8장 이상 없으면 진행이 막힌다.
test('교과서 네 구역에 필수 카드가 8장 이상', () => {
  const textbook = new Set(ZONES.filter((z) => z.textbook).map((z) => z.id));
  expect(deck.filter((o) => textbook.has(o.zone)).length).toBeGreaterThanOrEqual(8);
});
test('한 구역의 필수 카드는 6장 이하', () => {
  for (const z of ZONES) expect(deck.filter((o) => o.zone === z.id).length).toBeLessThanOrEqual(6);
});
test('보너스용 외부 은하가 3개 이상이고 모두 필수 카드 밖', () => {
  const galaxies = OBJECTS.filter((o) => o.group === 'galaxy');
  expect(galaxies.length).toBeGreaterThanOrEqual(3);
  for (const g of galaxies) expect(g.deck).toBe(false);
});
test('다섯 종류마다 필수 카드 밖의 천체가 1개 이상', () => {
  for (const t of TYPES) expect(OBJECTS.some((o) => !o.deck && o.type === t)).toBe(true);
});
test('종류와 대분류가 서로 맞음', () => {
  const groupOf = { emission: 'nebula', reflection: 'nebula', dark: 'nebula', open: 'cluster', globular: 'cluster', spiral: 'galaxy' };
  for (const o of OBJECTS) expect(o.group).toBe(groupOf[o.type]);
});
test('id가 사진 파일 이름과 같고 거리가 양수', () => {
  for (const o of OBJECTS) {
    expect(o.id).toMatch(/^[a-z0-9]+$/);
    expect(o.photo.file).toBe(`photos/${o.id}.jpg`);
    expect(o.distanceLy).toBeGreaterThan(0);
  }
});

// 하늘 지도: 88×88 터치 대상과 그 아래 이름표가 서로 겹치지 않고, 위쪽 110px은 비운다.
// 이름표는 24px 글씨(학생 글 최소 크기): 너비는 글자 수 × 24 + 테두리 여유 12, 높이 28.
const TARGET = 88, FONT = 24, LABEL_H = 28, LABEL_GAP = 4;
function boxesOf(z) {
  const h = TARGET / 2;
  const w = z.nameKo.length * FONT + 12;
  return [
    { l: z.mapX - h, r: z.mapX + h, t: z.mapY - h, b: z.mapY + h },
    { l: z.mapX - w / 2, r: z.mapX + w / 2, t: z.mapY + h + LABEL_GAP, b: z.mapY + h + LABEL_GAP + LABEL_H },
  ];
}
const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
test('구역 위치가 화면 안이고 위쪽 110px을 비움', () => {
  for (const z of ZONES) {
    for (const box of boxesOf(z)) {
      expect(box.l).toBeGreaterThanOrEqual(0);
      expect(box.r).toBeLessThanOrEqual(1280);
      expect(box.t).toBeGreaterThanOrEqual(110);
      expect(box.b).toBeLessThanOrEqual(720);
    }
  }
});
test('구역의 터치 대상과 이름표가 서로 겹치지 않음', () => {
  for (let i = 0; i < ZONES.length; i++) {
    for (let j = i + 1; j < ZONES.length; j++) {
      for (const a of boxesOf(ZONES[i])) for (const b of boxesOf(ZONES[j])) expect(overlap(a, b)).toBe(false);
    }
  }
});

test('보너스 천체의 종류는 외부 은하이거나 TYPE_INFO에 있어, 어떤 보너스 카드도 빈 칸 없이 그려진다', async () => {
  const { TYPE_INFO } = await import('../../src/data/copy.js');
  for (const o of OBJECTS.filter((x) => !x.deck)) {
    if (o.group === 'galaxy') continue; // 카드 글은 BONUS_TEXT.galaxyType
    expect(TYPE_INFO[o.type], o.id).toBeDefined();
    expect(TYPE_INFO[o.type].nameKo).toBeTruthy();
  }
  expect(OBJECTS.filter((x) => x.group === 'galaxy' && x.deck)).toHaveLength(0);
});
