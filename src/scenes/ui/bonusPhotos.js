import { OBJECTS } from '../../data/objects.js';
import { BOOT_TEXT, BONUS_TEXT } from '../../data/copy.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game.js';
import { photoKey } from './photoTextures.js';
import { addText } from './style.js';
import { makeButton } from './button.js';

// 보너스 사진(deck: false)은 보너스 관측에 들어갈 때 처음 불러온다. 다 있으면 곧바로 onReady.
// 실패하면 "다시 시도" 버튼을 보여 준다. 「결과 화면으로」 버튼은 부르는 장면이 먼저 놓는다(불러오는 중에도 나갈 수 있게).
export function ensureBonusPhotos(scene, onReady) {
  const missing = () => OBJECTS.filter((o) => !o.deck && !scene.textures.exists(photoKey(o.id)));
  if (missing().length === 0) {
    onReady();
    return;
  }
  const note = addText(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, BONUS_TEXT.loading, { size: 32, origin: [0.5, 0.5] });
  let retry = null;
  const start = () => {
    retry?.container.destroy();
    retry = null;
    note.setText(BONUS_TEXT.loading);
    for (const o of missing()) scene.load.image(photoKey(o.id), o.photo.file);
    scene.load.once('complete', () => {
      if (missing().length === 0) {
        note.destroy();
        onReady();
        return;
      }
      note.setText(BOOT_TEXT.failed);
      retry = makeButton(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, { w: 280, h: 96, label: BOOT_TEXT.retry, onTap: start });
    });
    scene.load.start();
  };
  start();
}
