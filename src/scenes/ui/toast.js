import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game.js';
import { addText, addPlate } from './style.js';

// 화면 가운데 잠깐 떴다 사라지는 한 줄 알림. 앞 알림은 지운다.
export function showToast(scene, str, { y = GAME_HEIGHT / 2, ms = 1600 } = {}) {
  if (scene.toastObj) {
    scene.tweens.killTweensOf(scene.toastObj);
    scene.toastObj.destroy();
  }
  const c = scene.add.container(GAME_WIDTH / 2, y).setDepth(200);
  const t = addText(scene, 0, 0, str, { size: 30, bold: true, origin: [0.5, 0.5] });
  const w = t.width + 72;
  c.add([addPlate(scene, -w / 2, -40, w, 80, 0.95), t]);
  scene.toastObj = c;
  scene.tweens.add({ targets: c, alpha: 0, delay: ms, duration: 350, onComplete: () => c.destroy() });
  return c;
}
