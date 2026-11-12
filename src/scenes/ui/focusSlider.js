import { COLOR } from './style.js';
import { MIN_TOUCH } from './button.js';

/**
 * 초점 눈금: 가로로 끄는 막대. (x, y)는 가운데, width는 눈금 길이.
 *   makeFocusSlider(scene, x, y, width) -> { container, value, setValue(v), release() }
 * 막대 아무 곳이나 누르면 그 자리로 가고, 누른 손가락으로 끌면 따라간다.
 * 손가락이 화면 밖으로 나가거나 떼어지면 놓는다.
 */
export function makeFocusSlider(scene, x, y, width) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(COLOR.navy, 0.9);
  g.fillRoundedRect(-width / 2 - 30, -34, width + 60, 68, 30);
  g.lineStyle(2, COLOR.brass, 0.8);
  g.strokeRoundedRect(-width / 2 - 30, -34, width + 60, 68, 30);
  g.lineStyle(6, COLOR.brass, 0.9);
  g.lineBetween(-width / 2, 0, width / 2, 0);
  g.lineStyle(2, COLOR.brassLight, 0.8);
  for (let i = 0; i <= 10; i++) {
    const tx = -width / 2 + (width * i) / 10;
    const h = i % 5 === 0 ? 18 : 10;
    g.lineBetween(tx, -h, tx, h);
  }
  const knob = scene.add.image(-width / 2, 0, 'icon-focus');
  knob.setScale(84 / knob.width);
  const hit = scene.add.zone(0, 0, width + MIN_TOUCH, MIN_TOUCH + 8).setInteractive({ useHandCursor: true });
  c.add([g, knob, hit]);

  let pointerId = null;
  const api = {
    container: c,
    value: 0,
    setValue(v) {
      api.value = Math.min(1, Math.max(0, v));
      knob.x = -width / 2 + api.value * width;
    },
    release() {
      pointerId = null;
    },
  };
  const fromPointer = (p) => api.setValue((p.x - c.x + width / 2) / width);
  hit.on('pointerdown', (p) => {
    pointerId = p.id;
    fromPointer(p);
  });
  scene.input.on('pointermove', (p) => {
    if (p.id === pointerId && c.visible) fromPointer(p);
  });
  scene.input.on('pointerup', (p) => { if (p.id === pointerId) api.release(); });
  scene.input.on('pointerupoutside', (p) => { if (p.id === pointerId) api.release(); });
  scene.input.on('gameout', () => api.release());
  return api;
}
