import { COLOR, addText } from './style.js';

// 같은 손가락이 이 버튼 위에서 눌렀다가 뗄 때만 누른 것으로 친다.
// 앞 화면에서 누르고 있던 손가락이 새 버튼 위에서 떨어져도 눌리지 않도록, 나타난 뒤 ARM_MS 동안은 무시한다.
const ARM_MS = 250;
export const MIN_TOUCH = 88;

/**
 * 버튼 하나. (x, y)는 가운데. w, h는 터치 영역이며 88 미만이면 88로 키운다.
 *   makeButton(scene, x, y, { w, h, label, icon, iconSize, size, onTap })
 *   -> { container, setEnabled(bool), setLabel(str), enabled }
 */
export function makeButton(scene, x, y, { w = 200, h = 88, label = '', icon = null, iconSize = 72, size = 26, onTap = () => {} } = {}) {
  w = Math.max(w, MIN_TOUCH);
  h = Math.max(h, MIN_TOUCH);
  const c = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const draw = (on) => {
    bg.clear();
    bg.fillStyle(on ? COLOR.navyLight : COLOR.navy, on ? 0.95 : 0.7);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    bg.lineStyle(3, COLOR.brass, on ? 1 : 0.35);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  };
  c.add(bg);

  let img = null;
  if (icon) {
    img = scene.add.image(0, label ? -14 : 0, icon);
    img.setScale(iconSize / img.width);
    c.add(img);
  }
  const txt = addText(scene, 0, icon ? h / 2 - 22 : 0, label, { size, bold: true, origin: [0.5, 0.5], align: 'center' });
  c.add(txt);

  const hit = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  c.add(hit);

  const api = {
    container: c,
    enabled: true,
    setEnabled(on) {
      api.enabled = on;
      draw(on);
      c.setAlpha(on ? 1 : 0.55);
      return api;
    },
    setLabel(str) {
      txt.setText(str);
      return api;
    },
  };
  onPress(scene, hit, onTap, () => api.enabled);
  draw(true);
  return api;
}

// 터치 영역 하나에 누르기 판정을 붙인다(버튼 판이 필요 없는 곳, 예: 하늘 지도의 별자리).
export function onPress(scene, hit, onTap, isEnabled = () => true) {
  const armedAt = scene.time.now + ARM_MS;
  let press = null;
  hit.on('pointerdown', (p) => {
    press = isEnabled() && scene.time.now >= armedAt ? { id: p.id, downTime: p.downTime } : null;
  });
  hit.on('pointerup', (p) => {
    const ok = press && press.id === p.id && press.downTime === p.downTime;
    press = null;
    if (ok && isEnabled()) onTap();
  });
  hit.on('pointerout', () => {
    press = null;
  });
}
