import { ZONE_W, ZONE_H, VIEW_RADIUS, BLUR_SPEED, SMUDGE_SPEED, LOCK_RADIUS, FOCUS_TOLERANCE, FOCUS_SWEEP_MS } from '../config/balance.js';
import { makeRng, seedFor } from './rng.js';

const dist = (view, p) => Math.hypot(p.x - view.x, p.y - view.y);

export function clampView(x, y) {
  return { x: Math.min(Math.max(x, 0), ZONE_W), y: Math.min(Math.max(y, 0), ZONE_H) };
}

export function viewState(speed) {
  if (speed >= BLUR_SPEED) return 'blur';
  if (speed >= SMUDGE_SPEED) return 'dim';
  return 'clear';
}

export function visibleSmudges(view, speed, placed, foundIds) {
  if (speed >= SMUDGE_SPEED) return [];
  return placed.filter((p) => !foundIds.has(p.id) && dist(view, p) <= VIEW_RADIUS).map((p) => p.id);
}

export function lockTarget(view, speed, placed, foundIds) {
  if (speed >= SMUDGE_SPEED) return null;
  let best = null;
  let bestD = Infinity;
  for (const p of placed) {
    if (foundIds.has(p.id)) continue;
    const d = dist(view, p);
    if (d <= LOCK_RADIUS && d < bestD) { best = p.id; bestD = d; }
  }
  return best;
}

// 초점 오차(0~1 눈금): 촬영 버튼을 누른 순간의 값으로 별점을 매긴다.
export const focusError = (value, target) => Math.abs(value - target);

// 허용 오차 안이면 촬영이 된다(밖이면 다시 찍는다).
export const isSharp = (value, target) => focusError(value, target) <= FOCUS_TOLERANCE;

export function nudgeDirection(view, placed, foundIds) {
  let best = null;
  let bestD = Infinity;
  for (const p of placed) {
    if (foundIds.has(p.id)) continue;
    const d = dist(view, p);
    if (d < bestD) { best = p; bestD = d; }
  }
  if (!best) return null;
  if (bestD === 0) return { dx: 0, dy: 0 };
  return { dx: (best.x - view.x) / bestD, dy: (best.y - view.y) / bestD };
}

// 혼자 오가는 초점 눈금의 값(0~1): 0에서 시작해 FOCUS_SWEEP_MS마다 끝에서 끝으로 일정한 빠르기로 오간다.
export function gaugeValue(elapsedMs) {
  const t = (Math.max(0, elapsedMs) / FOCUS_SWEEP_MS) % 2;
  return t <= 1 ? t : 2 - t;
}

// 천체마다 숨은 초점 목표(0~1 눈금). 눈금은 0에서 시작하므로 0.3 이상에 둔다.
export function focusTarget(seed, id) {
  return 0.3 + 0.6 * makeRng(seedFor(seed, `focus:${id}`))();
}

// 사진 흐림 정도(0 선명 ~ 1 가장 흐림): 목표에서 멀수록 흐리다. 눈금이 지나가는 동안 또렷해지는 순간이 눈에 띄게 좁게 잡는다.
export function focusBlur(value, target) {
  return Math.min(1, Math.abs(value - target) / 0.4);
}
