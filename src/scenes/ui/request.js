import { PLAIN_REQUEST, plainLook, TERM_REQUEST, TYPE_INFO, BONUS_TEXT } from '../../data/copy.js';
import { softTexture } from './photoTextures.js';

// 의뢰 내용 그리기(하늘 지도 머리글, 훑기 화면 왼쪽 판이 같이 쓴다).
// 남은 대상만 보여 준다.
export function remainingTargets(request, foundIds, objects) {
  if (!request) return [];
  return request.targetIds.filter((id) => !foundIds.has(id)).map((id) => objects.find((o) => o.id === id));
}

// 쉬운 말 의뢰: 겉모습 말을 겹치지 않게 모아 한 줄로("…것 · …것").
export function plainLooks(targets) {
  return [...new Set(targets.map((o) => plainLook(PLAIN_REQUEST[o.type])))].join(' · ');
}

// 그림 의뢰: 대상 사진을 흐리게 한 둥근 윤곽을 가로로 늘어놓는다. 왼쪽 위가 (x, y).
export function addRequestThumbs(scene, x, y, targets, size = 80, gap = 10) {
  return targets.map((o, i) => {
    const key = softTexture(scene, o.id, { size: 128, grain: 14, round: true });
    return scene.add.image(x + i * (size + gap) + size / 2, y + size / 2, key).setDisplaySize(size, size);
  });
}

// 보너스 용어 의뢰 문장: 종류 이름("방출 성운을 하나 더 찾아라") 또는 외부 은하.
export function termRequestText(request, objects) {
  const type = objects.find((o) => o.id === request.targetIds[0]).type;
  return type === 'spiral' ? BONUS_TEXT.galaxyRequest : TERM_REQUEST(TYPE_INFO[type].nameKo);
}
