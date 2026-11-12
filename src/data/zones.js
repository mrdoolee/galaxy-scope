// 별자리 구역. mapX·mapY는 설계 해상도 1280×720에서 하늘 지도 위 구역 표시(88×88 터치 대상)의 가운데다.
// 위쪽 110px은 머리글 자리로 비우고, 이름표는 표시 아래에 놓는 것을 기준으로 겹치지 않게 벌려 두었다.
// 배치는 실제 하늘을 대략 따른다(왼쪽일수록 적경이 크고, 위쪽일수록 북쪽).
// textbook: 교과서 탐구가 지정한 처음부터 열린 네 구역.
// 하늘 지도의 작은 별자리 그림과 구역 하늘의 별은 src/data/sky.js의 실제 별 자료에서 만든다.
export const ZONES = [
  // 북쪽 하늘
  { id: 'cepheus', nameKo: '세페우스자리', textbook: false, mapX: 130, mapY: 160 },
  { id: 'canesvenatici', nameKo: '사냥개자리', textbook: false, mapX: 600, mapY: 160 },
  { id: 'ursamajor', nameKo: '큰곰자리', textbook: false, mapX: 760, mapY: 160 },
  { id: 'perseus', nameKo: '페르세우스자리', textbook: false, mapX: 1080, mapY: 160 },
  { id: 'hercules', nameKo: '헤르쿨레스자리', textbook: false, mapX: 380, mapY: 280 },
  { id: 'taurus', nameKo: '황소자리', textbook: true, mapX: 1000, mapY: 280 },
  // 하늘 적도 부근
  { id: 'scutum', nameKo: '방패자리', textbook: false, mapX: 180, mapY: 400 },
  { id: 'serpens', nameKo: '뱀자리', textbook: false, mapX: 330, mapY: 400 },
  { id: 'ophiuchus', nameKo: '뱀주인자리', textbook: false, mapX: 480, mapY: 400 },
  { id: 'virgo', nameKo: '처녀자리', textbook: false, mapX: 660, mapY: 400 },
  { id: 'orion', nameKo: '오리온자리', textbook: true, mapX: 930, mapY: 400 },
  { id: 'eridanus', nameKo: '에리다누스자리', textbook: false, mapX: 1100, mapY: 400 },
  // 남쪽 하늘
  { id: 'sagittarius', nameKo: '궁수자리', textbook: true, mapX: 230, mapY: 520 },
  { id: 'scorpius', nameKo: '전갈자리', textbook: true, mapX: 430, mapY: 520 },
  { id: 'centaurus', nameKo: '센타우루스자리', textbook: false, mapX: 640, mapY: 520 },
  { id: 'vela', nameKo: '돛자리', textbook: false, mapX: 830, mapY: 520 },
  { id: 'coronaaustralis', nameKo: '남쪽왕관자리', textbook: false, mapX: 230, mapY: 640 },
  { id: 'chamaeleon', nameKo: '카멜레온자리', textbook: false, mapX: 700, mapY: 640 },
  { id: 'carina', nameKo: '용골자리', textbook: false, mapX: 860, mapY: 640 },
  { id: 'tucana', nameKo: '큰부리새자리', textbook: false, mapX: 1130, mapY: 640 },
];
