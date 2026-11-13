// 랜딩(첫 화면, index.html의 #landing). 게임은 그 뒤에서 미리 불러오고, 버튼을 누르면 랜딩이 걷힌다.
// 버튼을 누를 때 전체 화면으로 바꾸고 가로로 잠근다. 이어 하던 판이 있으면 버튼 글이 바뀐다. 밤 시계는 구역에 들어가야 가므로 랜딩이 떠 있는 동안 잃는 것은 없다.
import { SAVE_KEY } from './logic/save.js';

export const LANDING_TEXT = { start: '관측 시작하기', resume: '이어서 관측하기' };

// 하던 판이 있는가: 시작 브리핑을 넘겼거나 카드를 한 장이라도 찾았다(게임은 처음 열자마자 빈 판을 저장해 두므로 키만으로는 알 수 없다).
// 저장소가 막혔거나 저장이 깨졌으면 없는 것으로 본다.
export function hasSave(storage) {
  try {
    const saved = JSON.parse(storage.getItem(SAVE_KEY));
    return !!saved && (saved.introSeen === true || (Array.isArray(saved.foundIds) && saved.foundIds.length > 0));
  } catch {
    return false;
  }
}

export const startLabel = (saved) => (saved ? LANDING_TEXT.resume : LANDING_TEXT.start);

// 전체 화면으로 바꾸고 가로로 잠근다. 누르기(사용자 동작) 안에서 불러야 브라우저가 받아 준다.
// 전체 화면이 되면 true. 가로 잠금은 전체 화면일 때만 되고, 안 되는 기기(아이폰, PC)에서는 그냥 넘어간다
// (세로로 들면 「기기를 가로로 돌려 주세요」 덮개가 나온다). 전체 화면을 나가면 잠금도 함께 풀린다.
export async function enterFullscreenLandscape(doc = document, scr = globalThis.screen) {
  const root = doc.documentElement;
  const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
  if (!request) return false;
  try {
    if (!(doc.fullscreenElement ?? doc.webkitFullscreenElement)) await request.call(root, { navigationUI: 'hide' });
  } catch {
    return false;
  }
  try {
    await scr?.orientation?.lock?.('landscape');
  } catch {
    // 가로 잠금을 지원하지 않는 기기
  }
  return true;
}

export function initLanding(doc = document, win = window) {
  const el = doc.getElementById('landing');
  const btn = doc.getElementById('landing-start');
  if (!el || !btn) return;
  let storage = null;
  try {
    storage = win.localStorage;
  } catch {
    storage = null;
  }
  btn.textContent = startLabel(hasSave(storage));
  // Phaser는 캔버스 밖의 누르기도 window에서 받아 게임 좌표로 옮긴다. 랜딩을 누른 것이 그 아래 하늘 지도의 별자리를
  // 누른 것으로 새지 않게, 랜딩에서 일어난 누르기는 여기서 멈춘다.
  for (const type of ['mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchend', 'touchmove', 'touchcancel', 'wheel']) {
    el.addEventListener(type, (e) => e.stopPropagation());
  }
  btn.addEventListener('click', () => {
    enterFullscreenLandscape(doc, win.screen);
    el.classList.add('gone');
    el.setAttribute('aria-hidden', 'true');
    btn.blur();
  }, { once: true });
  // 전체 화면에서 나온 뒤 세로로 들고 있으면 덮개가 보인다. 덮개를 누르면 다시 전체 화면·가로로 돌아간다.
  doc.getElementById('rotate')?.addEventListener('click', () => enterFullscreenLandscape(doc, win.screen));
}
