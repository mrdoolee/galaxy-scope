import { MAP_TEXT, SCAN_TEXT, BOOT_TEXT, PLAIN_REQUEST, PHOTO_ATTRIBUTION } from '../../src/data/copy.js';
import { ZONES } from '../../src/data/zones.js';
import { OBJECTS } from '../../src/data/objects.js';
import { photoAgencies, photoLicenses } from '../../src/logic/credits.js';
import { miniFigure } from '../../src/logic/chart.js';

// 묶기 전에는 학생이 아직 분류하지 않았으므로 용어가 화면에 나오면 안 된다.
const BANNED = ['성운', '성단', '방출', '반사', '암흑', '산개', '구상', '은하'];

function strings(obj) {
  return Object.values(obj).flatMap((v) => (typeof v === 'string' ? [v] : typeof v === 'function' ? [v(3, 20), v('X', 2)] : strings(v)));
}

test('하늘 지도·훑기·불러오기 화면 글에 분류 용어가 없다', () => {
  for (const s of [...strings(MAP_TEXT), ...strings(SCAN_TEXT), ...strings(BOOT_TEXT), ...strings(PLAIN_REQUEST)]) {
    for (const w of BANNED) expect(s, s).not.toContain(w);
  }
});

test('훑기 화면 왼쪽 판의 새 글(머리글, 넘김 버튼, 순서 표시)이 있고 분류 용어가 없다', () => {
  const panel = [SCAN_TEXT.target, SCAN_TEXT.nextTarget, SCAN_TEXT.targetIndex(1, 3)];
  expect(SCAN_TEXT.targetIndex(1, 3)).toBe('1 / 3');
  for (const s of panel) {
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(0);
    for (const w of BANNED) expect(s, s).not.toContain(w);
  }
});

test('구역 이름에도 분류 용어가 없다', () => {
  for (const z of ZONES) for (const w of BANNED) expect(z.nameKo).not.toContain(w);
});

// 하늘 지도의 작은 별자리 그림(SkyMapScene이 miniFigure(zone.id, 44)로 그린다)은 88×88 터치 대상 안에 머물고,
// 표시 아래 4px 띄운 이름표(가운데가 표시 가운데에서 60px 아래, 24px 글씨)에 닿지 않는다.
test('구역마다 작은 별자리 그림이 있고, 선은 별 번호를 가리키며 터치 대상 안, 이름표 위에 머문다', () => {
  const TARGET_HALF = 44, LABEL_TOP = 44 + 4;
  for (const z of ZONES) {
    const { stars, segs } = miniFigure(z.id, 44);
    expect(stars.length).toBeGreaterThanOrEqual(2); // 사냥개자리는 실제로 밝은 별 둘
    expect(segs.length).toBeGreaterThanOrEqual(1);
    for (const [dx, dy] of stars) {
      expect(Math.abs(dx)).toBeLessThanOrEqual(TARGET_HALF + 1e-9);
      expect(Math.abs(dy)).toBeLessThanOrEqual(TARGET_HALF + 1e-9);
      expect(dy).toBeLessThan(LABEL_TOP);
    }
    for (const [i, j] of segs) {
      expect(stars[i]).toBeDefined();
      expect(stars[j]).toBeDefined();
    }
  }
});

test('보너스 용어 의뢰 문장: 다섯 종류 이름은 모두 받침이 있어 "을"로 이어지고, 다른 의뢰처럼 높임말로 부탁한다', async () => {
  const { TERM_REQUEST, TYPE_INFO, BONUS_TEXT } = await import('../../src/data/copy.js');
  for (const info of Object.values(TYPE_INFO)) {
    const last = info.nameKo.charCodeAt(info.nameKo.length - 1);
    expect((last - 0xac00) % 28).not.toBe(0); // 받침 있음
    expect(TERM_REQUEST(info.nameKo)).toBe(`${info.nameKo}을 하나 더 찾아 주세요.`);
  }
  expect(BONUS_TEXT.galaxyType).toBe('우리은하 밖에 있는 은하');
  expect(BONUS_TEXT.galaxyRequest).toBe('우리은하 밖에 있는 은하를 찾아 주세요.');
  for (const s of [TERM_REQUEST('X'), BONUS_TEXT.galaxyRequest]) expect(s).not.toContain('찾아라');
});

test('불러오기 화면과 하늘 지도의 사진 출처 한 줄: 자료로 만들고, 분류 용어가 없다', () => {
  const line = PHOTO_ATTRIBUTION(photoAgencies(OBJECTS), photoLicenses(OBJECTS));
  expect(line).toBe('사진: ESO · NOIRLab · ESA/Hubble (CC BY 4.0) · 자세한 출처는 결과 화면');
  for (const w of BANNED) expect(line).not.toContain(w);
});
