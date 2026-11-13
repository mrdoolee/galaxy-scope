// 수업 슬라이드(lesson.html). 게임을 한 뒤 교과서로 정리하는 시간에 교사가 화면에 띄워 쓴다.
// 사진의 이름과 출처는 게임 자료(objects.js)에서 가져오므로 게임과 어긋나지 않는다.
import { OBJECTS } from './data/objects.js';
import { photoAgencies, photoLicenses } from './logic/credits.js';

export const STAGE = { width: 1280, height: 720 };

// 한 번 넘기기: 쪽 안에 아직 가려진 단계가 있으면 그것부터 열고, 다 열렸으면 다음 쪽으로 간다.
// 뒤로 갈 때는 단계를 하나씩 닫고, 앞 쪽으로 넘어가면 그 쪽은 모두 열린 채로 보인다.
// pos: { slide, step }, stepCounts[i]: i번째 쪽의 단계 수, dir: +1 또는 -1.
export function move(pos, stepCounts, dir) {
  const last = stepCounts.length - 1;
  if (dir > 0) {
    if (pos.step < stepCounts[pos.slide]) return { slide: pos.slide, step: pos.step + 1 };
    if (pos.slide < last) return { slide: pos.slide + 1, step: 0 };
    return pos;
  }
  if (pos.step > 0) return { slide: pos.slide, step: pos.step - 1 };
  if (pos.slide > 0) return { slide: pos.slide - 1, step: stepCounts[pos.slide - 1] };
  return pos;
}

// 주소의 #3 같은 쪽 번호를 0부터 세는 쪽 자리로 바꾼다. 범위를 벗어나거나 숫자가 아니면 첫 쪽.
export function slideFromHash(hash, total) {
  const n = Number.parseInt(String(hash).replace('#', ''), 10);
  return Number.isFinite(n) && n >= 1 && n <= total ? n - 1 : 0;
}

// 화면에 무대(1280×720)를 비율 그대로 가득 맞추는 배율.
export const fitScale = (width, height) => Math.min(width / STAGE.width, height / STAGE.height);

const byId = (id) => OBJECTS.find((o) => o.id === id);

// <figure data-obj="m42">에 사진, 이름, 출처 기관을 채운다. data-name="off"면 이름을 숨긴다(맞혀 보는 쪽).
// 사진 위에는 기관만 적고, 사진마다의 크레딧 전문은 마지막 쪽에 모아 적는다(게임의 출처 표시와 같은 방식).
function fillPhotos(root) {
  for (const fig of root.querySelectorAll('figure[data-obj]')) {
    const o = byId(fig.dataset.obj);
    if (!o) continue;
    const named = fig.dataset.name !== 'off';
    const img = Object.assign(document.createElement('img'), {
      src: `${import.meta.env.BASE_URL}${o.photo.file}`,
      alt: named ? `${o.nameKo} 관측 사진` : '천체 관측 사진',
      draggable: false,
    });
    const cap = document.createElement('figcaption');
    if (named) cap.append(Object.assign(document.createElement('b'), { textContent: o.nameKo }));
    cap.append(Object.assign(document.createElement('span'), { textContent: `사진: ${o.photo.agency}` }));
    fig.replaceChildren(img, cap);
  }
}

// 여러 사진의 출처를 한 줄로: "석호 성운 ESO/VPHAS+ team · 오메가 성운 ESO".
export function creditList(ids, objects = OBJECTS) {
  return ids.map((id) => objects.find((o) => o.id === id.trim())).filter(Boolean)
    .map((o) => `${o.nameKo} ${o.photo.credit}`).join(' · ');
}

function start() {
  const deck = document.getElementById('deck');
  const slides = [...deck.querySelectorAll('.slide')];
  const stepCounts = slides.map((s) => Math.max(0, ...[...s.querySelectorAll('[data-step]')].map((n) => Number(n.dataset.step))));
  const counter = document.getElementById('counter');
  const bar = document.getElementById('bar');
  let pos = { slide: slideFromHash(location.hash, slides.length), step: 0 };

  fillPhotos(deck);
  const usedIds = [...new Set([...deck.querySelectorAll('figure[data-obj]')].map((f) => f.dataset.obj))];
  const used = usedIds.map(byId).filter(Boolean);
  document.getElementById('credit-line').textContent =
    `천체 사진 ${photoAgencies(used).join(', ')} (${photoLicenses(used).join(', ')}, 화면에 맞게 줄이고 잘라 씀): ${creditList(usedIds)} · 표지 그림: 이미지 생성 AI`;

  function render() {
    slides.forEach((s, i) => {
      s.classList.toggle('on', i === pos.slide);
      if (i !== pos.slide) return;
      for (const n of s.querySelectorAll('[data-step]')) n.classList.toggle('shown', Number(n.dataset.step) <= pos.step);
    });
    counter.textContent = `${pos.slide + 1} / ${slides.length}`;
    bar.style.width = `${((pos.slide + 1) / slides.length) * 100}%`;
    document.getElementById('prev').disabled = pos.slide === 0 && pos.step === 0;
    document.getElementById('next').disabled = pos.slide === slides.length - 1 && pos.step === stepCounts[pos.slide];
    history.replaceState(null, '', `#${pos.slide + 1}`);
  }
  const go = (dir) => { pos = move(pos, stepCounts, dir); render(); };
  const jump = (slide) => { pos = { slide: Math.min(Math.max(slide, 0), slides.length - 1), step: 0 }; render(); };

  function fit() {
    deck.style.setProperty('--s', fitScale(window.innerWidth, window.innerHeight));
  }
  function toggleFullscreen() {
    const root = document.documentElement;
    if (document.fullscreenElement ?? document.webkitFullscreenElement) (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document);
    else (root.requestFullscreen ?? root.webkitRequestFullscreen)?.call(root);
  }

  // 발표용 리모컨은 PageDown/PageUp을 보낸다.
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') jump(0);
    else if (e.key === 'End') jump(slides.length - 1);
    else if (e.key === 'f' || e.key === 'F' || e.key === 'ㄹ') toggleFullscreen();
  });
  document.getElementById('prev').addEventListener('click', () => go(-1));
  document.getElementById('next').addEventListener('click', () => go(1));
  document.getElementById('full').addEventListener('click', toggleFullscreen);
  // 화면을 누르면 넘어간다(왼쪽 1/4은 뒤로). 단추와 링크는 제 할 일을 한다.
  deck.addEventListener('click', (e) => {
    if (e.target.closest('a,button')) return;
    go(e.clientX < window.innerWidth / 4 ? -1 : 1);
  });
  // 터치 화면에서 옆으로 밀기.
  let touchX = null;
  deck.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  deck.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 60) return;
    e.preventDefault(); // 밀기 뒤에 따라오는 누르기(click)를 막는다
    go(dx < 0 ? 1 : -1);
  });
  window.addEventListener('hashchange', () => {
    const slide = slideFromHash(location.hash, slides.length);
    if (slide !== pos.slide) jump(slide);
  });
  window.addEventListener('resize', fit);
  fit();
  render();
}

if (typeof document !== 'undefined' && document.getElementById('deck')) start();
