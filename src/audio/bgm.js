// 배경 음악. Phaser에 의존하지 않는다(게임 밖의 audio 요소 하나로 튼다).
// 요소를 하나만 쓰는 까닭: 아이폰·아이패드는 누르기 안에서 한 번 재생을 시작한 요소만 그 뒤에 저절로 재생할 수 있다.
// 그래서 곡을 바꿀 때 요소를 새로 만들지 않고 같은 요소의 주소(src)만 바꾼다.

// 곡. loop가 false인 곡은 끝나면 then 곡으로 넘어간다.
export const TRACKS = {
  theme: { file: 'audio/theme.mp3', loop: true },
  scan: { file: 'audio/scan.mp3', loop: true },
  sort: { file: 'audio/sort.mp3', loop: true },
  result: { file: 'audio/result.mp3', loop: false, then: 'theme' },
};

// 장면마다 트는 곡. 여기에 없는 장면(사진 출처)은 앞 장면의 곡을 그대로 둔다.
export const SCENE_TRACK = {
  BootScene: 'theme',
  SkyMapScene: 'theme',
  ScanScene: 'scan',
  SortScene: 'sort',
  RegistryScene: 'sort',
  ResultScene: 'result',
};

export const BGM_KEY = 'galaxy-archive-bgm'; // 'off'면 꺼 둔 것. 진행 저장(galaxy-archive-save-v1)과 따로 둔다.
export const BGM_VOLUME = 0.45;
export const BGM_FADE_MS = 600;
const STEP_MS = 50;

export function readMuted(storage) {
  try {
    return storage.getItem(BGM_KEY) === 'off';
  } catch {
    return false;
  }
}

function writeMuted(storage, muted) {
  try {
    if (muted) storage.setItem(BGM_KEY, 'off');
    else storage.removeItem(BGM_KEY);
  } catch {
    // 저장소가 막힌 브라우저: 이번에만 적용된다
  }
}

/**
 * createBgm({ makeAudio, storage, base, fadeMs, volume, timers }) -> bgm
 *   bgm.start()          처음 한 번, 누르기 안에서 부른다(브라우저가 소리를 허락한다)
 *   bgm.setScene(key)    장면이 바뀔 때
 *   bgm.toggle()         켜고 끄기 -> 켜져 있으면 true. 기기에 기억한다
 *   bgm.setHidden(bool)  탭이 숨으면 멈추고 돌아오면 잇는다
 *   bgm.on               켜져 있는가(끄지 않았는가)
 *   bgm.playing          지금 나오는 곡 이름 또는 null
 * 곡마다 멈춘 자리를 기억해 다시 틀 때 이어서 나온다.
 */
export function createBgm({
  makeAudio = () => new Audio(),
  storage = null,
  base = '',
  fadeMs = BGM_FADE_MS,
  volume = BGM_VOLUME,
  timers = globalThis,
} = {}) {
  let audio = null;
  let started = false;
  let muted = readMuted(storage);
  let hidden = false;
  let wanted = 'theme';
  let playing = null;
  let fadeTimer = null;
  let ticket = 0; // 곡을 바꾸는 도중에 또 바뀌면 앞의 것은 그만둔다
  const pos = {};

  const setVolume = (v) => {
    try {
      audio.volume = Math.min(1, Math.max(0, v)); // 아이폰은 볼륨을 바꿀 수 없다(무시된다)
    } catch {
      // 무시
    }
  };

  function fade(to, done) {
    if (fadeTimer !== null) timers.clearInterval(fadeTimer);
    fadeTimer = null;
    const from = Number(audio.volume) || 0;
    const steps = Math.round(fadeMs / STEP_MS);
    if (steps <= 0) {
      setVolume(to);
      done?.();
      return;
    }
    let i = 0;
    fadeTimer = timers.setInterval(() => {
      i += 1;
      setVolume(from + ((to - from) * i) / steps);
      if (i < steps) return;
      timers.clearInterval(fadeTimer);
      fadeTimer = null;
      done?.();
    }, STEP_MS);
  }

  function load(name) {
    const track = TRACKS[name];
    playing = name;
    audio.src = base + track.file;
    audio.loop = track.loop;
    try {
      audio.currentTime = pos[name] ?? 0;
    } catch {
      // 아직 자리를 옮길 수 없는 브라우저: 처음부터
    }
    setVolume(0);
    const p = audio.play();
    if (p?.catch) p.catch(() => {}); // 소리가 막혀 있으면 조용히 넘어간다(다음에 켜거나 장면이 바뀔 때 다시 시도)
    fade(volume);
  }

  // 지금 나와야 할 곡에 맞춘다.
  function apply() {
    if (!started) return;
    const desired = muted || hidden ? null : wanted;
    if (desired === playing) return;
    const mine = ++ticket;
    if (!playing) {
      load(desired);
      return;
    }
    const leaving = playing;
    playing = null;
    fade(0, () => {
      pos[leaving] = audio.ended ? 0 : audio.currentTime || 0;
      audio.pause();
      if (mine !== ticket) return;
      const next = muted || hidden ? null : wanted;
      if (next) load(next);
    });
  }

  function onEnded() {
    const done = playing;
    const track = TRACKS[done];
    if (!track || track.loop) return;
    pos[done] = 0;
    playing = null;
    wanted = track.then ?? wanted;
    apply();
  }

  return {
    get on() {
      return !muted;
    },
    get playing() {
      return playing;
    },
    get wanted() {
      return wanted;
    },
    start() {
      if (started) return;
      started = true;
      audio = makeAudio();
      audio.preload = 'auto';
      audio.addEventListener?.('ended', onEnded);
      apply();
    },
    setScene(key) {
      const name = SCENE_TRACK[key];
      if (!name || name === wanted) return;
      wanted = name;
      apply();
    },
    toggle() {
      muted = !muted;
      writeMuted(storage, muted);
      apply();
      return !muted;
    },
    setHidden(value) {
      hidden = !!value;
      apply();
    },
  };
}
