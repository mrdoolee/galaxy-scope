# GALAXY ARCHIVE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학생이 둥근 망원경 시야로 밤하늘을 훑어 성운·성단 카드 20장을 모으고, 두 단계로 묶어 분류해 도감에 등록하는 가로 화면 터치 웹 게임을 만든다.

**Architecture:** 규칙은 전부 `src/logic/`의 순수 함수로 두고 vitest로 검증한다. Phaser 장면(`src/scenes/`)은 입력을 받아 로직을 호출하고 결과를 그리기만 한다. 천체 정보는 `src/data/objects.js` 한 곳에 두고, 서버 없이 `localStorage`에만 저장한다.

**Tech Stack:** Vite 8, Phaser 4.2.1, vitest 5, JavaScript(ES 모듈). 같은 작업 공간의 `../stargauge`와 같은 구성과 폴더 규칙(`src/logic`, `src/scenes`, `src/data`, `src/config`, `tests/`)을 따른다.

**Spec:** `docs/superpowers/specs/2026-11-11-galaxy-archive-design.md`

## Global Constraints

- 답변과 커밋 설명, 학생에게 보이는 글은 한국어. 코드 식별자는 영어.
- 기기는 태블릿과 스마트폰, 가로 화면 고정, 터치 조작. 설계 해상도 1280×720, `Phaser.Scale.FIT`.
- 터치 대상(버튼, 카드)은 설계 해상도 기준 최소 88×88.
- 관측 사진은 실제 천문 관측 사진만 쓴다. AI 생성 이미지를 관측 사진으로 쓰지 않는다.
- 게임 그림(배경, 틀, 요원, 아이콘)은 OpenAI 이미지 생성 API로 만든다. 손으로 쓴 SVG로 대신하지 않는다.
- `.env`는 읽어서 출력하지 않고 커밋하지 않는다. `src/` 아래 코드는 API 키를 참조하지 않는다.
- 학생에게 보이는 용어는 교과서 표기: 우리은하, 오리온대성운, 플레이아데스성단, 말머리성운, 방출 성운, 반사 성운, 암흑 성운, 산개 성단, 구상 성단.
- 한 판은 카드 20장, 다섯 종류가 각각 3장 이상. 외부 은하는 20장에 넣지 않는다.
- 서버, 로그인, 순위표, 기록 쓰기, 보고서 기능은 만들지 않는다.
- git·npm 명령은 `galaxy-scope/` 안에서만 실행한다.

## Review Focus

1. 저장 데이터가 깨졌거나 예전 형식일 때: 오류 없이 새 판으로 시작해야 한다. (Task 7)
2. 게임 도중 기기를 세로로 돌렸을 때: 멈추고 돌리라는 안내를 띄우며, 다시 가로가 되면 진행 상태가 그대로여야 한다. (Task 1)
3. 관측 사진이 불러와지지 않을 때(느린 교실 와이파이): 멈추지 않고 다시 시도 안내를 보여 주며, 불러온 뒤 카드를 얻을 수 있어야 한다. (Task 9)
4. 끌던 손가락이 화면 밖으로 나가거나 두 손가락이 닿았을 때: 카드는 원래 자리로 돌아가고 시야는 멈추며, 조작이 굳지 않아야 한다. (Task 9, Task 10)
5. 카드를 다 놓지 않고 묶기 판정을 눌렀을 때: 판정하지 않고 안내만 하며 감점하지 않는다. (Task 5)

---

## File Structure

```
index.html
package.json, vite.config.js
src/main.js                    Phaser 게임 생성, 장면 등록
src/config/game.js             해상도, 장면 키
src/config/balance.js          모든 수치(점수, 속도, 거리)
src/config/orientation.js      세로 화면 판정
src/data/objects.js            천체 목록(사진, 출처, 종류, 거리)
src/data/zones.js              별자리 구역 목록과 열림 조건
src/data/copy.js               의뢰·힌트·등록 문장
src/logic/deck.js              20장 구성 검증과 추출
src/logic/layout.js            구역 안 천체 재배치
src/logic/scan.js              시야 이동, 흐림, 발견, 초점
src/logic/requests.js          의뢰 만들기
src/logic/sorting.js           묶기 판정과 힌트
src/logic/scoring.js           점수와 등급
src/logic/save.js              저장과 불러오기
src/logic/rng.js               시드 난수
src/scenes/BootScene.js        자료 불러오기
src/scenes/SkyMapScene.js      하늘 지도
src/scenes/ScanScene.js        구역 훑기
src/scenes/SortScene.js        묶기
src/scenes/RegistryScene.js    도감 등록
src/scenes/ResultScene.js      점수와 등급
src/scenes/CreditsScene.js     사진 출처
tools/gen-art.mjs              OpenAI 이미지 생성 스크립트
tools/art-manifest.json        만들 그림 목록과 프롬프트
tools/fetch-photos.mjs         확인된 관측 사진 내려받기와 크기 줄이기
public/photos/                 관측 사진
public/art/                    생성한 게임 그림
tests/                         src와 같은 구조
```

---

### Task 1: 프로젝트 뼈대와 가로 화면

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/config/game.js`, `src/config/orientation.js`, `src/scenes/BootScene.js`
- Test: `tests/config/orientation.test.js`, `tests/smoke.test.js`

**Interfaces:**
- Produces: `GAME_WIDTH = 1280`, `GAME_HEIGHT = 720`, `SCENES = { BOOT, SKY_MAP, SCAN, SORT, REGISTRY, RESULT, CREDITS }` (`src/config/game.js`); `isPortrait(width: number, height: number): boolean` (`src/config/orientation.js`)

- [ ] **Step 1:** `package.json`을 `../stargauge/package.json`과 같은 버전(phaser 4.2.1, vite ^8.3.5, vitest ^5.0.5)과 스크립트(`dev`, `build`, `preview`, `test`)로 만든다. `vite.config.js`는 `base: './'`. `npm install` 실행.
- [ ] **Step 2: 실패하는 테스트 작성**

```js
// tests/config/orientation.test.js
import { isPortrait } from '../../src/config/orientation.js';
test('세로가 더 길면 세로 화면', () => { expect(isPortrait(390, 844)).toBe(true); });
test('가로가 더 길면 가로 화면', () => { expect(isPortrait(844, 390)).toBe(false); });
test('정사각형은 가로로 본다', () => { expect(isPortrait(600, 600)).toBe(false); });
```

```js
// tests/smoke.test.js
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../src/config/game.js';
test('설계 해상도', () => { expect([GAME_WIDTH, GAME_HEIGHT]).toEqual([1280, 720]); });
test('장면 키 일곱 개', () => { expect(Object.keys(SCENES)).toHaveLength(7); });
```

- [ ] **Step 3:** `npm test` 실행, 모듈 없음으로 실패 확인.
- [ ] **Step 4:** `game.js`, `orientation.js` 구현. `main.js`는 `Phaser.Scale.FIT` + `CENTER_BOTH`, 1280×720. `index.html`에 "기기를 가로로 돌려 주세요" 덮개 요소를 두고, `resize`·`orientationchange`에서 `isPortrait`가 참이면 덮개를 보이고 `game.pause()`, 거짓이면 숨기고 `game.resume()`. `BootScene`은 "GALAXY ARCHIVE" 글자만 띄운다.
- [ ] **Step 5:** `npm test` 통과, `npm run build` 성공 확인.
- [ ] **Step 6:** `npm run dev`로 열어 브라우저 기기 모드에서 세로로 바꾸면 덮개가 뜨고 가로로 돌리면 사라지는지 확인(Review Focus 2).
- [ ] **Step 7:** 커밋 `feat: 프로젝트 뼈대와 가로 화면 고정`

---

### Task 2: 천체 자료 확정

게임 코드보다 먼저 자료를 고친다. 설계 문서 7절의 작업이다.

**Files:**
- Modify: `reference/GALAXY_ARCHIVE_관측_천체_후보_자료집.md` (git 제외 대상이라 커밋되지 않음)
- Create: `src/data/objects.js`, `src/data/zones.js`, `tools/fetch-photos.mjs`, `public/photos/*.jpg`
- Test: `tests/data/objects.test.js`

**Interfaces:**
- Produces:

```js
// src/data/objects.js
export const TYPES = ['emission', 'reflection', 'dark', 'open', 'globular'];
export const OBJECTS = [{
  id: 'm42',                       // 영문 소문자·숫자, 사진 파일 이름과 같음
  nameKo: '오리온대성운',           // 교과서 표기
  catalogId: 'M42',
  group: 'nebula',                 // 'nebula' | 'cluster' | 'galaxy'
  type: 'emission',                // TYPES 중 하나, 은하는 'spiral'
  zone: 'orion',                   // zones.js의 id, 실제 소속 별자리
  distanceLy: 1350,                // 지구에서의 거리(광년)
  deck: true,                      // 필수 20장에 드는지
  composite: false,                // 한 사진에 두 종류가 보이는지
  photo: { file: 'photos/m42.jpg', pageUrl: '', credit: '', license: '', edited: true, checkedOn: '2026-11-11' },
}];
// src/data/zones.js
export const ZONES = [{ id: 'orion', nameKo: '오리온자리', textbook: true, mapX: 0, mapY: 0 }];
```

- [ ] **Step 1:** 자료집의 사실 오류를 고친다. 14번은 "뱀주인자리 로 구름(IC 4604)", 별자리 뱀주인자리로 바꾼다. 19번 별자리는 "전갈자리". 17번은 "파이프 성운(B59 등)".
- [ ] **Step 2:** 자료집에 후보를 더한다: M4(전갈자리, 구상 성단), M6·M7(전갈자리, 산개 성단), M22(궁수자리, 구상 성단), M20(궁수자리, 복합).
- [ ] **Step 3:** 후보의 사진 링크를 WebFetch로 하나씩 연다. 천체가 맞는지, 크레딧 문구, 라이선스를 확인해 자료집에 적는다. 열리지 않거나 다른 천체면 NASA·ESO·ESA/Hubble 안에서 올바른 페이지를 찾아 바꾼다. 아카이브 검색 페이지로 걸린 3건은 사진 한 장으로 확정한다. 라이선스를 확인하지 못한 후보는 쓰지 않는다.
- [ ] **Step 4:** 필수 20장을 고른다. 기준: 다섯 종류 각 4장, 전체 모습이 보이는 넓은 시야 사진, `composite`가 아닌 것 우선, M11 제외, 교과서 지정 네 구역(궁수·오리온·황소·전갈)의 천체 우선. 교과서 그림 8-7의 대표 천체(오리온대성운, 마녀머리 성운, 말머리성운, 플레이아데스성단)는 넣는다. 말머리성운과 플레이아데스성단은 복합이지만 교과서 대표 예라서 예외로 넣는다.
- [ ] **Step 5:** `tools/fetch-photos.mjs`를 만든다. `OBJECTS`의 원본 사진 주소를 받아 긴 변 1600px JPEG로 줄여 `public/photos/<id>.jpg`에 저장한다. 줄였으므로 `photo.edited`는 `true`.
- [ ] **Step 6: 실패하는 테스트 작성**

```js
// tests/data/objects.test.js
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
```

- [ ] **Step 7:** `objects.js`, `zones.js`를 채우고 사진을 내려받아 `npm test` 통과 확인.
- [ ] **Step 8:** 고른 20장 목록을 선생님에게 보여 주고 확인받는다. 과학 내용 판단이므로 여기서 한 번 멈춘다.
- [ ] **Step 9:** 커밋 `feat: 천체 자료와 관측 사진 확정`

---

### Task 3: 수치와 시드 난수, 구역 재배치

**Files:**
- Create: `src/config/balance.js`, `src/logic/rng.js`, `src/logic/layout.js`
- Test: `tests/logic/layout.test.js`

**Interfaces:**
- Produces:

```js
// balance.js
export const ZONE_W = 2400, ZONE_H = 1600;   // 구역 하늘 크기
export const VIEW_RADIUS = 260;              // 둥근 시야 반지름
export const EDGE_MARGIN = 200;              // 천체와 구역 가장자리 사이
export const MIN_GAP = 420;                  // 천체끼리 최소 거리
// rng.js
export function makeRng(seed: number): () => number   // 0 이상 1 미만
// layout.js
export function layoutZone(objectIds: string[], rng: () => number): { id: string, x: number, y: number }[]
```

- [ ] **Step 1: 실패하는 테스트 작성** — `layoutZone(['a','b','c','d','e'], makeRng(1))`에 대해: 결과 5개, 모든 좌표가 `EDGE_MARGIN` 안쪽, 서로 거리 `MIN_GAP` 이상, 같은 시드면 같은 결과, 다른 시드면 다른 결과, 빈 배열이면 빈 배열.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** 구현. 무작위로 놓고 조건에 안 맞으면 다시 뽑는다. 200번 안에 못 놓으면 격자 자리로 대신 놓는다.
- [ ] **Step 4:** 통과 확인.
- [ ] **Step 5:** 커밋 `feat: 구역 안 천체 재배치`

---

### Task 4: 훑기 규칙

**Files:**
- Create: `src/logic/scan.js`
- Modify: `src/config/balance.js`
- Test: `tests/logic/scan.test.js`

**Interfaces:**
- Consumes: `ZONE_W`, `ZONE_H`, `VIEW_RADIUS` (Task 3)
- Produces:

```js
// balance.js 추가
export const BLUR_SPEED = 900;        // 이 속도(px/초) 이상이면 시야가 흐려짐
export const SMUDGE_SPEED = 400;      // 이 속도 미만일 때만 얼룩이 보임
export const LOCK_RADIUS = 90;        // 시야 중심에서 이 안에 얼룩이 있으면 확대 가능
export const FOCUS_TOLERANCE = 0.08;  // 초점 허용 오차(0~1 눈금)
export const FOCUS_HOLD_MS = 500;     // 이 시간 동안 맞춰야 촬영
export const IDLE_NUDGE_MS = 25000;   // 발견 없이 이만큼 지나면 방향 표시
// scan.js
export function clampView(x, y): { x, y }                       // 시야 중심을 구역 안으로
export function viewState(speed: number): 'clear' | 'dim' | 'blur'   // <400 clear, 400~899 dim, >=900 blur
export function visibleSmudges(view: {x,y}, speed, placed, foundIds: Set<string>): string[]
export function lockTarget(view: {x,y}, speed, placed, foundIds): string | null
export function focusProgress(value: number, target: number, heldMs: number): { sharp: boolean, captured: boolean }
export function nudgeDirection(view: {x,y}, placed, foundIds): { dx: number, dy: number } | null  // 가장 가까운 미발견 천체 쪽 단위 벡터
```

- [ ] **Step 1: 실패하는 테스트 작성** — 다음을 각각 확인한다.
  - `viewState(399)`는 `'clear'`, `viewState(400)`는 `'dim'`, `viewState(900)`는 `'blur'`.
  - 속도 500이면 시야 안에 천체가 있어도 `visibleSmudges`는 빈 배열(휘두르면 안 보임).
  - 속도 100, 천체가 시야 중심에서 200 떨어져 있으면 보이고, 300 떨어져 있으면 안 보임.
  - 이미 찾은 천체는 얼룩으로 나오지 않음.
  - 중심에서 80 떨어진 천체는 `lockTarget`이 그 id, 100 떨어진 천체는 `null`.
  - `focusProgress(0.55, 0.5, 500)`는 `{ sharp: true, captured: true }`, `(0.55, 0.5, 300)`는 `captured: false`, `(0.7, 0.5, 900)`는 `{ sharp: false, captured: false }`.
  - `clampView(-50, 9999)`는 `{ x: 0, y: 1600 }`.
  - 모두 찾았으면 `nudgeDirection`은 `null`.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** 구현.
- [ ] **Step 4:** 통과 확인.
- [ ] **Step 5:** 커밋 `feat: 망원경 훑기 규칙`

---

### Task 5: 묶기 판정과 힌트

**Files:**
- Create: `src/logic/sorting.js`, `src/data/copy.js`
- Test: `tests/logic/sorting.test.js`

**Interfaces:**
- Produces:

```js
// sorting.js
export const STAGES = {
  shape:   { bins: ['cloud', 'stars'] },     // 1차: 구름 같은 것 / 별 무리
  nebula:  { bins: ['bright', 'dark'] },     // 2차: 밝은 것 / 어두운 것
  cluster: { bins: ['loose', 'dense'] },     // 2차: 엉성한 것 / 빽빽한 것
};
export function correctBin(stage: 'shape'|'nebula'|'cluster', object): string
// shape: nebula→cloud, cluster→stars / nebula: emission·reflection→bright, dark→dark / cluster: open→loose, globular→dense
export function judge(stage, placements: Record<string, string|null>, objects): {
  complete: boolean,        // 모든 카드를 놓았는지
  correct: boolean,
  wrongIds: string[],
}
export function nextHintLevel(wrongSubmits: number): 0 | 1 | 2 | 3   // 틀린 판정 횟수, 3에서 멈춤
// copy.js
export const HINTS = { shape: [q, point, rule], nebula: [...], cluster: [...] };   // 단계별 문장 3개씩
export const BIN_LABELS = { cloud: '구름 같은 것', stars: '별 무리', bright: '밝은 것', dark: '어두운 것', loose: '엉성하게 모인 것', dense: '빽빽하게 모인 것' };
```

힌트 문장(설계 문서 4.6): 1단계 질문, 2단계 어긋난 카드 짚기, 3단계 기준 제시. `nebula`의 3단계는 "색 말고 밝은지 어두운지로 나눠 보세요."로 고정한다. 나머지 문장은 같은 말투로 쓴다.

- [ ] **Step 1: 실패하는 테스트 작성** — 다음을 확인한다.
  - `correctBin`: 다섯 종류 × 해당 단계의 기대값 전부.
  - 전부 맞게 놓으면 `{ complete: true, correct: true, wrongIds: [] }`.
  - 한 장을 틀리게 놓으면 `correct: false`, `wrongIds`에 그 id만.
  - 한 장을 안 놓으면(`null`) `complete: false`이고 `correct: false`, `wrongIds`는 빈 배열(Review Focus 5: 판정하지 않음).
  - `nextHintLevel(0)`은 0, `(1)`은 1, `(3)`은 3, `(7)`은 3.
  - `HINTS`의 세 단계 모두 문장이 3개씩이고 비어 있지 않음.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** 구현.
- [ ] **Step 4:** 통과 확인.
- [ ] **Step 5:** 커밋 `feat: 묶기 판정과 힌트`

---

### Task 6: 의뢰, 점수, 등급

**Files:**
- Create: `src/logic/requests.js`, `src/logic/scoring.js`
- Modify: `src/config/balance.js`, `src/data/copy.js`
- Test: `tests/logic/requests.test.js`, `tests/logic/scoring.test.js`

**Interfaces:**
- Produces:

```js
// balance.js 추가
export const FREE_UNTIL = 4;            // 4장 모을 때까지 의뢰 없음
export const PICTURE_UNTIL = 10;        // 10장까지 그림 의뢰, 그 뒤 쉬운 말 의뢰
export const UNLOCK_ALL_AT = 8;         // 8장 모으면 교과서 밖 구역 열림
export const REQUEST_SIZE = 3;
export const SCORE = { find: 100, sortCard: 50, wrongSubmit: -30, allTypes: 300, full: 500 };
export const HINT_MULT = [1, 0.7, 0.4, 0.2];   // 힌트 0~3단계
export const RANKS = [{ min: 4000, name: '수석 연구원' }, { min: 2800, name: '정식 연구원' }, { min: 0, name: '수습 연구원' }];
// requests.js
export function requestKind(foundCount: number): 'none' | 'picture' | 'plain'
export function makeRequest(foundIds: Set<string>, deck, openZoneIds: string[], rng): { kind, zoneId, targetIds: string[] } | null
export function openZones(foundCount: number, zones): string[]
// scoring.js
export function stageScore(cardCount: number, hintLevel: number, wrongSubmits: number): number  // 0 미만이면 0
export function totalScore({ found: number, stages: {cardCount,hintLevel,wrongSubmits}[], typesRegistered: number }): number
export function rankFor(score: number): string
// copy.js 추가
export const PLAIN_REQUEST = { emission: '', reflection: '', dark: '', open: '', globular: '' };
```

쉬운 말 의뢰 문장은 용어 없이 겉모습만 쓴다. `dark`는 "구름처럼 뿌연데 어두운 것", `open`은 "별이 엉성하게 모인 것", `globular`은 "별이 공처럼 빽빽하게 뭉친 것", `emission`과 `reflection`은 둘 다 "구름처럼 뿌옇고 밝은 것".

- [ ] **Step 1: 실패하는 테스트 작성** — 다음을 확인한다.
  - `requestKind(3)`은 `'none'`, `(4)`는 `'picture'`, `(10)`은 `'plain'`.
  - `makeRequest`의 대상은 모두 같은 구역이고, 이미 찾은 것이 없으며, 최대 3개. 그 구역에 남은 것이 2개면 2개. 열린 구역에 남은 것이 없으면 `null`.
  - `openZones(7, zones)`는 교과서 구역 4개만, `(8, zones)`는 전부.
  - `stageScore(20, 0, 0)`은 1000, `(20, 1, 1)`은 670, `(8, 3, 9)`는 0.
  - 힌트 없이 전부 맞힌 한 판의 `totalScore`는 4800 (찾기 2000 + 묶기 1000 + 400 + 600 + 보너스 800. 1차 20장, 성운 12장, 성단 8장 기준).
  - `rankFor(4800)`은 `'수석 연구원'`, `(2800)`은 `'정식 연구원'`, `(0)`은 `'수습 연구원'`.
  - `PLAIN_REQUEST`의 어떤 문장에도 "성운", "성단", "방출", "반사", "암흑", "산개", "구상"이 없음.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** 구현. 달성 보너스는 다섯 종류 모두 등록 시 `allTypes`, 20장 완성 시 `full`.
- [ ] **Step 4:** 통과 확인.
- [ ] **Step 5:** 커밋 `feat: 의뢰와 점수, 등급`

---

### Task 7: 저장

**Files:**
- Create: `src/logic/save.js`
- Test: `tests/logic/save.test.js`

**Interfaces:**
- Produces:

```js
export const SAVE_KEY = 'galaxy-archive-save-v1';
export function newGame(seed: number): GameState
// GameState = { version: 1, seed, foundIds: string[], phase: 'collect'|'sort'|'registry'|'result',
//               stage: 'shape'|'nebula'|'cluster'|null, placements: {}, wrongSubmits: {shape:0,nebula:0,cluster:0}, bonusOpen: false }
export function load(storage): GameState | null
export function save(storage, state: GameState): void
export function clear(storage): void
```

- [ ] **Step 1: 실패하는 테스트 작성** — `Map`으로 만든 가짜 저장소로 확인한다.
  - 저장한 뒤 불러오면 같은 상태.
  - 저장된 것이 없으면 `null`.
  - JSON이 아닌 글자가 들어 있으면 `null`(Review Focus 1).
  - `version`이 2이거나 `foundIds`가 배열이 아니면 `null`.
  - 저장소의 `setItem`이 오류를 던져도 `save`는 오류를 던지지 않음(사생활 보호 모드).
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** 구현.
- [ ] **Step 4:** 통과 확인.
- [ ] **Step 5:** 커밋 `feat: 진행 상황 저장`

---

### Task 8: 게임 그림 만들기

**Files:**
- Create: `tools/gen-art.mjs`, `tools/art-manifest.json`, `public/art/*.png`
- Test: `tests/tools/no-key-in-src.test.js`

**Interfaces:**
- Produces: `public/art/` 아래 파일 — `bg-observatory.png`(1536×1024, 하늘 지도 배경), `eyepiece-frame.png`(1024×1024, 가운데가 투명한 망원경 접안 틀), `card-frame.png`(카드 틀), `card-back-unknown.png`(미확인 카드 뒷면), `agent-hq.png`(본부 요원, 투명 배경), `bin-tray.png`(묶음 칸), `icon-zoom.png`, `icon-focus.png`, `icon-hint.png`, `rank-badge-1.png`~`rank-badge-3.png`

- [ ] **Step 1:** `sprite-gen` 스킬을 불러 그 안내를 따른다. 스킬을 쓸 수 없으면 `tools/gen-art.mjs`를 직접 만든다: `node --env-file=.env tools/gen-art.mjs`로 실행하고, `process.env.OPENAI_API_KEY`로 OpenAI 이미지 생성 API를 호출해 `art-manifest.json`의 항목(`file`, `size`, `transparent`, `prompt`)마다 `public/art/`에 저장한다. 이미 있는 파일은 건너뛴다. 모델 이름과 요청 형식은 OpenAI 공식 문서에서 현재 값을 확인해 쓴다. 키 값은 화면에 출력하지 않는다.
- [ ] **Step 2:** `art-manifest.json`을 쓴다. 모든 프롬프트 앞에 같은 화풍 문장을 붙여 그림이 한 세트로 보이게 한다: 짙은 남색 밤하늘, 황동 색 관측 장비, 부드러운 평면 채색, 글자 없음. 그림 안에 실제 성운·성단 모습을 그리게 하지 않는다(관측 사진과 헷갈리지 않게).
- [ ] **Step 3: 테스트 작성**

```js
// tests/tools/no-key-in-src.test.js
import { readdirSync, readFileSync } from 'node:fs';
test('src 아래 어떤 파일도 API 키를 참조하지 않음', () => {
  const files = readdirSync('src', { recursive: true }).filter((f) => String(f).endsWith('.js'));
  for (const f of files) expect(readFileSync(`src/${f}`, 'utf8')).not.toMatch(/OPENAI|api\.openai\.com|sk-/);
});
```

- [ ] **Step 4:** 스크립트를 실행해 그림을 만들고, 하나씩 열어 본다. 글자가 섞였거나 화풍이 어긋난 것은 프롬프트를 고쳐 다시 만든다.
- [ ] **Step 5:** `npm test` 통과 확인. `git status`로 `.env`가 추적되지 않는지 확인.
- [ ] **Step 6:** 커밋 `feat: 게임 그림 생성`

---

### Task 9: 하늘 지도와 구역 훑기 장면

**Files:**
- Create: `src/scenes/SkyMapScene.js`, `src/scenes/ScanScene.js`
- Modify: `src/scenes/BootScene.js`, `src/main.js`
- Test: `tests/scenes/scan-flow.test.js`

**Interfaces:**
- Consumes: `layoutZone` (Task 3), `scan.js` 전부 (Task 4), `makeRequest`, `openZones` (Task 6), `load`, `save`, `newGame` (Task 7), `OBJECTS`, `ZONES` (Task 2)
- Produces: `ScanScene`은 `{ zoneId }`로 시작하고, 카드 20장이 모이면 `SCENES.SORT`로 넘어간다. 카드를 얻을 때마다 `save` 호출.

- [ ] **Step 1: 실패하는 테스트 작성** — 장면 없이 로직만 이어 붙여 한 판의 수집을 흉내 낸다: `newGame(1)`에서 시작해 열린 구역마다 `layoutZone`으로 배치하고, 각 천체 위치로 시야를 옮겨 `lockTarget`이 그 id를 주는지, 20장을 다 찾을 때까지 `makeRequest`가 `null`이 아닌지, 8장째에 `openZones`가 늘어나는지 확인한다.
- [ ] **Step 2:** 실패 확인 후, 로직에서 빠진 것이 있으면 해당 로직 파일을 고쳐 통과시킨다.
- [ ] **Step 3:** `BootScene`에서 `public/art/`와 `public/photos/`를 불러온다. 사진 불러오기에 실패하면 "사진을 불러오지 못했어요. 다시 시도" 버튼을 띄우고 누르면 다시 불러온다(Review Focus 3).
- [ ] **Step 4:** `SkyMapScene`: 배경 위에 `ZONES`의 별자리 선과 이름표를 그린다. 열린 구역만 누를 수 있고, 의뢰가 가리키는 구역은 반짝인다. 위쪽에 의뢰 내용(그림 의뢰면 대상 사진을 흐리게 한 윤곽, 쉬운 말 의뢰면 문장)과 "수집 n / 20"을 보여 준다.
- [ ] **Step 5:** `ScanScene`: 구역 하늘(별 배경은 시드 난수로 찍은 점)을 `eyepiece-frame.png`의 둥근 구멍으로만 보여 준다. 한 손가락으로 끌면 시야가 움직인다. 끄는 속도로 `viewState`를 구해 `'blur'`면 흐림 효과, `'clear'`일 때만 `visibleSmudges`의 얼룩을 그린다. `lockTarget`이 있으면 확대 버튼이 켜지고, 누르면 초점 눈금이 나온다. `focusProgress`가 `captured`면 사진이 선명해지며 "미확인 천체" 카드를 얻는다. 구석에 위치 지도, `IDLE_NUDGE_MS` 동안 발견이 없으면 `nudgeDirection` 화살표.
- [ ] **Step 6:** 손가락이 화면 밖으로 나가거나 두 번째 손가락이 닿으면 끌기를 끝내고 속도를 0으로 둔다(Review Focus 4).
- [ ] **Step 7:** `npm run dev`로 직접 해 본다. 확인할 것: 휙휙 휘두르면 얼룩이 안 보인다, 천천히 훑으면 보인다, 카드 한 장 얻는 데 1분 안팎이다, 새로 고침해도 모은 카드가 남는다, 스마트폰 크기(가로 844×390)에서 버튼이 눌린다. 한 장에 1분보다 많이 걸리면 `balance.js`의 `ZONE_W`, `ZONE_H`를 줄인다.
- [ ] **Step 8:** `npm test`, `npm run build` 통과 확인.
- [ ] **Step 9:** 커밋 `feat: 하늘 지도와 구역 훑기`

---

### Task 10: 묶기, 도감 등록, 결과, 출처 장면

**Files:**
- Create: `src/scenes/SortScene.js`, `src/scenes/RegistryScene.js`, `src/scenes/ResultScene.js`, `src/scenes/CreditsScene.js`
- Modify: `src/data/copy.js`, `src/main.js`
- Test: `tests/scenes/sort-flow.test.js`, `tests/data/copy.test.js`

**Interfaces:**
- Consumes: `sorting.js` 전부 (Task 5), `scoring.js` 전부 (Task 6), `save` (Task 7)
- Produces: `copy.js`에 `TYPE_INFO = { emission: { nameKo: '방출 성운', line: '' }, ... }` 추가

`TYPE_INFO`의 `line`은 교과서 문장을 한 줄로 쓴다(설계 문서 4.7).
- 방출 성운: "주변의 별빛을 흡수해 가열되면서 스스로 빛을 내는 성운"
- 반사 성운: "주변의 별빛을 반사하여 밝게 보이는 성운"
- 암흑 성운: "뒤쪽에서 오는 별빛을 가로막아 어둡게 보이는 성운"
- 산개 성단: "수십~수만 개의 별이 일정한 모양 없이 엉성하게 모여 있는 성단"
- 구상 성단: "수만~수십만 개의 별이 공 모양으로 빽빽하게 모여 있는 성단"

- [ ] **Step 1: 실패하는 테스트 작성**
  - `sort-flow`: 20장을 1차에서 전부 맞게 놓고 `judge`, 성운만 추려 2차, 성단만 추려 2차를 거쳐 `totalScore`가 4800인지. 1차에서 색으로 묶은 것처럼 일부를 틀리게 놓으면 `wrongIds`가 나오고 `nextHintLevel`이 1이 되는지.
  - `copy`: `TYPE_INFO`가 다섯 종류를 모두 갖고, 위 다섯 문장과 글자 그대로 같은지.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** `SortScene`: 아래쪽에 카드 한 줄(옆으로 넘김), 위쪽에 묶음 칸 2개와 `BIN_LABELS` 이름표. 단, 1차를 통과하기 전에는 "성운", "성단"이라는 말을 화면에 쓰지 않는다. 카드를 끌어 칸에 놓고, 놓은 카드는 다시 꺼낼 수 있다. "판정" 버튼은 `judge`를 부른다. `complete`가 거짓이면 "아직 놓지 않은 카드가 있어요"만 띄운다. 틀리면 `wrongSubmits`를 올리고 `nextHintLevel`에 맞는 힌트를 본부 요원 말풍선으로 띄운다. 2단계 힌트부터는 `wrongIds` 카드가 반짝인다. 맞으면 다음 단계(`shape` → `nebula` → `cluster`)로 간다. 끌던 카드는 손가락이 화면 밖으로 나가면 원래 자리로 돌아간다(Review Focus 4).
- [ ] **Step 4:** `RegistryScene`: 카드가 한 장씩 뒤집히며 이름, 종류, `TYPE_INFO` 한 줄, 별자리, 거리(광년)가 열린다. 방출 성운과 반사 성운은 "스스로 빛을 낸다", "별빛을 반사한다"를 강조한다. 구역별로 모아 보는 화면에서 같은 별자리 카드들의 거리를 나란히 보여 주고 "같은 별자리 방향에 보여도 거리는 서로 달라요" 한 줄을 띄운다.
- [ ] **Step 5:** `ResultScene`: 총점, `rankFor` 등급과 배지, "처음부터 다시", "사진 출처" 버튼. `CreditsScene`: `OBJECTS`의 `nameKo`, `credit`, `license`, `pageUrl`을 목록으로 보여 주고 "사진 크기를 줄여 사용함"을 적는다.
- [ ] **Step 6:** `npm run dev`로 처음부터 끝까지 한 판 해 본다. 확인할 것: 일부러 색으로 묶으면 힌트가 세 단계로 강해진다, 마구 찍으면 점수가 깎인다, 힌트를 다 써도 끝까지 갈 수 있다, 묶기 도중 새로 고침해도 이어진다, 한 판이 30분 안팎이다.
- [ ] **Step 7:** `npm test`, `npm run build` 통과 확인.
- [ ] **Step 8:** 커밋 `feat: 묶기와 도감 등록, 결과 화면`

---

### Task 11: 보너스 구역

**Files:**
- Modify: `src/data/objects.js`, `src/data/zones.js`, `src/data/copy.js`, `src/logic/requests.js`, `src/scenes/SkyMapScene.js`, `src/scenes/ResultScene.js`
- Test: `tests/logic/requests.test.js`

**Interfaces:**
- Consumes: `makeRequest` (Task 6)
- Produces: `makeTermRequest(type: string, foundIds, objects, rng): { kind: 'term', zoneId, targetIds } | null`; `copy.js`에 `TERM_REQUEST = (typeNameKo) => \`${typeNameKo}을 하나 더 찾아라\``

- [ ] **Step 1: 실패하는 테스트 작성** — `makeTermRequest('globular', …)`의 대상이 필수 20장에 없는 구상 성단인지, 남은 것이 없으면 `null`인지.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** 구현. 결과 화면에 "보너스 관측" 버튼을 두고, 누르면 하늘 지도에 외부 은하 구역과 `deck: false`인 천체가 열린다. 보너스에서 얻은 카드는 곧바로 등록되고 점수에는 더하지 않는다. 외부 은하 카드에는 "우리은하 밖에 있는 은하"라고 적는다.
- [ ] **Step 4:** 통과 확인, 직접 해 보기.
- [ ] **Step 5:** 커밋 `feat: 보너스 구역`

---

### Task 12: 배포 준비

**Files:**
- Create: `README.md`
- Modify: `../CLAUDE.md` (작업 공간 게임 목록에 한 줄 추가)

- [ ] **Step 1:** `npm test`, `npm run build` 통과 확인. `dist/` 안에 `OPENAI`나 `sk-`로 시작하는 글자가 없는지 Grep으로 확인.
- [ ] **Step 2:** `npm run preview`로 배포본을 열어 태블릿 크기(1180×820)와 스마트폰 크기(844×390)에서 한 판씩 해 본다.
- [ ] **Step 3:** `README.md`에 실행 방법, 사진 출처 원칙, 그림 생성 방법을 쓴다. 작업 공간 `CLAUDE.md` 게임 목록에 이 게임을 더한다.
- [ ] **Step 4:** 커밋 `docs: 안내 문서와 게임 목록`
- [ ] **Step 5:** GitHub 저장소 만들기와 Vercel 배포는 밖으로 공개되는 일이므로 선생님에게 확인받은 뒤 한다.
