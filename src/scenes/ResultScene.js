import Phaser from 'phaser';
import { GAME_WIDTH, SCENES } from '../config/game.js';
import { RESULT_TEXT, BONUS_TEXT } from '../data/copy.js';
import { scoreReport } from '../logic/result.js';
import { openBonus } from '../logic/bonus.js';
import { DECK, getState, resetGame, commit, sceneForPhase } from './gameState.js';
import { addBackdrop } from './SkyMapScene.js';
import { addText, addPlate, COLOR } from './ui/style.js';
import { makeButton } from './ui/button.js';

const PANEL = { x: 580, y: 24, w: 684, h: 516 };
const BUTTON_Y = 642;
const CONFIRM_MS = 3000;

// 결과: 총점, 연구원 등급과 배지, 점수 내역. 이 기기에서만 보인다(어디에도 보내지 않는다).
export default class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENES.RESULT);
  }

  create() {
    const state = getState(this);
    if (state.phase !== 'result') {
      this.scene.start(sceneForPhase(state.phase));
      return;
    }
    const r = scoreReport(state, DECK);
    addBackdrop(this, 0x6a7390);
    this.drawRank(r);
    this.drawScore(r);
    this.drawButtons();
  }

  drawRank(r) {
    const badge = this.add.image(290, 260, `rank-badge-${r.rankLevel}`);
    const full = 320 / badge.width;
    badge.setScale(full * 0.2).setAlpha(0);
    this.tweens.add({ targets: badge, scale: full, alpha: 1, duration: 500, ease: 'Back.out' });
    addText(this, 290, 470, r.rank, { size: 46, bold: true, color: COLOR.textBrass, origin: [0.5, 0.5], stroke: 6 });
  }

  drawScore(r) {
    const { x, y, w, h } = PANEL;
    addPlate(this, x, y, w, h, 0.92);
    const cx = x + w / 2;
    addText(this, cx, y + 40, RESULT_TEXT.title, { size: 32, bold: true, origin: [0.5, 0.5] });
    addText(this, cx - 12, y + 108, RESULT_TEXT.total, { size: 32, bold: true, color: COLOR.textDim, origin: [1, 0.5] });
    addText(this, cx + 12, y + 108, RESULT_TEXT.points(r.total), { size: 60, bold: true, color: COLOR.textBrass, origin: [0, 0.5] });

    // 점수 내역: 왼쪽 항목, 오른쪽 점수. 묶기는 아래에 힌트 단계와 틀린 판정 횟수.
    const lx = x + 32;
    const rx = x + w - 32;
    let ly = y + 168;
    const line = (label, pts, detail) => {
      addText(this, lx, ly, label, { size: 26 });
      addText(this, rx, ly, RESULT_TEXT.points(pts), { size: 26, bold: true, origin: [1, 0] });
      ly += 38;
      if (detail) {
        addText(this, lx + 20, ly - 4, detail, { size: 24, color: COLOR.textDim });
        ly += 32;
      }
    };
    line(RESULT_TEXT.found(r.found), r.findPoints);
    for (const s of r.stages) line(RESULT_TEXT.stage[s.stage], s.points, RESULT_TEXT.stageDetail(s.hintLevel, s.wrongSubmits));
    line(RESULT_TEXT.allTypes, r.allTypesPoints);
    line(RESULT_TEXT.full, r.fullPoints);
  }

  drawButtons() {
    let armed = null;
    const restart = makeButton(this, 0, BUTTON_Y, {
      w: 380, h: 96, label: RESULT_TEXT.restart, size: 28,
      onTap: () => {
        if (!armed) {
          // 두 번 눌러야 지운다: 처음 누르면 확인 문구로 바뀌고, 잠시 뒤 되돌아간다.
          restart.setLabel(RESULT_TEXT.restartConfirm);
          armed = this.time.delayedCall(CONFIRM_MS, () => { armed = null; restart.setLabel(RESULT_TEXT.restart); });
          return;
        }
        armed.remove();
        resetGame(this);
        this.scene.start(SCENES.SKY_MAP);
      },
    });
    const credits = makeButton(this, 0, BUTTON_Y, { w: 300, h: 96, label: RESULT_TEXT.credits, size: 28, onTap: () => this.scene.start(SCENES.CREDITS, { from: SCENES.RESULT }) });
    // 보너스 관측: 결과 단계는 그대로 두고 보너스만 연다. 점수는 바뀌지 않는다.
    const bonus = makeButton(this, 0, BUTTON_Y, {
      w: 300, h: 96, label: BONUS_TEXT.open, size: 28,
      onTap: () => {
        commit(this, openBonus(getState(this)));
        this.scene.start(SCENES.SKY_MAP);
      },
    });
    // 아래 버튼 줄. 목록에 버튼을 더하면 고르게 다시 놓인다.
    const row = [bonus, credits, restart];
    row.forEach((b, i) => b.container.setX((GAME_WIDTH * (i + 0.5)) / row.length));
  }
}
