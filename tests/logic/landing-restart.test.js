import { readFileSync } from 'node:fs';
import { initLanding, LANDING_TEXT, RESTART_CONFIRM_MS } from '../../src/landing.js';
import { SAVE_KEY } from '../../src/logic/save.js';

// 랜딩에 필요한 만큼만 흉내 낸 문서: 단추 둘, 랜딩, 세로 덮개.
function fakeNode() {
  const listeners = {};
  const classes = new Set();
  return {
    hidden: true,
    textContent: '',
    attrs: {},
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    blur() {},
    click() { for (const fn of listeners.click ?? []) fn(); },
  };
}

function setup(saved) {
  const nodes = { landing: fakeNode(), 'landing-start': fakeNode(), 'landing-restart': fakeNode(), rotate: fakeNode() };
  const doc = { getElementById: (id) => nodes[id] ?? null, documentElement: {}, fullscreenElement: null };
  const timers = [];
  const win = {
    localStorage: { getItem: (k) => (k === SAVE_KEY && saved ? JSON.stringify(saved) : null) },
    screen: {},
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearTimeout: (id) => { timers[id - 1] = null; },
  };
  const calls = [];
  initLanding({ onStart: () => calls.push('start'), onRestart: () => calls.push('restart'), doc, win });
  return { nodes, calls, timers };
}

describe('랜딩의 「처음부터 다시 하기」', () => {
  it('하던 판이 없으면 보이지 않는다', () => {
    const { nodes } = setup(null);
    expect(nodes['landing-restart'].hidden).toBe(true);
    expect(nodes['landing-start'].textContent).toBe(LANDING_TEXT.start);
  });
  it('하던 판이 있으면 「이어서 관측하기」 옆에 보인다', () => {
    const { nodes } = setup({ introSeen: true, foundIds: ['m42'] });
    expect(nodes['landing-restart'].hidden).toBe(false);
    expect(nodes['landing-restart'].textContent).toBe(LANDING_TEXT.restart);
    expect(nodes['landing-start'].textContent).toBe(LANDING_TEXT.resume);
  });
  it('한 번 누르면 확인 문구만 뜨고 지우지 않는다', () => {
    const { nodes, calls, timers } = setup({ introSeen: true, foundIds: ['m42'] });
    nodes['landing-restart'].click();
    expect(calls).toEqual([]);
    expect(nodes['landing-restart'].textContent).toBe(LANDING_TEXT.restartConfirm);
    expect(timers[0].ms).toBe(RESTART_CONFIRM_MS);
    expect(nodes.landing.classList.contains('gone')).toBe(false);
  });
  it('두 번 누르면 새 판을 만든 다음 게임을 시작한다', () => {
    const { nodes, calls } = setup({ introSeen: true, foundIds: ['m42'] });
    nodes['landing-restart'].click();
    nodes['landing-restart'].click();
    expect(calls).toEqual(['restart', 'start']);
    expect(nodes.landing.classList.contains('gone')).toBe(true);
  });
  it('확인 시간이 지나면 처음으로 되돌아가, 다시 두 번 눌러야 한다', () => {
    const { nodes, calls, timers } = setup({ introSeen: true, foundIds: ['m42'] });
    nodes['landing-restart'].click();
    timers[0].fn();
    expect(nodes['landing-restart'].textContent).toBe(LANDING_TEXT.restart);
    nodes['landing-restart'].click();
    expect(calls).toEqual([]);
  });
  it('이어서 시작한 뒤에는 눌려도 지우지 않는다', () => {
    const { nodes, calls } = setup({ introSeen: true, foundIds: ['m42'] });
    nodes['landing-start'].click();
    nodes['landing-restart'].click();
    nodes['landing-restart'].click();
    nodes['landing-start'].click();
    expect(calls).toEqual(['start']);
  });
  it('랜딩 쪽에 단추가 있고 처음에는 숨겨져 있다', () => {
    const index = readFileSync('index.html', 'utf8');
    expect(index).toMatch(/<button id="landing-restart"[^>]*hidden>/);
  });
});
