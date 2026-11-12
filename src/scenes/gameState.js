import { load, save, clear, newGame, repairState } from '../logic/save.js';
import { OBJECTS } from '../data/objects.js';
import { ZONES } from '../data/zones.js';
import { openZones, currentRequest, currentTermRequest } from '../logic/requests.js';
import { inBonus } from '../logic/bonus.js';
import { SCENES } from '../config/game.js';

// 장면들이 함께 쓰는 진행 상황. 게임 registry에 한 벌만 두고, 바꿀 때마다 기기에 저장한다.
export const DECK = OBJECTS.filter((o) => o.deck);
export const DECK_SIZE = DECK.length;
export const DECK_IDS = DECK.map((o) => o.id);

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null; // 저장소 접근이 막힌 브라우저: 저장 없이 진행
  }
}

// 저장된 판을 불러오고, 없으면 새 판을 만들어 저장한다.
export function bootState(registry) {
  const st = storage();
  let state = st ? load(st) : null;
  if (!state) {
    state = newGame(Math.floor(Math.random() * 2 ** 31));
    if (st) save(st, state);
  }
  // 손으로 고친 저장(필수 카드가 모자란데 묶기 이후 단계)은 모으기로 되돌리고, 다 모았는데 모으기면 묶기로 올린다.
  const fixed = repairState(state, DECK_IDS);
  if (fixed !== state) {
    state = fixed;
    if (st) save(st, state);
  }
  registry.set('state', state);
  return state;
}

export const getState = (scene) => scene.registry.get('state');

// 불러온 판의 단계에 맞는 장면(불러오기 뒤, 새로 고침 뒤).
const PHASE_SCENE = { collect: SCENES.SKY_MAP, sort: SCENES.SORT, registry: SCENES.REGISTRY, result: SCENES.RESULT };
export const sceneForPhase = (phase) => PHASE_SCENE[phase] ?? SCENES.SKY_MAP;
// 결과 단계에서 보너스 관측 중이면 결과 화면이 아니라 하늘 지도로 돌아간다(결과는 지도의 "결과 화면으로"로 본다).
export const sceneForState = (state) => (inBonus(state) ? SCENES.SKY_MAP : sceneForPhase(state.phase));
// 하늘 지도는 모으기와 보너스 관측에서만 쓴다. 그 밖의 단계(예: 20장째를 얻자마자 「지도로」를 누름)로 들어오면
// 그 단계의 장면 이름을 돌려준다. 머물러도 되면 null.
export const skyMapRedirect = (state) => (state.phase === 'collect' || inBonus(state) ? null : sceneForState(state));

export function persist(scene) {
  const st = storage();
  if (st) save(st, getState(scene));
}

// 새 상태를 두고 곧바로 저장한다.
export function commit(scene, state) {
  scene.registry.set('state', state);
  persist(scene);
  return state;
}

// "처음부터 다시": 저장을 지우고 새 판을 만든다. 하늘 지도의 의뢰와 열린 구역 기억도 지운다.
export function resetGame(scene) {
  const st = storage();
  if (st) clear(st);
  scene.registry.remove('request');
  scene.registry.remove('seenOpenCount');
  return commit(scene, newGame(Math.floor(Math.random() * 2 ** 31)));
}

// 지금 의뢰를 정해 registry에 둔다(하늘 지도와 훑기 화면이 같은 의뢰를 본다).
export function refreshRequest(scene) {
  const state = getState(scene);
  const found = new Set(state.foundIds);
  if (inBonus(state)) {
    const term = currentTermRequest(scene.registry.get('request') ?? null, found, state.seed, OBJECTS);
    scene.registry.set('request', term);
    return term;
  }
  const req = currentRequest(scene.registry.get('request') ?? null, found, state.seed, DECK, openZones(found.size, ZONES));
  scene.registry.set('request', req);
  return req;
}
