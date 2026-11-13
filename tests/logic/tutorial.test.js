import { tutorialOn, tutorialTarget, tutorialStep } from '../../src/logic/tutorial.js';
import { calloutSpot, mapZoneIds } from '../../src/logic/layout.js';
import { clockRuns } from '../../src/logic/night.js';
import { newGame } from '../../src/logic/save.js';
import { SMUDGE_SPEED } from '../../src/config/balance.js';
import { TUTORIAL_TEXT } from '../../src/data/copy.js';
import { ZONES } from '../../src/data/zones.js';
import { OBJECTS } from '../../src/data/objects.js';

describe('첫 탐사 안내를 하는 때', () => {
  it('새 판에서 첫 카드를 얻기 전까지만', () => {
    expect(tutorialOn(newGame(1))).toBe(true);
    expect(tutorialOn({ ...newGame(1), foundIds: ['m42'] })).toBe(false);
  });
  it('모으기 단계가 아니면 하지 않는다', () => {
    expect(tutorialOn({ ...newGame(1), phase: 'result' })).toBe(false);
  });
  it('안내하는 동안 밤 시계는 가지 않는다', () => {
    const on = { phase: 'collect', bonus: false, mode: 'sweep', hasMission: true, dayWait: false };
    expect(clockRuns({ ...on, guided: true })).toBe(false);
    expect(clockRuns({ ...on, mode: 'focus', guided: true })).toBe(false);
    expect(clockRuns({ ...on, guided: false })).toBe(true);
    expect(clockRuns(on)).toBe(true);
  });
});

describe('안내할 대상', () => {
  const placed = [{ id: 'a', x: 100, y: 100 }, { id: 'b', x: 900, y: 500 }];
  const request = { kind: 'picture', zoneId: 'orion', targetIds: ['b', 'a'] };
  it('임무 순서로 아직 못 찾은 첫 천체의 자리', () => {
    expect(tutorialTarget(request, 'orion', placed, new Set())).toBe(placed[1]);
    expect(tutorialTarget(request, 'orion', placed, new Set(['b']))).toBe(placed[0]);
  });
  it('임무 구역이 아니거나 임무가 없으면 없다', () => {
    expect(tutorialTarget(request, 'taurus', placed, new Set())).toBeNull();
    expect(tutorialTarget(null, 'orion', placed, new Set())).toBeNull();
    expect(tutorialTarget(request, 'orion', placed, new Set(['a', 'b']))).toBeNull();
  });
});

describe('안내 단계', () => {
  const sweep = { mode: 'sweep', hasTarget: true, speed: 0, locked: false, targetVisible: false };
  it('보이지 않으면 화살표를 따라가고, 보이면 가운데로 옮기고, 가운데 오면 확대한다', () => {
    expect(tutorialStep(sweep)).toBe('follow');
    expect(tutorialStep({ ...sweep, targetVisible: true })).toBe('center');
    expect(tutorialStep({ ...sweep, targetVisible: true, locked: true })).toBe('zoom');
  });
  it('너무 빨리 끌면 천천히 하라고 한다', () => {
    expect(tutorialStep({ ...sweep, speed: SMUDGE_SPEED })).toBe('slow');
    expect(tutorialStep({ ...sweep, speed: SMUDGE_SPEED - 1 })).toBe('follow');
  });
  it('임무 구역이 아니면 지도로 돌려보내되, 얼룩이 가운데 왔으면 확대하게 둔다', () => {
    expect(tutorialStep({ ...sweep, hasTarget: false })).toBe('elsewhere');
    expect(tutorialStep({ ...sweep, hasTarget: false, locked: true })).toBe('zoom');
  });
  it('확대 화면에서는 촬영, 카드와 낮에는 안내가 없다', () => {
    expect(tutorialStep({ ...sweep, mode: 'focus' })).toBe('shoot');
    expect(tutorialStep({ ...sweep, mode: 'card' })).toBeNull();
    expect(tutorialStep({ ...sweep, mode: 'day' })).toBeNull();
  });
  it('훑기 단계마다 보여 줄 글이 있고, 묶기 전이므로 분류 용어가 없다', () => {
    for (const step of ['follow', 'slow', 'center', 'zoom']) expect(TUTORIAL_TEXT[step].length).toBeGreaterThan(0);
    const all = [...Object.values(TUTORIAL_TEXT).filter((v) => typeof v === 'string'), TUTORIAL_TEXT.elsewhere('오리온자리')];
    for (const s of all) for (const w of ['성운', '성단', '방출', '반사', '암흑', '산개', '구상', '은하']) expect(s, s).not.toContain(w);
    expect(TUTORIAL_TEXT.elsewhere('오리온자리')).toContain('오리온자리');
  });
});

describe('하늘 지도의 말풍선 자리', () => {
  const deck = OBJECTS.filter((o) => o.deck);
  const shown = ZONES.filter((z) => mapZoneIds(deck, ZONES).includes(z.id));
  const size = { w: 250, h: 52, bounds: { x0: 8, y0: 110, x1: 1272, y1: 712 } };
  const boxOf = (s) => ({ x0: s.x - size.w / 2, x1: s.x + size.w / 2, y0: s.y - size.h / 2, y1: s.y + size.h / 2 });
  const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

  it.each(ZONES.filter((z) => z.textbook).map((z) => [z.nameKo, z]))('%s: 화면 안이고 다른 구역의 그림과 이름표를 가리지 않는다', (_name, zone) => {
    const spot = calloutSpot(zone, shown, size);
    const box = boxOf(spot);
    expect(box.x0).toBeGreaterThanOrEqual(size.bounds.x0);
    expect(box.x1).toBeLessThanOrEqual(size.bounds.x1);
    expect(box.y0).toBeGreaterThanOrEqual(size.bounds.y0);
    expect(box.y1).toBeLessThanOrEqual(size.bounds.y1);
    for (const z of shown) {
      if (z === zone) continue;
      expect(hit(box, { x0: z.mapX - 44, x1: z.mapX + 44, y0: z.mapY - 44, y1: z.mapY + 44 }), z.nameKo).toBe(false);
      expect(hit(box, { x0: z.mapX - 100, x1: z.mapX + 100, y0: z.mapY + 46, y1: z.mapY + 74 }), `${z.nameKo} 이름표`).toBe(false);
    }
    // 제 구역의 그림과 이름표도 가리지 않는다
    expect(hit(box, { x0: zone.mapX - 44, x1: zone.mapX + 44, y0: zone.mapY - 44, y1: zone.mapY + 74 })).toBe(false);
  });
  it('둘레가 비어 있으면 위에 놓는다', () => {
    const zone = { mapX: 600, mapY: 400 };
    expect(calloutSpot(zone, [zone], size)).toEqual({ x: 600, y: 400 - 44 - 10 - 26 });
  });
  it('위가 화면 밖이면 다른 자리를 고른다', () => {
    const zone = { mapX: 600, mapY: 150 };
    expect(calloutSpot(zone, [zone], size).y).toBeGreaterThanOrEqual(150);
  });
});
