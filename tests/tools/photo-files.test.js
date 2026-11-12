// 관측 사진은 교실 기기의 내려받기와 그래픽 메모리를 위해 긴 변 PHOTO_LONG_SIDE 이하로 줄여 둔다.
import sharp from 'sharp';
import { OBJECTS } from '../../src/data/objects.js';
import { PHOTO_LONG_SIDE } from '../../tools/fetch-photos.mjs'; // 불러오기만 하면 내려받지 않는다

test('도구의 긴 변 기준은 1024px', () => {
  expect(PHOTO_LONG_SIDE).toBe(1024);
});

test('public/photos의 사진은 모두 긴 변 1024px 이하 JPEG', async () => {
  for (const o of OBJECTS) {
    const meta = await sharp(`public/${o.photo.file}`).metadata();
    expect(meta.format, o.id).toBe('jpeg');
    expect(Math.max(meta.width, meta.height), o.id).toBeLessThanOrEqual(PHOTO_LONG_SIDE);
  }
});
