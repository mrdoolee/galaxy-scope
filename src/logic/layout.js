// 구역 안 천체 자리는 src/logic/chart.js의 chartLayout(실제 하늘을 따른 배치)이 정한다.

// 하늘 지도에 보일 구역: 필수 카드가 하나라도 있는 구역(ZONES 순서 그대로).
export function mapZoneIds(deck, zones) {
  const used = new Set(deck.map((o) => o.zone));
  return zones.filter((z) => used.has(z.id)).map((z) => z.id);
}
