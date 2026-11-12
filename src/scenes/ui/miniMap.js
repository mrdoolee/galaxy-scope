import { ZONE_W, ZONE_H, VIEW_RADIUS } from '../../config/balance.js';
import { COLOR, addPlate } from './style.js';

/**
 * 구석의 위치 지도: 구역 전체 중 지금 어디를 보는지. 찾은 천체 자리만 표시한다(못 찾은 것은 숨김).
 *   makeMiniMap(scene, cx, cy, width, placed) -> { update(view, foundIds) }
 */
export function makeMiniMap(scene, cx, cy, width, placed) {
  const s = width / ZONE_W;
  const h = ZONE_H * s;
  const x0 = cx - width / 2;
  const y0 = cy - h / 2;
  addPlate(scene, x0 - 8, y0 - 8, width + 16, h + 16, 0.9);
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
