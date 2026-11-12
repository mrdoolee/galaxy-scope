// 남은 밤: 달(밤의 시작)에서 해(해돋이)로 가는 막대. 남은 부분이 해 쪽에 붙어 있고 밤이 갈수록 줄어든다.
import { NIGHT_TEXT } from '../../data/copy.js';
import { addText, addPlate, COLOR } from './style.js';

const ICON = 46;
const BAR_H = 16;
const LOW = 0.2; // 남은 밤이 이 비율 아래면 막대가 해 뜨는 색으로

/**
 * makeNightBar(scene, x, y, width): (x, y)는 판 가운데, width는 판 너비. 판 높이는 104.
 *   -> { container, set(leftMs, totalMs, nightNo) }
 */
export function makeNightBar(scene, x, y, width) {
  const c = scene.add.container(x, y);
  const plate = addPlate(scene, -width / 2, -52, width, 104, 0.9);
  const label = addText(scene, 0, -26, '', { size: 26, bold: true, color: COLOR.textBrass, origin: [0.5, 0.5] });
  const rowY = 22;
  const moon = scene.add.image(-width / 2 + 10 + ICON / 2, rowY, 'icon-moon');
  moon.setScale(ICON / moon.width);
  const sun = scene.add.image(width / 2 - 10 - ICON / 2, rowY, 'icon-sun');
  sun.setScale(ICON / sun.width);
  const x0 = -width / 2 + 14 + ICON;
  const x1 = width / 2 - 14 - ICON;
  const track = scene.add.graphics();
  track.fillStyle(0x02040a, 0.9);
  track.fillRoundedRect(x0, rowY - BAR_H / 2, x1 - x0, BAR_H, BAR_H / 2);
  track.lineStyle(2, COLOR.brass, 0.8);
  track.strokeRoundedRect(x0, rowY - BAR_H / 2, x1 - x0, BAR_H, BAR_H / 2);
  const fill = scene.add.graphics();
  c.add([plate, label, track, fill, moon, sun]);

  // 매 프레임 불려도 보이는 값(밤 번호, 채움 너비 px, 색)이 바뀔 때만 다시 그린다.
  let shownNight = null;
  let shownFill = null;
  return {
    container: c,
    set(leftMs, totalMs, nightNo) {
      if (nightNo !== shownNight) {
        shownNight = nightNo;
        label.setText(NIGHT_TEXT.nightLabel(nightNo));
      }
      const k = totalMs > 0 ? Math.min(1, Math.max(0, leftMs / totalMs)) : 0;
      const w = k <= 0 ? 0 : Math.round(Math.max(BAR_H, (x1 - x0) * k));
      const key = `${w}|${k < LOW}`;
      if (key === shownFill) return;
      shownFill = key;
      fill.clear();
      if (w === 0) return;
      fill.fillStyle(k < LOW ? 0xffa65c : COLOR.brassLight, 1);
      fill.fillRoundedRect(x1 - w, rowY - BAR_H / 2 + 2, w, BAR_H - 4, (BAR_H - 4) / 2);
    },
  };
}
