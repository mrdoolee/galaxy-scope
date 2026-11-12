// 구역 하늘의 별자리: 흐린 선, 밝은 별(등급이 밝을수록 크게), 길잡이 이름표.
// 모두 하늘 container에 넣으므로 시야와 함께 움직이고, 빠르게 움직일 때의 흐림·어둡게도 함께 받는다.
import { chartStars, chartSegs, chartGuides } from '../../logic/chart.js';
import { addText, COLOR, MIN_FONT } from './style.js';

const LINE = { width: 2, color: 0x8fa6d8, alpha: 0.28 }; // 길을 알려 주되 눈에 띄지 않게
const LABEL_GAP = 12;                                     // 별 가장자리와 이름표 사이

// 등급(작을수록 밝다) → 별 반지름. 무작위 잔별(최대 약 2.8)보다 늘 크다.
export const starRadius = (mag) => Math.min(7, Math.max(3.2, 3 + (4.5 - mag) * 0.85));

export function addChartSky(scene, container, zoneId) {
  const g = scene.add.graphics();
  g.lineStyle(LINE.width, LINE.color, LINE.alpha);
  for (const [a, b] of chartSegs(zoneId)) g.lineBetween(a.x, a.y, b.x, b.y);

  const stars = chartStars(zoneId);
  for (const s of stars) {
    const r = starRadius(s.mag);
    g.fillStyle(0xdfe8ff, 0.12);
    g.fillCircle(s.x, s.y, r * 2.6); // 은은한 빛무리
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(s.x, s.y, r);
  }
  container.add(g);

  // 이름표는 별 바로 아래 가운데에 둔다. 시야 가운데의 별에 단 가장 긴 이름("헤르쿨레스자리 제타별", 약 290px)도
  // 둥근 시야(반지름 VIEW_RADIUS) 안에 들어온다(옆에 달면 망원경 틀에 잘린다). 테두리를 둘러 별과 선 위에서도 읽힌다.
  for (const gd of chartGuides(zoneId)) {
    const star = stars.find((s) => s.x === gd.x && s.y === gd.y);
    const off = (star ? starRadius(star.mag) : 4) + LABEL_GAP;
    const label = addText(scene, gd.x, gd.y + off, gd.nameKo, {
      size: MIN_FONT + 2, bold: true, color: COLOR.textBrass, stroke: 6, origin: [0.5, 0],
    });
    container.add(label);
  }
}
