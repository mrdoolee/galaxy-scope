export const ZONE_W = 2400;      // 구역 하늘 너비
export const ZONE_H = 1600;      // 구역 하늘 높이
export const VIEW_RADIUS = 260;  // 둥근 시야 반지름
export const EDGE_MARGIN = 200;  // 천체와 구역 가장자리 사이
export const CHART_MIN_GAP = 300; // 구역 안 천체끼리 최소 거리(실제 하늘 자리에서 이만큼만 벌린다)
export const BLUR_SPEED = 900;        // 이 속도(px/초) 이상이면 시야가 흐려짐
export const SMUDGE_SPEED = 400;      // 이 속도 미만일 때만 얼룩이 보임
export const LOCK_RADIUS = 90;        // 시야 중심에서 이 안에 얼룩이 있으면 확대 가능
export const FOCUS_TOLERANCE = 0.08;  // 초점 허용 오차(0~1 눈금)
export const FOCUS_HOLD_MS = 500;     // 이 시간 동안 맞춰야 촬영
export const IDLE_NUDGE_MS = 25000;   // 발견 없이 이만큼 지나면 방향 표시

export const DECK_CARDS = 20;           // 한 판의 필수 카드 수(objects.js의 deck: true와 같아야 한다)
export const FREE_UNTIL = 4;           // 4장 모을 때까지 의뢰 없음
export const PICTURE_UNTIL = 10;        // 10장까지 그림 의뢰, 그 뒤 쉬운 말 의뢰
export const UNLOCK_ALL_AT = 8;         // 8장 모으면 교과서 밖 구역 열림
export const REQUEST_SIZE = 3;
export const SCORE = { find: 100, sortCard: 50, wrongSubmit: -30, allTypes: 300, full: 500 };
export const HINT_MULT = [1, 0.7, 0.4, 0.2];   // 힌트 0~3단계
// 결과 화면에 오는 판(20장, 다섯 종류)은 묶기 점수가 0이어도 2800점이므로, 정식은 묶기 점수가 700점 넘어야 한다.
export const RANKS = [{ min: 4000, name: '수석 연구원' }, { min: 3500, name: '정식 연구원' }, { min: 0, name: '수습 연구원' }];
export const HIGHLIGHT_MAX = 3;         // 힌트 2단계부터 판정 한 번에 짚어 주는 어긋난 카드 수
export const ZONE_MIN_RATIO = 1.5;      // 별자리별 보기: 가장 먼 것 / 가장 가까운 것이 이 이상인 별자리만
export const ZONE_GROUP_LIMIT = 4;      // 별자리별 보기에 놓는 별자리 수(2×2 칸)
