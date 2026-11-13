import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/game.js';
import { STAGES } from '../logic/sorting.js';
import { beginSort, stageCards, foundCards, validPlacements, placeCard, submitSort, hintLevel, shuffledIds, safeCount, pickHighlights } from '../logic/sortFlow.js';
import { binCell, rowSlotX, clampScroll, dropTarget, rectContains } from '../logic/sortLayout.js';
import { createDrag, gestureKind } from '../logic/drag.js';
import { BIN_LABELS, HINTS, SORT_TEXT, SORT_STAGE_TEXT } from '../data/copy.js';
import { DECK, getState, commit, sceneForPhase } from './gameState.js';
import { addBackdrop } from './ui/backdrop.js';
import { addPlate } from './ui/style.js';
import { makeButton } from './ui/button.js';
import { makeCard, setCardGlow } from './ui/card.js';
import { makeBin, makeHintBubble, openCardZoom, showStoryPanel } from './ui/sortViews.js';
import { showToast } from './ui/toast.js';

// 화면 배치(설계 해상도). 위: 요원 말풍선과 판정 버튼, 가운데: 묶음 칸 2개, 아래: 옆으로 넘기는 카드 줄.
const BIN_TOP = 108;
const BIN_H = 448;
const BIN_W = 628;
const BIN_XS = [8, 644];
const ROW_TOP = 562;
const ROW_Y = 641;
const ROW_CARD_H = 140; // 카드 너비 93(88 이상)
const ROW = { left: 8, width: GAME_WIDTH - 16, spacing: 104 };
const THUMB_SCALE = 84 / ROW_CARD_H; // 묶음 칸 안 작은 카드(높이 84)
const LIFT_SCALE = 0.85;
const LIFT_DY = -24; // 들어 올린 카드가 손가락에 가리지 않게 조금 위에

export default class SortScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SORT);
  }

  create(data = {}) {
    if (getState(this).phase !== 'sort') {
      this.scene.start(sceneForPhase(getState(this).phase));
      return;
    }
    // 저장된 놓기 값은 검사되지 않았다: 지금 단계 카드와 묶음이 아닌 것은 버린다.
    let state = beginSort(getState(this));
    state = commit(this, { ...state, placements: validPlacements(state, DECK) });

    this.stage = state.stage;
    this.cards = stageCards(this.stage, foundCards(state, DECK));
    this.rowOrder = shuffledIds(state.seed, this.stage, this.cards.map((o) => o.id));
    this.scroll = 0;
    this.press = null;
    this.busy = false;
    this.glowIds = new Set();
    this.toastObj = null;
    this.drag = createDrag();

    addBackdrop(this, 0x6a7390);
    addPlate(this, 4, ROW_TOP, GAME_WIDTH - 8, GAME_HEIGHT - ROW_TOP - 4, 0.55);
    this.bins = STAGES[this.stage].bins.map((name, i) => makeBin(this, BIN_XS[i], BIN_TOP, BIN_W, BIN_H, name, BIN_LABELS[name]));
    this.bubble = makeHintBubble(this);
    this.judgeBtn = makeButton(this, 1141, 54, { w: 250, h: 92, label: SORT_TEXT.judge, size: 34, onTap: () => this.onJudge() });
    this.views = new Map(this.cards.map((o) => [o.id, makeCard(this, GAME_WIDTH / 2, ROW_Y, { id: o.id, height: ROW_CARD_H }).setDepth(1)]));

    this.sayCurrent();
    this.layout(false);
    this.bindInput();

    // 1차를 통과하면 성운·성단 이름을 알려 준다(새로 고침으로 놓친 경우에도 2차를 시작하기 전이면 다시).
    const freshNebula = this.stage === 'nebula' && Object.keys(state.placements).length === 0 && safeCount(state.wrongSubmits.nebula) === 0;
    if (data.reveal || freshNebula) {
      this.busy = true;
      showStoryPanel(this, SORT_STAGE_TEXT.nebula.reveal, SORT_STAGE_TEXT.nebula.revealNext, () => { this.busy = false; });
    }
  }

  // 말풍선: 힌트를 받은 단계면 그 힌트, 아니면 단계 안내.
  sayCurrent() {
    const level = hintLevel(getState(this));
    if (level > 0) this.bubble.say(HINTS[this.stage][level - 1], { hint: true });
    else this.bubble.say(SORT_STAGE_TEXT[this.stage].intro);
  }

  // ── 카드 자리: 묶음 칸 안은 놓은 순서대로 작은 카드, 나머지는 아래 줄
  layout(animate) {
    const placements = getState(this).placements;
    this.homes = new Map();
    for (const bin of this.bins) {
      const ids = Object.keys(placements).filter((id) => placements[id] === bin.name);
      bin.setCount(ids.length);
      ids.forEach((id, i) => {
        const c = binCell(i, ids.length, bin.inner);
        this.homes.set(id, { x: c.x, y: c.y, scale: THUMB_SCALE, where: 'bin', rect: { x: c.x - c.w / 2, y: c.y - c.h / 2, w: c.w, h: c.h } });
      });
    }
    const row = this.rowOrder.filter((id) => !placements[id]);
    this.rowCount = row.length;
    this.scroll = clampScroll(this.scroll, row.length, ROW);
    row.forEach((id, i) => {
      const x = rowSlotX(i, row.length, this.scroll, ROW);
      this.homes.set(id, { x, y: ROW_Y, scale: 1, where: 'row', rect: { x: x - ROW.spacing / 2, y: ROW_TOP, w: ROW.spacing, h: GAME_HEIGHT - ROW_TOP } });
    });

    for (const [id, view] of this.views) {
      if (this.press?.mode === 'lift' && this.press.id === id) continue;
      const h = this.homes.get(id);
      this.tweens.killTweensOf(view);
      view.setDepth(1);
      if (animate) this.tweens.add({ targets: view, x: h.x, y: h.y, scale: h.scale, duration: 200, ease: 'Cubic.out' });
      else view.setPosition(h.x, h.y).setScale(h.scale);
    }
  }

  cardAt(x, y) {
    if (x < 0 || x > GAME_WIDTH) return null;
    for (const [id, h] of this.homes) if (rectContains(h.rect, x, y)) return id;
    return null;
  }

  refreshGlows() {
    for (const [id, view] of this.views) setCardGlow(this, view, this.glowIds.has(id));
  }

  // ── 입력: 한 손가락. 줄의 카드는 세로로 끌면 들고 가로로 끌면 줄을 넘긴다. 묶음 칸의 카드는 끌면 든다. 누르면 크게 본다.
  bindInput() {
    const downCount = () => this.input.manager.pointers.filter((q) => q.isDown).length;
    this.input.on('pointerdown', (p, over) => {
      if (this.busy) return;
      const n = downCount();
      if (n > 1) {
        // 두 번째 손가락: 들던 카드는 제자리로, 손을 다 뗄 때까지 끌기 안 함
        this.cancelPress();
        this.drag.down(p.id, p.x, p.y, n);
        return;
      }
      if (over.length > 0) return; // 버튼
      const id = this.cardAt(p.x, p.y);
      if (!id && p.y < ROW_TOP) return;
      this.drag.down(p.id, p.x, p.y, 1);
      this.press = { pid: p.id, id, from: id ? this.homes.get(id).where : 'row', x0: p.x, y0: p.y, mode: 'pending', scroll0: this.scroll };
    });
    this.input.on('pointermove', (p) => {
      const pr = this.press;
      if (!pr || !this.drag.move(p.id, p.x, p.y)) return;
      const dx = p.x - pr.x0;
      const dy = p.y - pr.y0;
      if (pr.mode === 'pending') {
        const kind = gestureKind(dx, dy, { canLift: !!pr.id, canScroll: pr.from === 'row' });
        if (kind === 'lift') this.lift(pr);
        else if (kind === 'scroll') pr.mode = 'scroll';
      }
      if (pr.mode === 'lift') this.moveLifted(p.x, p.y);
      else if (pr.mode === 'scroll') {
        this.scroll = clampScroll(pr.scroll0 - dx, this.rowCount, ROW);
        this.layout(false);
      }
    });
    this.input.on('pointerup', (p) => {
      const pr = this.press;
      this.drag.up(p.id);
      if (!pr || pr.pid !== p.id) return;
      this.press = null;
      if (pr.mode === 'pending' && pr.id) this.openZoom(pr.id);
      else if (pr.mode === 'lift') this.drop(pr.id, p.x, p.y);
    });
    this.input.on('wheel', (_p, _o, dx, dy) => {
      if (this.busy || this.press) return;
      this.scroll = clampScroll(this.scroll + (dy || dx), this.rowCount, ROW);
      this.layout(false);
    });
    // 손가락이 화면 밖으로 나감, 화면 밖에서 뗌, 세로로 돌려 멈춤(game pause), 창 전환: 들던 카드는 제자리로.
    const cancel = () => this.cancelPress();
    this.input.on('pointerupoutside', cancel);
    this.input.on('gameout', cancel);
    const gameEvents = ['pause', 'blur', 'hidden'];
    for (const ev of gameEvents) this.game.events.on(ev, cancel);
    this.events.once('shutdown', () => {
      for (const ev of gameEvents) this.game.events.off(ev, cancel);
    });
  }

  lift(pr) {
    pr.mode = 'lift';
    const view = this.views.get(pr.id);
    this.tweens.killTweensOf(view);
    view.setDepth(50).setScale(LIFT_SCALE);
  }

  moveLifted(x, y) {
    this.views.get(this.press.id).setPosition(x, y + LIFT_DY);
    const target = dropTarget(x, y, this.bins.map((b) => ({ ...b.rect, name: b.name })), ROW_TOP);
    for (const b of this.bins) b.setHover(b.name === target);
  }

  cancelPress() {
    const pr = this.press;
    this.press = null;
    this.drag.cancel();
    if (pr?.mode === 'lift') {
      for (const b of this.bins) b.setHover(false);
      this.layout(true);
    }
  }

  drop(id, x, y) {
    for (const b of this.bins) b.setHover(false);
    const target = dropTarget(x, y, this.bins.map((b) => ({ ...b.rect, name: b.name })), ROW_TOP);
    const now = getState(this).placements[id] ?? null;
    if (target === 'row' && now) this.applyPlace(id, null);
    else if (target && target !== 'row' && target !== now) this.applyPlace(id, target);
    else this.layout(true);
  }

  applyPlace(id, bin) {
    commit(this, placeCard(getState(this), id, bin, DECK));
    this.glowIds.delete(id); // 옮긴 카드는 더 짚지 않는다
    this.layout(true);
    this.refreshGlows();
  }

  openZoom(id) {
    this.busy = true;
    const now = getState(this).placements[id] ?? null;
    const actions = STAGES[this.stage].bins
      .filter((b) => b !== now)
      .map((b) => ({ label: SORT_TEXT.putIn(BIN_LABELS[b]), onTap: () => this.applyPlace(id, b) }));
    if (now) actions.push({ label: SORT_TEXT.takeOut, onTap: () => this.applyPlace(id, null) });
    openCardZoom(this, id, actions, SORT_TEXT.close, () => { this.busy = false; });
  }

  // ── 판정
  onJudge() {
    if (this.busy) return;
    this.cancelPress();
    const r = submitSort(getState(this), DECK);
    commit(this, r.state);
    if (r.outcome === 'incomplete') {
      showToast(this, SORT_TEXT.incomplete);
      return;
    }
    if (r.outcome === 'wrong') {
      // 처음 틀리면 몇 장이 어긋났는지만 말하고 다시 살펴보게 한다. 어느 카드인지(노란 테)는 그다음에도 틀렸을 때부터, 판정 한 번에 몇 장만.
      this.bubble.say(r.hintLevel === 1 ? SORT_TEXT.wrongCount(r.wrongIds.length) : HINTS[this.stage][r.hintLevel - 1], { hint: true });
      this.glowIds = new Set(pickHighlights(r.wrongIds, r.hintLevel, r.state.seed, this.stage, r.state.wrongSubmits[this.stage]));
      this.refreshGlows();
      return;
    }
    this.busy = true;
    this.glowIds = new Set();
    this.refreshGlows();
    this.judgeBtn.setEnabled(false);
    showToast(this, SORT_TEXT.correct, { ms: 700 });
    this.time.delayedCall(1000, () => {
      if (r.state.phase === 'registry') {
        showStoryPanel(this, SORT_STAGE_TEXT.cluster.done, SORT_STAGE_TEXT.cluster.toRegistry, () => this.scene.start(SCENES.REGISTRY));
      } else {
        this.scene.restart({ reveal: r.state.stage === 'nebula' });
      }
    });
  }
}
