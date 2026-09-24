// Kept out of the map component so the ranked list can colour itself without loading Leaflet.
export function priorityColor(score: number | null): string {
  if (score === null) return "#8a99a6";
  if (score >= 0.6) return "#c0392b";
  if (score >= 0.45) return "#e08a1e";
  if (score >= 0.3) return "#d4b106";
  return "#2e8b57";
}
