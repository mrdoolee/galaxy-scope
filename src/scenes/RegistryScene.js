import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/game.js';
import { ZONES } from '../data/zones.js';
import { TYPE_INFO, REGISTRY_TEXT } from '../data/copy.js';
import { foundCards, finishRegistry } from '../logic/sortFlow.js';
import { registryOrder, zoneGroups } from '../logic/catalog.js';
import { DECK, getState, commit, sceneForPhase } from './gameState.js';
import { addBackdrop } from './ui/backdrop.js';
import { addText, addPlate, COLOR } from './ui/style.js';
import { makeButton, onPress } from './ui/button.js';
import { makeCard, makeCardBack } from './ui/card.js';

const CARD_X = 316;
const CARD_Y = 400;
const CARD_H = 580;
const PANEL = { x: 600, y: 112, w: 660, h: 470 };
const FLIP_MS = 170;

// 도감 등록: 카드가 한 장씩 뒤집히며 이름, 종류, 설명, 별자리, 거리가 열린다. 그 뒤 별자리별로 모아 본다.
export default class RegistryScene extends Phaser.Scene {
  constructor() {
    super(SCENES.REGISTRY);
  }

  create() {
    const state = getState(this);
    if (state.phase !== 'registry') {
      this.scene.start(sceneForPhase(state.phase));
      return;
    }
    this.cards = registryOrder(foundCards(state, DECK));
    this.index = -1;
    addBackdrop(this, 0x6a7390);
    this.page = this.add.container(0, 0);
    this.showFlipPage();
  }

  // ── 한 장씩 뒤집기
  showFlipPage() {
    this.page.removeAll(true);
    // 화면 아무 데나 눌러도 다음 장(버튼이 위에 있으면 버튼이 먼저 받는다)
    const tapZone = this.add.zone(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setInteractive();
    onPress(this, tapZone, () => this.next());
    this.page.add(tapZone);

    this.page.add(addPlate(this, 8, 8, 560, 84, 0.85));
    this.progress = addText(this, 32, 50, '', { size: 30, bold: true, color: COLOR.textBrass, origin: [0, 0.5] });
    this.page.add(this.progress);
    this.page.add(addText(this, 300, 50, REGISTRY_TEXT.tapHint, { size: 24, color: COLOR.textDim, origin: [0, 0.5], wrap: 260 }));
    this.page.add(makeButton(this, 1120, 50, { w: 280, h: 88, label: REGISTRY_TEXT.skipAll, size: 28, onTap: () => this.showZones() }).container);
    this.nextBtn = makeButton(this, 930, 648, { w: 340, h: 96, label: REGISTRY_TEXT.next, size: 30, onTap: () => this.next() });
    this.page.add(this.nextBtn.container);

    this.cardSlot = this.add.container(CARD_X, CARD_Y);
    this.info = this.add.container(0, 0);
    this.page.add([this.cardSlot, this.info]);
    this.next();
  }

  next() {
    if (this.index >= this.cards.length - 1) {
      this.showZones();
      return;
    }
    this.index += 1;
    const obj = this.cards[this.index];
    const last = this.index === this.cards.length - 1;
    this.progress.setText(REGISTRY_TEXT.progress(this.index + 1, this.cards.length));
    this.nextBtn.setLabel(last ? REGISTRY_TEXT.toZones : REGISTRY_TEXT.next);

    // 뒷면이 좁아졌다가 앞면이 넓어진다. 빨리 누르면 진행 중인 뒤집기를 버리고 다음 장으로.
    this.tweens.killTweensOf(this.cardSlot);
    this.tweens.killTweensOf(this.info);
    this.cardSlot.removeAll(true);
    this.info.removeAll(true);
    this.cardSlot.add(makeCardBack(this, 0, 0, { height: CARD_H }));
    this.cardSlot.setScale(1, 1);
    this.tweens.add({
      targets: this.cardSlot, scaleX: 0, duration: FLIP_MS, ease: 'Sine.in',
      onComplete: () => {
        this.cardSlot.removeAll(true);
        this.cardSlot.add(makeCard(this, 0, 0, { id: obj.id, height: CARD_H, label: obj.nameKo }));
        this.tweens.add({ targets: this.cardSlot, scaleX: 1, duration: FLIP_MS, ease: 'Sine.out' });
        this.drawInfo(obj);
        this.info.setAlpha(0);
        this.tweens.add({ targets: this.info, alpha: 1, duration: 220 });
      },
    });
  }

  drawInfo(obj) {
    const type = TYPE_INFO[obj.type];
    const zone = ZONES.find((z) => z.id === obj.zone);
    const x = PANEL.x + 32;
    const wrap = PANEL.w - 64;
    const add = (o) => {
      this.info.add(o);
      return o;
    };
    add(addPlate(this, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 0.92));
    let y = PANEL.y + 26;
    y += add(addText(this, x, y, obj.nameKo, { size: 44, bold: true, wrap })).height + 6;
    y += add(addText(this, x, y, type.nameKo, { size: 34, bold: true, color: COLOR.textBrass })).height + 16;

    // 방출 성운과 반사 성운: 빛을 내는 방식을 띠로 강조한다.
    const glow = REGISTRY_TEXT.glow[obj.type];
    if (glow) {
      const t = addText(this, x + 22, y + 10, glow, { size: 34, bold: true, color: '#fff3c4' });
      const band = this.add.graphics();
      band.fillStyle(COLOR.brass, 0.32);
      band.fillRoundedRect(x, y, t.width + 44, t.height + 20, 12);
      band.lineStyle(2, COLOR.brassLight, 0.95);
      band.strokeRoundedRect(x, y, t.width + 44, t.height + 20, 12);
      add(band);
      add(t);
      y += t.height + 20 + 18;
    }
    y += add(addText(this, x, y, type.line, { size: 28, wrap })).height + 22;
    y += add(addText(this, x, y, REGISTRY_TEXT.constellation(zone.nameKo), { size: 28, color: COLOR.textBrass })).height + 10;
    add(addText(this, x, y, REGISTRY_TEXT.distance(obj.distanceLy), { size: 28, wrap }));
  }

  // ── 별자리별로 모아 보기: 같은 별자리 방향의 카드들과 거리를 나란히
  showZones() {
    this.tweens.killTweensOf(this.cardSlot);
    this.tweens.killTweensOf(this.info);
    this.page.removeAll(true);
    this.page.add(addPlate(this, 8, 8, 1000, 96, 0.9));
    this.page.add(addText(this, 32, 34, REGISTRY_TEXT.zonesTitle, { size: 28, bold: true, color: COLOR.textBrass, origin: [0, 0.5] }));
    this.page.add(addText(this, 32, 74, REGISTRY_TEXT.zonesLine, { size: 30, bold: true, origin: [0, 0.5] }));
    this.page.add(makeButton(this, 1142, 56, { w: 252, h: 96, label: REGISTRY_TEXT.toResult, size: 30, onTap: () => this.toResult() }).container);

    // 거리 차가 큰 별자리만, 차가 큰 순서로(ZONE_GROUP_LIMIT개까지, 2×2 칸). 한 줄에 들어가면 칸을 세로로 키운다.
    const groups = zoneGroups(this.cards, ZONES);
    const cols = groups.length === 1 ? 1 : 2;
    const rows = Math.ceil(groups.length / cols);
    const top = 114;
    const pw = (GAME_WIDTH - 16 - (cols - 1) * 16) / cols;
    const ph = (GAME_HEIGHT - top - 8 - (rows - 1) * 8) / rows;
    // 카드 크기는 모든 칸에 같게: 가장 많은 칸의 한 장 자리(카드 너비 = 높이 × 2/3)와 칸 높이에 맞춘다.
    const most = Math.max(...groups.map((g) => g.cards.length));
    const cardH = Math.floor(Math.min(rows === 1 ? 260 : 140, (((pw - 24) / most) - 16) * 1.5));
    // 카드, 이름(두 줄까지), 거리를 한 덩어리로 칸 안 남는 높이의 가운데에 놓는다.
    const blockH = cardH + 156;
    const dy = 56 + Math.max(0, (ph - 56 - blockH) / 2);
    groups.forEach((g, i) => {
      const px = 8 + (i % cols) * (pw + 16);
      const py = top + Math.floor(i / cols) * (ph + 8);
      this.page.add(addPlate(this, px, py, pw, ph, 0.9));
      this.page.add(addText(this, px + 22, py + 28, g.zone.nameKo, { size: 28, bold: true, color: COLOR.textBrass, origin: [0, 0.5] }));
      const slot = (pw - 24) / g.cards.length;
      g.cards.forEach((o, j) => {
        const cx = px + 12 + slot * (j + 0.5);
        this.page.add(makeCard(this, cx, py + dy + cardH / 2, { id: o.id, height: cardH }));
        this.page.add(addText(this, cx, py + dy + 8 + cardH, o.nameKo, { size: 24, wrap: slot - 10, align: 'center', origin: [0.5, 0] }));
        this.page.add(addText(this, cx, py + dy + 80 + cardH, REGISTRY_TEXT.lightYears(o.distanceLy), { size: 26, bold: true, color: COLOR.textBrass, origin: [0.5, 0.5] }));
      });
    });
  }

  toResult() {
    commit(this, finishRegistry(getState(this)));
    this.scene.start(SCENES.RESULT);
  }
}
