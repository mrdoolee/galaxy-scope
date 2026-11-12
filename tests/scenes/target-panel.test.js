// 훑기 화면 왼쪽 판이 보여 줄 대상: 이 구역의 임무 대상 중 남은 것과 그 단서(장면 없이 시험한다).
import { panelTargets } from '../../src/scenes/ui/targetPanel.js';

const clues = {
  m42: { nameKo: '삼태성', dir: 'down', band: 'mid' },
  m78: { nameKo: '삼태성', dir: 'upLeft', band: 'mid' },
  b33: { nameKo: '삼태성', dir: 'downLeft', band: 'near' },
};
const request = { kind: 'picture', zoneId: 'orion', targetIds: ['m78', 'm42', 'b33'] };

test('임무 구역이 이 구역이면 남은 대상을 임무 순서대로 단서와 함께 낸다', () => {
  expect(panelTargets(request, 'orion', new Set(), clues)).toEqual([
    { id: 'm78', clue: clues.m78 },
    { id: 'm42', clue: clues.m42 },
    { id: 'b33', clue: clues.b33 },
  ]);
});

test('찾은 대상은 빠진다', () => {
  expect(panelTargets(request, 'orion', new Set(['m42', 'm7']), clues)).toEqual([
    { id: 'm78', clue: clues.m78 },
    { id: 'b33', clue: clues.b33 },
  ]);
  expect(panelTargets(request, 'orion', new Set(['m42', 'm78', 'b33']), clues)).toEqual([]);
});

test('임무 구역이 다른 구역이거나 임무가 없으면 빈 배열(단서는 임무의 일부다)', () => {
  expect(panelTargets(request, 'sagittarius', new Set(), clues)).toEqual([]);
  expect(panelTargets(null, 'orion', new Set(), clues)).toEqual([]);
});

test('보너스 용어 의뢰도 같은 규칙을 따르고, 단서가 없는 대상은 clue가 null', () => {
  const term = { kind: 'term', zoneId: 'orion', targetIds: ['ngc1977'] };
  expect(panelTargets(term, 'orion', new Set(), clues)).toEqual([{ id: 'ngc1977', clue: null }]);
});
