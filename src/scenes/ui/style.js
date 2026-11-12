// 여러 장면이 함께 쓰는 글꼴, 색, 글 상자.
export const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

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
export function addText(scene, x, y, str, { size = 24, color = COLOR.text, bold = false, wrap = 0, align = 'left', origin = [0, 0], stroke = 0 } = {}) {
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

// 글 뒤에 까는 어두운 판(화면 장식이 아니라 글을 읽히게 하는 바탕).
export function addPlate(scene, x, y, w, h, alpha = 0.78) {
  const g = scene.add.graphics();
  g.fillStyle(COLOR.navy, alpha);
  g.fillRoundedRect(x, y, w, h, 14);
  g.lineStyle(2, COLOR.brass, 0.6);
  g.strokeRoundedRect(x, y, w, h, 14);
  return g;
}
