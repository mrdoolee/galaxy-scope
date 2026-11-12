import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/game.js';
import { BOOT_TEXT } from '../data/copy.js';
import { DECK, bootState } from './gameState.js';
import { photoKey } from './ui/photoTextures.js';
import { addText, COLOR } from './ui/style.js';
import { makeButton } from './ui/button.js';

// 게임 그림(public/art)과 필수 카드 사진(public/photos). 보너스 사진은 보너스 단계에서 따로 불러온다.
const ART = ['bg-observatory', 'eyepiece-frame', 'card-frame', 'card-back-unknown', 'agent-hq', 'bin-tray',
  'icon-zoom', 'icon-focus', 'icon-hint', 'rank-badge-1', 'rank-badge-2', 'rank-badge-3'];
const FILES = [
  ...ART.map((k) => ({ key: k, url: `art/${k}.png` })),
  ...DECK.map((o) => ({ key: photoKey(o.id), url: o.photo.file })),
];

const BAR_W = 520;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.label = addText(this, cx, cy - 50, BOOT_TEXT.loading(0), { size: 36, origin: [0.5, 0.5] });
    this.add.rectangle(cx, cy + 10, BAR_W + 8, 36, COLOR.navyLight).setStrokeStyle(3, COLOR.brass, 0.9);
    this.fill = this.add.rectangle(cx - BAR_W / 2, cy + 10, 0, 28, COLOR.brassLight).setOrigin(0, 0.5);
    this.load.on('progress', (v) => {
      this.fill.width = BAR_W * v;
      this.label.setText(BOOT_TEXT.loading(Math.round(v * 100)));
    });
    this.queueMissing();
  }

  // 아직 텍스처가 없는 파일만 불러오기 목록에 넣는다(처음과 다시 시도 모두).
  queueMissing() {
    for (const f of FILES) if (!this.textures.exists(f.key)) this.load.image(f.key, f.url);
  }

  missing() {
    return FILES.filter((f) => !this.textures.exists(f.key));
  }

  create() {
    if (this.missing().length === 0) this.finish();
    else this.showRetry();
  }

  showRetry() {
    this.label.setText(BOOT_TEXT.failed);
    this.fill.width = 0;
    const btn = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, {
      w: 280, h: 96, label: BOOT_TEXT.retry,
      onTap: () => {
        btn.container.destroy();
        this.label.setText(BOOT_TEXT.loading(0));
        this.fill.width = 0;
        this.load.once('complete', () => this.create());
        this.queueMissing();
        this.load.start();
      },
    });
  }

  finish() {
    const state = bootState(this.registry);
    this.scene.start(state.phase === 'collect' ? SCENES.SKY_MAP : SCENES.SORT);
  }
}
