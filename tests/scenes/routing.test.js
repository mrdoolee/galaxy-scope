import { sceneForPhase, skyMapRedirect } from '../../src/scenes/gameState.js';
import { SCENES } from '../../src/config/game.js';
import { newGame } from '../../src/logic/save.js';

test('저장된 단계마다 이어서 할 장면으로 간다', () => {
  expect(sceneForPhase('collect')).toBe(SCENES.SKY_MAP);
  expect(sceneForPhase('sort')).toBe(SCENES.SORT);
  expect(sceneForPhase('registry')).toBe(SCENES.REGISTRY);
  expect(sceneForPhase('result')).toBe(SCENES.RESULT);
  expect(sceneForPhase('nope')).toBe(SCENES.SKY_MAP);
});

describe('skyMapRedirect: 하늘 지도에 들어왔을 때 다른 장면으로 보내야 하는가', () => {
  const at = (phase, bonusOpen = false) => ({ ...newGame(1), phase, bonusOpen });

  it('모으기 중이거나 보너스 관측 중이면 하늘 지도에 머문다(null)', () => {
    expect(skyMapRedirect(at('collect'))).toBeNull();
    expect(skyMapRedirect(at('result', true))).toBeNull();
  });

  it('20장째를 얻고 곧바로 「지도로」를 눌러도(이미 sort) 묶기 장면으로 보낸다', () => {
    expect(skyMapRedirect(at('sort'))).toBe(SCENES.SORT);
  });

  it('도감 등록, 결과 단계면 그 장면으로 보낸다', () => {
    expect(skyMapRedirect(at('registry'))).toBe(SCENES.REGISTRY);
    expect(skyMapRedirect(at('result'))).toBe(SCENES.RESULT);
  });
});
