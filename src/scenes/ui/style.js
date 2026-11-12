// 여러 장면이 함께 쓰는 글꼴, 색, 글 상자.
export const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

// 학생에게 보이는 글의 가장 작은 크기(설계 px). 스마트폰 가로(844×390)에서 약 13 CSS px.
export const MIN_FONT = 24;

export const COLOR = {
  navy: 0x0b1428,
  navyLight: 0x16233f,
  brass: 0xc9a45c,
  brassLight: 0xe8cf8f,
  text: '#ffffff',
  textDim: '#9aa7c2',
  textBrass: '#e8cf8f',
};

// 높은 화소 밀도 화면에서도 글자가 번지지 않게 해상도 2로 그린다.
export function addText(scene, x, y, str, { size = MIN_FONT, color = COLOR.text, bold = false, wrap = 0, align = 'left', origin = [0, 0], stroke = 0 } = {}) {
  const style = {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: bold ? 'bold' : 'normal',
    color,
    align,
    resolution: 2,
  };
  if (wrap) style.wordWrap = { width: wrap, useAdvancedWrap: true };
  if (stroke) Object.assign(style, { stroke: '#05070f', strokeThickness: stroke }); // 그림 위에서도 읽히게 테두리
  return scene.add.text(x, y, str, style).setOrigin(origin[0], origin[1]);
}

// 게임 그림 판(public/art)을 원하는 크기로 늘린다. 모서리는 그대로 두고 가운데만 늘리는 나인슬라이스를 쓰고,
// 나인슬라이스가 없는 캔버스 그리기에서는 통째로 늘린다. 모서리가 판보다 크면 판 전체를 줄여서 맞춘다.
//   slice: 그림의 모서리 크기(px). 원점은 origin(기본 가운데).
export const PLATES = {
  button: { key: 'btn-plate', slice: 52 },
  panel: { key: 'panel-plate', slice: 28 },
};

export function addSliced(scene, plate, x, y, w, h, { origin = [0.5, 0.5] } = {}) {
  const { key, slice } = plate;
  let obj;
  if (scene.renderer.gl) {
    const k = Math.min(1, h / (slice * 2.5), w / (slice * 2.5));
    obj = scene.add.nineslice(x, y, key, undefined, w / k, h / k, slice, slice, slice, slice).setScale(k);
  } else {
    obj = scene.add.image(x, y, key).setDisplaySize(w, h);
  }
  return obj.setOrigin(origin[0], origin[1]);
}

// 글 뒤에 까는 판(panel-plate 그림). (x, y)는 왼쪽 위.
export function addPlate(scene, x, y, w, h, alpha = 0.92) {
  return addSliced(scene, PLATES.panel, x, y, w, h, { origin: [0, 0] }).setAlpha(alpha);
}
