import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/game.js';
import { ZONE_W, ZONE_H, VIEW_RADIUS, LOCK_RADIUS, SMUDGE_SPEED, BLUR_SPEED, IDLE_NUDGE_MS } from '../config/balance.js';
import { ZONES } from '../data/zones.js';
import { OBJECTS } from '../data/objects.js';
import { SCAN_TEXT, MAP_TEXT, BONUS_TEXT, TYPE_INFO, REGISTRY_TEXT } from '../data/copy.js';
import { chartLayout } from '../logic/chart.js';
import { viewState, visibleSmudges, lockTarget, focusProgress, nudgeDirection, focusTarget, focusBlur } from '../logic/scan.js';
import { createDrag, createSpeedMeter, dragStep } from '../logic/drag.js';
import { makeRng, seedFor } from '../logic/rng.js';
import { recordFind } from '../logic/save.js';
import { inBonus, recordBonusFind, bonusProgress } from '../logic/bonus.js';
import { DECK, DECK_IDS, DECK_SIZE, getState, persist, refreshRequest } from './gameState.js';
import { addText, addPlate, COLOR, MIN_FONT } from './ui/style.js';
import { makeButton } from './ui/button.js';
import { makeCard } from './ui/card.js';
import { softTexture, photoKey, coverImage } from './ui/photoTextures.js';
import { remainingTargets, plainLooks, addRequestThumbs, termRequestText } from './ui/request.js';
import { makeFocusSlider } from './ui/focusSlider.js';
import { makeMiniMap } from './ui/miniMap.js';
import { addBackdropPiece } from './ui/backdrop.js';

const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;

// eyepiece-frame.png(1024×1024)의 투명 구멍을 재어 둔 값: 가운데 (503, 509), 반지름 325~335(평균 328).
// 구멍 반지름이 화면에서 VIEW_RADIUS가 되게 줄이면, 규칙의 "시야 안"과 눈에 보이는 하늘이 같아진다.
const HOLE = { cx: 503, cy: 509, r: 328, size: 1024 };
const FRAME_SCALE = VIEW_RADIUS / HOLE.r;
const FRAME_LEFT = CX - HOLE.cx * FRAME_SCALE;
const FRAME_RIGHT = CX + (HOLE.size - HOLE.cx) * FRAME_SCALE;

const SKY_MARGIN = VIEW_RADIUS + 80; // 시야가 구역 가장자리에 닿아도 별이 보이게
const STAR_COUNT = 900;
const SMUDGE_SIZE = 220;
const SMUDGE_ALPHA = 0.4;
const FOCUS_SIZE = 2 * VIEW_RADIUS + 24;
const SIDE_X = FRAME_LEFT / 2;               // 왼쪽 판 가운데
const RIGHT_X = (FRAME_RIGHT + GAME_WIDTH) / 2; // 오른쪽 판 가운데

export default class ScanScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SCAN);
  }

  init(data) {
    this.zoneId = data.zoneId;
  }

  create() {
    const state = getState(this);
    this.zone = ZONES.find((z) => z.id === this.zoneId);
    this.found = new Set(state.foundIds);
    this.bonus = inBonus(state);
    this.pool = this.bonus ? OBJECTS : DECK; // 보너스 관측에서는 필수·보너스 천체를 모두 놓는다(찾은 것은 얼룩으로 보이지 않는다)
    // 실제 하늘 자리를 따른 배치(판마다 같다). 보너스 천체를 더해도 필수 카드 자리는 그대로다.
    this.placed = chartLayout(this.zoneId, DECK, this.bonus ? OBJECTS.filter((o) => !o.deck) : []);
    this.view = { x: ZONE_W / 2, y: ZONE_H / 2 };
    this.speed = 0;
    this.mode = 'sweep'; // sweep | focus | card
    this.idleMs = 0;
    this.moved = false;
    this.lockId = undefined; // 첫 프레임에 확대 버튼과 조준 원을 그리게
    this.drag = createDrag();
    this.meter = createSpeedMeter();

    this.buildSky(state.seed);
    this.buildFocusLayer();
    this.buildFrame();
    this.buildHud();
    this.bindInput();
    this.refreshPanel();
  }

  // ── 구역 하늘: 시드 난수로 찍은 별 + 천체 자리의 흐린 얼룩
  buildSky(seed) {
    this.sky = this.add.container(CX - this.view.x, CY - this.view.y);
    const rng = makeRng(seedFor(seed, `stars:${this.zoneId}`));
    const g = this.add.graphics();
    const tints = [0xffffff, 0xffffff, 0xdfe8ff, 0xfff1d6, 0xcfdcff];
    for (let i = 0; i < STAR_COUNT; i++) {
      const x = -SKY_MARGIN + rng() * (ZONE_W + 2 * SKY_MARGIN);
      const y = -SKY_MARGIN + rng() * (ZONE_H + 2 * SKY_MARGIN);
      const r = 0.6 + rng() ** 3 * 2.2;
      g.fillStyle(tints[Math.floor(rng() * tints.length)], 0.35 + rng() * 0.65);
      g.fillCircle(x, y, r);
    }
    // 구역 가장자리(여기서 더 갈 수 없다)
    g.lineStyle(3, COLOR.brass, 0.35);
    g.strokeRect(0, 0, ZONE_W, ZONE_H);
    this.sky.add(g);

    this.smudges = new Map();
    for (const p of this.placed) {
      if (this.found.has(p.id)) continue; // 이미 찾은 천체는 얼룩을 만들지 않는다
      const img = this.add.image(p.x, p.y, softTexture(this, p.id, { size: 128, grain: 8, gray: true, faint: true }));
      img.setDisplaySize(SMUDGE_SIZE, SMUDGE_SIZE).setAlpha(0);
      this.sky.add(img);
      this.smudges.set(p.id, img);
    }

    // 빠르게 움직일 때 시야 흐림(WebGL에서만; 캔버스 그리기에서는 어둡게만 한다)
    this.blurFx = null;
    if (this.sky.enableFilters && this.renderer.gl) {
      this.sky.enableFilters();
      this.blurFx = this.sky.filters.internal.addBlur(1, 2, 2, 1, 0xffffff, 4);
      this.blurFx.active = false;
    }

    // 가운데 조준 원: 이 안에 얼룩이 오면 확대할 수 있다
    this.reticle = this.add.graphics({ x: CX, y: CY });
    this.nudge = this.add.graphics({ x: CX, y: CY }).setVisible(false);
    this.nudge.fillStyle(COLOR.brassLight, 0.9);
    this.nudge.fillTriangle(VIEW_RADIUS - 70, -26, VIEW_RADIUS - 70, 26, VIEW_RADIUS - 28, 0);
    this.nudge.fillTriangle(VIEW_RADIUS - 110, -20, VIEW_RADIUS - 110, 20, VIEW_RADIUS - 78, 0);
    this.tweens.add({ targets: this.nudge, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 });
  }

  drawReticle(locked) {
    const r = this.reticle;
    r.clear();
    r.lineStyle(locked ? 3 : 2, locked ? COLOR.brassLight : 0xffffff, locked ? 0.9 : 0.25);
    r.strokeCircle(0, 0, LOCK_RADIUS);
    r.lineBetween(-LOCK_RADIUS - 14, 0, -LOCK_RADIUS + 10, 0);
    r.lineBetween(LOCK_RADIUS - 10, 0, LOCK_RADIUS + 14, 0);
    r.lineBetween(0, -LOCK_RADIUS - 14, 0, -LOCK_RADIUS + 10);
    r.lineBetween(0, LOCK_RADIUS - 10, 0, LOCK_RADIUS + 14);
  }

  // ── 확대 화면: 흐린 사진 위에 선명한 사진을 겹치고, 초점이 맞을수록 선명한 쪽을 진하게
  buildFocusLayer() {
    this.focusLayer = this.add.container(CX, CY).setVisible(false);
  }

  showFocusPhoto(id) {
    this.focusLayer.removeAll(true);
    const soft = this.add.image(0, 0, softTexture(this, id, { size: 256, grain: 18, round: false }));
    soft.setDisplaySize(FOCUS_SIZE, FOCUS_SIZE);
    this.sharp = coverImage(this.add.image(0, 0, photoKey(id)), FOCUS_SIZE, FOCUS_SIZE).setAlpha(0);
    this.focusLayer.add([soft, this.sharp]);
    this.focusLayer.setVisible(true).setScale(0.35).setAlpha(0.4);
    this.tweens.add({ targets: this.focusLayer, scale: 1, alpha: 1, duration: 320, ease: 'Cubic.out' });
  }

  // ── 망원경 틀: 구멍 밖은 틀과 양옆 배경 띠가 모두 가린다
  buildFrame() {
    this.add.image(CX, CY, 'eyepiece-frame').setOrigin(HOLE.cx / HOLE.size, HOLE.cy / HOLE.size).setScale(FRAME_SCALE);
    const strip = (x0, x1) => addBackdropPiece(this, { x: x0, y: 0, w: x1 - x0, h: GAME_HEIGHT }, 0x8a93a8);
    strip(0, Math.ceil(FRAME_LEFT) + 4);
    strip(Math.floor(FRAME_RIGHT) - 4, GAME_WIDTH);
  }

  // ── 화면 글과 버튼
  buildHud() {
    this.backBtn = makeButton(this, SIDE_X, 62, { w: 200, h: 88, label: SCAN_TEXT.back, onTap: () => this.scene.start(SCENES.SKY_MAP) });
    addText(this, SIDE_X, 140, this.zone.nameKo, { size: 28, bold: true, origin: [0.5, 0.5] });
    this.zoneCountText = addText(this, SIDE_X, 180, '', { size: MIN_FONT, origin: [0.5, 0.5], color: COLOR.textBrass });
    this.totalText = addText(this, SIDE_X, 214, '', { size: MIN_FONT, origin: [0.5, 0.5] });
    this.requestBox = this.add.container(0, 0);

    addPlate(this, CX - 330, 14, 660, 64, 0.85);
    this.status = addText(this, CX, 46, SCAN_TEXT.start, { size: 26, bold: true, origin: [0.5, 0.5] });

    this.miniMap = makeMiniMap(this, RIGHT_X, 92, 200, this.placed);
    this.zoomBtn = makeButton(this, RIGHT_X, 560, {
      w: 200, h: 180, label: SCAN_TEXT.zoom, icon: 'icon-zoom', iconSize: 110, size: 28,
      onTap: () => this.enterFocus(),
    }).setEnabled(false);
    this.cancelBtn = makeButton(this, RIGHT_X, 600, { w: 200, h: 96, label: SCAN_TEXT.cancel, onTap: () => this.leaveFocus() });
    this.cancelBtn.container.setVisible(false);

    this.slider = makeFocusSlider(this, CX, 670, 480);
    this.slider.container.setVisible(false);
  }

  // 왼쪽 판: 구역 안 찾은 수, 전체 수집 수, 의뢰
  refreshPanel() {
    const mine = this.placed.filter((p) => this.found.has(p.id)).length;
    this.zoneCountText.setText(SCAN_TEXT.zoneCount(mine, this.placed.length));
    if (this.bonus) {
      const { found, total } = bonusProgress({ foundIds: [...this.found] }, OBJECTS);
      this.totalText.setText(BONUS_TEXT.count(found, total));
    } else {
      this.totalText.setText(MAP_TEXT.count(this.found.size, DECK_SIZE));
    }

    this.requestBox.removeAll(true);
    const request = refreshRequest(this);
    const targets = remainingTargets(request, this.found, this.pool);
    if (!request || targets.length === 0) return;
    if (request.zoneId !== this.zoneId) {
      const zoneName = ZONES.find((z) => z.id === request.zoneId).nameKo;
      this.requestBox.add(addText(this, SIDE_X, 270, SCAN_TEXT.requestElsewhere(zoneName), { size: MIN_FONT, wrap: 220, align: 'center', origin: [0.5, 0], color: COLOR.textDim }));
      return;
    }
    this.requestBox.add(addText(this, SIDE_X, 262, SCAN_TEXT.request, { size: 24, bold: true, color: COLOR.textBrass, origin: [0.5, 0] }));
    if (request.kind === 'term') {
      this.requestBox.add(addText(this, SIDE_X, 302, termRequestText(request, OBJECTS), { size: MIN_FONT, wrap: 220, align: 'center', origin: [0.5, 0] }));
    } else if (request.kind === 'picture') {
      const size = 66;
      const w = targets.length * size + (targets.length - 1) * 8;
      this.requestBox.add(addRequestThumbs(this, SIDE_X - w / 2, 302, targets, size, 8));
    } else {
      this.requestBox.add(addText(this, SIDE_X, 302, plainLooks(targets).replaceAll(' · ', '\n'), { size: MIN_FONT, wrap: 220, align: 'center', origin: [0.5, 0] }));
    }
  }

  // ── 입력: 한 손가락 끌기. 두 번째 손가락, 화면 밖, 창 전환이면 끌기를 끝내고 속도 0.
  bindInput() {
    const now = () => performance.now();
    // 끌기와 초점 눈금 잡기를 모두 놓는다. 세로로 돌려 게임이 멈출 때(game pause), 창 전환(blur, hidden),
    // 손가락이 화면 밖으로 나갈 때 부른다. 멈춘 동안의 손가락은 다시 움직여도 끌기로 이어지지 않는다.
    const stop = () => {
      this.drag.cancel();
      this.meter.reset(now());
      this.speed = 0;
      this.slider.release();
    };
    this.input.on('pointerdown', (p, over) => {
      if (this.mode !== 'sweep') return;
      const downCount = this.input.manager.pointers.filter((q) => q.isDown).length;
      if (over.length > 0 && downCount <= 1) return; // 버튼을 누르는 중
      this.drag.down(p.id, p.x, p.y, downCount);
      this.meter.reset(now());
      if (!this.drag.active) this.speed = 0;
    });
    this.input.on('pointermove', (p) => {
      const d = this.drag.move(p.id, p.x, p.y);
      if (!d) return;
      const step = dragStep(this.view, d);
      this.meter.sample(step.dist, now());
      this.view = step.view;
      this.moved = true;
    });
    const up = (p) => {
      this.drag.up(p.id);
      if (!this.drag.active) stop();
    };
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    this.input.on('gameout', stop);
    // main.js의 game.pause()는 게임의 'pause' 이벤트를 낸다(장면의 pause가 아니다).
    const gameEvents = [['pause', stop], ['blur', stop], ['hidden', stop]];
    for (const [ev, fn] of gameEvents) this.game.events.on(ev, fn);
    this.events.once('shutdown', () => {
      for (const [ev, fn] of gameEvents) this.game.events.off(ev, fn);
    });
  }

  update(_time, delta) {
    if (this.mode === 'sweep') this.updateSweep(delta);
    else if (this.mode === 'focus') this.updateFocus(delta);
  }

  updateSweep(delta) {
    this.speed = this.drag.active ? this.meter.read(performance.now()) : 0;
    this.sky.setPosition(CX - this.view.x, CY - this.view.y);

    const state = viewState(this.speed);
    if (this.blurFx) {
      this.blurFx.active = state === 'blur';
      this.blurFx.strength = Math.min(3, this.speed / BLUR_SPEED);
    }
    this.sky.setAlpha(state === 'clear' ? 1 : state === 'dim' ? 0.85 : 0.7);

    this.visibleIds = visibleSmudges(this.view, this.speed, this.placed, this.found);
    const visible = new Set(this.visibleIds);
    for (const [id, img] of this.smudges) {
      const want = visible.has(id) ? SMUDGE_ALPHA : 0;
      const k = want > img.alpha ? Math.min(1, delta / 300) : Math.min(1, delta / 80);
      img.setAlpha(this.found.has(id) ? 0 : img.alpha + (want - img.alpha) * k);
    }

    const lock = lockTarget(this.view, this.speed, this.placed, this.found);
    if (lock !== this.lockId) {
      this.lockId = lock;
      this.zoomBtn.setEnabled(!!lock);
      this.drawReticle(!!lock);
    }

    this.idleMs += delta;
    const dir = !lock && this.idleMs >= IDLE_NUDGE_MS ? nudgeDirection(this.view, this.placed, this.found) : null;
    this.nudge.setVisible(!!dir && (dir.dx !== 0 || dir.dy !== 0));
    if (dir) this.nudge.setRotation(Math.atan2(dir.dy, dir.dx));

    const zoneDone = this.placed.every((p) => this.found.has(p.id));
    this.status.setText(
      zoneDone ? SCAN_TEXT.zoneDone
        : this.speed >= SMUDGE_SPEED ? SCAN_TEXT.tooFast
          : lock ? SCAN_TEXT.found
            : this.moved ? '' : SCAN_TEXT.start,
    );
    this.miniMap.update(this.view, this.found);
  }

  enterFocus() {
    if (this.mode !== 'sweep' || !this.lockId) return;
    this.mode = 'focus';
    this.drag.cancel();
    this.speed = 0;
    this.focusId = this.lockId;
    this.focusTargetValue = focusTarget(getState(this).seed, this.focusId);
    this.heldMs = 0;
    this.sky.setVisible(false);
    this.reticle.setVisible(false);
    this.nudge.setVisible(false);
    this.showFocusPhoto(this.focusId);
    this.slider.setValue(0);
    this.slider.container.setVisible(true);
    this.zoomBtn.container.setVisible(false);
    this.cancelBtn.container.setVisible(true);
    this.status.setText(SCAN_TEXT.focusGuide);
  }

  leaveFocus() {
    this.mode = 'sweep';
    this.slider.release();
    this.slider.container.setVisible(false);
    this.focusLayer.setVisible(false);
    this.sky.setVisible(true);
    this.reticle.setVisible(true);
    this.cancelBtn.container.setVisible(false);
    this.zoomBtn.container.setVisible(true);
    this.backBtn.setEnabled(true);
    this.lockId = undefined; // 다음 프레임에 버튼과 조준 원을 다시 그린다
  }

  updateFocus(delta) {
    const value = this.slider.value;
    const blur = focusBlur(value, this.focusTargetValue);
    this.sharp.setAlpha((1 - blur) ** 2);
    const { sharp } = focusProgress(value, this.focusTargetValue, this.heldMs);
    this.heldMs = sharp ? this.heldMs + delta : 0;
    if (focusProgress(value, this.focusTargetValue, this.heldMs).captured) this.capture(this.focusId);
  }

  // ── 카드 얻기: 저장하고 "미확인 천체" 카드를 보여 준다
  capture(id) {
    this.mode = 'card';
    // 카드가 뜰 때까지(0.65초) 「지도로」를 끈다. 카드 화면의 버튼으로만 나간다.
    this.backBtn.setEnabled(false);
    const state = getState(this);
    // 보너스 천체는 점수와 단계에 영향을 주지 않는다: 단계는 그대로 두고 찾은 목록에만 넣는다.
    const next = this.bonus ? recordBonusFind(state, id) : recordFind(state, id, DECK_IDS);
    this.registry.set('state', next);
    this.found = new Set(next.foundIds);
    const complete = !this.bonus && next.phase === 'sort';
    persist(this);

    this.slider.release();
    this.slider.container.setVisible(false);
    this.cancelBtn.container.setVisible(false);
    this.status.setText(SCAN_TEXT.got);
    this.idleMs = 0;
    this.refreshPanel();
    this.tweens.add({ targets: this.sharp, alpha: 1, duration: 250 });
    this.time.delayedCall(650, () => this.showCard(id, complete));
  }

  showCard(id, complete) {
    const layer = this.add.container(0, 0);
    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x02040a, 0.8).setOrigin(0).setInteractive();
    layer.add(dim);
    const o = OBJECTS.find((x) => x.id === id);
    // 보너스 카드는 곧바로 등록된다: 이름, 종류, 별자리, 거리를 보여 준다.
    const card = makeCard(this, 470, 365, { id, height: 600, label: this.bonus ? o.nameKo : SCAN_TEXT.unknown });
    layer.add(card);
    card.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 300, ease: 'Back.out' });

    const bx = 960;
    this.status.setText('');
    layer.add(addText(this, bx, 140, SCAN_TEXT.got, { size: 36, bold: true, color: COLOR.textBrass, origin: [0.5, 0.5] }));
    if (this.bonus) {
      const { found, total } = bonusProgress({ foundIds: [...this.found] }, OBJECTS);
      layer.add(addText(this, bx, 200, BONUS_TEXT.count(found, total), { size: 30, bold: true, origin: [0.5, 0.5] }));
      const typeName = o.group === 'galaxy' ? BONUS_TEXT.galaxyType : TYPE_INFO[o.type].nameKo;
      layer.add(addText(this, bx, 262, typeName, { size: 34, bold: true, wrap: 520, align: 'center', origin: [0.5, 0.5] }));
      layer.add(addText(this, bx, 322, REGISTRY_TEXT.constellation(this.zone.nameKo), { size: 28, origin: [0.5, 0.5] }));
      layer.add(addText(this, bx, 366, REGISTRY_TEXT.distance(o.distanceLy), { size: 28, origin: [0.5, 0.5] }));
    } else {
      layer.add(addText(this, bx, 200, MAP_TEXT.count(this.found.size, DECK_SIZE), { size: 30, bold: true, origin: [0.5, 0.5] }));
    }
    const close = () => layer.destroy();
    const zoneDone = this.placed.every((p) => this.found.has(p.id));
    if (complete) {
      layer.add(addText(this, bx, 300, SCAN_TEXT.allDone, { size: 26, wrap: 400, align: 'center', origin: [0.5, 0.5] }));
      layer.add(makeButton(this, bx, 460, { w: 320, h: 100, label: SCAN_TEXT.toSort, size: 30, onTap: () => this.scene.start(SCENES.SORT) }).container);
      return;
    }
    if (this.bonus) {
      if (!zoneDone) layer.add(makeButton(this, bx, 470, { w: 320, h: 100, label: SCAN_TEXT.next, size: 30, onTap: () => { close(); this.leaveFocus(); } }).container);
      layer.add(makeButton(this, bx, zoneDone ? 500 : 590, { w: 320, h: 100, label: SCAN_TEXT.toMap, size: 28, onTap: () => this.scene.start(SCENES.SKY_MAP) }).container);
      return;
    }
    if (!zoneDone) {
      layer.add(makeButton(this, bx, 380, { w: 320, h: 100, label: SCAN_TEXT.next, size: 30, onTap: () => { close(); this.leaveFocus(); } }).container);
    } else {
      layer.add(addText(this, bx, 300, SCAN_TEXT.zoneDone, { size: 26, origin: [0.5, 0.5] }));
    }
    layer.add(makeButton(this, bx, zoneDone ? 400 : 510, { w: 320, h: 100, label: SCAN_TEXT.toMap, size: 28, onTap: () => this.scene.start(SCENES.SKY_MAP) }).container);
  }
}
