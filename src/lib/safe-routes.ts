// Browser-safe demo data shared by the Safe Map page and the Leaflet map.
export type LatLng = [number, number];
export type RouteId = "A" | "B";
export type Tone = "safe" | "caution" | "danger";

export interface SafetyFactor {
  key: "lighting" | "crowd" | "reports";
  label: string;
  /** 0–100, higher = safer */
  value: number;
  detail: string;
}

export interface SafeRouteOption {
  id: RouteId;
  name: string;
  tag: string;
  durationMin: number;
  distanceKm: number;
  safetyScore: number;
  tone: Tone;
  lineClass: string;
  path: LatLng[];
  factors: SafetyFactor[];
  reportCount: number;
}

export interface DangerReport {
  id: string;
  type: string;
  position: LatLng;
  minutesAgo: number;
}

export const UNIVERSITY: LatLng = [36.7125, 3.1806];
export const RESIDENCE: LatLng = [36.7215, 3.1655];

export const ROUTES: SafeRouteOption[] = [
  {
    id: "A",
    name: "Route A: Fastest",
    tag: "Fastest",
    durationMin: 10,
    distanceKm: 1.6,
    safetyScore: 60,
    tone: "caution",
    lineClass: "route-line route-fast",
    path: [UNIVERSITY, [36.7148, 3.1768], [36.7172, 3.1724], [36.7196, 3.1688], RESIDENCE],
    factors: [
      { key: "lighting", label: "Street Lighting", value: 45, detail: "Dark stretch by the park" },
      { key: "crowd", label: "Crowd Density", value: 55, detail: "Quiet after 8 PM" },
      { key: "reports", label: "Community Reports", value: 62, detail: "3 reports this week" },
    ],
    reportCount: 3,
  },
  {
    id: "B",
    name: "Route B: Safest",
    tag: "Safest",
    durationMin: 12,
    distanceKm: 1.9,
    safetyScore: 95,
    tone: "safe",
    lineClass: "route-line route-safe",
    path: [
      UNIVERSITY,
      [36.7158, 3.1818],
      [36.7202, 3.1792],
      [36.7238, 3.1734],
      [36.7236, 3.1684],
      RESIDENCE,
    ],
    factors: [
      { key: "lighting", label: "Street Lighting", value: 96, detail: "Well-lit main avenue" },
      { key: "crowd", label: "Crowd Density", value: 92, detail: "Shops & bus stop open late" },
      { key: "reports", label: "Community Reports", value: 98, detail: "No reports this week" },
    ],
    reportCount: 0,
  },
];

export const SEED_REPORTS: DangerReport[] = [
  { id: "r1", type: "Poor lighting", position: [36.7163, 3.1741], minutesAgo: 95 },
  { id: "r2", type: "Harassment", position: [36.7184, 3.1709], minutesAgo: 340 },
  { id: "r3", type: "Isolated area", position: [36.7151, 3.1757], minutesAgo: 1260 },
];

export const REPORT_TYPES = [
  "Poor lighting",
  "Harassment",
  "Suspicious person",
  "Isolated area",
  "Being followed",
] as const;

export function toneFor(value: number): Tone {
  if (value >= 80) return "safe";
  if (value >= 60) return "caution";
  return "danger";
}
