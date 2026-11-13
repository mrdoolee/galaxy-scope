import { readFileSync } from 'node:fs';
import { move, slideFromHash, fitScale, creditList } from '../../src/lesson.js';
import { OBJECTS } from '../../src/data/objects.js';

describe('수업 슬라이드 넘기기', () => {
  const steps = [0, 2, 1];
  it('가려진 단계를 먼저 열고, 다 열리면 다음 쪽으로 간다', () => {
    expect(move({ slide: 0, step: 0 }, steps, 1)).toEqual({ slide: 1, step: 0 });
    expect(move({ slide: 1, step: 0 }, steps, 1)).toEqual({ slide: 1, step: 1 });
    expect(move({ slide: 1, step: 2 }, steps, 1)).toEqual({ slide: 2, step: 0 });
  });
  it('뒤로 가면 단계를 하나씩 닫고, 앞 쪽은 모두 열린 채로 보인다', () => {
    expect(move({ slide: 1, step: 2 }, steps, -1)).toEqual({ slide: 1, step: 1 });
    expect(move({ slide: 2, step: 0 }, steps, -1)).toEqual({ slide: 1, step: 2 });
  });
  it('처음과 끝에서는 멈춘다', () => {
    expect(move({ slide: 0, step: 0 }, steps, -1)).toEqual({ slide: 0, step: 0 });
    expect(move({ slide: 2, step: 1 }, steps, 1)).toEqual({ slide: 2, step: 1 });
  });
  it('주소의 쪽 번호를 읽고, 벗어나면 첫 쪽', () => {
    expect(slideFromHash('#3', 10)).toBe(2);
    expect(slideFromHash('', 10)).toBe(0);
    expect(slideFromHash('#11', 10)).toBe(0);
    expect(slideFromHash('#abc', 10)).toBe(0);
  });
  it('무대를 비율 그대로 화면에 맞춘다', () => {
    expect(fitScale(1280, 720)).toBe(1);
    expect(fitScale(1920, 1080)).toBe(1.5);
    expect(fitScale(1280, 360)).toBe(0.5);
  });
  it('여러 사진의 출처를 한 줄로 모은다', () => {
    expect(creditList(['m8', ' m17'])).toBe('석호 성운 ESO/VPHAS+ team · 오메가 성운 ESO');
  });
});

describe('수업 슬라이드 쪽(lesson.html)', () => {
  const html = readFileSync('lesson.html', 'utf8');
  const ids = (re) => [...html.matchAll(re)].flatMap((m) => m[1].split(','));
  it('10장 안팎이다', () => {
    const count = html.match(/<section class="slide/g).length;
    expect(count).toBeGreaterThanOrEqual(8);
    expect(count).toBeLessThanOrEqual(12);
  });
  it('쓰는 사진은 모두 게임 자료에 있는 천체다', () => {
    const used = ids(/data-obj="([^"]+)"/g);
    expect(used.length).toBeGreaterThan(0);
    for (const id of used) expect(OBJECTS.some((o) => o.id === id)).toBe(true);
  });
  it('거리 쪽의 숫자는 게임 자료와 같다', () => {
    for (const id of ['m8', 'm17', 'b86', 'm22']) {
      const o = OBJECTS.find((x) => x.id === id);
      expect(o.zone).toBe('sagittarius');
      expect(html).toContain(`약 ${o.distanceLy.toLocaleString('en-US')}광년`);
    }
  });
  it('제작자 표시가 있고, 교사 안내에서 갈 수 있다', () => {
    expect(html).toContain('© 2026 Designed &amp; Developed by 두리쌤(@trdoolee). All rights reserved.');
    expect(readFileSync('teacher.html', 'utf8')).toContain('href="lesson.html"');
  });
});
