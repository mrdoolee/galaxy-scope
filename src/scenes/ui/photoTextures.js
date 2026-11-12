// 관측 사진에서 흐린 텍스처를 만든다(작게 줄였다 키우는 방식이라 캔버스 필터가 없는 브라우저에서도 된다).
// 사진 텍스처 키는 photoKey(id).
export const photoKey = (id) => `photo-${id}`;

/**
 * soft(scene, id, opts) -> 텍스처 키
 *   size   만들 정사각 텍스처 한 변
 *   grain  가장 작게 줄인 한 변(작을수록 흐림)
 *   gray   true면 흑백으로 바꾸고 밝기를 고르게 맞춘다(얼룩이 종류를 드러내지 않게)
 *   round  true면 가장자리를 둥글고 부드럽게 지운다
 *   faint  true면 가운데부터 빠르게 옅어진다(하늘의 희미한 얼룩), false면 가장자리만 옅어진다(의뢰 사진)
 */
export function softTexture(scene, id, { size = 128, grain = 10, gray = false, round = true, faint = false } = {}) {
  const key = `soft-${id}-${size}-${grain}-${gray ? 'g' : 'c'}-${round ? 'r' : 's'}${faint ? 'f' : ''}`;
  if (scene.textures.exists(key)) return key;
  const src = scene.textures.get(photoKey(id)).getSourceImage();

  // 가운데를 정사각으로 잘라 grain 크기로 줄인다.
  const side = Math.min(src.width, src.height);
  const small = document.createElement('canvas');
  small.width = small.height = grain;
  const sctx = small.getContext('2d');
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(src, (src.width - side) / 2, (src.height - side) / 2, side, side, 0, 0, grain, grain);

  if (gray) {
    const img = sctx.getImageData(0, 0, grain, grain);
    const d = img.data;
    let sum = 0;
    const lum = [];
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      lum.push(l);
      sum += l;
    }
    const mean = sum / lum.length || 1;
    const k = 120 / mean; // 평균 밝기를 맞춰 밝은 것과 어두운 것이 비슷한 얼룩으로 보이게
    for (let i = 0; i < lum.length; i++) {
      const v = Math.max(0, Math.min(255, 120 + (lum[i] * k - 120) * 0.7));
      d[i * 4] = v * 0.92;
      d[i * 4 + 1] = v * 0.96;
      d[i * 4 + 2] = v;
    }
    sctx.putImageData(img, 0, 0);
  }

  // 두 번에 나눠 키우면 덜 각지다.
  const mid = document.createElement('canvas');
  mid.width = mid.height = grain * 4;
  const mctx = mid.getContext('2d');
  mctx.imageSmoothingEnabled = true;
  mctx.drawImage(small, 0, 0, mid.width, mid.height);

  const out = document.createElement('canvas');
  out.width = out.height = size;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(mid, 0, 0, size, size);

  if (round) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    if (faint) {
      g.addColorStop(0.3, 'rgba(0,0,0,0.6)');
      g.addColorStop(0.65, 'rgba(0,0,0,0.18)');
    } else {
      g.addColorStop(0.7, 'rgba(0,0,0,1)');
    }
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  scene.textures.addCanvas(key, out);
  return key;
}

// 사진을 (w, h) 창에 가득 차게(넘치는 부분은 잘라) 맞춘다. 원점은 가운데.
export function coverImage(image, w, h) {
  const tw = image.frame.realWidth;
  const th = image.frame.realHeight;
  const s = Math.max(w / tw, h / th);
  image.setOrigin(0.5).setScale(s);
  const cw = w / s;
  const ch = h / s;
  image.setCrop((tw - cw) / 2, (th - ch) / 2, cw, ch);
  return image;
}
