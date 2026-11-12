import { sceneForPhase } from '../../src/scenes/gameState.js';
import { SCENES } from '../../src/config/game.js';

test('저장된 단계마다 이어서 할 장면으로 간다', () => {
  expect(sceneForPhase('collect')).toBe(SCENES.SKY_MAP);
  expect(sceneForPhase('sort')).toBe(SCENES.SORT);
  expect(sceneForPhase('registry')).toBe(SCENES.REGISTRY);
  expect(sceneForPhase('result')).toBe(SCENES.RESULT);
  expect(sceneForPhase('nope')).toBe(SCENES.SKY_MAP);
});
