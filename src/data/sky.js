// 구역 하늘 자료. 좌표는 J2000 적경(시, 소수)과 적위(도, 소수), mag는 겉보기 등급(변광성은 평소 밝기쯤).
// center·spanDeg: 구역 화면(2400×1600)에 보여 줄 하늘 창의 가운데와 가로 폭(도). 세로 폭은 spanDeg × 2/3.
//   큰 별자리는 천체와 알아볼 만한 별이 함께 들어오는 부분만 잡는다.
// stars: 그 별자리를 알아볼 수 있는 밝은 별. 이웃 별자리의 별도 길잡이로 넣을 수 있다(그런 별은 선으로 잇지 않는다).
// segs: 흔히 그리는 별자리 선(별 id 쌍). 하늘 지도의 작은 그림은 선으로 이은 별만 쓴다.
// guides: 학생이 길을 찾는 기준이 되는 이름 있는 별이나 별 무리. 늘 stars 중 한 별의 자리에 둔다.
//   묶기 전 화면에 보이므로 "성운", "성단"과 다섯 종류 이름을 쓰지 않는다.
// 천구의 극에 가까운 구역(세페우스자리, 카멜레온자리, 큰부리새자리)은 간단한 투영이라 모양이 조금 일그러진다.

function star(id, ra, dec, mag) {
  return { id, ra, dec, mag };
}

// 별 하나를 길잡이로: 별 자료의 좌표를 그대로 쓴다.
function guide(nameKo, s) {
  return { nameKo, ra: s.ra, dec: s.dec };
}

function zone(center, spanDeg, stars, segs, guides) {
  const at = Object.fromEntries(stars.map((s) => [s.id, s]));
  return { center, spanDeg, stars, segs, guides: guides.map(([nameKo, id]) => guide(nameKo, at[id])) };
}

export const SKY = {
  // ── 북쪽 하늘
  cepheus: zone({ ra: 22.0, dec: 67.9 }, 36, [
    star('alderamin', 21.310, 62.59, 2.45), // α
    star('alfirk', 21.478, 70.56, 3.23),    // β
    star('errai', 23.656, 77.63, 3.21),     // γ
    star('iota', 22.828, 66.20, 3.52),
    star('zeta', 22.181, 58.20, 3.35),
    star('eta', 20.755, 61.84, 3.43),
  ], [
    ['alderamin', 'alfirk'], ['alfirk', 'errai'], ['errai', 'iota'], ['iota', 'zeta'], ['zeta', 'alderamin'],
    ['alfirk', 'iota'], ['alderamin', 'eta'],
  ], [['알데라민', 'alderamin'], ['알피르크', 'alfirk'], ['에라이', 'errai']]),

  canesvenatici: zone({ ra: 13.2, dec: 47.0 }, 32, [
    star('corcaroli', 12.934, 38.32, 2.88), // α² 사냥개자리
    star('chara', 12.562, 41.36, 4.26),     // β 사냥개자리
    star('alkaid', 13.792, 49.31, 1.86),    // 큰곰자리 η(북두칠성 손잡이 끝)
    star('mizar', 13.399, 54.93, 2.23),     // 큰곰자리 ζ
    star('alioth', 12.900, 55.96, 1.77),    // 큰곰자리 ε
  ], [['corcaroli', 'chara']], [['코르 카롤리', 'corcaroli'], ['알카이드', 'alkaid'], ['미자르', 'mizar']]),

  ursamajor: zone({ ra: 12.6, dec: 55.3 }, 34, [
    star('dubhe', 11.062, 61.75, 1.79),
    star('merak', 11.031, 56.38, 2.37),
    star('phecda', 11.897, 53.69, 2.44),
    star('megrez', 12.257, 57.03, 3.31),
    star('alioth', 12.900, 55.96, 1.77),
    star('mizar', 13.399, 54.93, 2.23),
    star('alkaid', 13.792, 49.31, 1.86),
  ], [
    ['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'], ['megrez', 'dubhe'],
    ['megrez', 'alioth'], ['alioth', 'mizar'], ['mizar', 'alkaid'],
  ], [['두베', 'dubhe'], ['미자르', 'mizar'], ['알카이드', 'alkaid']]),

  perseus: zone({ ra: 3.0, dec: 49.5 }, 36, [
    star('mirfak', 3.405, 49.86, 1.79),  // α
    star('algol', 3.136, 40.96, 2.1),    // β(변광성)
    star('gamma', 3.080, 53.51, 2.93),
    star('delta', 3.715, 47.79, 3.01),
    star('epsilon', 3.964, 40.01, 2.89),
    star('eta', 2.845, 55.90, 3.76),
    star('kappa', 3.158, 44.86, 3.80),
    star('rho', 3.086, 38.84, 3.39),
  ], [
    ['eta', 'gamma'], ['gamma', 'mirfak'], ['mirfak', 'delta'], ['delta', 'epsilon'],
    ['mirfak', 'kappa'], ['kappa', 'algol'], ['algol', 'rho'],
  ], [['미르팍', 'mirfak'], ['알골', 'algol'], ['페르세우스자리 에타별', 'eta']]),

  hercules: zone({ ra: 16.85, dec: 30.2 }, 31, [
    star('zeta', 16.688, 31.60, 2.81),
    star('eta', 16.715, 38.92, 3.48),
    star('pi', 17.251, 36.81, 3.16),
    star('epsilon', 17.005, 30.93, 3.92),
    star('kornephoros', 16.504, 21.49, 2.77), // β
    star('delta', 17.250, 24.84, 3.12),
  ], [
    ['zeta', 'eta'], ['eta', 'pi'], ['pi', 'epsilon'], ['epsilon', 'zeta'],
    ['zeta', 'kornephoros'], ['epsilon', 'delta'],
  ], [['헤르쿨레스자리 제타별', 'zeta'], ['헤르쿨레스자리 에타별', 'eta'], ['코르네포로스', 'kornephoros']]),

  taurus: zone({ ra: 4.5, dec: 20.5 }, 36, [
    star('aldebaran', 4.599, 16.51, 0.86), // α
    star('elnath', 5.438, 28.61, 1.65),    // β
    star('zeta', 5.627, 21.14, 3.0),
    star('theta2', 4.478, 15.87, 3.40),
    star('gamma', 4.330, 15.63, 3.65),
    star('delta1', 4.382, 17.54, 3.76),
    star('epsilon', 4.477, 19.18, 3.53),
    star('lambda', 4.011, 12.49, 3.47),
    star('alcyone', 3.791, 24.11, 2.87),   // η, 플레이아데스에서 가장 밝은 별(선으로 잇지 않는다)
  ], [
    ['gamma', 'delta1'], ['delta1', 'epsilon'], ['epsilon', 'elnath'], ['gamma', 'theta2'],
    ['theta2', 'aldebaran'], ['aldebaran', 'zeta'], ['gamma', 'lambda'],
  ], [['알데바란', 'aldebaran'], ['엘나트', 'elnath']]),

  // ── 하늘 적도 부근
  scutum: zone({ ra: 18.68, dec: -8.5 }, 20, [
    star('alpha', 18.587, -8.24, 3.85),
    star('beta', 18.786, -4.75, 4.22),
    star('gamma', 18.486, -14.57, 4.67),
    star('delta', 18.705, -9.05, 4.72),
    star('lambdaAql', 19.104, -4.88, 3.43), // 독수리자리 λ(꼬리)
  ], [['beta', 'alpha'], ['alpha', 'gamma'], ['gamma', 'delta'], ['delta', 'beta']],
  [['방패자리 알파별', 'alpha'], ['방패자리 베타별', 'beta'], ['독수리자리 람다별', 'lambdaAql']]),

  serpens: zone({ ra: 18.1, dec: -7.0 }, 34, [
    star('xi', 17.627, -15.40, 3.54),
    star('omicron', 17.690, -12.88, 4.26),
    star('zeta', 18.008, -3.69, 4.62),
    star('eta', 18.355, -2.90, 3.26),
    star('theta', 18.937, 4.20, 4.1),
    star('nuOph', 17.984, -9.77, 3.33), // 뱀주인자리 ν
  ], [['xi', 'omicron'], ['omicron', 'zeta'], ['zeta', 'eta'], ['eta', 'theta']],
  [['뱀자리 에타별', 'eta'], ['뱀자리 크시별', 'xi'], ['뱀주인자리 뉴별', 'nuOph']]),

  ophiuchus: zone({ ra: 17.0, dec: -17.5 }, 44, [
    star('yedPrior', 16.239, -3.69, 2.74),  // δ
    star('yedPosterior', 16.305, -4.69, 3.24), // ε
    star('zeta', 16.619, -10.57, 2.56),
    star('sabik', 17.173, -15.72, 2.43),    // η
    star('theta', 17.367, -25.00, 3.27),
    star('antares', 16.490, -26.43, 1.06),  // 전갈자리 α
  ], [['yedPrior', 'yedPosterior'], ['zeta', 'sabik'], ['sabik', 'theta']],
  [['사빅', 'sabik'], ['뱀주인자리 세타별', 'theta'], ['안타레스', 'antares']]),

  virgo: zone({ ra: 12.8, dec: -9.0 }, 34, [
    star('spica', 13.420, -11.16, 0.97),   // α
    star('theta', 13.166, -5.54, 4.38),
    star('porrima', 12.694, -1.45, 2.74),  // γ
    star('eta', 12.332, -0.67, 3.89),
    star('zavijava', 11.845, 1.76, 3.61),  // β
    star('gienah', 12.263, -17.54, 2.59),  // 까마귀자리 γ
    star('algorab', 12.498, -16.52, 2.95), // 까마귀자리 δ
  ], [['spica', 'theta'], ['theta', 'porrima'], ['porrima', 'eta'], ['eta', 'zavijava']],
  [['스피카', 'spica'], ['포리마', 'porrima'], ['까마귀자리 델타별', 'algorab']]),

  orion: zone({ ra: 5.6, dec: 0 }, 32, [
    star('betelgeuse', 5.919, 7.41, 0.5),
    star('rigel', 5.242, -8.20, 0.13),
    star('bellatrix', 5.419, 6.35, 1.64),
    star('mintaka', 5.533, -0.30, 2.23),
    star('alnilam', 5.604, -1.20, 1.69),
    star('alnitak', 5.679, -1.94, 1.77),
    star('saiph', 5.796, -9.67, 2.06),
    star('meissa', 5.586, 9.93, 3.39),
  ], [
    ['meissa', 'betelgeuse'], ['meissa', 'bellatrix'], ['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'],
    ['mintaka', 'alnilam'], ['alnilam', 'alnitak'], ['alnitak', 'saiph'], ['mintaka', 'rigel'],
  ], [['베텔게우스', 'betelgeuse'], ['리겔', 'rigel'], ['삼태성', 'alnilam'], ['벨라트릭스', 'bellatrix']]),

  eridanus: zone({ ra: 4.6, dec: -6.5 }, 30, [
    star('cursa', 5.131, -5.09, 2.79),     // β
    star('omega', 4.881, -5.45, 4.39),
    star('mu', 4.758, -3.25, 4.02),
    star('nu', 4.605, -3.35, 3.93),
    star('omicron1', 4.198, -6.84, 4.04),
    star('zaurak', 3.967, -13.51, 2.95),   // γ
    star('delta', 3.721, -9.76, 3.52),
    star('rigel', 5.242, -8.20, 0.13),     // 오리온자리 β
  ], [['cursa', 'omega'], ['omega', 'mu'], ['mu', 'nu'], ['nu', 'omicron1'], ['omicron1', 'zaurak'], ['zaurak', 'delta']],
  [['리겔', 'rigel'], ['쿠르사', 'cursa'], ['자우라크', 'zaurak']]),

  // ── 남쪽 하늘
  sagittarius: zone({ ra: 18.75, dec: -25.0 }, 36, [
    star('kausAustralis', 18.403, -34.38, 1.85), // ε
    star('nunki', 18.921, -26.30, 2.05),         // σ
    star('ascella', 19.044, -29.88, 2.60),       // ζ
    star('kausMedia', 18.350, -29.83, 2.70),     // δ
    star('kausBorealis', 18.466, -25.42, 2.81),  // λ
    star('alnasl', 18.097, -30.42, 2.99),        // γ²
    star('phi', 18.761, -26.99, 3.17),
    star('tau', 19.116, -27.67, 3.32),
  ], [
    ['alnasl', 'kausMedia'], ['alnasl', 'kausAustralis'], ['kausMedia', 'kausAustralis'],
    ['kausMedia', 'kausBorealis'], ['kausBorealis', 'phi'], ['kausMedia', 'phi'],
    ['phi', 'ascella'], ['ascella', 'kausAustralis'], ['phi', 'nunki'], ['nunki', 'tau'], ['tau', 'ascella'],
  ], [['눈키', 'nunki'], ['카우스 보레알리스', 'kausBorealis'], ['알나슬', 'alnasl'], ['카우스 아우스트랄리스', 'kausAustralis']]),

  scorpius: zone({ ra: 16.95, dec: -31.3 }, 40, [
    star('acrab', 16.091, -19.81, 2.62),    // β
    star('dschubba', 16.006, -22.62, 2.29), // δ
    star('pi', 15.981, -26.11, 2.89),
    star('antares', 16.490, -26.43, 1.06),  // α
    star('tau', 16.598, -28.22, 2.82),
    star('epsilon', 16.836, -34.29, 2.29),
    star('mu1', 16.864, -38.05, 3.0),
    star('sargas', 17.622, -43.00, 1.86),   // θ
    star('kappa', 17.708, -39.03, 2.39),
    star('shaula', 17.560, -37.10, 1.62),   // λ
  ], [
    ['acrab', 'dschubba'], ['dschubba', 'pi'], ['dschubba', 'antares'], ['antares', 'tau'],
    ['tau', 'epsilon'], ['epsilon', 'mu1'], ['mu1', 'sargas'], ['sargas', 'kappa'], ['kappa', 'shaula'],
  ], [['안타레스', 'antares'], ['샤울라', 'shaula']]),

  centaurus: zone({ ra: 13.7, dec: -51.0 }, 38, [
    star('rigilKent', 14.660, -60.83, -0.27), // α
    star('hadar', 14.064, -60.37, 0.61),      // β
    star('gamma', 12.692, -48.96, 2.17),
    star('delta', 12.139, -50.72, 2.52),
    star('epsilon', 13.665, -53.47, 2.30),
    star('zeta', 13.926, -47.29, 2.55),
    star('eta', 14.592, -42.16, 2.31),
  ], [
    ['delta', 'gamma'], ['gamma', 'epsilon'], ['epsilon', 'hadar'], ['hadar', 'rigilKent'],
    ['epsilon', 'zeta'], ['zeta', 'eta'],
  ], [['센타우루스자리 알파별', 'rigilKent'], ['하다르', 'hadar'], ['센타우루스자리 제타별', 'zeta'], ['센타우루스자리 감마별', 'gamma']]),

  vela: zone({ ra: 8.7, dec: -50.0 }, 30, [
    star('gamma', 8.159, -47.34, 1.83),  // γ²
    star('delta', 8.745, -54.71, 1.96),
    star('lambda', 9.133, -43.43, 2.21),
    star('kappa', 9.368, -55.01, 2.47),
    star('phi', 9.948, -54.57, 3.54),
    star('psi', 9.512, -40.47, 3.60),
  ], [['gamma', 'delta'], ['delta', 'kappa'], ['kappa', 'phi'], ['gamma', 'lambda'], ['lambda', 'psi']],
  [['돛자리 감마별', 'gamma'], ['돛자리 델타별', 'delta'], ['돛자리 람다별', 'lambda']]),

  coronaaustralis: zone({ ra: 19.0, dec: -38.5 }, 24, [
    star('epsilon', 18.979, -37.11, 4.87),
    star('gamma', 19.107, -37.06, 4.21),
    star('alpha', 19.158, -37.90, 4.10),
    star('beta', 19.167, -39.34, 4.11),
    star('delta', 19.139, -40.50, 4.59),
    star('zeta', 19.052, -42.10, 4.75),
    star('theta', 18.558, -42.31, 4.64),
    star('kausAustralis', 18.403, -34.38, 1.85), // 궁수자리 ε
  ], [['epsilon', 'gamma'], ['gamma', 'alpha'], ['alpha', 'beta'], ['beta', 'delta'], ['delta', 'zeta'], ['zeta', 'theta']],
  [['남쪽왕관자리 알파별', 'alpha'], ['남쪽왕관자리 감마별', 'gamma'], ['카우스 아우스트랄리스', 'kausAustralis']]),

  chamaeleon: zone({ ra: 10.3, dec: -76.0 }, 36, [
    star('alpha', 8.309, -76.92, 4.07),
    star('gamma', 10.591, -78.61, 4.11),
    star('epsilon', 11.994, -78.22, 4.91),
    star('beta', 12.306, -79.31, 4.26),
    star('delta2', 10.763, -80.54, 4.45),
    star('miaplacidus', 9.220, -69.72, 1.68), // 용골자리 β
    star('alphaMus', 12.620, -69.14, 2.69),   // 파리자리 α
  ], [['alpha', 'gamma'], ['gamma', 'epsilon'], ['epsilon', 'beta'], ['beta', 'delta2'], ['delta2', 'gamma']],
  [['카멜레온자리 알파별', 'alpha'], ['카멜레온자리 감마별', 'gamma'], ['미아플라키두스', 'miaplacidus'], ['파리자리 알파별', 'alphaMus']]),

  carina: zone({ ra: 10.3, dec: -62.5 }, 34, [
    star('avior', 8.375, -59.51, 1.86),        // ε
    star('aspidiske', 9.285, -59.28, 2.21),    // ι
    star('q', 10.285, -61.33, 3.39),
    star('theta', 10.716, -64.39, 2.76),
    star('omega', 10.229, -70.04, 3.32),
    star('miaplacidus', 9.220, -69.72, 1.68),  // β
    star('upsilon', 9.785, -65.07, 3.01),
  ], [
    ['avior', 'aspidiske'], ['aspidiske', 'q'], ['q', 'theta'], ['theta', 'omega'],
    ['omega', 'miaplacidus'], ['miaplacidus', 'upsilon'], ['upsilon', 'aspidiske'],
  ], [['미아플라키두스', 'miaplacidus'], ['아비오르', 'avior'], ['용골자리 세타별', 'theta']]),

  tucana: zone({ ra: 0.0, dec: -66.0 }, 40, [
    star('alpha', 22.308, -60.26, 2.86),
    star('gamma', 23.290, -58.24, 3.99),
    star('beta1', 0.526, -62.96, 4.37),
    star('zeta', 0.334, -64.87, 4.23),
    star('epsilon', 23.998, -65.58, 4.50),
    star('delta', 22.455, -64.97, 4.48),
    star('achernar', 1.629, -57.24, 0.46),  // 에리다누스자리 α
    star('betaHyi', 0.429, -77.25, 2.80),   // 물뱀자리 β
  ], [['alpha', 'gamma'], ['gamma', 'beta1'], ['beta1', 'zeta'], ['zeta', 'epsilon'], ['epsilon', 'delta'], ['delta', 'alpha']],
  [['아케르나르', 'achernar'], ['물뱀자리 베타별', 'betaHyi'], ['큰부리새자리 알파별', 'alpha']]),
};
