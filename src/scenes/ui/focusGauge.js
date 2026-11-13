import { COLOR } from './style.js';

/**
 * 초점 눈금: 손잡이가 혼자 좌우로 오가는 막대(누르거나 끌 수 없다). (x, y)는 가운데, width는 눈금 길이.
 *   makeFocusGauge(scene, x, y, width) -> { container, value, setValue(v) }
 * 값은 장면이 매 프레임 넣는다(logic/scan.js의 gaugeValue). 언제 촬영을 누르느냐가 놀이다.
 */
export function makeFocusGauge(scene, x, y, width) {
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
  c.add([g, knob]);

  const api = {
    container: c,
    value: 0,
    setValue(v) {
      api.value = Math.min(1, Math.max(0, v));
      knob.x = -width / 2 + api.value * width;
    },
  };
  return api;
}
