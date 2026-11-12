import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/game.js';
import { OBJECTS } from '../data/objects.js';
import { CREDITS_TEXT } from '../data/copy.js';
import { createDrag } from '../logic/drag.js';
import { addBackdrop } from './SkyMapScene.js';
import { addText, addPlate, COLOR } from './ui/style.js';
import { makeButton } from './ui/button.js';

const HEADER_H = 116;
const LIST_X = 40;
const LIST_W = GAME_WIDTH - 80;

// 사진 출처: 사진이 있는 천체마다 이름, 크레딧(줄이지 않고 그대로), 라이선스, 원문 페이지 주소. 끌어서 넘긴다.
export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.CREDITS);
  }

  init(data) {
    this.from = data?.from ?? SCENES.RESULT;
  }

  create() {
    addBackdrop(this, 0x4a5370);
    this.scroll = 0;
    this.list = this.add.container(0, HEADER_H);
    this.contentH = this.buildList();
    this.buildHeader();
    this.bindScroll();
  }

  buildList() {
    let y = 20;
    for (const o of OBJECTS.filter((x) => x.photo)) {
      const name = o.catalogId && o.catalogId !== o.nameKo ? `${o.nameKo} (${o.catalogId})` : o.nameKo;
      const parts = [
        addText(this, LIST_X, y, name, { size: 28, bold: true, color: COLOR.textBrass, wrap: LIST_W }),
      ];
      let yy = y + parts[0].height + 6;
      for (const [str, color] of [[CREDITS_TEXT.credit(o.photo.credit), COLOR.text], [CREDITS_TEXT.license(o.photo.license), COLOR.text], [o.photo.pageUrl, COLOR.textDim]]) {
        const t = addText(this, LIST_X + 20, yy, str, { size: 24, color, wrap: LIST_W - 20 });
        parts.push(t);
        yy += t.height + 2;
      }
      const line = this.add.graphics();
      line.lineStyle(1, COLOR.brass, 0.45);
      line.lineBetween(LIST_X, yy + 14, LIST_X + LIST_W, yy + 14);
      this.list.add([...parts, line]);
      y = yy + 30;
    }
    return y + 20;
  }

  // 위쪽 머리글은 배경 그림을 잘라 덮어, 넘긴 목록이 그 아래로 들어가 보이지 않게 한다.
  buildHeader() {
    const bg = this.add.image(0, 0, 'bg-observatory').setOrigin(0, 0);
    const s = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    const top = (GAME_HEIGHT - bg.height * s) / 2;
    bg.setScale(s).setPosition(0, top).setTint(0x4a5370).setDepth(10);
    bg.setCrop(0, -top / s, bg.width, HEADER_H / s);
    addPlate(this, 8, 8, 1000, HEADER_H - 16, 0.95).setDepth(10);
    addText(this, 32, 38, CREDITS_TEXT.title, { size: 32, bold: true, origin: [0, 0.5] }).setDepth(10);
    addText(this, 32, 80, CREDITS_TEXT.edited, { size: 26, color: COLOR.textBrass, origin: [0, 0.5] }).setDepth(10);
    addText(this, 560, 58, CREDITS_TEXT.scroll, { size: 24, color: COLOR.textDim, origin: [0, 0.5] }).setDepth(10);
    makeButton(this, 1142, 58, { w: 252, h: 96, label: CREDITS_TEXT.back, size: 30, onTap: () => this.scene.start(this.from) }).container.setDepth(10);
  }

  maxScroll() {
    return Math.max(0, this.contentH - (GAME_HEIGHT - HEADER_H));
  }

  setScroll(v) {
    this.scroll = Math.max(0, Math.min(this.maxScroll(), v));
    this.list.setY(HEADER_H - this.scroll);
  }

  bindScroll() {
    const drag = createDrag();
    this.input.on('pointerdown', (p, over) => {
      const n = this.input.manager.pointers.filter((q) => q.isDown).length;
      if (over.length > 0 && n <= 1) return;
      drag.down(p.id, p.x, p.y, n);
    });
    this.input.on('pointermove', (p) => {
      const d = drag.move(p.id, p.x, p.y);
      if (d) this.setScroll(this.scroll - d.dy);
    });
    const up = (p) => drag.up(p.id);
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    this.input.on('gameout', () => drag.cancel());
    this.input.on('wheel', (_p, _o, _dx, dy) => this.setScroll(this.scroll + dy));
    const cancel = () => drag.cancel();
    const gameEvents = ['pause', 'blur', 'hidden'];
    for (const ev of gameEvents) this.game.events.on(ev, cancel);
    this.events.once('shutdown', () => {
      for (const ev of gameEvents) this.game.events.off(ev, cancel);
    });
  }
}
