import { BIN_COLS, BIN_ROWS, binCell, rowSlotX, clampScroll, maxScroll, dropTarget, rectContains } from '../../src/logic/sortLayout.js';

describe('binCell', () => {
  const inner = { x: 0, y: 0, w: 600, h: 360 };
  it('20장이 한 칸에 몰려도 칸이 88×88 이상이고 안쪽에 들어간다', () => {
    expect(BIN_COLS * BIN_ROWS).toBeGreaterThanOrEqual(20);
    for (let i = 0; i < 20; i++) {
      const c = binCell(i, 20, inner);
      expect(c.w).toBeGreaterThanOrEqual(88);
      expect(c.h).toBeGreaterThanOrEqual(88);
      expect(c.x - c.w / 2).toBeGreaterThanOrEqual(-1e-9);
      expect(c.x + c.w / 2).toBeLessThanOrEqual(600 + 1e-9);
      expect(c.y + c.h / 2).toBeLessThanOrEqual(360 + 1e-9);
    }
  });
  it('왼쪽 위부터 가로로 채운다', () => {
    const a = binCell(0, 3, inner);
    const b = binCell(1, 3, inner);
    const c = binCell(BIN_COLS, 8, inner);
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBe(a.y);
    expect(c.x).toBe(a.x);
    expect(c.y).toBeGreaterThan(a.y);
  });
  it('칸 수보다 많으면 줄을 늘려 겹치지 않게 한다', () => {
    const last = binCell(29, 30, inner);
    expect(last.y + last.h / 2).toBeLessThanOrEqual(360 + 1e-9);
  });
});

describe('카드 줄', () => {
  const view = { left: 0, width: 1280, spacing: 100 };
  it('다 들어가면 가운데 정렬하고 넘기지 않는다', () => {
    expect(maxScroll(5, view)).toBe(0);
    expect(rowSlotX(0, 5, 0, view)).toBe(440);
    expect(rowSlotX(4, 5, 0, view)).toBe(840);
    expect(clampScroll(300, 5, view)).toBe(0);
  });
  it('넘치면 왼쪽부터 놓고 넘긴 만큼 옮긴다', () => {
    expect(maxScroll(20, view)).toBe(720);
    expect(rowSlotX(0, 20, 0, view)).toBe(50);
    expect(rowSlotX(0, 20, 200, view)).toBe(-150);
    expect(clampScroll(-50, 20, view)).toBe(0);
    expect(clampScroll(9999, 20, view)).toBe(720);
    // 끝까지 넘기면 마지막 카드가 오른쪽 끝에 보인다
    expect(rowSlotX(19, 20, 720, view)).toBe(1230);
  });
});

describe('dropTarget', () => {
  const bins = [{ name: 'cloud', x: 0, y: 100, w: 600, h: 400 }, { name: 'stars', x: 640, y: 100, w: 600, h: 400 }];
  it('묶음 칸 위면 그 이름, 카드 줄이면 row, 그 밖이면 null', () => {
    expect(dropTarget(300, 300, bins, 560)).toBe('cloud');
    expect(dropTarget(900, 120, bins, 560)).toBe('stars');
    expect(dropTarget(620, 300, bins, 560)).toBeNull();
    expect(dropTarget(300, 40, bins, 560)).toBeNull();
    expect(dropTarget(300, 600, bins, 560)).toBe('row');
  });
  it('rectContains', () => {
    expect(rectContains({ x: 0, y: 0, w: 10, h: 10 }, 10, 10)).toBe(true);
    expect(rectContains({ x: 0, y: 0, w: 10, h: 10 }, 10.1, 5)).toBe(false);
  });
});
