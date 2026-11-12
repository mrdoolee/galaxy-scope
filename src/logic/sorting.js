// 묶기 규칙. Phaser에 의존하지 않는다.
export const STAGES = {
  shape: { bins: ['cloud', 'stars'] },
  nebula: { bins: ['bright', 'dark'] },
  cluster: { bins: ['loose', 'dense'] },
};

// 묶기 단계 순서. 저장 검사(save.js)와 진행(sortFlow.js)이 함께 쓴다.
export const STAGE_ORDER = Object.keys(STAGES);

export function correctBin(stage, object) {
  switch (stage) {
    case 'shape':
      return object.group === 'nebula' ? 'cloud' : 'stars';
    case 'nebula':
      return object.type === 'dark' ? 'dark' : 'bright';
    case 'cluster':
      return object.type === 'globular' ? 'dense' : 'loose';
    default:
      throw new Error(`알 수 없는 단계: ${stage}`);
  }
}

export function judge(stage, placements, objects) {
  const complete = objects.every((obj) => placements[obj.id] != null);
  if (!complete) return { complete: false, correct: false, wrongIds: [] };
  const wrongIds = objects.filter((obj) => placements[obj.id] !== correctBin(stage, obj)).map((obj) => obj.id);
  return { complete: true, correct: wrongIds.length === 0, wrongIds };
}

export function nextHintLevel(wrongSubmits) {
  return Math.max(0, Math.min(3, wrongSubmits));
}
