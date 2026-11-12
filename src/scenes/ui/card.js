import { photoKey, coverImage } from './photoTextures.js';
import { addText, COLOR, MIN_FONT } from './style.js';

// card-frame.png(512×768)의 사진 창과 아래 글 띠. tools/art-manifest.json의 window 값과 같다.
const CARD_W = 512;
const CARD_H = 768;
const WINDOW = { x: 24, y: 128, w: 463, h: 436 };
const BAND_Y = 660; // 글 띠 가운데(텍스처 좌표)

/**
 * 카드 한 장. (x, y)는 가운데, height는 화면에서의 카드 높이.
 *   makeCard(scene, x, y, { id, height, label }) -> Container
 * 사진은 창 크기에 맞춰 잘라 틀 아래에 깐다. label이 없으면 글 띠는 비워 둔다.
 */
export function makeCard(scene, x, y, { id, height = 460, label = '' } = {}) {
  const s = height / CARD_H;
  const c = scene.add.container(x, y);
  const wx = (WINDOW.x + WINDOW.w / 2 - CARD_W / 2) * s;
  const wy = (WINDOW.y + WINDOW.h / 2 - CARD_H / 2) * s;
  // 틀 안쪽 가장자리 아래로 사진이 조금 들어가게 창보다 약간 크게 잘라 깐다.
  const photo = coverImage(scene.add.image(wx, wy, photoKey(id)), (WINDOW.w + 8) * s, (WINDOW.h + 8) * s);
  const frame = scene.add.image(0, 0, 'card-frame').setScale(s);
  c.add([photo, frame]);
  if (label) {
    c.add(addText(scene, 0, (BAND_Y - CARD_H / 2) * s, label, { size: Math.max(MIN_FONT, Math.round(44 * s)), bold: true, color: COLOR.textBrass, origin: [0.5, 0.5] }));
  }
  c.setSize(CARD_W * s, CARD_H * s);
  return c;
}

// 카드 뒷면(card-back-unknown.png). 도감 등록에서 뒤집기 전 모습.
export function makeCardBack(scene, x, y, { height = 460 } = {}) {
  const s = height / CARD_H;
  const c = scene.add.container(x, y);
  c.add(scene.add.image(0, 0, 'card-back-unknown').setScale(s));
  c.setSize(CARD_W * s, CARD_H * s);
  return c;
}

// 카드 둘레를 반짝이는 선으로 짚는다(힌트 2단계부터 어긋난 카드). 카드와 함께 움직이고 커지고 작아진다.
export function setCardGlow(scene, card, on) {
  if (!card.glow && !on) return;
  if (!card.glow) {
    const w = card.width;
    const h = card.height;
    const g = scene.add.graphics();
    const t = Math.max(6, w * 0.06);
    g.lineStyle(t, 0xffe08a, 1);
    g.strokeRoundedRect(-w / 2 - t / 2, -h / 2 - t / 2, w + t, h + t, w * 0.08);
    card.add(g);
    card.glow = g;
    scene.tweens.add({ targets: g, alpha: 0.15, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
  card.glow.setVisible(on);
}
