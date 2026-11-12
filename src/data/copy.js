// 학생에게 보이는 글. shape 단계 문장과 cloud/stars 이름에는 "성운", "성단"을 쓰지 않는다(아직 열리기 전이다).
export const BIN_LABELS = {
  cloud: '구름 같은 것',
  stars: '별 무리',
  bright: '밝은 것',
  dark: '어두운 것',
  loose: '엉성하게 모인 것',
  dense: '빽빽하게 모인 것',
};

// 힌트 단계별 문장: [질문, 어긋난 카드 짚기, 기준 제시]. 힌트 N단계는 HINTS[stage][N - 1].
export const HINTS = {
  // 암흑 성운 사진에는 앞뒤로 별이 가득하므로, "별이 보이나요?"가 아니라 구름 덩어리(뿌옇거나 검은)가 있는지를 묻는다.
  shape: [
    '이 묶음의 카드들, 구름 같은 덩어리가 보이나요?',
    '이 카드는 다른 묶음과 더 닮았어요.',
    '뿌옇거나 검은 구름 덩어리가 있는 것과, 별들만 모여 있는 것으로 나눠 보세요.',
  ],
  nebula: [
    '이 묶음의 카드들, 얼마나 환하게 보이나요?',
    '이 카드는 다른 묶음과 더 닮았어요.',
    '색 말고 밝은지 어두운지로 나눠 보세요.',
  ],
  cluster: [
    '이 묶음의 카드들, 별이 얼마나 가까이 모여 있나요?',
    '이 카드는 다른 묶음과 더 닮았어요.',
    '별이 얼마나 빽빽하게 모여 있는지로 나눠 보세요.',
  ],
};

// 본부 의뢰 문장(쉬운 말). 용어 없이 겉모습만 쓴다.
export const PLAIN_REQUEST = {
  emission: '구름처럼 뿌옇고 밝은 것을 찾아 주세요.',
  reflection: '구름처럼 뿌옇고 밝은 것을 찾아 주세요.',
  dark: '구름처럼 뿌연데 어두운 것을 찾아 주세요.',
  open: '별이 엉성하게 모인 것을 찾아 주세요.',
  globular: '별이 공처럼 빽빽하게 뭉친 것을 찾아 주세요.',
};

// 불러오기, 하늘 지도, 구역 훑기 화면의 글. 묶기 전이므로 "성운", "성단"과 다섯 종류 이름을 쓰지 않는다.
// 불러오기 화면과 하늘 지도 구석의 사진 출처 한 줄. 기관과 라이선스는 자료(objects.js)에서 모은다(logic/credits.js).
export const PHOTO_ATTRIBUTION = (agencies, licenses) => `사진: ${agencies.join(' · ')} (${licenses.join(', ')}) · 자세한 출처는 결과 화면`;

export const BOOT_TEXT = {
  loading: (pct) => `불러오는 중… ${pct}%`,
  failed: '사진을 불러오지 못했어요.',
  retry: '다시 시도',
};

export const MAP_TEXT = {
  count: (n, total) => `수집 ${n} / ${total}`,
  free: '열린 별자리를 눌러 하늘을 자유롭게 훑어보세요.',
  picture: (zone, k) => `${zone}에서 이 사진과 닮은 천체 ${k}개를 찾아 주세요.`,
  plain: (zone, k) => `${zone}에서 ${k}개를 찾아 주세요.`,
  done: '다 찾음',
  lockedTap: '카드를 8장 모으면 열려요.',
  unlocked: '새 별자리 구역이 열렸어요!',
};

export const SCAN_TEXT = {
  back: '지도로',
  zoneCount: (n, total) => `이 구역 ${n} / ${total}`,
  start: '손가락으로 천천히 끌어 하늘을 훑어보세요.',
  tooFast: '너무 빨라요! 천천히 움직여야 보여요.',
  found: '무언가 있어요! 확대해 보세요.',
  zoom: '확대',
  focusGuide: '눈금을 좌우로 움직여 초점을 맞추세요.',
  cancel: '그만두기',
  got: '카드를 얻었어요!',
  unknown: '미확인 천체',
  next: '계속 훑기',
  zoneDone: '이 구역은 다 찾았어요.',
  toMap: '지도로 돌아가기',
  allDone: '20장을 모두 모았어요! 이제 카드를 묶어 볼 차례예요.',
  toSort: '묶기 시작',
  request: '의뢰',
  requestElsewhere: (zone) => `의뢰 구역: ${zone}`,
};

// 쉬운 말 의뢰 문장에서 "…것"까지만 떼어 여러 대상을 한 줄로 보여 줄 때 쓴다.
export const plainLook = (sentence) => sentence.replace(/을 찾아 주세요\.$/, '');

// 천 단위마다 쉼표(기기 언어 설정과 상관없이 같게).
export const formatNumber = (n) => {
  const s = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n < 0 ? `-${s}` : s;
};

// 다섯 종류 이름과 교과서 설명 한 줄(설계 문서 4.7). 도감 등록 화면에서 처음 보인다.
export const TYPE_INFO = {
  emission: { nameKo: '방출 성운', line: '주변의 별빛을 흡수해 가열되면서 스스로 빛을 내는 성운' },
  reflection: { nameKo: '반사 성운', line: '주변의 별빛을 반사하여 밝게 보이는 성운' },
  dark: { nameKo: '암흑 성운', line: '뒤쪽에서 오는 별빛을 가로막아 어둡게 보이는 성운' },
  open: { nameKo: '산개 성단', line: '수십~수만 개의 별이 일정한 모양 없이 엉성하게 모여 있는 성단' },
  globular: { nameKo: '구상 성단', line: '수만~수십만 개의 별이 공 모양으로 빽빽하게 모여 있는 성단' },
};

// 묶기 화면에서 단계와 상관없이 보이는 글. "성운", "성단"과 다섯 종류 이름을 쓰지 않는다.
export const SORT_TEXT = {
  judge: '판정',
  incomplete: '아직 놓지 않은 카드가 있어요',
  correct: '맞았어요!',
  close: '닫기',
  putIn: (label) => `${label}에 넣기`,
  takeOut: '카드 줄로 빼기',
  binCount: (n) => `${n}장`,
};

// 묶기 단계별 글. shape에는 "성운", "성단"을 쓰지 않고, 어느 단계에도 다섯 종류 이름을 쓰지 않는다.
export const SORT_STAGE_TEXT = {
  shape: {
    intro: '생김새가 비슷한 카드끼리 두 묶음으로 나눠 보세요. 카드를 위로 끌어 올리거나 눌러서 크게 볼 수 있어요.',
  },
  nebula: {
    reveal: '구름 같은 것은 성운, 별 무리는 성단이라고 불러요.',
    revealNext: '성운부터 나누기',
    intro: '이번에는 성운 카드만 두 묶음으로 나눠 보세요.',
  },
  cluster: {
    intro: '이번에는 성단 카드만 두 묶음으로 나눠 보세요.',
    done: '묶기를 모두 마쳤어요! 이제 카드를 도감에 등록해요.',
    toRegistry: '도감 등록',
  },
};

export const REGISTRY_TEXT = {
  progress: (i, n) => `도감 등록 ${i} / ${n}`,
  next: '다음 카드',
  skipAll: '모두 넘기기',
  tapHint: '화면을 눌러도 다음 카드로 넘어가요.',
  toZones: '별자리별로 보기',
  constellation: (name) => `별자리: ${name}`,
  lightYears: (ly) => `${formatNumber(ly)} 광년`,
  distance: (ly) => `지구에서의 거리: 약 ${formatNumber(ly)} 광년`,
  glow: { emission: '스스로 빛을 낸다', reflection: '별빛을 반사한다' },
  zonesTitle: '별자리별로 모아 보기',
  zonesLine: '같은 별자리 방향에 보여도 거리는 서로 달라요',
  toResult: '결과 보기',
};

export const RESULT_TEXT = {
  title: '관측 결과',
  total: '총점',
  points: (n) => `${formatNumber(n)}점`,
  found: (n) => `카드 발견 ${n}장`,
  stage: { shape: '1차 묶기 (구름 같은 것 / 별 무리)', nebula: '2차 묶기 (성운)', cluster: '2차 묶기 (성단)' },
  stageDetail: (hint, wrong) => `힌트 ${hint}단계 · 틀린 판정 ${wrong}번`,
  allTypes: '다섯 종류 모두 등록',
  full: '20장 완성',
  credits: '사진 출처',
  restart: '처음부터 다시',
  restartConfirm: '한 번 더 누르면 처음부터',
};

export const CREDITS_TEXT = {
  title: '사진 출처',
  edited: '사진 크기를 줄이고 화면에 맞게 잘라 사용함',
  scroll: '위아래로 끌어 넘겨 보세요.',
  credit: (c) => `사진: ${c}`,
  license: (l, url) => (url ? `라이선스: ${l} (${url})` : `라이선스: ${l}`),
  back: '돌아가기',
};

// 보너스 관측의 글. 분류가 끝난 뒤에만 나오므로 종류 이름을 써도 된다(하늘 지도와 훑기 화면에서 bonusOpen일 때만 쓴다).
// 다섯 종류 이름은 모두 받침이 있어 "을"이 맞다. 다른 의뢰처럼 높임말로 부탁한다.
export const TERM_REQUEST = (typeNameKo) => `${typeNameKo}을 하나 더 찾아 주세요.`;

export const BONUS_TEXT = {
  open: '보너스 관측',
  back: '결과 화면으로',
  count: (n, total) => `보너스 ${n} / ${total}`,
  galaxyType: '우리은하 밖에 있는 은하',
  galaxyRequest: '우리은하 밖에 있는 은하를 찾아 주세요.',
  zoneHint: (zone) => `의뢰 구역: ${zone}`,
  allDone: '보너스 천체를 모두 찾았어요! 결과 화면으로 돌아가 보세요.',
  loading: '보너스 사진을 불러오는 중…',
};
