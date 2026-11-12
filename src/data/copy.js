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
  shape: [
    '이 묶음의 카드들, 별이 하나하나 보이나요?',
    '이 카드는 다른 묶음과 더 닮았어요.',
    '구름처럼 번져 보이는 것과 별이 하나하나 보이는 것으로 나눠 보세요.',
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
