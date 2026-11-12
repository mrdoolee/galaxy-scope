import { ZONE_W, ZONE_H, VIEW_RADIUS } from '../../config/balance.js';
import { chartStars, chartSegs } from '../../logic/chart.js';
import { COLOR, addPlate } from './style.js';

/**
 * 구석의 위치 지도: 구역 전체 중 지금 어디를 보는지. 별자리 그림을 흐리게 깔고, 그 위에 지금 시야와
 * 찾은 천체 자리만 표시한다(못 찾은 것은 숨김).
 *   makeMiniMap(scene, cx, cy, width, placed, zoneId) -> { update(view, foundIds) }
 */
export function makeMiniMap(scene, cx, cy, width, placed, zoneId) {
  const s = width / ZONE_W;
  const h = ZONE_H * s;
  const x0 = cx - width / 2;
  const y0 = cy - h / 2;
  addPlate(scene, x0 - 8, y0 - 8, width + 16, h + 16, 0.9);

  const figure = scene.add.graphics();
  figure.lineStyle(1.5, 0x8fa6d8, 0.45);
  for (const [a, b] of chartSegs(zoneId)) figure.lineBetween(x0 + a.x * s, y0 + a.y * s, x0 + b.x * s, y0 + b.y * s);
  figure.fillStyle(0xdfe8ff, 0.6);
  for (const st of chartStars(zoneId)) figure.fillCircle(x0 + st.x * s, y0 + st.y * s, Math.max(1.2, 2.6 - st.mag * 0.35));

  const g = scene.add.graphics();
  return {
    update(view, foundIds) {
      g.clear();
      g.fillStyle(0x6fd18b, 1);
      for (const p of placed) if (foundIds.has(p.id)) g.fillCircle(x0 + p.x * s, y0 + p.y * s, 4);
      g.lineStyle(2, COLOR.brassLight, 1);
      g.strokeCircle(x0 + view.x * s, y0 + view.y * s, VIEW_RADIUS * s);
      g.fillStyle(COLOR.brassLight, 1);
      g.fillCircle(x0 + view.x * s, y0 + view.y * s, 2.5);
    },
  };
}
