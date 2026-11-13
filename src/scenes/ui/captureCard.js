// 훑기 화면에서 카드를 얻었을 때 덮는 판: 카드, 별점과 그 까닭, 임무 완료, 다음으로 갈 버튼.
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game.js';
import { OBJECTS } from '../../data/objects.js';
import { SCAN_TEXT, MAP_TEXT, BONUS_TEXT, TYPE_INFO, REGISTRY_TEXT, NIGHT_TEXT, ratingLine } from '../../data/copy.js';
import { SCORE } from '../../config/balance.js';
import { addText, COLOR } from './style.js';
import { makeButton } from './button.js';
import { makeCard } from './card.js';
import { addStarRating } from './starRating.js';

const BX = 960;      // 오른쪽 글과 버튼 줄의 가운데
const WRAP = 520;
const BTN = { w: 320, h: 100 };

/**
 * showCaptureCard(scene, opts) -> layer(Container)
 *   opts: { id, bonus, zoneName, count: { found, total }, rating: { stars },
 *           mission: null | { early }, complete, zoneDone, onNext, onMap, onSort, onNextMission }
 *   complete(필수 카드를 다 모음)면 「묶기 시작」 하나, 임무를 마쳤으면 「다음 임무 받기」 하나,
 *   그 밖에는 「계속 훑기」(구역에 남은 것이 있을 때)와 「지도로 돌아가기」.
 */
export function showCaptureCard(scene, opts) {
  const { id, bonus, rating, mission, complete, zoneDone } = opts;
  const layer = scene.add.container(0, 0);
  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x02040a, 0.8).setOrigin(0).setInteractive());
  const o = OBJECTS.find((x) => x.id === id);
  // 보너스 카드는 곧바로 등록된다: 이름, 종류, 별자리, 거리를 보여 준다.
  const card = makeCard(scene, 470, 365, { id, height: 600, label: bonus ? o.nameKo : SCAN_TEXT.unknown });
  layer.add(card);
  card.setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 300, ease: 'Back.out' });

  // 오른쪽 줄: 위에서부터 차례로 쌓는다(cy는 다음 줄의 위쪽).
  let cy = bonus ? 70 : 100;
  const line = (str, { size = 26, bold = false, color = COLOR.text, gap = 14 } = {}) => {
    const t = addText(scene, BX, cy, str, { size, bold, color, wrap: WRAP, align: 'center', origin: [0.5, 0] });
    layer.add(t);
    cy += t.height + gap;
  };
  line(SCAN_TEXT.got, { size: 36, bold: true, color: COLOR.textBrass });
  line(bonus ? BONUS_TEXT.count(opts.count.found, opts.count.total) : MAP_TEXT.count(opts.count.found, opts.count.total), { size: 30, bold: true, gap: 16 });
  layer.add(addStarRating(scene, BX, cy + 28, rating.stars));
  cy += 56 + 12;
  line(ratingLine(rating.stars), { color: COLOR.textBrass, gap: 22 });

  const button = (label, onTap, size = 30) => {
    layer.add(makeButton(scene, BX, cy + BTN.h / 2, { ...BTN, label, size, onTap }).container);
    cy += BTN.h + 12;
  };
  if (bonus) {
    line(o.group === 'galaxy' ? BONUS_TEXT.galaxyType : TYPE_INFO[o.type].nameKo, { size: 32, bold: true, gap: 8 });
    line(REGISTRY_TEXT.constellation(opts.zoneName), { gap: 4 });
    line(REGISTRY_TEXT.distance(o.distanceLy), { gap: 20 });
    if (!zoneDone) button(SCAN_TEXT.next, opts.onNext);
    button(SCAN_TEXT.toMap, opts.onMap, 28);
    return layer;
  }
  if (mission) {
    line(mission.early ? NIGHT_TEXT.missionEarly : NIGHT_TEXT.missionDone, { size: 30, bold: true, gap: 6 });
    if (mission.early) line(NIGHT_TEXT.earlyBonus(SCORE.earlyMission), { size: 28, bold: true, color: COLOR.textBrass, gap: 6 });
    cy += 16;
  }
  if (complete) {
    line(SCAN_TEXT.allDone, { gap: 24 });
    button(SCAN_TEXT.toSort, opts.onSort);
    return layer;
  }
  if (mission) {
    button(NIGHT_TEXT.toNextMission, opts.onNextMission);
    return layer;
  }
  if (zoneDone) line(SCAN_TEXT.zoneDone, { gap: 24 });
  else button(SCAN_TEXT.next, opts.onNext);
  button(SCAN_TEXT.toMap, opts.onMap, 28);
  return layer;
}
