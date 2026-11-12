import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/game.js';
import { isPortrait } from './config/orientation.js';
import BootScene from './scenes/BootScene.js';
import SkyMapScene from './scenes/SkyMapScene.js';
import ScanScene from './scenes/ScanScene.js';
import SortScene from './scenes/SortScene.js';
import RegistryScene from './scenes/RegistryScene.js';
import ResultScene from './scenes/ResultScene.js';
import CreditsScene from './scenes/CreditsScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#05070f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // 두 번째 손가락을 알아채야 끌기를 끝낼 수 있다.
  input: { activePointers: 2 },
  // 연결이 멈춘 사진도 20초 뒤에는 실패로 끝나 "다시 시도"로 이어지게(기본값 0은 한없이 기다린다).
  loader: { timeout: 20000 },
  scene: [BootScene, SkyMapScene, ScanScene, SortScene, RegistryScene, ResultScene, CreditsScene],
});

// 세로 화면이면 덮개를 보이고 게임을 멈춘다. 상태가 바뀔 때만 멈추거나 다시 움직인다.
// force: 탭이 다시 보이게 되면 지금 방향을 다시 적용한다(세로인 채로 돌아오면 계속 멈춰 있게).
let portraitApplied = null;
function applyOrientation(force = false) {
  const portrait = isPortrait(window.innerWidth, window.innerHeight);
  if (!force && portrait === portraitApplied) return;
  portraitApplied = portrait;
  document.documentElement.classList.toggle('rotate', portrait);
  if (portrait) game.pause();
  else game.resume();
}

window.addEventListener('resize', () => applyOrientation());
window.addEventListener('orientationchange', () => applyOrientation());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) applyOrientation(true);
});
game.events.on('visible', () => applyOrientation(true));
applyOrientation(true);

// 개발 중에만: 브라우저 자동 점검이 장면 상태를 읽을 수 있게 한다(배포본에는 들어가지 않는다).
if (import.meta.env.DEV) window.__GA = game;
