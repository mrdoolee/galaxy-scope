// 구역 안 천체 자리는 src/logic/chart.js의 chartLayout(실제 하늘을 따른 배치)이 정한다.

// 하늘 지도에 보일 구역: 필수 카드가 하나라도 있는 구역(ZONES 순서 그대로).
export function mapZoneIds(deck, zones) {
  const used = new Set(deck.map((o) => o.zone));
  return zones.filter((z) => used.has(z.id)).map((z) => z.id);
}

// 하늘 지도의 구역 하나가 차지하는 자리: 별자리 그림(88×88 터치 대상)과 그 아래 이름표.
const FIGURE_HALF = 44;
const LABEL_DY = 60;
const LABEL_HALF_W = 100;
const LABEL_HALF_H = 14;
const zoneBoxes = (z) => [
  { x0: z.mapX - FIGURE_HALF, x1: z.mapX + FIGURE_HALF, y0: z.mapY - FIGURE_HALF, y1: z.mapY + FIGURE_HALF },
  { x0: z.mapX - LABEL_HALF_W, x1: z.mapX + LABEL_HALF_W, y0: z.mapY + LABEL_DY - LABEL_HALF_H, y1: z.mapY + LABEL_DY + LABEL_HALF_H },
];
const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/**
 * 구역 표시 옆에 말풍선(w×h)을 놓을 가운데 자리. 위, 왼쪽, 오른쪽, 아래(이름표 밑) 순서로 살펴
 * 화면 범위(bounds) 안이고 다른 구역의 그림·이름표와 겹치지 않는 첫 자리를 고른다. 모두 겹치면 가장 덜 겹치는 자리.
 *   zone, others: { mapX, mapY }(others에 zone이 들어 있어도 된다)   bounds: { x0, y0, x1, y1 }
 */
export function calloutSpot(zone, others, { w, h, gap = 10, bounds }) {
  const { mapX: x, mapY: y } = zone;
  const spots = [
    { x, y: y - FIGURE_HALF - gap - h / 2 },
    { x: x - FIGURE_HALF - gap - w / 2, y },
    { x: x + FIGURE_HALF + gap + w / 2, y },
    { x, y: y + LABEL_DY + LABEL_HALF_H + gap + h / 2 },
  ];
  const obstacles = others.filter((z) => !(z.mapX === x && z.mapY === y)).flatMap(zoneBoxes);
  let best = null, bestHits = Infinity;
  for (const s of spots) {
    const box = { x0: s.x - w / 2, x1: s.x + w / 2, y0: s.y - h / 2, y1: s.y + h / 2 };
    const inside = !bounds || (box.x0 >= bounds.x0 && box.x1 <= bounds.x1 && box.y0 >= bounds.y0 && box.y1 <= bounds.y1);
    const hits = (inside ? 0 : 100) + obstacles.filter((o) => overlaps(box, o)).length;
    if (hits < bestHits) { best = s; bestHits = hits; }
  }
  return best;
}
