import { ZONE_W, ZONE_H, EDGE_MARGIN, MIN_GAP } from '../config/balance.js';
import { makeRng, seedFor } from './rng.js';

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

// 한 판 안에서 구역 배치는 고정: 판 시드와 구역 id로 난수를 만든다(새로 고침해도 그대로).
export function zoneLayout(seed, zoneId, deck) {
  const ids = deck.filter((o) => o.zone === zoneId).map((o) => o.id);
  return layoutZone(ids, makeRng(seedFor(seed, zoneId)));
}

// 하늘 지도에 보일 구역: 필수 카드가 하나라도 있는 구역(ZONES 순서 그대로).
export function mapZoneIds(deck, zones) {
  const used = new Set(deck.map((o) => o.zone));
  return zones.filter((z) => used.has(z.id)).map((z) => z.id);
}

// 보너스 모드 배치: 필수 카드는 zoneLayout과 똑같이 놓고(자리가 움직이지 않는다),
// 보너스 천체는 따로 시드를 만든 두 번째 단계에서 모든 천체와 MIN_GAP 이상 떨어지게 놓는다.
export function zoneLayoutWithBonus(seed, zoneId, deck, bonus) {
  const placed = zoneLayout(seed, zoneId, deck);
  const rng = makeRng(seedFor(seed, `bonus:${zoneId}`));
  for (const o of bonus.filter((b) => b.zone === zoneId)) {
    let spot = null;
    for (let t = 0; t < MAX_TRIES && !spot; t++) {
      const p = { x: X0 + rng() * (X1 - X0), y: Y0 + rng() * (Y1 - Y0) };
      if (fits(p, placed)) spot = p;
    }
    // 무작위로 못 찾으면 안쪽 영역을 촘촘히 훑어 빈자리를 찾는다(순서가 정해져 있어 결과는 늘 같다).
    for (let y = Y0; y <= Y1 && !spot; y += 50) {
      for (let x = X0; x <= X1 && !spot; x += 50) if (fits({ x, y }, placed)) spot = { x, y };
    }
    placed.push({ id: o.id, ...(spot ?? { x: (X0 + X1) / 2, y: (Y0 + Y1) / 2 }) });
  }
  return placed;
}
