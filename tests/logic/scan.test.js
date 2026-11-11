import { clampView, viewState, visibleSmudges, lockTarget, focusProgress, nudgeDirection } from '../../src/logic/scan.js';

const view = { x: 1000, y: 800 };
const at = (id, dx, dy = 0) => ({ id, x: view.x + dx, y: view.y + dy });

describe('viewState', () => {
  it('속도 구간에 따라 clear/dim/blur', () => {
    expect(viewState(399)).toBe('clear');
    expect(viewState(400)).toBe('dim');
    expect(viewState(899)).toBe('dim');
    expect(viewState(900)).toBe('blur');
  });
});

describe('visibleSmudges', () => {
  it('빠르게 휘두르면 보이지 않는다', () => {
    expect(visibleSmudges(view, 500, [at('a', 50)], new Set())).toEqual([]);
  });
  it('시야 반지름 안쪽만 보인다', () => {
    const placed = [at('near', 200), at('far', 300)];
    expect(visibleSmudges(view, 100, placed, new Set())).toEqual(['near']);
  });
  it('이미 찾은 천체는 나오지 않는다', () => {
    expect(visibleSmudges(view, 100, [at('a', 50)], new Set(['a']))).toEqual([]);
  });
});

describe('lockTarget', () => {
  it('LOCK_RADIUS 안이면 id, 밖이면 null', () => {
    expect(lockTarget(view, 100, [at('a', 80)], new Set())).toBe('a');
    expect(lockTarget(view, 100, [at('b', 100)], new Set())).toBeNull();
  });
  it('빠르게 휘두르는 중에는 잠기지 않는다', () => {
    expect(lockTarget(view, 500, [at('a', 80)], new Set())).toBeNull();
  });
  it('찾은 천체는 잠기지 않는다', () => {
    expect(lockTarget(view, 100, [at('a', 10)], new Set(['a']))).toBeNull();
  });
  it('여럿이면 가장 가까운 것', () => {
    expect(lockTarget(view, 100, [at('far', 80), at('close', 20)], new Set())).toBe('close');
  });
});

describe('focusProgress', () => {
  it('허용 오차 안에서 충분히 유지하면 촬영', () => {
    expect(focusProgress(0.55, 0.5, 500)).toEqual({ sharp: true, captured: true });
    expect(focusProgress(0.55, 0.5, 300)).toEqual({ sharp: true, captured: false });
    expect(focusProgress(0.7, 0.5, 900)).toEqual({ sharp: false, captured: false });
  });
});

describe('clampView', () => {
  it('구역 안으로 맞춘다', () => {
    expect(clampView(-50, 9999)).toEqual({ x: 0, y: 1600 });
    expect(clampView(500, 700)).toEqual({ x: 500, y: 700 });
  });
});

describe('nudgeDirection', () => {
  it('가장 가까운 미발견 천체 쪽 단위 벡터', () => {
    const d = nudgeDirection(view, [at('far', 0, 600), at('near', 300)], new Set());
    expect(d.dx).toBeCloseTo(1);
    expect(d.dy).toBeCloseTo(0);
  });
  it('모두 찾았으면 null', () => {
    expect(nudgeDirection(view, [at('a', 100)], new Set(['a']))).toBeNull();
  });
});
