import { TYPE_INFO, BIN_LABELS, HINTS, SORT_TEXT, SORT_STAGE_TEXT, REGISTRY_TEXT, RESULT_TEXT, CREDITS_TEXT, formatNumber } from '../../src/data/copy.js';
import { TYPES } from '../../src/data/objects.js';
import { STAGES } from '../../src/logic/sorting.js';

describe('TYPE_INFO', () => {
  it('다섯 종류를 모두 갖고, 교과서 문장과 글자 그대로 같다', () => {
    expect(Object.keys(TYPE_INFO).sort()).toEqual([...TYPES].sort());
    expect(TYPE_INFO.emission).toEqual({ nameKo: '방출 성운', line: '주변의 별빛을 흡수해 가열되면서 스스로 빛을 내는 성운' });
    expect(TYPE_INFO.reflection).toEqual({ nameKo: '반사 성운', line: '주변의 별빛을 반사하여 밝게 보이는 성운' });
    expect(TYPE_INFO.dark).toEqual({ nameKo: '암흑 성운', line: '뒤쪽에서 오는 별빛을 가로막아 어둡게 보이는 성운' });
    expect(TYPE_INFO.open).toEqual({ nameKo: '산개 성단', line: '수십~수만 개의 별이 일정한 모양 없이 엉성하게 모여 있는 성단' });
    expect(TYPE_INFO.globular).toEqual({ nameKo: '구상 성단', line: '수만~수십만 개의 별이 공 모양으로 빽빽하게 모여 있는 성단' });
  });
});

// 함수로 된 문장은 여러 값으로 불러 본다.
function strings(v) {
  if (typeof v === 'string') return [v];
  if (typeof v === 'function') return [v(3, 20), v(0, 0), v(12345, 1)].map(String);
  if (Array.isArray(v)) return v.flatMap(strings);
  return Object.values(v).flatMap(strings);
}

// 다섯 종류 이름(앞말만 봐도 된다)은 도감 등록 전까지 묶기 화면에 나오면 안 된다.
const TYPE_WORDS = ['방출', '반사', '암흑', '산개', '구상'];
const GROUP_WORDS = ['성운', '성단'];

// 묶기 단계마다 화면에 나올 수 있는 글: 공통 글, 그 단계 글, 그 단계 힌트, 그 단계 묶음 이름.
function sortScreen(stage) {
  return [
    ...strings(SORT_TEXT),
    ...strings(SORT_STAGE_TEXT[stage]),
    ...HINTS[stage],
    ...STAGES[stage].bins.map((b) => BIN_LABELS[b]),
  ];
}

describe('묶기 화면 글', () => {
  it('1차(shape)에는 성운, 성단, 다섯 종류 이름이 없다', () => {
    for (const s of sortScreen('shape')) for (const w of [...GROUP_WORDS, ...TYPE_WORDS]) expect(s, s).not.toContain(w);
  });

  it.each(['nebula', 'cluster'])('2차(%s)에는 다섯 종류 이름이 없다', (stage) => {
    for (const s of sortScreen(stage)) for (const w of TYPE_WORDS) expect(s, s).not.toContain(w);
  });

  it('1차를 통과하면 성운과 성단 이름을 알려 준다', () => {
    expect(SORT_STAGE_TEXT.nebula.reveal).toContain('성운');
    expect(SORT_STAGE_TEXT.nebula.reveal).toContain('성단');
  });

  it('판정 때 다 놓지 않았으면 이 문장만 띄운다', () => {
    expect(SORT_TEXT.incomplete).toBe('아직 놓지 않은 카드가 있어요');
  });

  it('단계마다 시작 안내가 있다', () => {
    for (const stage of Object.keys(STAGES)) expect(SORT_STAGE_TEXT[stage].intro.length).toBeGreaterThan(0);
  });
});

describe('도감, 결과, 출처 화면 글', () => {
  it('방출 성운과 반사 성운의 차이를 짧게 강조한다', () => {
    expect(REGISTRY_TEXT.glow.emission).toBe('스스로 빛을 낸다');
    expect(REGISTRY_TEXT.glow.reflection).toBe('별빛을 반사한다');
  });

  it('구역별 보기 문장', () => {
    expect(REGISTRY_TEXT.zonesLine).toBe('같은 별자리 방향에 보여도 거리는 서로 달라요');
  });

  it('거리는 천 단위 쉼표와 광년으로 쓴다', () => {
    expect(REGISTRY_TEXT.distance(17000)).toContain('17,000 광년');
    expect(REGISTRY_TEXT.lightYears(1400)).toBe('1,400 광년');
    expect(REGISTRY_TEXT.lightYears(500)).toBe('500 광년');
  });

  it('출처 화면에 줄이고 잘랐다는 말이 있다', () => {
    expect(CREDITS_TEXT.edited).toBe('사진 크기를 줄이고 화면에 맞게 잘라 사용함');
  });

  it('출처 화면의 라이선스 줄에 라이선스 주소가 함께 나온다', () => {
    expect(CREDITS_TEXT.license('CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'))
      .toBe('라이선스: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)');
  });

  it('결과 화면 버튼', () => {
    expect(RESULT_TEXT.restart).toBe('처음부터 다시');
    expect(RESULT_TEXT.credits).toBe('사진 출처');
  });
});

describe('formatNumber', () => {
  it('천 단위마다 쉼표', () => {
    expect([0, 999, 1000, 4800, 25000000, -30].map(formatNumber)).toEqual(['0', '999', '1,000', '4,800', '25,000,000', '-30']);
  });
});
