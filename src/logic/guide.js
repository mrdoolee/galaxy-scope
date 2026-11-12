// 길잡이 별 단서: 천체에서 가장 가까운 이름 있는 별을 골라 그 별 기준의 방향과 거리 칸을 구한다.
import { GUIDE_NEAR, GUIDE_MID } from '../config/balance.js';
import { chartLayout, chartGuides } from './chart.js';

// 위쪽부터 시계 방향. 각 방향은 그 방향을 가운데로 한 45도 칸을 맡는다.
export const DIRECTIONS = ['up', 'upRight', 'right', 'downRight', 'down', 'downLeft', 'left', 'upLeft'];

/** 화면 좌표(y가 아래로 커짐)에서 길잡이 g 기준 대상 t의 방향. 겹치면 'up'. */
function directionOf(g, t) {
  const dx = t.x - g.x, dy = t.y - g.y;
  if (dx === 0 && dy === 0) return 'up';
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI; // 위 0도, 시계 방향
  return DIRECTIONS[Math.round(deg / 45 + 8) % 8];
}

export function guideFor(target, guides) {
  let best = null, bestD = Infinity;
  for (const g of guides) {
    const d = Math.hypot(target.x - g.x, target.y - g.y);
    if (d < bestD) { best = g; bestD = d; }
  }
  if (!best) return null;
  const band = bestD < GUIDE_NEAR ? 'near' : bestD < GUIDE_MID ? 'mid' : 'far';
  return { nameKo: best.nameKo, dir: directionOf(best, target), band };
}

export function zoneClues(zoneId, deck, bonus = []) {
  const guides = chartGuides(zoneId);
  const clues = {};
  for (const p of chartLayout(zoneId, deck, bonus)) clues[p.id] = guideFor(p, guides);
  return clues;
}
