import { OBJECTS } from '../../data/objects.js';
import { PHOTO_ATTRIBUTION } from '../../data/copy.js';
import { photoAgencies, photoLicenses } from '../../logic/credits.js';
import { addText, COLOR, MIN_FONT } from './style.js';

// 사진 출처 한 줄(불러오기 화면, 하늘 지도). 자세한 출처는 결과 화면의 「사진 출처」에 있다.
const LINE = PHOTO_ATTRIBUTION(photoAgencies(OBJECTS), photoLicenses(OBJECTS));

export function addAttribution(scene, x, y, { origin = [0.5, 0.5], wrap = 0, align = 'center' } = {}) {
  return addText(scene, x, y, LINE, { size: MIN_FONT, color: COLOR.textDim, origin, wrap, align, stroke: 4 });
}
