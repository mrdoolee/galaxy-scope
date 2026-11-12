import { photoAgencies, photoLicenses } from '../../src/logic/credits.js';
import { OBJECTS } from '../../src/data/objects.js';

describe('사진 출처 한 줄에 쓸 기관과 라이선스', () => {
  it('자료에서 처음 나온 순서대로, 겹치지 않게', () => {
    const objs = [
      { photo: { agency: 'B', license: 'L1' } },
      { photo: { agency: 'A', license: 'L1' } },
      { photo: { agency: 'B', license: 'L2' } },
      { id: 'no-photo' },
    ];
    expect(photoAgencies(objs)).toEqual(['B', 'A']);
    expect(photoLicenses(objs)).toEqual(['L1', 'L2']);
  });

  it('실제 자료: ESO, NOIRLab, ESA/Hubble, CC BY 4.0', () => {
    expect(photoAgencies(OBJECTS)).toEqual(['ESO', 'NOIRLab', 'ESA/Hubble']);
    expect(photoLicenses(OBJECTS)).toEqual(['CC BY 4.0']);
  });
});
