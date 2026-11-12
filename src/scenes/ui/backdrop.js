import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game.js';

const KEY = 'bg-observatory';

// 배경 그림(bg-observatory)을 화면에 가득 차게(넘치는 부분은 잘라) 깐다.
export function addBackdrop(scene, tint = 0xffffff) {
  const bg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, KEY);
  bg.setScale(Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height)).setTint(tint);
  return bg;
}

// 같은 배경 그림에서 화면의 한 사각형(x, y, w, h)만 잘라, addBackdrop과 꼭 같은 자리에 깐다.
// 넘겨 보는 목록이나 하늘 위를 덮는 띠에 쓴다.
export function addBackdropPiece(scene, { x, y, w, h }, tint = 0xffffff) {
  const bg = scene.add.image(0, 0, KEY).setOrigin(0, 0);
  const s = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
  const left = (GAME_WIDTH - bg.width * s) / 2;
  const top = (GAME_HEIGHT - bg.height * s) / 2;
  bg.setScale(s).setPosition(left, top).setTint(tint);
  bg.setCrop((x - left) / s, (y - top) / s, w / s, h / s);
  return bg;
}
