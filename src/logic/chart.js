// 구역 하늘의 자리: 실제 적경·적위(src/data/sky.js, src/data/objects.js)를 구역 화면(ZONE_W × ZONE_H)의 자리로 옮긴다.
// 하늘을 올려다본 방향 그대로 동쪽(적경이 큰 쪽)이 왼쪽, 북쪽이 위다. 난수를 쓰지 않으므로 판마다 같다.
import { ZONE_W, ZONE_H, EDGE_MARGIN, CHART_MIN_GAP } from '../config/balance.js';
import { SKY } from '../data/sky.js';

const X0 = EDGE_MARGIN, X1 = ZONE_W - EDGE_MARGIN;
const Y0 = EDGE_MARGIN, Y1 = ZONE_H - EDGE_MARGIN;
const MAX_ROUNDS = 300;
const SLACK = 0.5; // 벌릴 때 조금 더 밀어 소수 오차로 간격이 모자라지 않게

/**
 * 가운데 기준 등장방형 투영. 가로 1도 = ZONE_W / spanDeg px, 세로도 같은 비율.
 * 적경 차는 ±12시로 접고(0시를 넘는 창), 15 × cos(가운데 적위)를 곱해 도로 바꾼다.
 * 결과는 구역 화면 밖일 수도 있다.
 */
export function projectSky(ra, dec, sky) {
  const dh = ((((ra - sky.center.ra + 12) % 24) + 24) % 24) - 12;
  const k = ZONE_W / sky.spanDeg;
  const dx = dh * 15 * Math.cos((sky.center.dec * Math.PI) / 180);
  return { x: ZONE_W / 2 - dx * k, y: ZONE_H / 2 - (dec - sky.center.dec) * k };
}

export function chartStars(zoneId) {
  const sky = SKY[zoneId];
  return sky.stars.map((s) => ({ id: s.id, ...projectSky(s.ra, s.dec, sky), mag: s.mag }));
}

export function chartSegs(zoneId) {
  const at = new Map(chartStars(zoneId).map((s) => [s.id, { x: s.x, y: s.y }]));
  return SKY[zoneId].segs.map(([a, b]) => [at.get(a), at.get(b)]);
}

export function chartGuides(zoneId) {
  const sky = SKY[zoneId];
  return sky.guides.map((g) => ({ nameKo: g.nameKo, ...projectSky(g.ra, g.dec, sky) }));
}

function clampIn(p) {
  p.x = Math.min(X1, Math.max(X0, p.x));
  p.y = Math.min(Y1, Math.max(Y0, p.y));
}

// 앞의 fixed개는 그대로 두고 나머지만 움직여, 모든 쌍이 CHART_MIN_GAP 이상 떨어지게 한다.
// 가까운 쌍은 둘을 잇는 선을 따라 모자란 만큼 민다(둘 다 움직이면 반씩, 한쪽이 고정이면 다른 쪽이 전부).
// 선을 따라 밀므로 실제 하늘에서의 방향과 순서가 그대로 남는다.
function spread(points, fixed) {
  for (let i = fixed; i < points.length; i++) clampIn(points[i]);
  for (let round = 0; round < MAX_ROUNDS; round++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = Math.max(i + 1, fixed); j < points.length; j++) {
        const a = points[i], b = points[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= CHART_MIN_GAP) continue;
        const [ux, uy] = d > 0 ? [dx / d, dy / d] : [1, 0]; // 완전히 겹치면 가로로 벌린다
        const need = CHART_MIN_GAP - d + SLACK;
        const share = i < fixed ? need : need / 2;
        b.x += ux * share; b.y += uy * share;
        if (i >= fixed) { a.x -= ux * share; a.y -= uy * share; }
        moved = true;
      }
    }
    for (let i = fixed; i < points.length; i++) clampIn(points[i]);
    if (!moved) break;
  }
  return points;
}

/**
 * 구역 하늘의 천체 자리: 실제 자리에 놓고 너무 가까운 것만 벌린다.
 * 필수 카드(deck)를 먼저 놓고, 보너스는 놓인 필수 카드를 움직이지 않은 채 그 뒤에 놓는다.
 * 그래서 chartLayout(zone, deck)의 자리는 chartLayout(zone, deck, bonus)의 앞부분과 같다.
 */
export function chartLayout(zoneId, deck, bonus = []) {
  const sky = SKY[zoneId];
  const place = (o) => ({ id: o.id, ...projectSky(o.ra, o.dec, sky) });
  const placed = spread(deck.filter((o) => o.zone === zoneId).map(place), 0);
  const extra = bonus.filter((o) => o.zone === zoneId).map(place);
  return extra.length ? spread([...placed, ...extra], placed.length) : placed;
}

/**
 * 하늘 지도의 작은 별자리 그림: 선으로 이은 별(그 별자리의 모양)만 골라, 가운데를 맞추고
 * 가로세로 같은 비율로 줄여 모든 점이 ±radius 안에 들어오게 한다. 이웃 별자리의 길잡이 별처럼
 * 선이 없는 별은 넣지 않는다.
 */
export function miniFigure(zoneId, radius) {
  const sky = SKY[zoneId];
  const used = sky.stars.filter((s) => sky.segs.some(([a, b]) => a === s.id || b === s.id));
  const pts = used.map((s) => projectSky(s.ra, s.dec, sky));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const half = Math.max(Math.max(...xs) - cx, Math.max(...ys) - cy) || 1;
  const s = radius / half;
  const index = new Map(used.map((st, i) => [st.id, i]));
  return {
    stars: pts.map((p) => [(p.x - cx) * s, (p.y - cy) * s]),
    segs: sky.segs.map(([a, b]) => [index.get(a), index.get(b)]),
  };
}
