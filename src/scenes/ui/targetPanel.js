// 훑기 화면 왼쪽 판: 이 구역에서 지금 찾을 임무 대상 하나의 겉모습과 길잡이 단서.
import { GAME_HEIGHT } from '../../config/game.js';
import { OBJECTS } from '../../data/objects.js';
import { SCAN_TEXT, GUIDE_TEXT, PLAIN_REQUEST, plainLook } from '../../data/copy.js';
import { addText, addPlate, COLOR, MIN_FONT } from './style.js';
import { makeButton } from './button.js';
import { addRequestThumbs, termRequestText } from './request.js';

/**
 * 이 구역에서 지금 찾을 대상: 임무 구역이 이 구역이면 임무 대상 중 남은 것을 임무 순서대로, 단서와 함께.
 * 임무가 없거나 다른 구역의 임무면 빈 배열(길을 잃고 들어온 구역에는 단서를 주지 않는다. 단서는 임무의 일부다).
 */
export function panelTargets(request, zoneId, foundIds, clues) {
  if (!request || request.zoneId !== zoneId) return [];
  return request.targetIds.filter((id) => !foundIds.has(id)).map((id) => ({ id, clue: clues[id] ?? null }));
}

const PAD = 12;        // 판 안쪽 여백
const GAP = 12;        // 줄 묶음 사이
const THUMB_MAX = 96;  // 그림 임무의 흐린 사진 한 변(자리가 모자라면 줄인다. 글자는 줄이지 않는다)
const THUMB_MIN = 56;
const NAV_H = 88;      // 넘김 버튼 높이(터치 최소)
const BOTTOM = GAME_HEIGHT - 8;

/**
 * makeTargetPanel(scene, x, y, width): x는 판 가운데, y는 판 위쪽.
 *   set(targets, kind)  targets: panelTargets의 결과, kind: 임무 종류('picture' | 'plain' | 'term').
 *                       보던 대상이 남아 있으면 그대로, 찾아서 빠졌으면 다음 대상, 새 임무면 첫 대상을 보여 준다.
 *   note(text)          대상 대신 흐린 글 한 줄(예: 의뢰 구역이 다른 곳일 때)
 *   currentId           지금 보여 주는 대상(없으면 null)
 *   container           판 전체(판 그림, 내용, 넘김 줄)
 *   destroy()
 */
export function makeTargetPanel(scene, x, y, width) {
  const wrap = width - 2 * PAD;
  const root = scene.add.container(0, 0);
  let plate = null;
  // 판(나인슬라이스)은 높이가 바뀔 때마다 새로 깐다. h가 0이면 걷기만 한다.
  const setPlate = (h) => {
    plate?.destroy();
    plate = h > 0 ? addPlate(scene, x - width / 2, y, width, h, 0.9) : null;
    if (plate) root.addAt(plate, 0);
  };
  const content = scene.add.container(0, 0);
  const navY = BOTTOM - PAD - NAV_H / 2;
  const btnW = Math.floor(width / 2);
  const counter = addText(scene, x - width / 4, navY, '', { size: MIN_FONT, bold: true, origin: [0.5, 0.5], color: COLOR.textBrass });
  const nextBtn = makeButton(scene, x + width / 2 - PAD - btnW / 2, navY, {
    w: btnW, h: NAV_H, label: SCAN_TEXT.nextTarget, size: 26, onTap: () => show(index + 1),
  });
  const nav = scene.add.container(0, 0, [counter, nextBtn.container]).setVisible(false);
  root.add([content, nav]);

  let targets = [];
  let kind = null;
  let index = 0;

  const text = (cy, str, opts) => addText(scene, x, cy, str, { size: MIN_FONT, wrap, align: 'center', origin: [0.5, 0], ...opts });

  function show(i) {
    content.removeAll(true);
    if (targets.length === 0) {
      api.currentId = null;
      setPlate(0);
      nav.setVisible(false);
      return;
    }
    index = ((i % targets.length) + targets.length) % targets.length;
    const t = targets[index];
    const o = OBJECTS.find((q) => q.id === t.id);
    api.currentId = t.id;

    let cy = y + PAD;
    const header = text(cy, SCAN_TEXT.target, { bold: true, color: COLOR.textBrass });
    content.add(header);
    cy += header.height + GAP;

    const clue = t.clue ? text(0, GUIDE_TEXT(t.clue)) : null;
    const clueH = clue ? clue.height : 0;
    const many = targets.length > 1;
    const limit = many ? navY - NAV_H / 2 - GAP : BOTTOM - PAD;

    if (kind === 'picture') {
      // 남은 자리에 맞춰 사진을 줄인다(단서 글이 길어도 넘김 버튼에 닿지 않게).
      const room = limit - cy - GAP - clueH;
      const size = Math.max(THUMB_MIN, Math.min(THUMB_MAX, Math.floor(room)));
      content.add(addRequestThumbs(scene, x - size / 2, cy, [o], size, 0));
      cy += size + GAP;
    } else {
      const look = text(cy, kind === 'term' ? termRequestText({ targetIds: [t.id] }, OBJECTS) : plainLook(PLAIN_REQUEST[o.type]));
      content.add(look);
      cy += look.height + GAP;
    }
    if (clue) {
      clue.setY(cy);
      content.add(clue);
      cy += clueH;
    }

    // 대상이 하나면 판을 글 길이에 맞추고, 여럿이면 아래쪽 넘김 버튼까지 덮는다.
    setPlate(many ? BOTTOM - y : cy + PAD - y);
    nav.setVisible(many);
    counter.setText(SCAN_TEXT.targetIndex(index + 1, targets.length));
  }

  const api = {
    container: root,
    currentId: null,
    set(next, nextKind) {
      const prevIds = targets.map((t) => t.id);
      const cur = api.currentId;
      const keep = next.findIndex((t) => t.id === cur);
      kind = nextKind;
      targets = next;
      if (keep >= 0) show(keep);
      else if (next.some((t) => prevIds.includes(t.id))) show(index); // 보던 대상을 찾았다: 그 자리의 다음 대상
      else show(0); // 새 임무
    },
    note(str) {
      targets = [];
      show(0);
      content.add(text(y + 20, str, { color: COLOR.textDim }));
    },
    destroy() {
      root.destroy();
    },
  };
  return api;
}
