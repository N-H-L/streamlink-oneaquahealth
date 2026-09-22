import type { ReactElement } from "react";
// Simple line pictograms for the check-in answers (48×48, stroke = currentColor).
const P = {
  fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};
const water = "#3a8fb7";

const shapes: Record<string, ReactElement> = {
  "chan-flat": <><path {...P} d="M4 16h8l4 14h16l4-14h8" /><path d="M17 26h14" stroke={water} strokeWidth="3" strokeLinecap="round" /></>,
  "chan-u": <><path {...P} d="M6 12c0 14 6 22 18 22s18-8 18-22" /><path d="M12 28c4 2 8 3 12 3s8-1 12-3" stroke={water} strokeWidth="3" strokeLinecap="round" fill="none" /></>,
  "chan-v": <><path {...P} d="M6 10l18 26 18-26" /><path d="M18 28h12" stroke={water} strokeWidth="3" strokeLinecap="round" /></>,
  natural: <><path {...P} d="M6 34c6-4 10 2 16-2s10 2 20-2" /><circle cx="14" cy="26" r="3" {...P} /><circle cx="26" cy="24" r="4" {...P} /><circle cx="36" cy="27" r="2.5" {...P} /></>,
  concrete: <><rect x="6" y="18" width="36" height="16" rx="1" {...P} /><path {...P} d="M6 26h36M18 18v8M30 26v8" /></>,
  stones: <><path {...P} d="M6 34h36" /><ellipse cx="14" cy="29" rx="7" ry="5" {...P} /><ellipse cx="28" cy="29" rx="6" ry="5" {...P} /><ellipse cx="21" cy="21" rx="6" ry="4.5" {...P} /><ellipse cx="37" cy="30" rx="4" ry="4" {...P} /></>,
  "flow-fast": <><path d="M6 18c6-4 10 4 16 0s10 4 20 0M6 26c6-4 10 4 16 0s10 4 20 0M6 34c6-4 10 4 16 0s10 4 20 0" stroke={water} strokeWidth="2.6" fill="none" strokeLinecap="round" /><path {...P} d="M36 10l6 4-6 4" /></>,
  "flow-slow": <><path d="M6 24c8-2 14 2 20 0s10 2 16 0M6 32c8-2 14 2 20 0s10 2 16 0" stroke={water} strokeWidth="2.6" fill="none" strokeLinecap="round" /></>,
  "flow-still": <><ellipse cx="24" cy="28" rx="18" ry="7" stroke={water} strokeWidth="2.6" fill="none" /><path {...P} d="M24 12v4M18 14l1 3M30 14l-1 3" /></>,
  "flow-dry": <><path {...P} d="M6 30h36" /><path {...P} d="M12 30l4-5 3 5 5-7 4 7 4-4 4 4" /><circle cx="36" cy="12" r="4" {...P} /></>,
  "water-clear": <><path d="M24 8c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z" stroke={water} strokeWidth="2.6" fill="none" /><path {...P} d="M19 31a5 5 0 0 0 5 5" /></>,
  "water-turbid": <><path d="M24 8c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z" stroke="#8a6d3b" strokeWidth="2.6" fill="#c9ad7a55" /></>,
  "water-foam": <><path d="M6 32c6-3 10 3 16 0s10 3 20 0" stroke={water} strokeWidth="2.6" fill="none" /><circle cx="14" cy="24" r="4" {...P} /><circle cx="22" cy="21" r="5" {...P} /><circle cx="31" cy="24" r="4" {...P} /><circle cx="38" cy="22" r="2.5" {...P} /></>,
  "water-colour": <><path d="M24 8c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z" stroke="#7a4f9a" strokeWidth="2.6" fill="#9b6bbd44" /></>,
  "veg-herbs": <><path {...P} d="M6 38h36M12 38c0-8 2-12 4-14M16 38c0-10-3-14-6-16M24 38c0-9 2-13 5-16M30 38c0-8-2-12-5-14M36 38c0-7 2-10 4-12" /></>,
  "veg-shrubs": <><path {...P} d="M6 38h36" /><path {...P} d="M10 38c-2-10 6-16 14-14 8-2 16 4 14 14" /><path {...P} d="M24 38v-8" /></>,
  "veg-trees": <><path {...P} d="M6 40h36M24 40V26" /><circle cx="24" cy="18" r="10" {...P} /><path {...P} d="M36 40v-8" /><circle cx="36" cy="27" r="5" {...P} /></>,
  "rating-good": <><circle cx="24" cy="24" r="16" {...P} /><path {...P} d="M17 27c4 5 10 5 14 0" /><circle cx="18.5" cy="20" r="1.6" fill="currentColor" /><circle cx="29.5" cy="20" r="1.6" fill="currentColor" /></>,
  "rating-moderate": <><circle cx="24" cy="24" r="16" {...P} /><path {...P} d="M17 29h14" /><circle cx="18.5" cy="20" r="1.6" fill="currentColor" /><circle cx="29.5" cy="20" r="1.6" fill="currentColor" /></>,
  "rating-poor": <><circle cx="24" cy="24" r="16" {...P} /><path {...P} d="M17 31c4-5 10-5 14 0" /><circle cx="18.5" cy="20" r="1.6" fill="currentColor" /><circle cx="29.5" cy="20" r="1.6" fill="currentColor" /></>,
};

export function Pictogram({ name, size = 44 }: { name?: string; size?: number }) {
  if (!name || !shapes[name]) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {shapes[name]}
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <path d="M5 19c3.5-5 7 5 11 0s7.5 5 11 0" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="23" cy="10" r="3" fill="#9fe3d0" />
    </svg>
  );
}
