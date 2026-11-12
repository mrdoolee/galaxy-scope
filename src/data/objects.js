// 천체 목록. 사진 출처는 2026-11-12에 각 원문 페이지에서 확인했다.
// ESO, NOIRLab, ESA/Hubble은 별도 표기가 없으면 CC BY 4.0이고, 크레딧은 페이지 문구 그대로 적는다.
// 사진은 tools/fetch-photos.mjs가 photo.sourceUrl에서 받아 긴 변 1024px 이하로 줄여 저장하고,
// 화면에서는 카드 창에 맞게 잘라 보인다(edited: true).
export const TYPES =['emission', 'reflection', 'dark', 'open', 'globular'];

const CHECKED_ON = '2026-11-12';
const LICENSE = 'CC BY 4.0';
const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';

// agency: 불러오기 화면과 하늘 지도의 사진 출처 한 줄에 쓰는 기관 이름.
function eso(id, credit) {
  return { agency: 'ESO', pageUrl: `https://www.eso.org/public/images/${id}/`, sourceUrl: `https://cdn.eso.org/images/large/${id}.jpg`, credit };
}
function noirlab(id, credit) {
  return { agency: 'NOIRLab', pageUrl: `https://noirlab.edu/public/images/${id}/`, sourceUrl: `https://storage.noirlab.edu/media/archives/images/large/${id}.jpg`, credit };
}
function hubble(id, credit) {
  return { agency: 'ESA/Hubble', pageUrl: `https://esahubble.org/images/${id}/`, sourceUrl: `https://cdn.esahubble.org/archives/images/large/${id}.jpg`, credit };
}

const GROUP_OF = { emission: 'nebula', reflection: 'nebula', dark: 'nebula', open: 'cluster', globular: 'cluster', spiral: 'galaxy' };

// 하늘 자리(J2000): [적경(시, 소수), 적위(도, 소수)]. 구역 하늘에서 천체를 놓는 기준이다(src/logic/chart.js).
// 파이프 성운은 여러 암흑 성운이 이어진 것이라 B59 하나가 아니라 무리 전체의 가운데쯤을 적는다.
const RADEC = {
  m42: [5.588, -5.39], m8: [18.060, -24.38], m17: [18.346, -16.18], m16: [18.313, -13.78],
  m78: [5.779, 0.08], ic2118: [5.080, -7.20], ic2631: [11.160, -76.60], ngc7023: [21.030, 68.17],
  b33: [5.683, -2.46], b68: [17.378, -23.83], b59: [17.350, -27.00], b86: [18.050, -27.87],
  m45: [3.790, 24.12], m7: [17.898, -34.79], ngc869: [2.330, 57.13], ngc2547: [8.170, -49.20],
  m4: [16.393, -26.53], m22: [18.607, -23.90], ngc5139: [13.446, -47.48], m13: [16.695, 36.46],
  ngc3372: [10.750, -59.87], m20: [18.040, -23.03], ngc6726: [19.030, -36.90], ldn1622: [5.910, 1.80],
  m11: [18.851, -6.27], ngc3532: [11.090, -58.70], ngc104: [0.401, -72.08], m55: [19.667, -30.96],
  m51: [13.498, 47.20], m101: [14.054, 54.35], m104: [12.666, -11.62],
};

function obj(id, nameKo, catalogId, type, zone, distanceLy, deck, composite, source) {
  const [ra, dec] = RADEC[id];
  return {
    id, nameKo, catalogId, group: GROUP_OF[type], type, zone, ra, dec, distanceLy, deck, composite,
    photo: { file: `photos/${id}.jpg`, ...source, license: LICENSE, licenseUrl: LICENSE_URL, edited: true, checkedOn: CHECKED_ON },
  };
}

export const OBJECTS = [
  // ── 필수 20장: 방출 성운
  obj('m42', '오리온대성운', 'M42', 'emission', 'orion', 1400, true, false, eso('eso1103a', 'ESO/Igor Chekalin')),
  obj('m8', '석호 성운', 'M8', 'emission', 'sagittarius', 5000, true, false, eso('eso1403a', 'ESO/VPHAS+ team')),
  obj('m17', '오메가 성운', 'M17', 'emission', 'sagittarius', 5500, true, false, eso('omega-nebula', 'ESO')),
  obj('m16', '독수리 성운', 'M16', 'emission', 'serpens', 7000, true, false, eso('eso0926a', 'ESO')),
  // ── 필수 20장: 반사 성운
  obj('m78', 'M78', 'M78', 'reflection', 'orion', 1400, true, false, eso('eso1105a', 'ESO/Igor Chekalin')),
  obj('ic2118', '마녀머리 성운', 'IC 2118', 'reflection', 'eridanus', 1000, true, false,
    noirlab('noao-ic2118calvert', 'KPNO/NOIRLab/NSF/AURA/Fred Calvert/Adam Block')),
  obj('ic2631', 'IC 2631', 'IC 2631', 'reflection', 'chamaeleon', 500, true, false, eso('eso1605a', 'ESO')),
  obj('ngc7023', '붓꽃 성운', 'NGC 7023', 'reflection', 'cepheus', 1400, true, false,
    noirlab('noao-ngc7023', 'T.A. Rector/University of Alaska Anchorage, H. Schweiker/WIYN and NOIRLab/NSF/AURA')),
  // ── 필수 20장: 암흑 성운
  obj('b33', '말머리성운', 'B33', 'dark', 'orion', 1300, true, true, eso('eso0202a', 'ESO')),
  obj('b68', '바너드 68', 'B68', 'dark', 'ophiuchus', 500, true, false, eso('eso0102a', 'ESO')),
  obj('b59', '파이프 성운', 'B59 등', 'dark', 'ophiuchus', 600, true, false, eso('eso1233a', 'ESO')),
  obj('b86', '바너드 86', 'B86', 'dark', 'sagittarius', 6000, true, true, eso('eso1307a', 'ESO')),
  // ── 필수 20장: 산개 성단
  obj('m45', '플레이아데스성단', 'M45', 'open', 'taurus', 450, true, true,
    noirlab('noao-m45denton', 'KPNO/NOIRLab/NSF/AURA/Tad Denton/Adam Block')),
  obj('m7', '프톨레마이오스 성단', 'M7', 'open', 'scorpius', 800, true, false, eso('eso1406a', 'ESO')),
  obj('ngc869', '이중 성단', 'NGC 869, NGC 884', 'open', 'perseus', 7000, true, false,
    noirlab('noao-hcper', 'N.A.Sharp/NOIRLab/NSF/AURA')),
  obj('ngc2547', 'NGC 2547', 'NGC 2547', 'open', 'vela', 1500, true, false, eso('eso1316a', 'ESO')),
  // ── 필수 20장: 구상 성단
  obj('m4', 'M4', 'M4', 'globular', 'scorpius', 7000, true, false, eso('eso1235a', 'ESO Acknowledgement: ESO Imaging Survey')),
  obj('m22', 'M22', 'M22', 'globular', 'sagittarius', 10000, true, false,
    noirlab('noao-m22', 'N.A.Sharp, REU program/NOIRLab/NSF/AURA')),
  obj('ngc5139', '오메가 센타우리', 'NGC 5139', 'globular', 'centaurus', 17000, true, false, eso('eso0844a', 'ESO')),
  obj('m13', 'M13', 'M13', 'globular', 'hercules', 22000, true, false,
    noirlab('noao-m13kpno4m', 'T.A. Rector (University of Alaska Anchorage) and H. Schweiker (WIYN and NOIRLab/NSF/AURA)')),

  // ── 보너스(필수 20장 밖): 종류마다 1개 이상
  obj('ngc3372', '용골 성운', 'NGC 3372', 'emission', 'carina', 7500, false, false,
    eso('eso1250a', 'ESO. Acknowledgement: VPHAS+ Consortium/Cambridge Astronomical Survey Unit')),
  obj('m20', '삼렬 성운', 'M20', 'emission', 'sagittarius', 5500, false, true, eso('eso0930b', 'ESO')),
  obj('ngc6726', 'NGC 6726', 'NGC 6726', 'reflection', 'coronaaustralis', 420, false, false, eso('eso1027a', 'ESO')),
  obj('ldn1622', 'LDN 1622', 'LDN 1622', 'dark', 'orion', 1300, false, true,
    noirlab('iotw2325a', 'KPNO/NOIRLab/NSF/AURA/T. A. Rector Image processing: T.A. Rector (University of Alaska Anchorage/NSF NOIRLab), M. Zamani (NSF NOIRLab) & D. de Martin (NSF NOIRLab)')),
  obj('m11', '야생오리 성단', 'M11', 'open', 'scutum', 6000, false, false, eso('eso1430a', 'ESO')),
  obj('ngc3532', 'NGC 3532', 'NGC 3532', 'open', 'carina', 1300, false, false, eso('eso1439a', 'ESO/G. Beccari')),
  obj('ngc104', '큰부리새자리 47', 'NGC 104', 'globular', 'tucana', 16000, false, false,
    noirlab('noao-02212', 'NOIRLab/NSF/AURA')),
  obj('m55', 'M55', 'M55', 'globular', 'sagittarius', 17000, false, false, eso('m55-3point6-m_copy', 'ESO')),

  // ── 보너스: 외부 은하(우리은하 밖)
  obj('m51', '소용돌이 은하', 'M51', 'spiral', 'canesvenatici', 25000000, false, false,
    hubble('heic0506a', 'NASA, ESA, S. Beckwith (STScI), and The Hubble Heritage Team (STScI/AURA)')),
  obj('m101', '바람개비 은하', 'M101', 'spiral', 'ursamajor', 20000000, false, false,
    noirlab('noao-m101ubviha', 'T.A. Rector (University of Alaska Anchorage) and H. Schweiker (WIYN and NOIRLab/NSF/AURA)')),
  obj('m104', '솜브레로 은하', 'M104', 'spiral', 'virgo', 30000000, false, false,
    hubble('heic2506a', 'ESA/Hubble & NASA, K. Noll')),
];
