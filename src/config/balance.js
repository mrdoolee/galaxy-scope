export const ZONE_W = 2400;      // 구역 하늘 너비
export const ZONE_H = 1600;      // 구역 하늘 높이
export const VIEW_RADIUS = 260;  // 둥근 시야 반지름
export const EDGE_MARGIN = 200;  // 천체와 구역 가장자리 사이
export const CHART_MIN_GAP = 300; // 구역 안 천체끼리 최소 거리(실제 하늘 자리에서 이만큼만 벌린다)
export const BLUR_SPEED = 900;        // 이 속도(px/초) 이상이면 시야가 흐려짐
export const SMUDGE_SPEED = 400;      // 이 속도 미만일 때만 얼룩이 보임
export const LOCK_RADIUS = 90;        // 시야 중심에서 이 안에 얼룩이 있으면 확대 가능
export const FOCUS_TOLERANCE = 0.08;  // 초점 허용 오차(0~1 눈금)
export const NIGHT_BASE_MS = 20000;       // 밤의 기본 길이
export const NIGHT_PER_TARGET_MS = 50000; // 임무 대상 하나마다 더해지는 밤 길이
export const NIGHT_SAVE_MS = 5000;        // 밤 시계가 가는 동안 이만큼마다 저장(새로 고침으로 잃는 밤은 이 이하)
export const DAY_WAIT_MS = 5000;          // 해가 뜬 뒤 기다리는 시간(해가 하늘을 지나가는 시간)
export const DAY_FADE_MS = 800;           // 하늘이 밝아지는/어두워지는 시간
export const DUSK_HOLD_MS = 700;          // 어두워진 뒤 "다시 밤이 되었어요"를 보여 주는 시간
export const CENTER_GOOD = 35;           // 확대할 때 시야 중심과 천체 사이가 이 안이면 별 1개 더
export const FOCUS_GOOD = 0.03;           // 촬영할 때 초점 오차가 이 안이면 별 1개 더
export const IDLE_NUDGE_MS = 25000;   // 발견 없이 이만큼 지나면 방향 표시

export const DECK_CARDS = 20;           // 한 판의 필수 카드 수(objects.js의 deck: true와 같아야 한다)
export const PICTURE_UNTIL = 10;        // 10장 미만은 그림 임무, 그 뒤는 쉬운 말 임무(임무는 처음부터 나온다)
export const UNLOCK_ALL_AT = 8;         // 8장 모으면 교과서 밖 구역 열림
export const REQUEST_SIZE = 3;
export const SCORE = { find: 100, sortCard: 50, wrongSubmit: -30, allTypes: 300, full: 500, star: 25, earlyMission: 50 };
export const HINT_MULT = [1, 0.7, 0.4, 0.2];   // 힌트 0~3단계
// 결과 화면에 오는 판(20장, 다섯 종류)은 묶기 점수가 0이어도 2800점이다. 기준은 세 경우로 정했고 tests/logic/scoring.test.js가 고정한다.
//  - 정식 4200: 별점·완료 보너스가 0이어도 묶기를 힌트 없이 다 맞히면(4800) 정식이다. 묶기 점수가 1400 이상이어야 한다.
//  - 수석 5600: 묶기를 힌트 없이 맞힌 수집 완벽 판(별점 1000, 완료 10번 = 6300)만 닿는다.
//    묶기를 찍어서 통과한 판(묶기 점수 620)은 별점 1000, 완료 14번을 해도 5120이라 수석이 될 수 없다.
//  - 묶기를 찍고(3420) 수집도 서툴면 수습이다.
export const RANKS = [{ min: 5600, name: '수석 연구원' }, { min: 4200, name: '정식 연구원' }, { min: 0, name: '수습 연구원' }];
export const HIGHLIGHT_MAX = 3;         // 힌트 2단계부터 판정 한 번에 짚어 주는 어긋난 카드 수
export const ZONE_MIN_RATIO = 1.5;      // 별자리별 보기: 가장 먼 것 / 가장 가까운 것이 이 이상인 별자리만
export const ZONE_GROUP_LIMIT = 4;      // 별자리별 보기에 놓는 별자리 수(2×2 칸)
export const GUIDE_NEAR = 260;          // 길잡이 별에서 이 안이면 "바로 옆"
export const GUIDE_MID = 700;           // 이 안이면 "조금", 넘으면 "멀리"
