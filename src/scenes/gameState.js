import { load, save, newGame } from '../logic/save.js';
import { OBJECTS } from '../data/objects.js';
import { ZONES } from '../data/zones.js';
import { openZones, currentRequest } from '../logic/requests.js';

// 장면들이 함께 쓰는 진행 상황. 게임 registry에 한 벌만 두고, 바꿀 때마다 기기에 저장한다.
export const DECK = OBJECTS.filter((o) => o.deck);
export const DECK_SIZE = DECK.length;

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
  registry.set('state', state);
  return state;
}

export const getState = (scene) => scene.registry.get('state');

export function persist(scene) {
  const st = storage();
  if (st) save(st, getState(scene));
}

// 지금 의뢰를 정해 registry에 둔다(하늘 지도와 훑기 화면이 같은 의뢰를 본다).
export function refreshRequest(scene) {
  const state = getState(scene);
  const found = new Set(state.foundIds);
  const req = currentRequest(scene.registry.get('request') ?? null, found, state.seed, DECK, openZones(found.size, ZONES));
  scene.registry.set('request', req);
  return req;
}
