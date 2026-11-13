// 교사 안내 쪽(teacher.html)의 표를 게임 자료에서 만든다. 게임과 같은 자료를 쓰므로 표가 게임과 어긋나지 않는다.
import { OBJECTS, TYPES } from './data/objects.js';
import { ZONES } from './data/zones.js';
import { TYPE_INFO, BIN_LABELS, BONUS_TEXT, formatNumber } from './data/copy.js';
import { correctBin } from './logic/sorting.js';
import { photoAgencies } from './logic/credits.js';
import {
  SCORE, RANKS, HINT_MULT, HIGHLIGHT_MAX, UNLOCK_ALL_AT, PICTURE_UNTIL, NIGHT_BASE_MS, NIGHT_PER_TARGET_MS, DECK_CARDS,
} from './config/balance.js';

const zoneName = (id) => ZONES.find((z) => z.id === id)?.nameKo ?? id;
export const typeName = (o) => (o.group === 'galaxy' ? BONUS_TEXT.galaxyType : TYPE_INFO[o.type].nameKo);

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of [].concat(children)) node.append(c);
  return node;
};

// 표의 묶음: 필수 카드, 보너스(성운·성단), 보너스(은하).
export function objectGroups(objects = OBJECTS) {
  return [
    { title: `필수 카드 ${objects.filter((o) => o.deck).length}장`, rows: objects.filter((o) => o.deck) },
    { title: '보너스 관측: 성운과 성단', rows: objects.filter((o) => !o.deck && o.group !== 'galaxy') },
    { title: '보너스 관측: 우리은하 밖의 은하', rows: objects.filter((o) => o.group === 'galaxy') },
  ].filter((g) => g.rows.length > 0);
}

function objectRow(o) {
  const img = el('img', { src: `${import.meta.env.BASE_URL}${o.photo.file}`, alt: `${o.nameKo} 관측 사진`, loading: 'lazy', width: 72, height: 72 });
  const name = el('td', {}, [el('b', { textContent: o.nameKo })]);
  if (o.catalogId !== o.nameKo) name.append(el('span', { className: 'cat', textContent: o.catalogId }));
  const source = el('td', { className: 'src' }, [
    el('a', { href: o.photo.pageUrl, target: '_blank', rel: 'noopener', textContent: o.photo.agency }),
    ` · ${o.photo.credit}`,
  ]);
  return el('tr', {}, [
    el('td', { className: 'pic' }, img),
    name,
    el('td', {}, el('span', { className: `tag ${o.type}`, textContent: typeName(o) })),
    el('td', { textContent: zoneName(o.zone) }),
    el('td', { className: 'num', textContent: `약 ${formatNumber(o.distanceLy)}` }),
    source,
  ]);
}

function fillObjects() {
  const body = document.querySelector('#object-table tbody');
  body.replaceChildren();
  for (const g of objectGroups()) {
    body.append(el('tr', { className: 'group' }, el('th', { colSpan: 6, textContent: g.title })));
    for (const o of g.rows) body.append(objectRow(o));
  }
  const deck = OBJECTS.filter((o) => o.deck).length;
  document.getElementById('fact-count').textContent = `필수 카드 ${deck}장 + 보너스 ${OBJECTS.length - deck}장`;
  document.getElementById('agency-line').textContent = photoAgencies(OBJECTS).join(', ');
}

// 종류마다: 1차 묶음 이름 → 2차 묶음 이름, 교과서 용어와 설명, 필수 카드 이름.
function fillTypes() {
  const body = document.querySelector('#type-table tbody');
  for (const type of TYPES) {
    const cards = OBJECTS.filter((o) => o.deck && o.type === type);
    const sample = cards[0];
    const first = BIN_LABELS[correctBin('shape', sample)];
    const second = BIN_LABELS[correctBin(sample.group, sample)];
    body.append(el('tr', {}, [
      el('td', { textContent: `${first} → ${second}` }),
      el('td', {}, el('span', { className: `tag ${type}`, textContent: TYPE_INFO[type].nameKo })),
      el('td', { textContent: TYPE_INFO[type].line }),
      el('td', { textContent: cards.map((o) => o.nameKo).join(', ') }),
    ]));
  }
}

function fillScore() {
  const body = document.querySelector('#score-table tbody');
  const rows = [
    ['카드 발견', `1장에 ${SCORE.find}점`, `필수 카드 ${DECK_CARDS}장`],
    ['촬영 별점', `별 1개를 넘는 별마다 ${SCORE.star}점`, '초점이 잘 맞은 순간에 촬영할수록 별이 많습니다(카드마다 1~3개)'],
    ['동트기 전 완료', `임무 1번에 ${SCORE.earlyMission}점`, '해가 뜨기 전에 임무의 천체를 모두 찾았을 때'],
    ['묶기', `카드 1장에 ${SCORE.sortCard}점`, `힌트 단계에 따라 ×${HINT_MULT.join(', ×')}, 틀린 판정 1번에 ${SCORE.wrongSubmit}점`],
    ['다섯 종류 모두 등록', `${SCORE.allTypes}점`, ''],
    [`${DECK_CARDS}장 완성`, `${SCORE.full}점`, ''],
  ];
  for (const r of rows) body.append(el('tr', {}, r.map((textContent) => el('td', { textContent }))));
  const ranks = [...RANKS].sort((a, b) => b.min - a.min);
  document.getElementById('rank-line').textContent =
    `등급: ${ranks.map((r) => (r.min > 0 ? `${formatNumber(r.min)}점 이상 ${r.name}` : `그 아래 ${r.name}`)).join(', ')}.`;
}

// 본문 속 수치(data-v)를 balance.js 값으로 맞춘다.
function fillValues() {
  const values = {
    unlock: UNLOCK_ALL_AT, picture: PICTURE_UNTIL, nightBase: NIGHT_BASE_MS / 1000, nightPer: NIGHT_PER_TARGET_MS / 1000,
    highlight: HIGHLIGHT_MAX, mult1: HINT_MULT[1], mult2: HINT_MULT[2], mult3: HINT_MULT[3],
  };
  for (const node of document.querySelectorAll('[data-v]')) node.textContent = values[node.dataset.v];
}

if (typeof document !== 'undefined' && document.getElementById('object-table')) {
  fillObjects();
  fillTypes();
  fillScore();
  fillValues();
}
