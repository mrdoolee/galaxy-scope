import { ZONE_W, ZONE_H, VIEW_RADIUS, BLUR_SPEED, SMUDGE_SPEED, LOCK_RADIUS, FOCUS_TOLERANCE, FOCUS_HOLD_MS } from '../config/balance.js';

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

export function focusProgress(value, target, heldMs) {
  const sharp = Math.abs(value - target) <= FOCUS_TOLERANCE;
  return { sharp, captured: sharp && heldMs >= FOCUS_HOLD_MS };
}

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
