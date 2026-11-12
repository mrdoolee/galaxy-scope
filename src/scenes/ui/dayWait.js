// 해돋이 뒤 낮 기다림: 시야의 하늘이 밝아지며 별과 얼룩이 사라지고, 본부 요원이 말하고, 그 밤에 찍은 카드를 작게 보여 주고,
// 해가 하늘을 지나간 뒤(DAY_WAIT_MS) 다시 어두워진다. 버튼이 없고 눌러도 넘어가지 않는다.
// 시간은 장면의 update(delta)로만 잰다: 게임이 멈춘 동안(세로 화면, 숨은 탭)에는 함께 멈춘다.
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game.js';
import { NIGHT_TEXT } from '../../data/copy.js';
import { dayTimeline } from '../../logic/night.js';
import { addText, addPlate } from './style.js';
import { makeCard } from './card.js';

const MORNING = 0xa9cdea;  // 옅은 아침 하늘
const HORIZON = 0xf3e6c8;  // 아래쪽 해 뜨는 빛
const CARD_H = 120;
const MAX_CARDS = 3;       // 시야 아래쪽 폭에 들어가는 만큼(더 찍었으면 마지막 셋, 장 수는 글로)
const BUBBLE = { x: 104, y: 8, w: 900, h: 92 }; // 묶기 화면 힌트 말풍선과 같은 자리·모양

/**
 * runDayWait(scene, { cardIds, onDone, hole, fade, below })
 *   cardIds  그 밤에 찍은 카드 id
 *   onDone   다시 밤이 되었을 때 한 번
 *   hole     시야 { x, y, r }: 이 안의 하늘을 칠하고 해가 지나간다
 *   fade     밝아지는 동안 함께 사라질 것(별 하늘, 조준 원). 끝나면 alpha 1로 돌려 둔다
 *   below    하늘색과 해는 이것(망원경 틀) 바로 아래에 깐다
 */
export function runDayWait(scene, { cardIds, onDone, hole, fade = [], below = null }) {
  const { x, y, r } = hole;
  // 시야 안: 아침 하늘과 해(틀 아래)
  const skyFill = scene.add.graphics();
  skyFill.fillStyle(MORNING, 1);
  skyFill.fillCircle(x, y, r + 8);
  skyFill.fillStyle(HORIZON, 0.55);
  skyFill.fillEllipse(x, y + r * 0.95, r * 2.4, r * 0.9);
  const arc = { cx: x, cy: y + r * 0.35, R: r * 0.85 };
  const track = scene.add.graphics();
  track.fillStyle(0xffffff, 0.75);
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + (Math.PI * i) / 24;
    track.fillCircle(arc.cx + arc.R * Math.cos(a), arc.cy + arc.R * Math.sin(a), 3);
  }
  const sun = scene.add.image(0, 0, 'icon-sun');
  sun.setScale(84 / sun.width);
  const inHole = [skyFill, track, sun];
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
    tonight.add(addText(scene, x, y + 40, NIGHT_TEXT.tonight(cardIds.length), { size: 26, bold: true, color: '#0b1428', origin: [0.5, 0.5] }));
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
    for (const o of inHole) o.setAlpha(t.light);
    for (const o of fade) o.setAlpha(1 - t.light);
    tonight.setAlpha(t.light);
    bubble.setAlpha(Math.min(1, elapsed / 300));
    const a = Math.PI + Math.PI * t.sun;
    sun.setPosition(arc.cx + arc.R * Math.cos(a), arc.cy + arc.R * Math.sin(a));
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
