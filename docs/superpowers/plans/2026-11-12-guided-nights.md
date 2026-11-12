# 길잡이 별과 밤 임무 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수집 단계를 "임무를 받고, 별자리의 밝은 별을 길잡이 삼아 찾아가, 솜씨 있게 촬영하고, 동트기 전에 마치는" 흐름으로 바꾼다.

**Architecture:** 천체와 별의 실제 적경·적위를 자료로 두고, 순수 함수가 구역 화면 자리로 옮긴다. 길잡이 단서는 그 자리에서 계산한다. 임무·밤 시계·촬영 평가·점수 규칙은 `src/logic/`의 순수 함수이고 저장 상태에 들어간다. 장면은 규칙을 불러 그리기만 한다.

**Tech Stack:** Vite 8, Phaser 4.2.1, vitest 5(`globals: true`), JavaScript ES 모듈. 지금 코드의 폴더 규칙(`src/logic`, `src/scenes`, `src/scenes/ui`, `src/data`, `src/config`, `tests/`)을 따른다.

**Spec:** `docs/superpowers/specs/2026-11-12-guided-nights-design.md` (바탕 설계: `docs/superpowers/specs/2026-11-11-galaxy-archive-design.md`)

## Global Constraints

- 커밋 설명과 학생에게 보이는 글은 한국어(공손한 말투). 코드 식별자는 영어.
- 가로 화면 고정, 터치 조작, 설계 해상도 1280×720. 터치 대상 최소 88×88, 글자 최소 24 설계 px.
- 규칙은 `src/logic/`의 순수 함수(Phaser import 없음), 수치는 `src/config/balance.js`, 문장은 `src/data/copy.js`. 장면에 시험 없는 규칙을 두지 않는다.
- 묶기 전 화면(불러오기, 하늘 지도, 구역 훑기)에는 "성운", "성단"과 다섯 종류 이름을 쓰지 않는다. 길잡이 이름과 단서 문장도 마찬가지다. 보너스 관측 중에는 써도 된다.
- 게임 그림은 OpenAI 이미지 생성 API로 만든다(`tools/art-manifest.json` + `node --env-file=.env tools/gen-art.mjs`). `.env`는 읽어서 출력하지 않고 커밋하지 않는다. 별자리 선과 별, 시간 막대, 낮 하늘의 색 변화는 코드로 그려도 된다.
- 빠르게 움직이면 얼룩이 보이지 않는 규칙(`SMUDGE_SPEED`, `BLUR_SPEED`)은 바꾸지 않는다.
- 해가 떠도 잃는 것은 없다. 낮 기다림은 5초이고 건너뛸 수 없다.
- 저장 키 `galaxy-archive-save-v1`은 바꾸지 않는다. 예전 저장은 새 항목을 기본값으로 채워 이어 한다.
- 필수 카드 20장의 구성, 묶기·도감·출처 화면의 동작은 바꾸지 않는다.
- git·npm 명령은 `galaxy-scope/` 안에서만. push 하지 않는다.

## Review Focus

1. 밤 도중이나 낮 기다림 도중에 새로 고침했을 때: 밤 시간이 되돌아가지 않고, 낮에 멈춘 채 갇히지 않아야 한다. (Task 3, Task 6)
2. 이 기능 전에 저장된 판(새 항목 없음)을 열었을 때: 오류 없이 이어 하고, 모은 카드가 그대로여야 한다. (Task 3)
3. 초점을 맞추는 중이나 카드 화면에서 밤 시간이 다 됐을 때: 그 촬영은 끝까지 되고, 그 뒤에 해가 뜬다. 임무의 마지막 대상을 그렇게 찍었으면 동트기 전 완료로 친다. (Task 3, Task 6)
4. 낮 기다림이나 밤 도중에 기기를 세로로 돌리거나 다른 창으로 갔을 때: 시계와 기다림이 함께 멈추고, 돌아오면 이어진다. (Task 6)
5. 단서가 가리키는 방향이 화면의 실제 자리와 어긋날 때: 31개 천체 모두 단서의 방향과 거리 구분이 배치와 맞아야 한다. (Task 2)

---

## File Structure

```
src/data/sky.js                 구역별 하늘 자료(창, 밝은 별, 선, 길잡이)          새로
src/data/objects.js             천체에 ra, dec 추가                               고침
src/data/zones.js               손으로 넣은 lines 삭제                            고침
src/data/copy.js                단서, 브리핑, 밤·낮, 촬영 평가 문장               고침
src/config/balance.js           간격, 단서 거리, 밤 길이, 평가 기준, 점수, 등급     고침
src/logic/chart.js              좌표→화면 자리, 구역 배치, 작은 별자리 그림        새로
src/logic/layout.js             무작위 배치 삭제, mapZoneIds만 남김               고침
src/logic/guide.js              길잡이 단서 계산                                  새로
src/logic/night.js              임무 배정, 밤 시계, 해돋이, 임무 완료              새로
src/logic/rating.js             촬영 평가                                         새로
src/logic/requests.js           자유 탐색 구간 삭제, 임무 이어 가기                고침
src/logic/save.js               새 저장 항목과 기본값 채우기                       고침
src/logic/scoring.js, result.js 별점·동트기 전 완료 점수                           고침
src/scenes/gameState.js         임무를 저장 상태에 두기                            고침
src/scenes/ui/chartSky.js       구역 하늘의 별자리 별·선·이름표 그리기             새로
src/scenes/ui/miniMap.js        위치 지도에 별자리 그림                            고침
src/scenes/ui/targetPanel.js    왼쪽 판: 지금 찾을 대상과 단서                     새로
src/scenes/ui/nightBar.js       남은 밤 막대                                      새로
src/scenes/ui/dayWait.js        해돋이와 낮 기다림 화면                            새로
src/scenes/ui/starRating.js     별점 표시                                         새로
src/scenes/ScanScene.js         위 조각을 엮기, 촬영 버튼                          고침
src/scenes/SkyMapScene.js       시작 브리핑, 임무 머리글, 별자리 그림              고침
src/scenes/ResultScene.js       점수 내역에 별점·완료 보너스                       고침
src/scenes/BootScene.js         새 그림 불러오기                                  고침
tools/art-manifest.json         새 그림 다섯 장                                   고침
README.md                       게임 흐름 설명 고침                               고침
```

---

### Task 1: 하늘 자료와 구역 배치

**Files:**
- Create: `src/data/sky.js`, `src/logic/chart.js`
- Modify: `src/data/objects.js`, `src/data/zones.js`, `src/config/balance.js`, `src/logic/layout.js`, `src/scenes/ScanScene.js`(배치 호출만), `src/scenes/SkyMapScene.js`(별자리 그림만)
- Test: `tests/logic/chart.test.js`, `tests/data/sky.test.js`; 무작위 배치를 쓰던 기존 시험은 새 배치에 맞게 고치거나 지운다

**Interfaces:**
- Produces:

```js
// balance.js 추가
export const CHART_MIN_GAP = 300;   // 구역 안 천체끼리 최소 거리(MIN_GAP을 대신한다. MIN_GAP은 지운다)

// objects.js: 천체마다 ra(시, 소수), dec(도, 소수) 추가

// sky.js
export const SKY = {
  orion: {
    center: { ra: 5.6, dec: 0 },      // 하늘 창의 가운데
    spanDeg: 30,                       // 창의 가로 폭(도). 세로는 ZONE_H / ZONE_W 비율
    stars: [{ id: 'betelgeuse', ra: 5.919, dec: 7.41, mag: 0.5 }, /* ... */],
    segs: [['betelgeuse', 'bellatrix'], /* 별 id 쌍 */],
    guides: [{ nameKo: '삼태성', ra: 5.60, dec: -1.2 }, /* 구역마다 2~5개 */],
  },
  // ZONES의 20개 구역 모두
};

// chart.js
export function projectSky(ra, dec, sky): { x, y }   // 구역 화면 자리(0..ZONE_W, 0..ZONE_H 밖일 수도 있음)
export function chartStars(zoneId): { id, x, y, mag }[]
export function chartSegs(zoneId): [{ x, y }, { x, y }][]
export function chartGuides(zoneId): { nameKo, x, y }[]
export function chartLayout(zoneId, deck, bonus = []): { id, x, y }[]   // deck 먼저, bonus는 그 뒤
export function miniFigure(zoneId, radius): { stars: [dx, dy][], segs: [i, j][] }   // 하늘 지도의 작은 그림, 모든 점이 ±radius 안
```

천체 좌표(적경 시, 적위 도). 구현자는 아는 값과 견주어 크게 틀린 것이 있으면 고치고 보고서에 적는다.

| id | ra | dec | id | ra | dec |
|---|---|---|---|---|---|
| m42 | 5.588 | -5.39 | m7 | 17.898 | -34.79 |
| m8 | 18.060 | -24.38 | ngc869 | 2.330 | 57.13 |
| m17 | 18.346 | -16.18 | ngc2547 | 8.170 | -49.20 |
| m16 | 18.313 | -13.78 | m4 | 16.393 | -26.53 |
| m78 | 5.779 | 0.08 | m22 | 18.607 | -23.90 |
| ic2118 | 5.080 | -7.20 | ngc5139 | 13.446 | -47.48 |
| ic2631 | 11.160 | -76.60 | m13 | 16.695 | 36.46 |
| ngc7023 | 21.030 | 68.17 | ngc3372 | 10.750 | -59.87 |
| b33 | 5.683 | -2.46 | m20 | 18.040 | -23.03 |
| b68 | 17.378 | -23.83 | ngc6726 | 19.030 | -36.90 |
| b59 | 17.350 | -27.00 | ldn1622 | 5.910 | 1.80 |
| b86 | 18.050 | -27.87 | m11 | 18.851 | -6.27 |
| m45 | 3.790 | 24.12 | ngc3532 | 11.090 | -58.70 |
| ngc104 | 0.401 | -72.08 | m55 | 19.667 | -30.96 |
| m51 | 13.498 | 47.20 | m101 | 14.054 | 54.35 |
| m104 | 12.666 | -11.62 | | | |

- [ ] **Step 1: 실패하는 시험 작성** — `tests/logic/chart.test.js`
  - `projectSky(center.ra, center.dec, sky)`는 `{ x: ZONE_W / 2, y: ZONE_H / 2 }`.
  - 적경이 더 크면 x가 작다(동쪽이 왼쪽). 적위가 더 크면 y가 작다(북쪽이 위).
  - 적경 0시를 넘는 창(큰부리새자리)에서 23.9시와 0.1시가 가운데 양쪽에 가깝게 놓인다(24시 건너뛰기 처리).
  - `chartLayout`: 31개 천체 모두 자기 구역에서 `EDGE_MARGIN` 안쪽, 같은 구역의 모든 쌍이 `CHART_MIN_GAP` 이상, 두 번 불러도 같은 결과.
  - `chartLayout(zone, deck)`의 필수 카드 자리는 `chartLayout(zone, deck, bonus)`에서도 같다(20개 구역 모두).
  - 방향 보존: 같은 구역의 모든 쌍에서, 벌리기 전 투영 자리의 x 차가 60 이상이면 벌린 뒤에도 x 순서가 같고, y도 같다.
  - 오리온자리에서 y 순서가 M78 < 말머리성운 < M42(북쪽에서 남쪽).
  - `miniFigure(zone, 44)`의 모든 점이 ±44 안이고, 선의 번호가 별 범위 안이다.
- [ ] **Step 2: 실패하는 시험 작성** — `tests/data/sky.test.js`
  - `ZONES`의 20개 구역 모두 `SKY`에 있다. 별이 4개 이상, 길잡이가 2개 이상 5개 이하.
  - `segs`의 모든 id가 그 구역 `stars`에 있다. 별 id가 구역 안에서 겹치지 않는다.
  - 모든 별과 길잡이가 벌리기 전 투영에서 구역 화면 안(0..ZONE_W, 0..ZONE_H)에 있다. 길잡이는 `EDGE_MARGIN / 2` 안쪽.
  - 모든 천체의 벌리기 전 투영 자리가 자기 구역 화면 안에 있다(창을 잘못 잡으면 여기서 걸린다).
  - 길잡이 이름에 "성운", "성단", "방출", "반사", "암흑", "산개", "구상"이 없다. 한 구역 안에서 이름이 겹치지 않는다.
  - 모든 천체에 유한한 `ra`(0 이상 24 미만), `dec`(-90~90)가 있다.
- [ ] **Step 3:** 두 시험 실행, 모듈 없음으로 실패 확인.
- [ ] **Step 4:** `objects.js`에 좌표를 넣고 `sky.js`를 쓴다. 별은 그 별자리를 알아볼 수 있는 밝은 별 5~10개, 실제 적경·적위와 등급. 창은 천체와 알아볼 만한 별이 함께 들어오게 잡는다(큰 별자리는 일부만). 길잡이는 유명한 별 이름이나 별 무리 이름을 우리말로(예: 베텔게우스, 리겔, 삼태성, 안타레스, 알데바란). 이웃 별자리의 별을 길잡이로 넣어도 된다.
- [ ] **Step 5:** `chart.js` 구현. 투영은 가운데 기준 등장방형: 가로 1도 = `ZONE_W / spanDeg` px, 적경 차는 ±12시로 접고 `15 × cos(center.dec)`를 곱한다. 벌리기는 난수 없이: 투영 → 여백 안으로 당기기 → 가까운 쌍을 잇는 선을 따라 반씩 밀기를 되풀이(겹쳐 있으면 x로) → 여백 안으로 당기기, 간격이 모두 맞을 때까지 최대 300번. 보너스는 놓인 필수 카드를 고정한 채 자기만 움직인다.
- [ ] **Step 6:** `layout.js`에서 `layoutZone`, `zoneLayout`, `zoneLayoutWithBonus`를 지우고 `mapZoneIds`만 남긴다. `ScanScene.js`의 배치 호출을 `chartLayout`으로 바꾼다. `zones.js`의 `lines`를 지우고 `SkyMapScene.drawZone`이 `miniFigure(zone.id, 44)`를 쓰게 한다. 지운 함수를 쓰던 시험을 새 함수에 맞게 고친다.
- [ ] **Step 7:** `npm test`, `npm run build` 통과 확인.
- [ ] **Step 8:** 커밋 `feat: 실제 하늘을 따른 구역 배치와 별자리 자료`

---

### Task 2: 길잡이 단서

**Files:**
- Create: `src/logic/guide.js`
- Modify: `src/config/balance.js`, `src/data/copy.js`
- Test: `tests/logic/guide.test.js`

**Interfaces:**
- Consumes: `chartLayout`, `chartGuides` (Task 1)
- Produces:

```js
// balance.js 추가
export const GUIDE_NEAR = 260;   // 이 안이면 "바로 옆"
export const GUIDE_MID = 700;    // 이 안이면 "조금", 넘으면 "멀리"

// guide.js
export const DIRECTIONS = ['up', 'upRight', 'right', 'downRight', 'down', 'downLeft', 'left', 'upLeft'];
export function guideFor(target: { x, y }, guides: { nameKo, x, y }[]): { nameKo, dir, band: 'near' | 'mid' | 'far' } | null
export function zoneClues(zoneId, deck, bonus = []): { [objectId]: { nameKo, dir, band } }

// copy.js 추가
export const DIR_KO = { up: '위', upRight: '오른쪽 위', right: '오른쪽', downRight: '오른쪽 아래', down: '아래', downLeft: '왼쪽 아래', left: '왼쪽', upLeft: '왼쪽 위' };
export const GUIDE_TEXT = (clue) => string;
// near: `${nameKo} 바로 ${DIR_KO[dir]}에 있어요.`
// mid:  `${nameKo}에서 ${DIR_KO[dir]}${으로|로} 조금 가 보세요.`
// far:  `${nameKo}에서 ${DIR_KO[dir]}${으로|로} 멀리 가 보세요.`
// 조사: 받침 없는 말(위, 아래)과 ㄹ 받침 뒤에는 "로", 그 밖의 받침(쪽) 뒤에는 "으로".
```

- [ ] **Step 1: 실패하는 시험 작성**
  - 길잡이 (1000, 500), 대상 (1000, 900): `{ dir: 'down', band: 'mid' }`. 대상 (1000, 700): `band: 'near'`. 대상 (1000, 1300): `band: 'far'`.
  - 여덟 방향: 길잡이에서 대상까지의 각이 각 방향의 가운데일 때 그 방향이 나온다(화면 좌표, y가 아래로 커진다).
  - 길잡이가 둘이면 가까운 쪽을 고른다. 길잡이가 없으면 `null`.
  - 31개 천체 모두 `zoneClues`에 단서가 있고(Review Focus 5), 단서의 `dir`이 배치에서 다시 계산한 방향과 같고, `band`가 거리와 맞는다.
  - `GUIDE_TEXT({ nameKo: '삼태성', dir: 'down', band: 'mid' })`는 `'삼태성에서 아래로 조금 가 보세요.'`. `dir: 'left'`, `band: 'far'`는 `'삼태성에서 왼쪽으로 멀리 가 보세요.'`. `dir: 'upRight'`, `band: 'near'`는 `'삼태성 바로 오른쪽 위에 있어요.'`.
  - 31개 천체의 단서 문장 어디에도 "성운", "성단", "방출", "반사", "암흑", "산개", "구상"이 없다.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** 구현. 방향은 `atan2`를 45도 칸으로 나눈다.
- [ ] **Step 4:** 통과 확인.
- [ ] **Step 5:** 커밋 `feat: 길잡이 별 단서`

---

### Task 3: 임무, 밤, 촬영 평가, 점수 규칙

**Files:**
- Create: `src/logic/night.js`, `src/logic/rating.js`
- Modify: `src/config/balance.js`, `src/logic/requests.js`, `src/logic/save.js`, `src/logic/scoring.js`, `src/logic/result.js`, `src/scenes/gameState.js`, `src/data/copy.js`(지우는 수치를 쓰던 문장만)
- Test: `tests/logic/night.test.js`, `tests/logic/rating.test.js`; `requests`, `save`, `scoring`, `result` 시험 고침

**Interfaces:**
- Produces:

```js
// balance.js: FREE_UNTIL을 지운다. 추가·변경:
export const NIGHT_BASE_MS = 20000;
export const NIGHT_PER_TARGET_MS = 50000;
export const DAY_WAIT_MS = 5000;
export const CENTER_GOOD = 35;       // 확대할 때 시야 중심과 천체 사이가 이 안이면 별 1개 더
export const FOCUS_GOOD = 0.03;      // 촬영할 때 초점 오차가 이 안이면 별 1개 더
export const SCORE = { find: 100, sortCard: 50, wrongSubmit: -30, allTypes: 300, full: 500, star: 25, earlyMission: 50 };
export const RANKS = [{ min: 5600, name: '수석 연구원' }, { min: 4200, name: '정식 연구원' }, { min: 0, name: '수습 연구원' }];

// requests.js
export function requestKind(foundCount): 'picture' | 'plain'        // 10장 미만 picture
export function currentRequest(prev, foundIds, seed, deck, openZoneIds)
// prev의 대상이 하나라도 남아 있으면 종류가 바뀌어도 prev 그대로. 아니면 새로 뽑는다.

// save.js: 저장 상태에 추가되는 항목과 기본값
// mission: { kind, zoneId, targetIds } | null   (null)
// night: number            (1)      지금 몇째 밤인가
// nightLeftMs: number|null (null)   남은 밤. null이면 아직 시작 안 함
// dawned: boolean          (false)  지금 임무에서 해가 뜬 적이 있는가
// earlyMissions: number    (0)      동트기 전에 마친 임무 수
// ratings: { [id]: 1|2|3 } ({})
// introSeen: boolean       (false)
export function withDefaults(state): state   // 없는 항목과 이상한 값을 기본값으로. load가 부른다

// night.js
export function nightLength(targetCount): number                    // NIGHT_BASE_MS + targetCount × NIGHT_PER_TARGET_MS
export function assignMission(state, request): state                // 임무가 바뀌면 mission·nightLeftMs·dawned를 새로, 같으면 같은 객체
export function tickNight(state, deltaMs): state                    // nightLeftMs를 줄인다(0에서 멈춤). null이면 그대로
export function isDawn(state): boolean                              // mission이 있고 nightLeftMs === 0
export function endDay(state, foundIds: Set): state                 // night + 1, 남은 대상 수로 nightLeftMs 새로, dawned true
export function missionDone(state, foundIds: Set): boolean          // mission의 대상을 모두 찾았는가
export function completeMission(state): { state, early: boolean }   // early = !dawned. early면 earlyMissions + 1. night + 1, mission null, nightLeftMs null, dawned false
export function resumeNight(state, foundIds: Set): state            // 불러온 뒤: 해가 뜬 채 저장됐으면 endDay, 임무를 이미 다 찾았으면 completeMission

// rating.js
export function rateCapture(centerOffsetPx, focusError): 1 | 2 | 3
export function recordRating(state, id, stars): state               // 이미 있으면 바꾸지 않는다

// scoring.js
export function starPoints(ratings, deckIds): number                // 필수 카드만, (별 - 1) × SCORE.star, 별은 1~3으로 자른다
export function totalScore({ found, stages, typesRegistered, starBonus = 0, earlyMissions = 0 }): number

// result.js scoreReport가 더 내는 것: starPoints, earlyMissions, earlyPoints

// gameState.js refreshRequest (모으기 단계): prev로 state.mission을 쓰고, 정한 임무를 assignMission으로 상태에 넣어 저장한다.
```

- [ ] **Step 1: 실패하는 시험 작성** — `night.test.js`
  - `nightLength(1)` 70000, `(2)` 120000, `(3)` 170000.
  - `assignMission`: 임무가 없던 상태에 대상 3개 임무를 넣으면 `nightLeftMs` 170000, `dawned` false. 같은 임무를 다시 넣으면 같은 객체(시간이 되돌아가지 않는다). 대상이 다른 임무면 새로 시작. `request`가 `null`이면 `mission` `null`, `nightLeftMs` `null`.
  - `tickNight`: 1000을 빼면 169000. 남은 것보다 많이 빼면 0. `nightLeftMs`가 `null`이면 같은 객체.
  - `isDawn`: 0이면 참, 1이면 거짓, 임무가 없으면 거짓.
  - `endDay`: 대상 3개 중 1개를 찾은 상태에서 `night`가 1 늘고 `nightLeftMs` 120000, `dawned` true.
  - `completeMission`: `dawned` false면 `early` true이고 `earlyMissions` 1. `dawned` true면 `early` false이고 그대로. 두 경우 모두 `night` + 1, `mission` `null`.
  - Review Focus 3: `nightLeftMs` 0(아직 `endDay` 전)이고 `dawned` false인 상태에서 마지막 대상을 찾아 `completeMission`하면 `early` true.
  - Review Focus 1: `resumeNight`는 `nightLeftMs` 0인 저장을 `endDay`한 상태로, 대상을 다 찾은 저장을 `completeMission`한 상태로 돌려주고, 그 밖에는 같은 객체.
- [ ] **Step 2: 실패하는 시험 작성** — `rating.test.js`
  - `rateCapture(80, 0.07)` 1, `(30, 0.07)` 2, `(80, 0.02)` 2, `(30, 0.02)` 3, 경계값 `(35, 0.03)` 3.
  - `recordRating`은 원래 상태를 바꾸지 않고, 이미 평가가 있는 카드는 그대로 둔다. 1~3 밖의 값은 1~3으로 자른다.
- [ ] **Step 3: 기존 시험 고침과 추가**
  - `requests`: `requestKind(0)`은 `'picture'`, `(9)`는 `'picture'`, `(10)`은 `'plain'`. 0장일 때도 `makeRequest`가 임무를 낸다. 9장에서 받은 그림 임무는 10장이 되어도 대상이 남아 있으면 그대로 이어진다.
  - `save`(Review Focus 2): 새 항목이 하나도 없는 예전 저장을 불러오면 `foundIds`는 그대로이고 새 항목은 기본값. 이상한 값 표(`night` 0·음수·문자열, `nightLeftMs` 음수·NaN, `ratings`에 5나 문자열, `mission`의 `targetIds`가 빈 배열이거나 4개, `kind`가 모르는 값, `earlyMissions` 음수)마다 그 항목만 기본값으로 바뀌고 오류가 없다. `newGame`에 새 항목이 기본값으로 있다.
  - `scoring`: `starPoints({ a: 3, b: 2, c: 1, x: 3 }, ['a', 'b', 'c'])`는 75(필수 카드가 아닌 `x`는 세지 않는다). 등급 세 경우를 고정한다.
    - 힌트 없이 전부 맞히고 별점·완료 보너스가 0이면 4800, `'정식 연구원'`.
    - 묶기 점수 620, 별점 1000, 완료 14번이면 5120, `'정식 연구원'`(수석이 아니다).
    - 묶기 점수 620, 별점·완료 0이면 3420, `'수습 연구원'`.
    - 전부 맞히고 별점 1000, 완료 10번이면 6300, `'수석 연구원'`.
  - `result`: `scoreReport`가 `ratings`와 `earlyMissions`를 점수에 넣고 내역 세 항목을 낸다. 보너스 천체의 별점은 점수에 들어가지 않는다.
- [ ] **Step 4:** 실패 확인.
- [ ] **Step 5:** 구현. `MAP_TEXT.free`처럼 자유 탐색을 말하는 문장과 그것을 쓰는 곳은 임무가 없을 때의 빈 문장으로 둔다(Task 7에서 화면을 고친다).
- [ ] **Step 6:** `npm test`, `npm run build` 통과 확인.
- [ ] **Step 7:** 커밋 `feat: 밤 임무와 촬영 평가 규칙`

---

### Task 4: 새 그림

**Files:**
- Modify: `tools/art-manifest.json`, `src/scenes/BootScene.js`, `tests/tools/art-files.test.js`
- Create: `public/art/icon-shutter.png`, `icon-star.png`, `icon-star-empty.png`, `icon-sun.png`, `icon-moon.png`

**Interfaces:**
- Produces: 텍스처 키 `icon-shutter`, `icon-star`, `icon-star-empty`, `icon-sun`, `icon-moon`(모두 256×256, 투명 배경, 글자 없음)

- [ ] **Step 1:** `tests/tools/art-files.test.js`의 파일 목록에 다섯 장을 더하고 실패 확인.
- [ ] **Step 2:** `art-manifest.json`에 다섯 항목을 더한다. 기존 아이콘과 같은 화풍 문장과 크기 설정을 쓴다: 촬영 버튼(황동 카메라 셔터 모양), 채워진 별(황동·금색 별), 빈 별(같은 모양의 어두운 윤곽), 해(따뜻한 색의 단순한 해), 달(초승달). 88px에서 알아볼 수 있는 굵은 모양.
- [ ] **Step 3:** `node --env-file=.env tools/gen-art.mjs`로 만든다(있는 파일은 건너뛴다). 키를 출력하지 않는다. 하나씩 열어 보고, 글자가 섞였거나 배경이 투명하지 않으면 다시 만든다(파일마다 3번까지). 채워진 별과 빈 별은 같은 크기와 자리여야 나란히 놓았을 때 어긋나지 않는다.
- [ ] **Step 4:** `BootScene`의 그림 불러오기 목록에 더한다.
- [ ] **Step 5:** `npm test` 통과, `git status`로 `.env`가 추적되지 않는지 확인.
- [ ] **Step 6:** 커밋 `feat: 촬영·별점·밤낮 그림`

---

### Task 5: 구역 하늘에 별자리와 단서 보이기

**Files:**
- Create: `src/scenes/ui/chartSky.js`, `src/scenes/ui/targetPanel.js`
- Modify: `src/scenes/ScanScene.js`, `src/scenes/ui/miniMap.js`, `src/data/copy.js`
- Test: `tests/scenes/target-panel.test.js`, `tests/data/screen-copy.test.js`(고침)

**Interfaces:**
- Consumes: `chartStars`, `chartSegs`, `chartGuides`, `chartLayout` (Task 1); `zoneClues`, `GUIDE_TEXT` (Task 2)
- Produces:

```js
// chartSky.js
export function addChartSky(scene, container, zoneId): void   // 별자리 선(흐리게), 밝은 별(등급이 밝을수록 크게), 길잡이 이름표를 container에 더한다
// miniMap.js
export function makeMiniMap(scene, cx, cy, width, placed, zoneId)   // 별자리 그림을 함께 그린다
// targetPanel.js
export function panelTargets(request, zoneId, foundIds: Set, clues): { id, clue }[]   // 순수 함수: 이 구역에서 지금 찾을 대상(임무 대상 중 남은 것)과 단서
export function makeTargetPanel(scene, x, y, width): { set(targets, kind), destroy() }   // 대상 하나의 겉모습과 단서, 여럿이면 넘김 버튼
```

- [ ] **Step 1: 실패하는 시험 작성** — `panelTargets`: 임무 구역이 이 구역이면 남은 대상만 임무 순서대로 단서와 함께 낸다. 찾은 대상은 빠진다. 임무 구역이 다른 구역이거나 임무가 없으면 빈 배열. `screen-copy` 시험에 새 문장(왼쪽 판 머리글, 넘김 버튼 이름)을 더해 금지어를 살핀다.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** `chartSky.js`: 선은 가늘고 흐리게, 별은 무작위 잔별보다 뚜렷하게, 길잡이 이름표는 24px 이상에 테두리를 둘러 별 위에서도 읽히게 한다. 이름표는 하늘과 함께 움직인다. 빠르게 움직여 시야가 흐려질 때 함께 흐려진다.
- [ ] **Step 4:** `ScanScene.buildSky`가 잔별 위에 `addChartSky`를 부른다. `miniMap`은 별자리 선과 별을 흐리게 깔고 그 위에 지금 시야와 찾은 자리를 그린다.
- [ ] **Step 5:** `ScanScene.refreshPanel`의 의뢰 그리기를 `makeTargetPanel`로 바꾼다. 대상 하나의 겉모습(그림 임무면 흐린 사진, 쉬운 말 임무면 문장)과 그 대상의 단서 문장을 보여 주고, 대상이 둘 이상이면 88×88 이상의 넘김 버튼으로 바꿔 본다. 왼쪽 판의 폭 안에서 24px 글자가 넘치지 않게 줄을 바꾼다. 보너스 관측에서도 단서를 보여 준다.
- [ ] **Step 6:** 헤드리스 확인(저장소 밖 Playwright, 자기 dev 서버). 1280×720과 844×390 터치에서: 오류 없이 구역에 들어간다, 별자리 선과 이름표가 보인다, 왼쪽 판에 단서가 보이고 넘김이 된다, 단서가 가리키는 길잡이에서 그 방향으로 천천히 끌면 얼룩이 나온다, 위치 지도에 별자리 그림이 있다. 화면을 찍어 겹침과 잘림이 없는지 본다.
- [ ] **Step 7:** `npm test`, `npm run build` 통과 확인.
- [ ] **Step 8:** 커밋 `feat: 구역 하늘의 별자리와 길잡이 단서`

---

### Task 6: 밤 시계, 해돋이, 촬영 버튼

**Files:**
- Create: `src/scenes/ui/nightBar.js`, `src/scenes/ui/dayWait.js`, `src/scenes/ui/starRating.js`
- Modify: `src/scenes/ScanScene.js`, `src/scenes/gameState.js`, `src/data/copy.js`
- Test: `tests/scenes/night-flow.test.js`, `tests/data/screen-copy.test.js`(고침)

**Interfaces:**
- Consumes: `night.js`, `rating.js` 전부 (Task 3); 텍스처 키 다섯 개 (Task 4)
- Produces:

```js
// copy.js 추가
export const NIGHT_TEXT = {
  nightLabel: (n) => `${n}째 밤`,
  dawn: '해가 떴어요. 낮에는 천체를 관측할 수 없어요. 밤이 될 때까지 기다려야 해요.',
  dusk: '다시 밤이 되었어요. 이어서 찾아봐요.',
  tonight: (k) => `오늘 밤 찍은 카드 ${k}장`,
  missionEarly: `동트기 전에 임무를 마쳤어요!`,
  missionDone: '임무를 마쳤어요.',
  toNextMission: '다음 임무 받기',
  shutter: '촬영',
};
// nightBar.js
export function makeNightBar(scene, x, y, width): { set(leftMs, totalMs, nightNo) }   // 달에서 해로 가는 막대
// dayWait.js
export function runDayWait(scene, { cardIds, onDone }): void   // 하늘이 밝아지고 요원 말, DAY_WAIT_MS 뒤 다시 어두워지고 onDone
// starRating.js
export function addStarRating(scene, x, y, stars, size = 56): Container   // 채워진 별 stars개, 빈 별 3 - stars개
```

- [ ] **Step 1: 실패하는 시험 작성** — `night-flow.test.js`, 장면 없이 규칙을 이어 붙인다.
  - 대상 3개 임무를 받고, 한 개를 찾고, 밤을 다 써서 해가 뜨고, `endDay` 뒤 나머지 둘을 찾으면 `completeMission`의 `early`는 false이고 `night`는 3.
  - 같은 임무를 밤 안에 다 찾으면 `early` true, `earlyMissions` 1, `night` 2.
  - 밤 시간을 다 쓴 채(`endDay` 전) 저장하고 다시 불러온 상태에 `resumeNight`를 하면 다음 밤이 시작돼 있다(Review Focus 1).
  - 20장을 모두 찾을 때까지 임무 받기 → 찾기 → 완료를 되풀이하면 `phase`가 `'sort'`가 되고, 그동안 `mission`이 `null`인 채로 남는 순간이 없다.
  - `NIGHT_TEXT`의 모든 문장에 금지어가 없다.
- [ ] **Step 2:** 실패 확인 후, 규칙에 빠진 것이 있으면 `src/logic/`을 고쳐 통과시킨다.
- [ ] **Step 3:** 밤 시계. 모으기 단계에서 `ScanScene`의 훑기와 초점 상태일 때만 `tickNight(state, delta)`를 한다. 카드 화면, 낮 기다림, 보너스 관측에서는 가지 않는다. 화면 위쪽에 `makeNightBar`로 남은 밤과 몇째 밤인지 보여 준다. 5초마다, 그리고 장면을 떠날 때와 카드를 얻을 때 저장한다. 임무가 없는 상태로 구역에 들어왔으면 막대를 숨긴다.
- [ ] **Step 4:** 해돋이. 훑기 상태에서 `isDawn`이면 끌기를 끝내고 `runDayWait`를 부른다. 초점 상태에서 시간이 다 되면 촬영하거나 그만둘 때까지 기다린다(Review Focus 3). `runDayWait`는 하늘을 밝히며 별과 얼룩을 지우고, 요원 그림과 말풍선으로 `NIGHT_TEXT.dawn`을 보여 주고, 그 밤에 찍은 카드를 작게 보여 주고, `DAY_WAIT_MS` 동안 해가 지나가는 것을 보여 준 뒤 어두워진다. 버튼이 없고 눌러도 넘어가지 않는다. 끝나면 `endDay`를 하고 저장하고 같은 자리에서 훑기로 돌아간다. 기다림은 장면 시계로 재서 게임이 멈춘 동안(세로 화면, 다른 창) 함께 멈춘다(Review Focus 4).
- [ ] **Step 5:** 촬영 버튼. 초점이 맞으면 저절로 찍히던 것을 없앤다. 초점 화면에 `icon-shutter`를 쓴 촬영 버튼(88×88 이상)을 두고, 초점이 `FOCUS_TOLERANCE` 안일 때만 켠다. 누르면 그 순간의 초점 오차와, 확대를 누를 때 재어 둔 시야 중심과 천체 사이 거리로 `rateCapture`를 하고 `recordRating`으로 저장한다. 카드를 얻는 화면에 `addStarRating`으로 별점을 보여 준다. `FOCUS_HOLD_MS`와 그것을 쓰는 규칙·시험은 지운다.
- [ ] **Step 6:** 임무 완료. 카드를 얻은 뒤 `missionDone`이면 `completeMission`을 하고 저장한다. 카드 화면에 `early`면 `NIGHT_TEXT.missionEarly`와 보너스 점수, 아니면 `NIGHT_TEXT.missionDone`을 보여 주고, 버튼은 `NIGHT_TEXT.toNextMission` 하나로 하늘 지도에 간다. 20장째면 지금처럼 묶기로 간다. `gameState`의 불러오기 뒤에 `resumeNight`를 부른다.
- [ ] **Step 7:** 헤드리스 확인(저장소 밖 Playwright, 자기 dev 서버). 밤 길이를 줄이려면 저장 상태의 `nightLeftMs`를 작게 넣어 시작한다. 1280×720과 844×390 터치에서: 막대가 줄어든다, 시간이 다 되면 낮 화면과 요원 말이 나오고 약 5초 뒤 같은 자리에서 다시 밤이 된다, 낮 동안 눌러도 넘어가지 않는다, 낮 도중 새로 고침하면 다음 밤으로 이어진다, 낮 도중 세로로 돌리면 멈췄다가 이어진다, 초점 화면에서 시간이 다 돼도 촬영이 된다, 촬영 버튼이 초점이 맞을 때만 켜진다, 가운데와 초점을 잘 맞추면 별 3개가 나온다, 임무의 대상을 밤 안에 다 찾으면 완료 보너스 글이 나온다, 보너스 관측에는 막대가 없다. 화면을 찍어 본다.
- [ ] **Step 8:** `npm test`, `npm run build` 통과 확인.
- [ ] **Step 9:** 커밋 `feat: 밤 시계와 해돋이, 촬영 평가`

---

### Task 7: 시작 브리핑, 임무 머리글, 결과 내역, 안내 문서

**Files:**
- Modify: `src/scenes/SkyMapScene.js`, `src/scenes/ResultScene.js`, `src/data/copy.js`, `src/logic/save.js`(브리핑 본 표시), `README.md`
- Test: `tests/data/screen-copy.test.js`(고침), `tests/logic/save.test.js`(고침)

**Interfaces:**
- Consumes: 저장 상태의 `introSeen`, `mission`, `night` (Task 3); `scoreReport`의 `starPoints`, `earlyPoints`, `earlyMissions` (Task 3); `showStoryPanel` (`src/scenes/ui/sortViews.js`)
- Produces:

```js
// save.js
export function markIntroSeen(state): state
// copy.js 추가
export const INTRO_TEXT = { lines: string[], start: '임무 받기' };   // 요원의 인사 세 줄 안팎
// MAP_TEXT.mission(nightNo, zone, k): `${nightNo}째 밤 임무: ${zone}에서 …`
```

- [ ] **Step 1: 실패하는 시험 작성** — `markIntroSeen`은 원래 상태를 바꾸지 않고 `introSeen`을 참으로 한다. `screen-copy` 시험에 `INTRO_TEXT`와 새 `MAP_TEXT` 문장을 더해 금지어를 살핀다. 인사 문장은 세 줄 이상 다섯 줄 이하이고 비어 있지 않다.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** 시작 브리핑. 모으기 단계에서 `introSeen`이 거짓이면 하늘 지도에 요원이 크게 나와 인사와 할 일을 말한다: 신입 연구원을 맞는 말, 밤마다 임무를 받아 별자리의 밝은 별을 길잡이 삼아 찾는다는 말, 해가 뜨기 전에 마치면 좋다는 말. [임무 받기]를 누르면 `markIntroSeen`을 저장하고 닫힌다. 한 번만 나온다.
- [ ] **Step 4:** 임무 머리글. 하늘 지도 머리글에 몇째 밤인지와 임무(구역, 대상 수, 그림 또는 쉬운 말)를 보여 준다. 자유 탐색을 말하던 문장은 지운다. 임무 구역이 반짝이는 것은 그대로다.
- [ ] **Step 5:** 결과 화면의 점수 내역에 별점 점수와 동트기 전 완료(횟수와 점수)를 한 줄씩 더한다. 내역이 화면에 넘치지 않게 줄 간격을 맞춘다.
- [ ] **Step 6:** `README.md`의 "학생이 하는 일"을 새 흐름(브리핑, 임무, 길잡이 별, 촬영 평가, 밤과 낮)으로 고친다.
- [ ] **Step 7:** 헤드리스 확인(저장소 밖 Playwright, 자기 dev 서버). 1280×720과 844×390 터치에서: 새 판에서 브리핑이 나오고 닫은 뒤 새로 고침하면 다시 나오지 않는다, 머리글에 첫째 밤 임무가 보인다, 임무 구역에 들어가 한 장을 찍고 지도로 돌아오면 임무가 이어져 있다, 이 기능 전 형식의 저장(새 항목 없음, 5장 수집)을 넣고 열면 오류 없이 이어진다(Review Focus 2), 끝난 판의 결과 화면에 새 내역 두 줄이 보이고 합계가 `scoreReport`와 같다. 화면을 찍어 본다.
- [ ] **Step 8:** `npm test`, `npm run build` 통과 확인.
- [ ] **Step 9:** 커밋 `feat: 시작 브리핑과 임무 머리글, 결과 내역`
