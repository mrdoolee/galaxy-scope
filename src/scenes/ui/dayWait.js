// 해돋이 뒤 낮 기다림: 시야의 밤하늘이 해돋이 빛으로 물들었다가 밝은 낮이 되고, 해넘이 빛을 거쳐 다시 밤이 된다.
// 그동안 별과 얼룩이 사라지고, 본부 요원이 말하고, 그 밤에 찍은 카드를 작게 보여 준다. 버튼이 없고 눌러도 넘어가지 않는다.
// 시간은 장면의 update(delta)로만 잰다: 게임이 멈춘 동안(세로 화면, 숨은 탭)에는 함께 멈춘다.
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game.js';
import { NIGHT_TEXT } from '../../data/copy.js';
import { dayTimeline } from '../../logic/night.js';
import { addText, addPlate } from './style.js';
import { makeCard } from './card.js';

// 하늘 빛깔(위 → 아래). 해는 그리지 않고 지평선 쪽 빛으로만 때를 알린다.
const SKIES = {
  sunrise: [0x27306e, 0x7a5a9c, 0xf08f6b, 0xffd596],
  day: [0x5ea6e6, 0x9fd0f2, 0xd6ecf7, 0xf6f0d8],
  sunset: [0x1d1b4f, 0x7a3a7c, 0xe2603f, 0xf8a544],
};
const GLOW = { sunrise: 0xfff3c4, day: 0xffffff, sunset: 0xffc27a };
const HILL = 0x0a1024;     // 아래쪽 낮은 언덕 그림자(지평선)
const BANDS = 72;
const CARD_H = 120;
const MAX_CARDS = 3;       // 시야 아래쪽 폭에 들어가는 만큼(더 찍었으면 마지막 셋, 장 수는 글로)
const BUBBLE = { x: 104, y: 8, w: 900, h: 92 }; // 묶기 화면 힌트 말풍선과 같은 자리·모양

/**
 * runDayWait(scene, { cardIds, onDone, hole, fade, below })
 *   cardIds  그 밤에 찍은 카드 id
 *   onDone   다시 밤이 되었을 때 한 번
 *   hole     시야 { x, y, r }: 이 안의 하늘빛이 바뀐다
 *   fade     밝아지는 동안 함께 사라질 것(별 하늘, 조준 원). 끝나면 alpha 1로 돌려 둔다
 *   below    하늘빛은 이것(망원경 틀) 바로 아래에 깐다
 */
export function runDayWait(scene, { cardIds, onDone, hole, fade = [], below = null }) {
  const { x, y, r } = hole;
  // 시야 안(틀 아래): 하늘 세 겹과 언덕 그림자. 색 띠를 촘촘히 쌓아 캔버스 그리기에서도 같은 그러데이션이 된다.
  const R = r + 10;
  const lerp = (a, b, k) => Math.round(a + (b - a) * k);
  const mix = (c0, c1, k) =>
    (lerp(c0 >> 16, c1 >> 16, k) << 16) | (lerp((c0 >> 8) & 255, (c1 >> 8) & 255, k) << 8) | lerp(c0 & 255, c1 & 255, k);
  const skyLayer = (name) => {
    const g = scene.add.graphics();
    const stops = SKIES[name];
    for (let i = 0; i < BANDS; i++) {
      const p = (i / (BANDS - 1)) * (stops.length - 1);
      const k = Math.min(stops.length - 2, Math.floor(p));
      g.fillStyle(mix(stops[k], stops[k + 1], p - k), 1);
      // 띠끼리 겹치면 반투명일 때 줄이 보이므로 정수 경계로 딱 맞춘다
      const y0 = Math.round(y - R + (2 * R * i) / BANDS);
      const y1 = Math.round(y - R + (2 * R * (i + 1)) / BANDS);
      g.fillRect(x - R, y0, 2 * R, y1 - y0);
    }
    // 지평선의 빛: 겹쳐 그린 타원이 가운데로 갈수록 밝아진다
    for (let i = 0; i < 6; i++) {
      g.fillStyle(GLOW[name], 0.09);
      g.fillEllipse(x, y + r * 0.72, r * (2.2 - i * 0.3), r * (0.9 - i * 0.12));
    }
    return g;
  };
  const layers = { sunrise: skyLayer('sunrise'), day: skyLayer('day'), sunset: skyLayer('sunset') };
  const hill = scene.add.graphics();
  hill.fillStyle(HILL, 1);
  hill.fillEllipse(x - r * 0.35, y + r * 1.12, r * 2.2, r * 0.62);
  hill.fillEllipse(x + r * 0.6, y + r * 1.16, r * 1.8, r * 0.56);
  const inHole = [layers.sunrise, layers.day, layers.sunset, hill];
  for (const o of inHole) {
    o.setAlpha(0);
    if (below) scene.children.moveBelow(o, below);
  }

  // 틀 위: 막(누르기 막기), 요원 말풍선, 오늘 밤 카드
  const layer = scene.add.container(0, 0).setDepth(60);
  layer.add(scene.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setInteractive());
  const agent = scene.add.image(54, BUBBLE.y + BUBBLE.h / 2 + 2, 'agent-hq');
  agent.setScale(100 / agent.width);
  const say = addText(scene, BUBBLE.x + 24, BUBBLE.y + BUBBLE.h / 2, NIGHT_TEXT.dawn, { size: 26, origin: [0, 0.5], wrap: BUBBLE.w - 48 });
  const bubble = scene.add.container(0, 0, [addPlate(scene, BUBBLE.x, BUBBLE.y, BUBBLE.w, BUBBLE.h, 0.96), agent, say]).setAlpha(0);
  layer.add(bubble);

  const tonight = scene.add.container(0, 0).setAlpha(0);
  if (cardIds.length > 0) {
    tonight.add(addText(scene, x, y + 40, NIGHT_TEXT.tonight(cardIds.length), { size: 26, bold: true, origin: [0.5, 0.5], stroke: 6 }));
    const shown = cardIds.slice(-MAX_CARDS);
    const w = CARD_H * (512 / 768);
    shown.forEach((id, i) => {
      tonight.add(makeCard(scene, x + (i - (shown.length - 1) / 2) * (w + 12), y + 70 + CARD_H / 2, { id, height: CARD_H }));
    });
  }
  layer.add(tonight);

  let elapsed = 0;
  let dusk = false;
  const apply = () => {
    const t = dayTimeline(elapsed);
    layers.sunrise.setAlpha(t.sunrise);
    layers.day.setAlpha(t.day);
    layers.sunset.setAlpha(t.sunset);
    hill.setAlpha(t.light);
    for (const o of fade) o.setAlpha(1 - t.light);
    tonight.setAlpha(t.light);
    bubble.setAlpha(Math.min(1, elapsed / 300));
    if (t.dusk && !dusk) {
      dusk = true;
      say.setText(NIGHT_TEXT.dusk);
    }
    return t.done;
  };
  const cleanup = () => {
    scene.events.off('update', tick);
    for (const o of fade) o.setAlpha(1);
    for (const o of inHole) o.destroy();
    layer.destroy();
  };
  function tick(_time, delta) {
    elapsed += delta;
    if (!apply()) return;
    cleanup();
    onDone();
  }
  apply();
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
}
