import { isPortrait } from '../../src/config/orientation.js';
test('세로가 더 길면 세로 화면', () => { expect(isPortrait(390, 844)).toBe(true); });
test('가로가 더 길면 가로 화면', () => { expect(isPortrait(844, 390)).toBe(false); });
test('정사각형은 가로로 본다', () => { expect(isPortrait(600, 600)).toBe(false); });
