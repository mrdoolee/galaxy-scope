import { existsSync } from 'node:fs';
import { createBgm, TRACKS, SCENE_TRACK, BGM_KEY, BGM_VOLUME, readMuted } from '../../src/audio/bgm.js';
import { gutterFor } from '../../src/audio/bgmButton.js';
import { SCENES } from '../../src/config/game.js';

// 소리를 내지 않는 가짜 audio 요소: 무엇이 불렸는지만 적는다.
function fakeAudio() {
  const a = {
    src: '', loop: false, volume: 1, currentTime: 0, ended: false, paused: true, plays: 0, pauses: 0, listeners: {},
    play() { a.paused = false; a.plays += 1; return Promise.resolve(); },
    pause() { a.paused = true; a.pauses += 1; },
    addEventListener(type, fn) { a.listeners[type] = fn; },
  };
  return a;
}
function memory(initial = {}) {
  const m = { ...initial };
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, m };
}
// 페이드 없이(fadeMs 0) 곧바로 바뀌게 해서 본다.
function setup(opts = {}) {
  const audio = fakeAudio();
  const bgm = createBgm({ makeAudio: () => audio, fadeMs: 0, base: './', ...opts });
  return { audio, bgm };
}

describe('곡 자료', () => {
  it('곡 파일이 모두 있다', () => {
    for (const t of Object.values(TRACKS)) expect(existsSync(`public/${t.file}`), t.file).toBe(true);
  });
  it('장면이 가리키는 곡과 이어질 곡이 모두 있는 곡이다', () => {
    for (const [scene, name] of Object.entries(SCENE_TRACK)) {
      expect(Object.values(SCENES)).toContain(scene);
      expect(TRACKS[name], scene).toBeDefined();
    }
    for (const t of Object.values(TRACKS)) if (!t.loop) expect(TRACKS[t.then]).toBeDefined();
  });
});

describe('createBgm', () => {
  it('start 전에는 소리를 내지 않고, start하면 그때의 장면 곡을 튼다', () => {
    const { audio, bgm } = setup();
    bgm.setScene('ScanScene');
    expect(audio.plays).toBe(0);
    bgm.start();
    expect(bgm.playing).toBe('scan');
    expect(audio.src).toBe('./audio/scan.mp3');
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBeCloseTo(BGM_VOLUME);
    expect(audio.plays).toBe(1);
  });

  it('장면이 바뀌면 곡이 바뀌고, 같은 곡을 쓰는 장면끼리는 그대로 둔다', () => {
    const { audio, bgm } = setup();
    bgm.start();
    expect(bgm.playing).toBe('theme');
    bgm.setScene('SkyMapScene');
    expect(audio.plays).toBe(1);
    bgm.setScene('SortScene');
    expect(bgm.playing).toBe('sort');
    bgm.setScene('RegistryScene');
    expect(audio.plays).toBe(2);
    bgm.setScene('CreditsScene'); // 곡이 정해지지 않은 장면: 그대로
    expect(bgm.playing).toBe('sort');
  });

  it('곡마다 멈춘 자리를 기억해 돌아오면 이어서 튼다', () => {
    const { audio, bgm } = setup();
    bgm.start();
    audio.currentTime = 42;
    bgm.setScene('ScanScene');
    expect(audio.currentTime).toBe(0);
    audio.currentTime = 7;
    bgm.setScene('SkyMapScene');
    expect(bgm.playing).toBe('theme');
    expect(audio.currentTime).toBe(42);
    bgm.setScene('ScanScene');
    expect(audio.currentTime).toBe(7);
  });

  it('끄면 멈추고 기억하며, 켜면 그때의 장면 곡을 튼다', () => {
    const storage = memory();
    const { audio, bgm } = setup({ storage });
    bgm.start();
    audio.currentTime = 12;
    expect(bgm.toggle()).toBe(false);
    expect(bgm.on).toBe(false);
    expect(bgm.playing).toBe(null);
    expect(audio.paused).toBe(true);
    expect(storage.m[BGM_KEY]).toBe('off');
    bgm.setScene('ScanScene'); // 꺼 둔 동안 장면이 바뀌어도 조용하다
    expect(audio.paused).toBe(true);
    expect(bgm.toggle()).toBe(true);
    expect(bgm.playing).toBe('scan');
    expect(storage.m[BGM_KEY]).toBeUndefined();
  });

  it('꺼 둔 채로 다시 열면 start해도 소리가 나지 않는다', () => {
    const storage = memory({ [BGM_KEY]: 'off' });
    expect(readMuted(storage)).toBe(true);
    const { audio, bgm } = setup({ storage });
    bgm.start();
    expect(bgm.on).toBe(false);
    expect(audio.plays).toBe(0);
    bgm.toggle();
    expect(bgm.playing).toBe('theme');
  });

  it('저장소가 없거나 막혀 있어도 켜진 것으로 시작하고 오류가 없다', () => {
    expect(readMuted(null)).toBe(false);
    const blocked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
    const { bgm } = setup({ storage: blocked });
    bgm.start();
    expect(bgm.on).toBe(true);
    expect(() => bgm.toggle()).not.toThrow();
  });

  it('탭이 숨으면 멈추고 돌아오면 잇는다', () => {
    const { audio, bgm } = setup();
    bgm.start();
    bgm.setHidden(true);
    expect(audio.paused).toBe(true);
    expect(bgm.playing).toBe(null);
    bgm.setHidden(false);
    expect(bgm.playing).toBe('theme');
    expect(audio.paused).toBe(false);
  });

  it('결과 곡은 한 번만 나오고 끝나면 주제곡으로 넘어간다. 결과 화면에 다시 오면 처음부터 다시 나온다', () => {
    const { audio, bgm } = setup();
    bgm.start();
    bgm.setScene('ResultScene');
    expect(bgm.playing).toBe('result');
    expect(audio.loop).toBe(false);
    audio.currentTime = 60;
    audio.ended = true;
    audio.listeners.ended();
    expect(bgm.playing).toBe('theme');
    expect(audio.loop).toBe(true);
    audio.ended = false;
    bgm.setScene('ResultScene');
    expect(bgm.playing).toBe('result');
    expect(audio.currentTime).toBe(0);
  });

  it('소리가 막혀 재생이 거절돼도 오류가 새지 않는다', async () => {
    const audio = fakeAudio();
    audio.play = () => Promise.reject(new Error('NotAllowedError'));
    const bgm = createBgm({ makeAudio: () => audio, fadeMs: 0 });
    expect(() => bgm.start()).not.toThrow();
    await Promise.resolve();
  });

  it('페이드: 볼륨이 조금씩 올라가고, 곡을 바꿀 때는 내려간 뒤 바뀐다', () => {
    vi.useFakeTimers();
    try {
      const audio = fakeAudio();
      const bgm = createBgm({ makeAudio: () => audio, fadeMs: 200, volume: 0.4 });
      bgm.start();
      expect(audio.volume).toBe(0);
      vi.advanceTimersByTime(100);
      expect(audio.volume).toBeCloseTo(0.2);
      vi.advanceTimersByTime(100);
      expect(audio.volume).toBeCloseTo(0.4);
      bgm.setScene('ScanScene');
      expect(audio.src).toContain('theme');
      vi.advanceTimersByTime(200);
      expect(audio.src).toContain('scan');
      expect(bgm.playing).toBe('scan');
      // 바꾸는 도중에 또 바뀌면 마지막 것만 남는다
      bgm.setScene('SortScene');
      vi.advanceTimersByTime(50);
      bgm.setScene('SkyMapScene');
      vi.advanceTimersByTime(1000);
      expect(bgm.playing).toBe('theme');
      expect(audio.volume).toBeCloseTo(0.4);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('gutterFor: 음악 단추가 게임을 가리지 않게', () => {
  it('옆에 남는 띠가 넉넉하면(폭이 넓은 스마트폰) 게임을 줄이지 않는다', () => {
    expect(gutterFor(844, 390, 60)).toBe(0);
  });
  it('위에 남는 띠가 넉넉하면(4:3 태블릿) 게임을 줄이지 않는다', () => {
    expect(gutterFor(1024, 768, 60)).toBe(0);
  });
  it('화면이 16:9에 가까워 남는 띠가 없으면 단추만큼 오른쪽을 비운다', () => {
    expect(gutterFor(1280, 720, 60)).toBe(60);
    expect(gutterFor(1920, 1080, 76)).toBe(76);
    expect(gutterFor(1280, 800, 60)).toBe(60); // 위 띠 40px로는 모자란다
  });
});
