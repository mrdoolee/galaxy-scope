// 배경 음악 켜고 끄는 단추(index.html의 #bgm-toggle). 화면 오른쪽 위에 떠 있다.
// 게임 화면(16:9)을 가리지 않는다: 화면 옆이나 위에 남는 띠가 있으면 거기에 놓이고,
// 남는 띠가 없으면(화면이 거의 16:9) 게임을 조금 줄여 오른쪽에 단추 자리를 만든다.
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.js';

export const BGM_TEXT = { turnOff: '배경 음악 끄기', turnOn: '배경 음악 켜기' };

/**
 * 게임 오른쪽에 비워 둘 너비(CSS px). need는 단추와 여백을 합친 한 변.
 * 게임을 화면에 맞춰 넣었을 때 옆 띠나 위 띠가 need 이상이면 0(단추가 띠 안에 들어간다), 아니면 need.
 */
export function gutterFor(viewW, viewH, need) {
  const gameW = Math.min(viewW, (viewH * GAME_WIDTH) / GAME_HEIGHT);
  const gameH = (gameW * GAME_HEIGHT) / GAME_WIDTH;
  const side = (viewW - gameW) / 2;
  const top = (viewH - gameH) / 2;
  return side >= need || top >= need ? 0 : need;
}

/**
 * initBgmButton({ bgm, onLayout }) -> { show() }
 *   show()     단추를 보인다(랜딩에서 시작을 누른 뒤)
 *   onLayout() 게임 자리(#game)의 크기가 바뀌었을 때(Phaser에 다시 맞추라고 알린다)
 */
export function initBgmButton({ bgm, onLayout = () => {}, doc = document, win = window } = {}) {
  const btn = doc.getElementById('bgm-toggle');
  const gameEl = doc.getElementById('game');
  if (!btn || !gameEl) return { show() {} };
  let shown = false;
  let gutter = null;

  const paint = () => {
    btn.classList.toggle('off', !bgm.on);
    btn.setAttribute('aria-pressed', String(bgm.on));
    btn.setAttribute('aria-label', bgm.on ? BGM_TEXT.turnOff : BGM_TEXT.turnOn);
    btn.title = bgm.on ? BGM_TEXT.turnOff : BGM_TEXT.turnOn;
  };

  const layout = () => {
    const margin = parseFloat(win.getComputedStyle(btn).right) || 8;
    const next = shown ? gutterFor(win.innerWidth, win.innerHeight, btn.offsetWidth + 2 * margin) : 0;
    if (next === gutter) return;
    gutter = next;
    gameEl.style.right = `${next}px`;
    onLayout();
  };

  // 단추를 누른 것이 게임의 누르기로 새지 않게 한다(Phaser는 캔버스 밖의 누르기도 window에서 받는다).
  for (const type of ['mousedown', 'mouseup', 'touchstart', 'touchend', 'touchcancel']) {
    btn.addEventListener(type, (e) => e.stopPropagation());
  }
  btn.addEventListener('click', () => {
    bgm.toggle();
    paint();
    btn.blur(); // 스페이스·엔터가 다시 단추를 누르지 않게
  });
  win.addEventListener('resize', layout);
  win.addEventListener('orientationchange', layout);
  doc.addEventListener('fullscreenchange', layout);
  paint();

  return {
    show() {
      shown = true;
      btn.hidden = false;
      paint();
      layout();
    },
  };
}
