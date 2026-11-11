import { ZONE_W, ZONE_H, EDGE_MARGIN, MIN_GAP } from '../config/balance.js';

const MAX_TRIES = 200;
const X0 = EDGE_MARGIN, X1 = ZONE_W - EDGE_MARGIN;
const Y0 = EDGE_MARGIN, Y1 = ZONE_H - EDGE_MARGIN;

function fits(p, placed) {
  return placed.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= MIN_GAP);
}

// 격자 자리: 안쪽 영역을 cols x rows 칸으로 나누고 순서를 rng로 섞는다.
// 9개까지 칸 간격이 MIN_GAP 이상이다 (4x3 격자: 가로 약 667, 세로 600).
function gridLayout(objectIds, rng) {
  const n = objectIds.length;
  const w = X1 - X0, h = Y1 - Y0;
  const cols = Math.min(n, Math.ceil(Math.sqrt((n * w) / h)));
  const rows = Math.ceil(n / cols);
  const slots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        x: cols === 1 ? (X0 + X1) / 2 : X0 + (w * c) / (cols - 1),
        y: rows === 1 ? (Y0 + Y1) / 2 : Y0 + (h * r) / (rows - 1),
      });
    }
  }
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return objectIds.map((id, i) => ({ id, ...slots[i] }));
}

export function layoutZone(objectIds, rng) {
  const placed = [];
  for (const id of objectIds) {
    let spot = null;
    for (let t = 0; t < MAX_TRIES && !spot; t++) {
      const p = { x: X0 + rng() * (X1 - X0), y: Y0 + rng() * (Y1 - Y0) };
      if (fits(p, placed)) spot = p;
    }
    // 하나라도 못 놓으면 전체를 격자로 (섞어 놓으면 간격 보장이 깨지므로)
    if (!spot) return gridLayout(objectIds, rng);
    placed.push({ id, ...spot });
  }
  return placed;
}
