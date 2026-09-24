// Kept out of the map component so the ranked list can colour itself without loading Leaflet.
/** One scale, shared with the CSS tokens (--bad/--warn/--ok). The mid tone is darkened so the
 * bars stay readable on white. */
export function priorityColor(score: number | null): string {
  if (score === null) return "#7c8b95";
  if (score >= 0.6) return "#b3261e";   // visit soon   (--bad)
  if (score >= 0.45) return "#b3690b";  // elevated
  if (score >= 0.3) return "#8a6d0b";   // watch
  return "#2e7d4f";                     // low          (--ok)
}
