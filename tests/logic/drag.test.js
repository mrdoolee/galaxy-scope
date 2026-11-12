import { createDrag, createSpeedMeter } from '../../src/logic/drag.js';

describe('createDrag', () => {
  it('한 손가락으로 끌면 움직인 만큼 돌려준다', () => {
    const d = createDrag();
    d.down(1, 100, 100, 1);
    expect(d.active).toBe(true);
    expect(d.move(1, 130, 90)).toEqual({ dx: 30, dy: -10 });
    expect(d.move(1, 130, 90)).toEqual({ dx: 0, dy: 0 });
    d.up(1);
    expect(d.active).toBe(false);
    expect(d.move(1, 200, 200)).toBeNull();
  });

  it('두 번째 손가락이 닿으면 끌기를 끝내고, 남은 손가락의 움직임은 무시한다', () => {
    const d = createDrag();
    d.down(1, 0, 0, 1);
    d.down(2, 50, 50, 2);
    expect(d.active).toBe(false);
    expect(d.move(1, 40, 0)).toBeNull();
    expect(d.move(2, 90, 50)).toBeNull();
    d.up(2);
    expect(d.move(1, 80, 0)).toBeNull();
    // 손을 다 떼고 다시 대면 새 끌기
    d.up(1);
    d.down(3, 10, 10, 1);
    expect(d.move(3, 15, 10)).toEqual({ dx: 5, dy: 0 });
  });

  it('cancel()은 끌기를 끝낸다 (화면 밖으로 나감, 창 전환)', () => {
    const d = createDrag();
    d.down(1, 0, 0, 1);
    d.cancel();
    expect(d.active).toBe(false);
    expect(d.move(1, 10, 0)).toBeNull();
  });

  it('다른 손가락이 떼어져도 끌기는 이어진다', () => {
    const d = createDrag();
    d.down(1, 0, 0, 1);
    d.up(7);
    expect(d.move(1, 3, 4)).toEqual({ dx: 3, dy: 4 });
  });
});

describe('createSpeedMeter', () => {
  it('끄는 속도를 손가락 움직임 사이 시간으로 잰다', () => {
    const m = createSpeedMeter();
    m.reset(0);
    let t = 0;
    for (let i = 0; i < 60; i++) { t += 16; m.sample(10, t); } // 10px/16ms = 625px/s
    expect(m.read(t)).toBeGreaterThan(600);
    expect(m.read(t)).toBeLessThan(626);
  });

  it('움직임 신호가 띄엄띄엄 와도(64ms마다) 속도가 출렁이지 않는다', () => {
    const m = createSpeedMeter();
    m.reset(0);
    let t = 0;
    const seen = [];
    for (let i = 0; i < 30; i++) {
      t += 64;
      m.sample(64, t); // 1000px/s
      // 그 사이 화면 프레임에서 읽은 값
      for (let f = 16; f < 64; f += 16) seen.push(m.read(t + f));
    }
    expect(Math.min(...seen.slice(20))).toBeGreaterThan(900);
  });

  it('손가락을 멈추면 곧 0 가까이 줄어든다', () => {
    const m = createSpeedMeter();
    m.reset(0);
    let t = 0;
    for (let i = 0; i < 60; i++) { t += 16; m.sample(20, t); } // 1250px/s
    expect(m.read(t + 50)).toBeGreaterThan(1000); // 아주 잠깐 끊긴 것은 멈춘 것이 아니다
    expect(m.read(t + 400)).toBeLessThan(100);
    expect(m.read(t + 1000)).toBeLessThan(1);
  });

  it('reset은 속도를 0으로 둔다', () => {
    const m = createSpeedMeter();
    m.reset(0);
    m.sample(500, 10);
    expect(m.read(10)).toBeGreaterThan(0);
    m.reset(20);
    expect(m.read(20)).toBe(0);
  });
});
