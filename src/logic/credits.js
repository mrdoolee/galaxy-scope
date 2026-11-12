// 사진 출처 한 줄(불러오기 화면, 하늘 지도)에 쓸 기관과 라이선스를 자료에서 모은다. Phaser에 의존하지 않는다.
const uniqueIn = (objects, key) => [...new Set(objects.filter((o) => o.photo?.[key]).map((o) => o.photo[key]))];

export const photoAgencies = (objects) => uniqueIn(objects, 'agency');
export const photoLicenses = (objects) => uniqueIn(objects, 'license');
