// 촬영 별점: 채워진 별 stars개, 빈 별 3 - stars개를 한 줄로.
const GAP = 10;

/**
 * addStarRating(scene, x, y, stars, size = 56): (x, y)는 줄 가운데. -> Container
 * 별은 하나씩 커지며 나타난다.
 */
export function addStarRating(scene, x, y, stars, size = 56) {
  const c = scene.add.container(x, y);
  const n = Math.min(3, Math.max(0, Math.round(stars)));
  for (let i = 0; i < 3; i++) {
    const img = scene.add.image((i - 1) * (size + GAP), 0, i < n ? 'icon-star' : 'icon-star-empty');
    const s = size / img.width;
    img.setScale(s * 0.3).setAlpha(0);
    scene.tweens.add({ targets: img, scale: s, alpha: 1, duration: 220, delay: 250 + i * 160, ease: 'Back.out' });
    c.add(img);
  }
  c.setSize(3 * size + 2 * GAP, size);
  return c;
}
