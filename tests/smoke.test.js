import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../src/config/game.js';
test('설계 해상도', () => { expect([GAME_WIDTH, GAME_HEIGHT]).toEqual([1280, 720]); });
test('장면 키 일곱 개', () => { expect(Object.keys(SCENES)).toHaveLength(7); });
