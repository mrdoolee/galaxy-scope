import { clampView } from './scan.js';

// 한 손가락 끌기 추적. Phaser에 의존하지 않는다.
// 두 번째 손가락이 닿으면 끌기를 끝내고, 모든 손가락을 뗀 뒤 새로 대야 다시 끌 수 있다.
//   down(id, x, y, downCount)  downCount: 지금 눌려 있는 손가락 수(이 손가락 포함)
//   move(id, x, y) -> { dx, dy } | null
//   up(id), cancel()
export function createDrag() {
  let id = null;
  let last = null;
  let blocked = false; // 여러 손가락이 닿은 뒤: 손을 다 뗄 때까지 끌기 안 함

  const end = () => {
    id = null;
    last = null;
  };

  return {
    get active() {
      return id !== null;
    },
    down(pid, x, y, downCount) {
      if (downCount > 1) {
        end();
        blocked = true;
        return;
      }
      blocked = false;
      id = pid;
      last = { x, y };
    },
    move(pid, x, y) {
      if (blocked || id === null || pid !== id) return null;
      const d = { dx: x - last.x, dy: y - last.y };
      last = { x, y };
      return d;
    },
    up(pid) {
      if (pid === id) end();
    },
    cancel() {
      end();
    },
  };
}

// 누른 손가락이 threshold 넘게 움직였을 때 무엇을 할지 정한다(한 손가락으로 줄 넘기기와 카드 들기를 가른다).
//   canLift: 누른 곳에 들 수 있는 카드가 있다. canScroll: 누른 곳이 옆으로 넘기는 줄이다.
//   둘 다면 세로로 끌면 'lift', 가로로 끌면 'scroll'. 아직 덜 움직였으면 null(누르기일 수 있다).
export const GESTURE_THRESHOLD = 12;

export function gestureKind(dx, dy, { canLift = false, canScroll = false, threshold = GESTURE_THRESHOLD } = {}) {
  if (Math.hypot(dx, dy) < threshold) return null;
  if (canLift && canScroll) return Math.abs(dy) >= Math.abs(dx) ? 'lift' : 'scroll';
  if (canLift) return 'lift';
  if (canScroll) return 'scroll';
  return null;
}

// 끄는 속도(px/초). 화면 프레임이 아니라 손가락 움직임 신호 사이의 시간으로 잰다.
// 기기마다 움직임 신호가 프레임보다 띄엄띄엄 올 수 있는데, 프레임으로 재면 신호가 없는 프레임마다
// 속도가 0 쪽으로 출렁여 빠르게 휘두르는 중에도 얼룩이 언뜻 보이게 된다.
// 신호가 IDLE_MS보다 오래 없으면 손가락을 멈춘 것으로 보고 속도를 줄인다.
//   reset(t)          끌기 시작(또는 끝): 속도 0
//   sample(dist, t)   움직임 신호마다: 움직인 거리(px), 시각(ms)
//   read(t)           프레임마다: 지금 속도
const SPEED_TAU_MS = 120;
const IDLE_MS = 100;
const DECAY_TAU_MS = 80;

export function createSpeedMeter() {
  let speed = 0;
  let lastT = 0;
  return {
    reset(t) {
      speed = 0;
      lastT = t;
    },
    sample(dist, t) {
      const dt = Math.max(1, t - lastT);
      lastT = t;
      const k = 1 - Math.exp(-dt / SPEED_TAU_MS);
      speed += ((dist / dt) * 1000 - speed) * k;
    },
    read(t) {
      const idle = t - lastT;
      return idle <= IDLE_MS ? speed : speed * Math.exp(-(idle - IDLE_MS) / DECAY_TAU_MS);
    },
  };
}

// 끌기 한 번: 시야는 손가락 반대 방향으로 움직이고 구역 안에 머문다.
// 속도용 거리는 손가락이 움직인 거리다. 시야가 가장자리에 붙어 움직이지 못해도
// 휘두르는 손가락은 빠르게 잡혀야 한다(가장자리에서 휘둘러 얼룩을 보는 장난을 막는다).
export function dragStep(view, d) {
  return { view: clampView(view.x - d.dx, view.y - d.dy), dist: Math.hypot(d.dx, d.dy) };
}
