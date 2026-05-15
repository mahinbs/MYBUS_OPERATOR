import type { SeatClass } from "./seatClasses";
import { getFareAmount } from "./fleetPricing";

export type PromoRule = {
  id: string;
  label: string;
  /** 0=Sun … 6=Sat */
  days: number[];
  percentOff: number;
  enabled: boolean;
};

const STORAGE_KEY = "mybus_promo_v1";

const DEFAULT_RULES: PromoRule[] = [
  { id: "weekend", label: "Weekend (+10%)", days: [0, 6], percentOff: -10, enabled: true },
  { id: "weekday", label: "Weekday (-5%)", days: [1, 2, 3, 4, 5], percentOff: 5, enabled: true },
];

export function readPromoRules(): PromoRule[] {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RULES;
    const parsed = JSON.parse(raw) as PromoRule[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

export function writePromoRules(rules: PromoRule[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new Event("mybus:promo-updated"));
  } catch {
    /* ignore */
  }
}

export function applyPromoToFare(baseFare: number, dateIso?: string): number {
  const d = dateIso ? new Date(dateIso + "T12:00:00") : new Date();
  const day = d.getDay();
  const rules = readPromoRules().filter((r) => r.enabled && r.days.includes(day));
  let fare = baseFare;
  for (const rule of rules) {
    if (rule.percentOff > 0) fare = Math.round(fare * (1 - rule.percentOff / 100));
    else fare = Math.round(fare * (1 + Math.abs(rule.percentOff) / 100));
  }
  return Math.max(1, fare);
}

export function getEffectiveFare(
  routeId: string,
  busId: string,
  seatClass: SeatClass,
  dateIso?: string
): number | undefined {
  const base = getFareAmount(routeId, busId, seatClass);
  if (base == null) return undefined;
  return applyPromoToFare(base, dateIso);
}

export function formatEffectiveFare(
  routeId: string,
  busId: string,
  seatClass: SeatClass,
  dateIso?: string
): string {
  const n = getEffectiveFare(routeId, busId, seatClass, dateIso);
  return n != null ? `₹ ${n.toLocaleString("en-IN")}` : "—";
}
