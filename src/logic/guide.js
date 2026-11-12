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

/**
 * 훑기를 시작할 길잡이: 못 찾은 천체 중 가장 가까운 것까지의 거리가 가장 먼 길잡이.
 * 학생은 이름 있는 별에서 시작해 단서를 따라 옮겨 가야 한다(시작하자마자 천체가 시야에 들지 않게).
 * 못 찾은 천체가 없으면 첫 길잡이, 길잡이가 없으면 null. 같으면 앞의 것.
 */
export function startGuide(guides, placed, foundIds) {
  const left = placed.filter((p) => !foundIds.has(p.id));
  if (guides.length === 0) return null;
  if (left.length === 0) return guides[0];
  let best = null, bestD = -Infinity;
  for (const g of guides) {
    const d = Math.min(...left.map((p) => Math.hypot(p.x - g.x, p.y - g.y)));
    if (d > bestD) { best = g; bestD = d; }
  }
  return best;
}

export function zoneClues(zoneId, deck, bonus = []) {
  const guides = chartGuides(zoneId);
  const clues = {};
  for (const p of chartLayout(zoneId, deck, bonus)) clues[p.id] = guideFor(p, guides);
  return clues;
}
