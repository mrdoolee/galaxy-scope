// onPress의 "나타난 뒤 잠깐은 무시" 규칙. 장면을 다시 열면 scene.time.now는 앞 방문의 값을 들고 있으므로
// 게임 전체 시계(scene.game.loop.time)로 재야 한다.
import { onPress } from '../../src/scenes/ui/button.js';

function fakeHit() {
  const handlers = {};
  return {
    on(ev, fn) { handlers[ev] = fn; return this; },
    fire(ev, p) { handlers[ev]?.(p); },
  };
}

// 다시 연 장면: 장면 시계는 앞 방문에서 멈춘 값(아주 큼), 게임 시계는 지금.
function reenteredScene(loopTime) {
  return { time: { now: 999999 }, game: { loop: { time: loopTime } } };
}

const tap = (hit, id, downTime) => {
  hit.fire('pointerdown', { id, downTime });
  hit.fire('pointerup', { id, downTime });
};

test('나타난 뒤 250ms 안에 뗀 손가락은 누른 것으로 치지 않는다(다시 연 장면에서도)', () => {
  const scene = reenteredScene(10000);
  const hit = fakeHit();
  let taps = 0;
  onPress(scene, hit, () => { taps += 1; });

  scene.game.loop.time = 10100; // 100ms 뒤
  tap(hit, 1, 10100);
  expect(taps).toBe(0);

  scene.game.loop.time = 10300; // 300ms 뒤
  tap(hit, 1, 10300);
  expect(taps).toBe(1);
});

test('누른 손가락과 뗀 손가락이 다르면 누른 것으로 치지 않는다', () => {
  const scene = reenteredScene(0);
  const hit = fakeHit();
  let taps = 0;
  onPress(scene, hit, () => { taps += 1; });
  scene.game.loop.time = 1000;
  hit.fire('pointerdown', { id: 1, downTime: 1000 });
  hit.fire('pointerup', { id: 2, downTime: 1000 });
  expect(taps).toBe(0);
});
