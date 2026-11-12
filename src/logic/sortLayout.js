// 묶기 화면의 자리 계산. Phaser에 의존하지 않는다. 좌표는 설계 해상도(1280×720).

// 묶음 칸 안 카드 자리: 6열 4줄(24칸)이면 20장이 한 칸에 몰려도 다 들어간다.
export const BIN_COLS = 6;
export const BIN_ROWS = 4;

/**
 * n장이 놓인 묶음에서 index번째 카드 자리(가운데)와 칸 크기.
 *   inner: 묶음 안쪽 { x, y, w, h } (왼쪽 위 기준)
 */
export function binCell(index, n, inner) {
  const rows = Math.max(BIN_ROWS, Math.ceil(n / BIN_COLS));
  const w = inner.w / BIN_COLS;
  const h = inner.h / rows;
  const col = index % BIN_COLS;
  const row = Math.floor(index / BIN_COLS);
  return { x: inner.x + (col + 0.5) * w, y: inner.y + (row + 0.5) * h, w, h };
}

// 아래쪽 카드 줄. view = { left, width, spacing }. 다 들어가면 가운데 정렬, 넘치면 왼쪽부터 놓고 옆으로 넘긴다.
export function maxScroll(n, view) {
  return Math.max(0, n * view.spacing - view.width);
}

export function clampScroll(scroll, n, view) {
  return Math.max(0, Math.min(maxScroll(n, view), scroll));
}

export function rowSlotX(index, n, scroll, view) {
  const contentW = n * view.spacing;
  const start = contentW <= view.width ? view.left + (view.width - contentW) / 2 : view.left - scroll;
  return start + (index + 0.5) * view.spacing;
}

export function rectContains(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// 끌던 카드를 놓은 곳: 묶음 이름, 카드 줄('row'), 그 밖(null: 원래 자리로).
export function dropTarget(x, y, bins, rowTop) {
  const bin = bins.find((b) => rectContains(b, x, y));
  if (bin) return bin.name;
  return y >= rowTop ? 'row' : null;
}
