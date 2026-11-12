// 묶기 화면 조각: 묶음 칸, 본부 요원 말풍선, 크게 보기, 안내 판.
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game.js';
import { addText, addPlate, COLOR } from './style.js';
import { makeButton } from './button.js';
import { makeCard } from './card.js';
import { SORT_TEXT } from '../../data/copy.js';

// bin-tray.png(1024×384)를 재어 둔 값. 위쪽 가운데에 둥근 지붕 장식(x 340~690, y 0~92)이 있고,
// 놋쇠 테 안쪽 남색 칸은 x 40~996, y 108~340이다. 지붕 왼쪽 위는 비어 있어 이름표를 둔다.
const TRAY = { w: 1024, h: 384, left: 48, right: 48, top: 116, bottom: 52, innerL: 40, innerR: 28, innerT: 108, innerB: 44, domeL: 340 };

/**
 * 묶음 칸 하나. (x, y)는 왼쪽 위, w×h는 화면 크기. 가로는 그림 비율대로 줄이고, 세로는 가운데 띠만 늘린다(지붕 장식은 그대로).
 *   -> { name, rect, inner, setCount(n), setHover(on) }
 */
export function makeBin(scene, x, y, w, h, name, label) {
  const k = w / TRAY.w;
  let tray;
  if (scene.renderer.gl) {
    tray = scene.add.nineslice(x, y, 'bin-tray', undefined, TRAY.w, h / k, TRAY.left, TRAY.right, TRAY.top, TRAY.bottom).setScale(k);
  } else {
    tray = scene.add.image(x, y, 'bin-tray').setDisplaySize(w, h);
  }
  tray.setOrigin(0, 0);

  const inner = { x: x + TRAY.innerL * k + 2, y: y + TRAY.innerT * k + 2, w: w - (TRAY.innerL + TRAY.innerR) * k - 4, h: h - (TRAY.innerT + TRAY.innerB) * k - 4 };
  // 이름표: 지붕 장식 왼쪽 빈자리. 길면 글자를 조금 줄인다(MIN_FONT 아래로는 안 줄인다).
  const room = TRAY.domeL * k - 26;
  const title = addText(scene, x + 18, y + 30, label, { size: 28, bold: true, color: COLOR.textBrass, origin: [0, 0.5], stroke: 5 });
  if (title.width > room) title.setFontSize(Math.max(24, Math.floor(28 * room / title.width)));
  const count = addText(scene, x + w - 18, y + 30, '', { size: 24, color: COLOR.text, origin: [1, 0.5], stroke: 5 });

  const hover = scene.add.graphics();
  hover.lineStyle(4, COLOR.brassLight, 0.9);
  hover.strokeRoundedRect(inner.x - 4, inner.y - 4, inner.w + 8, inner.h + 8, 12);
  hover.setVisible(false);

  return {
    name,
    rect: { x, y, w, h },
    inner,
    setCount(n) {
      count.setText(n > 0 ? SORT_TEXT.binCount(n) : '');
    },
    setHover(on) {
      hover.setVisible(on);
    },
  };
}

/**
 * 위쪽 본부 요원과 말풍선(panel-plate). 힌트일 때는 전구 아이콘을 붙인다.
 *   -> { say(str, { hint }) }
 */
export function makeHintBubble(scene, { x = 104, y = 8, w = 900, h = 92 } = {}) {
  const agent = scene.add.image(54, y + h / 2 + 2, 'agent-hq');
  agent.setScale(100 / agent.width);
  const c = scene.add.container(0, 0);
  c.add(addPlate(scene, x, y, w, h, 0.94));
  const icon = scene.add.image(x + 44, y + h / 2, 'icon-hint');
  icon.setScale(64 / icon.width);
  const text = addText(scene, x + 24, y + h / 2, '', { size: 26, origin: [0, 0.5], wrap: w - 48 });
  c.add([icon, text]);
  return {
    get text() {
      return text.text;
    },
    say(str, { hint = false } = {}) {
      icon.setVisible(hint);
      text.setX(hint ? x + 88 : x + 24);
      text.setWordWrapWidth(hint ? w - 108 : w - 48, true);
      text.setColor(hint ? COLOR.textBrass : COLOR.text);
      text.setText(str);
      if (hint) {
        scene.tweens.add({ targets: icon, angle: { from: -12, to: 12 }, duration: 120, yoyo: true, repeat: 3, onComplete: () => icon.setAngle(0) });
      }
    },
  };
}

// 화면 전체를 덮는 어두운 막(뒤쪽을 누르지 못하게 한다).
function addDim(scene, layer, alpha = 0.82) {
  const dim = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x02040a, alpha).setOrigin(0).setInteractive();
  layer.add(dim);
  return dim;
}

/**
 * 카드를 크게 본다. 오른쪽에 묶음에 넣기 버튼(actions)과 닫기.
 *   actions: [{ label, onTap }]
 *   -> layer(Container). 닫으면 layer를 지운다.
 */
export function openCardZoom(scene, id, actions, closeLabel, onClose) {
  const layer = scene.add.container(0, 0).setDepth(100);
  addDim(scene, layer);
  const card = makeCard(scene, 360, GAME_HEIGHT / 2, { id, height: 640 });
  layer.add(card);
  card.setScale(0.7).setAlpha(0);
  scene.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
  const close = () => {
    layer.destroy();
    onClose?.();
  };
  const bx = 920;
  actions.forEach((a, i) => {
    layer.add(makeButton(scene, bx, 150 + i * 120, { w: 480, h: 100, label: a.label, size: 28, onTap: () => { close(); a.onTap(); } }).container);
  });
  layer.add(makeButton(scene, bx, 600, { w: 300, h: 100, label: closeLabel, size: 30, onTap: close }).container);
  return layer;
}

/**
 * 요원이 한 마디 하는 안내 판(1차 통과 뒤 이름 알려 주기, 묶기를 마침).
 */
export function showStoryPanel(scene, str, buttonLabel, onNext) {
  const layer = scene.add.container(0, 0).setDepth(100);
  addDim(scene, layer, 0.7);
  // 그림은 허리에서 잘려 있으므로 화면 아래 끝에 붙인다.
  const agent = scene.add.image(300, GAME_HEIGHT, 'agent-hq').setOrigin(0.5, 1);
  agent.setScale(460 / agent.width);
  layer.add(agent);
  layer.add(addPlate(scene, 540, 190, 680, 220, 0.96));
  layer.add(addText(scene, 880, 300, str, { size: 34, bold: true, wrap: 600, align: 'center', origin: [0.5, 0.5] }));
  layer.add(makeButton(scene, 880, 510, { w: 360, h: 100, label: buttonLabel, size: 30, onTap: () => { layer.destroy(); onNext(); } }).container);
  layer.setAlpha(0);
  scene.tweens.add({ targets: layer, alpha: 1, duration: 250 });
  return layer;
}
