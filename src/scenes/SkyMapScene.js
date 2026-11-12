import Phaser from 'phaser';
import { GAME_WIDTH, SCENES } from '../config/game.js';
import { ZONES } from '../data/zones.js';
import { OBJECTS } from '../data/objects.js';
import { MAP_TEXT, SCAN_TEXT, BONUS_TEXT } from '../data/copy.js';
import { mapZoneIds } from '../logic/layout.js';
import { miniFigure } from '../logic/chart.js';
import { openZones } from '../logic/requests.js';
import { inBonus, bonusProgress } from '../logic/bonus.js';
import { DECK, DECK_SIZE, getState, refreshRequest, skyMapRedirect } from './gameState.js';
import { addText, addPlate, COLOR, MIN_FONT } from './ui/style.js';
import { onPress, MIN_TOUCH, makeButton } from './ui/button.js';
import { remainingTargets, plainLooks, addRequestThumbs, termRequestText } from './ui/request.js';
import { ensureBonusPhotos } from './ui/bonusPhotos.js';
import { addAttribution } from './ui/attribution.js';
import { addBackdrop } from './ui/backdrop.js';
import { showToast } from './ui/toast.js';

const HEADER_H = 106;
const LABEL_DY = 60; // 표시 가운데에서 이름표 가운데까지(터치 대상 아래 4px 띄우고 24px 높이)
const FIGURE_R = 44; // 작은 별자리 그림의 반지름: 88×88 터치 대상 안에 들어오고 이름표에 닿지 않는다

export default class SkyMapScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SKY_MAP);
  }

  create() {
    // 모으기와 보너스 관측이 아니면(20장째를 얻자마자 「지도로」를 누른 경우 등) 그 단계의 장면으로 간다.
    const redirect = skyMapRedirect(getState(this));
    if (redirect) {
      this.scene.start(redirect);
      return;
    }
    this.bonus = inBonus(getState(this));
    this.toastObj = null; // 앞 방문의 알림(이미 지워졌다)을 잊는다
    addBackdrop(this, 0x5c6684); // 별자리 선과 이름표가 배경 그림보다 앞에 보이게 어둡게
    // 오른쪽 아래, 에리다누스자리 이름표와 용골자리·큰부리새자리 사이의 빈 곳
    addAttribution(this, GAME_WIDTH - 12, 492, { origin: [1, 0], wrap: 360, align: 'right' });
    if (!this.bonus) {
      this.build();
      return;
    }
    // 보너스 사진을 불러오는 중이거나 실패해도 결과 화면으로 돌아갈 수 있게 버튼을 먼저 놓는다.
    makeButton(this, 460, 652, { w: 280, h: 88, label: BONUS_TEXT.back, size: 28, onTap: () => this.scene.start(SCENES.RESULT) }).container.setDepth(10);
    ensureBonusPhotos(this, () => this.build());
  }

  build() {
    const state = getState(this);
    const found = new Set(state.foundIds);
    const open = new Set(openZones(found.size, ZONES));
    // 보너스 관측: 보너스 천체만 있는 구역까지 모두 보이고, 아직 못 찾은 천체가 있는 구역이 열려 있다.
    const pool = this.bonus ? OBJECTS : DECK;
    const shownIds = mapZoneIds(pool, ZONES);
    const request = refreshRequest(this);

    this.drawHeader(request, found);

    const g = this.add.graphics();
    for (const id of shownIds) {
      const zone = ZONES.find((z) => z.id === id);
      const left = pool.filter((o) => o.zone === id && !found.has(o.id)).length;
      const status = !this.bonus && !open.has(id) ? 'locked' : left === 0 ? 'done' : 'open';
      this.drawZone(g, zone, status, request?.zoneId === id);
    }

    if (this.bonus) return; // 「결과 화면으로」 버튼은 create()에서 이미 놓았다
    // 8장째에 새 구역이 열렸으면 한 번 알린다.
    const openShown = shownIds.filter((id) => open.has(id)).length;
    const seen = this.registry.get('seenOpenCount');
    if (seen !== undefined && openShown > seen) showToast(this, MAP_TEXT.unlocked, { ms: 1800 });
    this.registry.set('seenOpenCount', openShown);
  }

  drawBonusHeader(request, found) {
    const { found: n, total } = bonusProgress({ foundIds: [...found] }, OBJECTS);
    addText(this, GAME_WIDTH - 28, HEADER_H / 2, BONUS_TEXT.count(n, total), { size: 30, bold: true, color: COLOR.textBrass, origin: [1, 0.5] });
    const x = 122;
    if (!request) {
      addText(this, x, HEADER_H / 2, BONUS_TEXT.allDone, { size: 26, wrap: 760, origin: [0, 0.5] });
      return;
    }
    addText(this, x, 20, termRequestText(request, OBJECTS), { size: 30, bold: true });
    addText(this, x, 60, BONUS_TEXT.zoneHint(ZONES.find((z) => z.id === request.zoneId).nameKo), { size: 26, color: COLOR.textBrass });
  }

  drawHeader(request, found) {
    addPlate(this, 8, 6, GAME_WIDTH - 16, HEADER_H - 10, 0.82);
    const agent = this.add.image(62, HEADER_H / 2, 'agent-hq');
    agent.setScale(92 / agent.width);
    if (this.bonus) {
      this.drawBonusHeader(request, found);
      return;
    }
    addText(this, GAME_WIDTH - 28, HEADER_H / 2, MAP_TEXT.count(found.size, DECK_SIZE), { size: 30, bold: true, color: COLOR.textBrass, origin: [1, 0.5] });

    const targets = remainingTargets(request, found, DECK);
    const x = 122;
    if (!request || targets.length === 0) {
      addText(this, x, HEADER_H / 2, MAP_TEXT.free, { size: 28, origin: [0, 0.5] });
      return;
    }
    const zoneName = ZONES.find((z) => z.id === request.zoneId).nameKo;
    if (request.kind === 'picture') {
      addText(this, x, HEADER_H / 2, MAP_TEXT.picture(zoneName, targets.length), { size: 26, wrap: 560, origin: [0, 0.5] });
      addRequestThumbs(this, 700, (HEADER_H - 84) / 2, targets, 84, 12);
    } else {
      addText(this, x, 20, MAP_TEXT.plain(zoneName, targets.length), { size: 26, bold: true });
      addText(this, x, 56, plainLooks(targets), { size: 24, color: COLOR.textBrass, wrap: 900 });
    }
  }

  drawZone(g, zone, status, requested) {
    const { mapX: x, mapY: y } = zone;
    const on = status === 'open';
    const lineColor = on ? COLOR.brassLight : 0x8090b0;
    const alpha = on ? 0.95 : status === 'done' ? 0.5 : 0.28;
    const { stars, segs } = miniFigure(zone.id, FIGURE_R);
    g.lineStyle(on ? 2.5 : 2, lineColor, alpha * 0.8);
    for (const [i, j] of segs) g.lineBetween(x + stars[i][0], y + stars[i][1], x + stars[j][0], y + stars[j][1]);
    g.fillStyle(0xffffff, alpha);
    for (const [dx, dy] of stars) g.fillCircle(x + dx, y + dy, on ? 4 : 3);

    const name = status === 'done' ? `${zone.nameKo} ✓` : zone.nameKo;
    addText(this, x, y + LABEL_DY, name, {
      size: MIN_FONT, bold: on, color: on ? COLOR.text : COLOR.textDim, origin: [0.5, 0.5], stroke: 5,
    }).setAlpha(status === 'locked' ? 0.75 : 1);

    if (requested) {
      const ring = this.add.graphics({ x, y });
      ring.lineStyle(4, COLOR.brass, 1);
      ring.strokeCircle(0, 0, 46);
      this.tweens.add({ targets: ring, scale: 1.25, alpha: 0.25, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    const hit = this.add.zone(x, y, MIN_TOUCH, MIN_TOUCH).setInteractive({ useHandCursor: on });
    onPress(this, hit, () => {
      if (status === 'open') this.scene.start(SCENES.SCAN, { zoneId: zone.id });
      else showToast(this, status === 'done' ? SCAN_TEXT.zoneDone : MAP_TEXT.lockedTap, { ms: 1800 });
    });
  }
}
