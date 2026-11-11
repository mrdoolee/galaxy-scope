import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/game.js';
import { isPortrait } from './config/orientation.js';
import BootScene from './scenes/BootScene.js';

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
  scene: [BootScene],
});

// 세로 화면이면 덮개를 보이고 게임을 멈춘다.
function applyOrientation() {
  const portrait = isPortrait(window.innerWidth, window.innerHeight);
  document.documentElement.classList.toggle('rotate', portrait);
  if (portrait) game.pause();
  else game.resume();
}

window.addEventListener('resize', applyOrientation);
window.addEventListener('orientationchange', applyOrientation);
applyOrientation();
