// 세로가 더 길 때만 세로 화면으로 본다 (정사각형은 가로).
export function isPortrait(width, height) {
  return height > width;
}
