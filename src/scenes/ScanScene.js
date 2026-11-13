import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/game.js';
import { ZONE_W, ZONE_H, VIEW_RADIUS, LOCK_RADIUS, SMUDGE_SPEED, BLUR_SPEED, IDLE_NUDGE_MS, NIGHT_SAVE_MS, SHOT_RETRY_MS } from '../config/balance.js';
import { ZONES } from '../data/zones.js';
import { OBJECTS } from '../data/objects.js';
import { SCAN_TEXT, MAP_TEXT, BONUS_TEXT, NIGHT_TEXT, TUTORIAL_TEXT } from '../data/copy.js';
import { chartLayout, chartGuides } from '../logic/chart.js';
import { startGuide, zoneClues } from '../logic/guide.js';
import { viewState, visibleSmudges, lockTarget, focusError, gaugeValue, nudgeDirection, focusTarget, focusBlur, clampView } from '../logic/scan.js';
import { createDrag, createSpeedMeter, dragStep } from '../logic/drag.js';
import { makeRng, seedFor } from '../logic/rng.js';
import { inBonus, bonusProgress } from '../logic/bonus.js';
import { tickNight, isDawn, endDay, nightTotal, clockRuns } from '../logic/night.js';
import { shotStars } from '../logic/rating.js';
import { recordCapture } from '../logic/capture.js';
import { tutorialOn, tutorialTarget, tutorialStep, soloHintOn } from '../logic/tutorial.js';
import { DECK, DECK_IDS, DECK_SIZE, getState, persist, commit, stash, refreshRequest } from './gameState.js';
import { addText, addPlate, COLOR, MIN_FONT } from './ui/style.js';
import { makeButton } from './ui/button.js';
import { softTexture, photoKey, coverImage } from './ui/photoTextures.js';
import { remainingTargets } from './ui/request.js';
import { makeFocusGauge } from './ui/focusGauge.js';
import { makeMiniMap } from './ui/miniMap.js';
import { addChartSky } from './ui/chartSky.js';
import { makeTargetPanel, panelTargets } from './ui/targetPanel.js';
import { addBackdropPiece } from './ui/backdrop.js';
import { makeNightBar } from './ui/nightBar.js';
import { runDayWait } from './ui/dayWait.js';
import { showCaptureCard } from './ui/captureCard.js';
import { showToast } from './ui/toast.js';

const SOLO_HINT_MS = 4500; // "이제 스스로 찾아보세요" 알림이 떠 있는 시간

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
const MARK_R = 104;      // 첫 탐사 안내: 대상 얼룩을 두르는 원
const MARK_LABEL_DY = 172; // 그 원을 풀이하는 글: 시야 가운데에서 위나 아래로 이만큼(시야 안에서 잘리지 않는 자리)
const NO_IDS = new Set();

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
    const bonusObjects = this.bonus ? OBJECTS.filter((o) => !o.deck) : [];
    this.placed = chartLayout(this.zoneId, DECK, bonusObjects);
    this.clues = zoneClues(this.zoneId, DECK, bonusObjects);
    // 이름 있는 길잡이 별에서 시작한다(못 찾은 천체에서 가장 먼 길잡이). 단서를 따라 옮겨 가야 찾는다.
    const start = startGuide(chartGuides(this.zoneId), this.placed, this.found);
    this.view = start ? clampView(start.x, start.y) : { x: ZONE_W / 2, y: ZONE_H / 2 };
    this.speed = 0;
    this.mode = 'sweep'; // sweep | focus | card | day
    this.idleMs = 0;
    this.dayWait = false; // 낮 기다림이 도는 중
    this.nightTotalMs = undefined; // 시간 막대의 분모(showNight(true)에서 센다)
    this.sinceSave = 0;   // 밤 시계를 마지막으로 기기에 저장한 뒤 지난 시간
    this.tonightIds = []; // 이 밤에 찍은 카드(낮 기다림에 보여 준다. 새로 고침하면 비어도 된다)
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
    this.buildTutorial(state);
    this.showNight(true);
    this.toastObj = null; // 앞 방문의 알림(이미 지워졌다)을 잊는다
    this.soloHint = !this.bonus && soloHintOn(state);
    this.showSoloHint();
  }

  // 첫 탐사 안내가 끝난 뒤 다음 훑기를 시작할 때 한 번: 이제 왼쪽 판을 보고 스스로 찾으라고 알린다.
  // 이 구역에 찾을 대상이 있을 때만(왼쪽 판에 「찾을 천체」가 떠 있을 때만) 띄운다.
  showSoloHint() {
    if (!this.soloHint || !this.targetPanel.currentId) return;
    this.soloHint = false;
    showToast(this, TUTORIAL_TEXT.solo, { ms: SOLO_HINT_MS });
  }

  // ── 첫 탐사 안내: 새 판에서 첫 카드를 얻을 때까지 화살표, 얼룩을 두르는 원, 누를 버튼 표시로 한 단계씩 이끈다.
  // 단계는 logic/tutorial.js가 정하고, 여기서는 그리기만 한다. 안내하는 동안 밤 시계는 가지 않는다(tickClock).
  buildTutorial(state) {
    const request = this.registry.get('request') ?? null;
    this.tutorial = !this.bonus && tutorialOn(state) && !!request;
    if (!this.tutorial) return;
    this.tutTarget = tutorialTarget(request, this.zoneId, this.placed, this.found);
    this.tutZoneName = ZONES.find((z) => z.id === request.zoneId)?.nameKo ?? '';
    const pulse = (obj) => {
      this.tweens.add({ targets: obj, alpha: { from: 1, to: 0.3 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return obj;
    };
    this.tutParts = [];
    this.tutMark = null;
    this.tutLabel = null;
    if (this.tutTarget) {
      // 대상 얼룩을 두르는 원: 하늘과 함께 움직인다.
      this.tutMark = this.add.graphics({ x: this.tutTarget.x, y: this.tutTarget.y });
      this.tutMark.lineStyle(5, COLOR.brassLight, 1);
      this.tutMark.strokeCircle(0, 0, MARK_R);
      this.sky.add(pulse(this.tutMark).setVisible(false));
      // "이것이 찾는 천체"라는 글: 얼룩이 시야 가장자리에 있어도 잘리지 않게 시야 안 정해진 자리에 둔다(얼룩이 없는 쪽).
      this.tutLabel = addText(this, CX, CY + MARK_LABEL_DY, TUTORIAL_TEXT.mark, {
        size: MIN_FONT, bold: true, color: COLOR.textBrass, origin: [0.5, 0.5], stroke: 6,
      }).setVisible(false);
      this.tutParts.push(this.tutMark);
    }
    // 누를 버튼을 두르는 표시: 확대·촬영(같은 자리의 둥근 버튼), 지도로(임무 구역이 아닐 때)
    this.tutPulse = this.add.graphics({ x: RIGHT_X, y: 538 });
    this.tutPulse.lineStyle(6, COLOR.brassLight, 1);
    this.tutPulse.strokeCircle(0, 0, 80);
    this.tutBack = this.add.graphics({ x: SIDE_X, y: 62 });
    this.tutBack.lineStyle(6, COLOR.brassLight, 1);
    this.tutBack.strokeRoundedRect(-108, -52, 216, 104, 22);
    this.tutParts.push(pulse(this.tutPulse).setVisible(false), pulse(this.tutBack).setVisible(false));
  }

  // 훑기 중 안내: 단계에 맞는 글과 표시. 화살표(nudge)는 기다리지 않고 처음부터 대상을 가리킨다.
  updateTutorial(lock) {
    const t = this.tutTarget;
    const seen = !!t && this.visibleIds.includes(t.id);
    const step = tutorialStep({ mode: 'sweep', hasTarget: !!t, speed: this.speed, locked: !!lock, targetVisible: seen });
    this.tutMark?.setVisible(seen);
    // 얼룩이 시야 아래쪽에 있으면 글은 위에, 아니면 아래에
    this.tutLabel?.setVisible(seen).setY(t.y - this.view.y > 40 ? CY - MARK_LABEL_DY : CY + MARK_LABEL_DY);
    const dir = t && !lock && !seen ? nudgeDirection(this.view, [t], NO_IDS) : null;
    this.nudge.setVisible(!!dir && (dir.dx !== 0 || dir.dy !== 0));
    if (dir) this.nudge.setRotation(Math.atan2(dir.dy, dir.dx));
    this.tutPulse.setVisible(step === 'zoom');
    this.tutBack.setVisible(step === 'elsewhere');
    this.status.setText(step === 'elsewhere' ? TUTORIAL_TEXT.elsewhere(this.tutZoneName) : TUTORIAL_TEXT[step]);
  }

  // 첫 카드를 얻으면 안내를 걷는다.
  endTutorial() {
    if (!this.tutorial) return;
    this.tutorial = false;
    for (const part of this.tutParts) this.tweens.killTweensOf(part);
    this.tutMark?.destroy();
    this.tutLabel?.destroy();
    this.tutPulse.destroy();
    this.tutBack.destroy();
    this.tutParts = [];
    this.tutMark = null;
    this.tutLabel = null;
  }

  // ── 구역 하늘: 시드 난수로 찍은 별 + 별자리(선, 밝은 별, 길잡이 이름표) + 천체 자리의 흐린 얼룩
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
    addChartSky(this, this.sky, this.zoneId);

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
    this.frame = this.add.image(CX, CY, 'eyepiece-frame').setOrigin(HOLE.cx / HOLE.size, HOLE.cy / HOLE.size).setScale(FRAME_SCALE);
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
    this.targetPanel = makeTargetPanel(this, SIDE_X, 244, 224);

    addPlate(this, CX - 330, 14, 660, 64, 0.85);
    this.status = addText(this, CX, 46, SCAN_TEXT.start, { size: 26, bold: true, origin: [0.5, 0.5] });

    this.miniMap = makeMiniMap(this, RIGHT_X, 92, 200, this.placed, this.zoneId);
    this.nightBar = makeNightBar(this, RIGHT_X, 234, 212);
    this.zoomBtn = makeButton(this, RIGHT_X, 560, {
      w: 200, h: 180, label: SCAN_TEXT.zoom, icon: 'icon-zoom', iconSize: 110, size: 28,
      onTap: () => this.enterFocus(),
    }).setEnabled(false);
    this.cancelBtn = makeButton(this, RIGHT_X, 380, { w: 200, h: 96, label: SCAN_TEXT.cancel, onTap: () => this.leaveFocus() });
    this.cancelBtn.container.setVisible(false);
    // 촬영 버튼: 확대 버튼 자리(오른손 엄지가 닿는 곳). 눈금이 혼자 오가는 동안 사진이 또렷해지는 순간에 누른다.
    this.shutterBtn = makeButton(this, RIGHT_X, 560, {
      w: 200, h: 180, label: NIGHT_TEXT.shutter, icon: 'icon-shutter', iconSize: 124, size: 28, onTap: () => this.shoot(),
    });
    this.shutterBtn.container.setVisible(false);

    this.gauge = makeFocusGauge(this, CX, 670, 480);
    this.gauge.container.setVisible(false);
  }

  // 왼쪽 판: 구역 안 찾은 수, 전체 수집 수, 지금 찾을 임무 대상과 단서
  refreshPanel() {
    const mine = this.placed.filter((p) => this.found.has(p.id)).length;
    this.zoneCountText.setText(SCAN_TEXT.zoneCount(mine, this.placed.length));
    if (this.bonus) {
      const { found, total } = bonusProgress({ foundIds: [...this.found] }, OBJECTS);
      this.totalText.setText(BONUS_TEXT.count(found, total));
    } else {
      this.totalText.setText(MAP_TEXT.count(this.found.size, DECK_SIZE));
    }

    const request = refreshRequest(this);
    if (request && request.zoneId !== this.zoneId && remainingTargets(request, this.found, this.pool).length > 0) {
      const zoneName = ZONES.find((z) => z.id === request.zoneId).nameKo;
      this.targetPanel.note(SCAN_TEXT.requestElsewhere(zoneName));
      return;
    }
    this.targetPanel.set(panelTargets(request, this.zoneId, this.found, this.clues), request?.kind ?? null);
  }

  // 끌기를 놓는다. 세로로 돌려 게임이 멈출 때(game pause), 창 전환(blur, hidden),
  // 손가락이 화면 밖으로 나갈 때, 해가 뜨고 질 때 부른다. 멈춘 동안의 손가락은 다시 움직여도 끌기로 이어지지 않는다.
  stopDrag() {
    this.drag.cancel();
    this.meter.reset(performance.now());
    this.speed = 0;
  }

  // ── 입력: 한 손가락 끌기. 두 번째 손가락, 화면 밖, 창 전환이면 끌기를 끝내고 속도 0.
  bindInput() {
    const now = () => performance.now();
    const stop = () => this.stopDrag();
    // 게임이 멈추거나 창을 떠나면 밤 시계를 곧바로 저장한다(평소에는 NIGHT_SAVE_MS마다).
    const halt = () => {
      stop();
      persist(this);
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
    const gameEvents = [['pause', halt], ['blur', halt], ['hidden', halt]];
    for (const [ev, fn] of gameEvents) this.game.events.on(ev, fn);
    const leave = () => persist(this); // 새로 고침, 탭 닫기
    window.addEventListener('pagehide', leave);
    this.events.once('shutdown', () => {
      for (const [ev, fn] of gameEvents) this.game.events.off(ev, fn);
      window.removeEventListener('pagehide', leave);
      persist(this);
    });
  }

  update(_time, delta) {
    this.tickClock(delta);
    if (this.mode === 'sweep') this.updateSweep(delta);
    else if (this.mode === 'focus') this.updateFocus(delta);
  }

  // ── 밤 시계: 모으기 중 훑기·초점 상태에서만 간다(카드 화면, 낮, 보너스 관측, 게임이 멈춘 동안은 update가 오지 않거나 건너뛴다).
  // 임무 구역이 아니어도 간다(어느 구역을 보든 밤은 지나간다). 매 프레임 registry에 두고 NIGHT_SAVE_MS마다 기기에 저장한다.
  tickClock(delta) {
    const state = getState(this);
    const gate = { phase: state.phase, bonus: this.bonus, mode: this.mode, hasMission: !!state.mission, dayWait: this.dayWait, guided: this.tutorial };
    if (!clockRuns(gate)) return;
    const next = stash(this, tickNight(state, delta));
    this.sinceSave += delta;
    if (this.sinceSave >= NIGHT_SAVE_MS) {
      this.sinceSave = 0;
      persist(this);
    }
    this.showNight();
    // 초점을 맞추는 중에 시간이 다 되면 촬영하거나 그만둘 때까지 기다렸다가 훑기로 돌아오면 해가 뜬다.
    if (this.mode === 'sweep' && isDawn(next)) this.startDay();
  }

  // 시간 막대. 밤 길이(분모)는 임무·찾은 것·밤이 바뀔 때만(recount) 다시 센다. 막대는 보이는 값이 바뀔 때만 다시 그린다.
  showNight(recount = false) {
    const state = getState(this);
    const on = !this.bonus && !!state.mission;
    if (this.nightBar.container.visible !== on) this.nightBar.container.setVisible(on);
    if (!on) return;
    if (recount || this.nightTotalMs === undefined) this.nightTotalMs = nightTotal(state, this.found);
    this.nightBar.set(state.nightLeftMs, this.nightTotalMs, state.night);
  }

  // 낮 동안 숨기는 버튼(요원 말풍선 아래로 비치지 않게, 누를 것이 없게): 지도로, 확대, 왼쪽 판의 다음.
  hideForDay(hidden) {
    this.backBtn.container.setVisible(!hidden);
    this.zoomBtn.container.setVisible(!hidden);
    this.targetPanel.holdNav(hidden);
  }

  // ── 해돋이: 해가 뜬 순간(남은 밤 0)을 저장하고 낮 기다림. 새로 고침하면 불러올 때 resumeNight가 다음 밤으로 넘긴다.
  startDay() {
    this.mode = 'day';
    this.dayWait = true;
    this.stopDrag();
    persist(this);
    this.sinceSave = 0;
    this.backBtn.setEnabled(false);
    this.zoomBtn.setEnabled(false);
    this.hideForDay(true);
    this.nudge.setVisible(false);
    if (this.blurFx) this.blurFx.active = false;
    this.status.setText('');
    runDayWait(this, {
      cardIds: this.tonightIds,
      hole: { x: CX, y: CY, r: VIEW_RADIUS },
      fade: [this.sky, this.reticle],
      below: this.frame,
      onDone: () => this.endDayWait(),
    });
  }

  endDayWait() {
    commit(this, endDay(getState(this), this.found));
    this.tonightIds = [];
    this.stopDrag();
    this.mode = 'sweep';
    this.dayWait = false;
    this.backBtn.setEnabled(true);
    this.hideForDay(false);
    this.lockId = undefined; // 다음 프레임에 확대 버튼과 조준 원을 다시 그린다
    this.showNight(true);
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

    this.miniMap.update(this.view, this.found);
    if (this.tutorial) {
      this.updateTutorial(lock);
      return;
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
  }

  enterFocus() {
    if (this.mode !== 'sweep' || !this.lockId) return;
    this.mode = 'focus';
    this.stopDrag();
    this.focusId = this.lockId;
    this.focusTargetValue = focusTarget(getState(this).seed, this.focusId);
    this.focusMs = 0;
    this.shotHold = false;
    this.sky.setVisible(false);
    this.reticle.setVisible(false);
    this.nudge.setVisible(false);
    this.showFocusPhoto(this.focusId);
    this.gauge.setValue(0);
    this.gauge.container.setVisible(true);
    this.zoomBtn.container.setVisible(false);
    this.cancelBtn.container.setVisible(true);
    this.shutterBtn.container.setVisible(true);
    this.shutterBtn.setEnabled(true);
    this.status.setText(SCAN_TEXT.focusGuide);
    if (this.tutorial) { // 첫 탐사 안내: 이제 누를 것은 촬영(확대와 같은 자리)
      this.tutPulse.setVisible(true);
      this.tutBack.setVisible(false);
      this.tutLabel?.setVisible(false);
    }
  }

  leaveFocus() {
    this.mode = 'sweep';
    this.retryTimer?.remove();
    this.shotHold = false;
    this.gauge.container.setVisible(false);
    this.focusLayer.setVisible(false);
    this.sky.setVisible(true);
    this.reticle.setVisible(true);
    this.cancelBtn.container.setVisible(false);
    this.shutterBtn.container.setVisible(false);
    this.zoomBtn.container.setVisible(true);
    this.backBtn.setEnabled(true);
    this.lockId = undefined; // 다음 프레임에 버튼과 조준 원을 다시 그린다
    this.showSoloHint(); // 첫 카드를 얻고 「계속 훑기」로 돌아온 때
  }

  // 초점 눈금은 혼자 오간다. 사진은 눈금이 숨은 목표에 가까울수록 또렷해진다.
  updateFocus(delta) {
    if (this.shotHold) return; // 촬영 실패 글을 보여 주는 동안 눈금은 멈춰 있다
    this.focusMs += delta;
    this.gauge.setValue(gaugeValue(this.focusMs));
    this.sharp.setAlpha((1 - focusBlur(this.gauge.value, this.focusTargetValue)) ** 2);
  }

  // 촬영: 누른 순간의 초점 오차로 별점을 매긴다. 너무 어긋났으면 찍히지 않고, 잠깐 뒤 눈금이 다시 움직인다.
  shoot() {
    if (this.mode !== 'focus' || this.shotHold) return;
    const stars = shotStars(focusError(this.gauge.value, this.focusTargetValue));
    if (stars > 0) {
      this.cameras.main.flash(160, 255, 255, 255);
      this.capture(this.focusId, { stars });
      return;
    }
    this.shotHold = true;
    this.shutterBtn.setEnabled(false);
    this.status.setText(SCAN_TEXT.retry);
    this.tweens.add({ targets: this.focusLayer, x: { from: CX - 10, to: CX + 10 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => this.focusLayer.setX(CX) });
    this.retryTimer = this.time.delayedCall(SHOT_RETRY_MS, () => {
      this.shotHold = false;
      if (this.mode !== 'focus') return;
      this.shutterBtn.setEnabled(true);
      this.status.setText(SCAN_TEXT.focusGuide);
    });
  }

  // ── 카드 얻기: 찾은 목록·별점·임무 완료를 한 번에 저장하고 "미확인 천체" 카드를 보여 준다
  capture(id, rating) {
    this.mode = 'card';
    this.endTutorial();
    // 카드가 뜰 때까지(0.65초) 「지도로」를 끈다. 카드 화면의 버튼으로만 나간다.
    this.backBtn.setEnabled(false);
    const result = recordCapture(getState(this), { id, stars: rating.stars, bonus: this.bonus, deckIds: DECK_IDS });
    commit(this, result.state);
    this.soloHint = !this.bonus && soloHintOn(result.state); // 첫 카드였다면 다음 훑기에서 알린다
    this.sinceSave = 0;
    this.found = new Set(result.state.foundIds);
    this.tonightIds.push(id);

    this.gauge.container.setVisible(false);
    this.cancelBtn.container.setVisible(false);
    this.shutterBtn.container.setVisible(false);
    this.status.setText(SCAN_TEXT.got);
    this.idleMs = 0;
    this.refreshPanel(); // 임무를 마쳤으면 여기서 다음 임무가 정해진다(완료는 위에서 이미 반영해 두 번 세지 않는다)
    this.showNight(true);
    this.tweens.add({ targets: this.sharp, alpha: 1, duration: 250 });
    this.time.delayedCall(650, () => this.showCard(id, rating, result));
  }

  showCard(id, rating, { done, early, complete }) {
    this.status.setText('');
    const toMap = () => this.scene.start(SCENES.SKY_MAP);
    const count = this.bonus ? bonusProgress({ foundIds: [...this.found] }, OBJECTS) : { found: this.found.size, total: DECK_SIZE };
    const layer = showCaptureCard(this, {
      id, bonus: this.bonus, zoneName: this.zone.nameKo, count, rating,
      mission: done ? { early } : null, complete, zoneDone: this.placed.every((p) => this.found.has(p.id)),
      onNext: () => { layer.destroy(); this.leaveFocus(); },
      onMap: toMap,
      onNextMission: toMap,
      onSort: () => this.scene.start(SCENES.SORT),
    });
  }
}
