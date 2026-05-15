import type { PersistedBus } from "./fleetPersistence";
import { readFleet } from "./fleetPersistence";
import { readManagedRoutes, type ManagedRoute } from "./managedRoutes";
import { getBusesForRoute } from "./routeBusAssignments";
import { getSeatLayoutsForBus, type SeatClass } from "./seatClasses";

export type RouteBusPricing = {
  seater?: number;
  sleeper?: number;
};

export type PricingRow = {
  routeId: string;
  routeLabel: string;
  busId: string;
  busName: string;
  layouts: SeatClass[];
  seater?: number;
  sleeper?: number;
};

const STORAGE_KEY = "mybus_fleet_pricing_v1";

function pricingKey(routeId: string, busId: string) {
  return `${routeId}|${busId}`;
}

/** Default owner-set fares (INR). Buses with both layouts have separate seater/sleeper. */
const DEFAULT_PRICING: Record<string, RouteBusPricing> = {
  "RT-101|MB-001": { sleeper: 450 },
  "RT-101|MB-002": { seater: 380 },
  "RT-101|MB-004": { seater: 420, sleeper: 520 },
  "RT-205|MB-002": { seater: 650 },
  "RT-205|MB-004": { seater: 580, sleeper: 720 },
  "RT-312|MB-001": { sleeper: 950 },
  "RT-312|MB-003": { sleeper: 890 },
};

export function formatInr(amount: number): string {
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

export function parseRupeeInput(value: string): number | undefined {
  const n = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function readFleetPricing(): Record<string, RouteBusPricing> {
  if (typeof window === "undefined") return { ...DEFAULT_PRICING };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PRICING };
    const parsed = JSON.parse(raw) as Record<string, RouteBusPricing>;
    return { ...DEFAULT_PRICING, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return { ...DEFAULT_PRICING };
  }
}

export function writeFleetPricing(store: Record<string, RouteBusPricing>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event("mybus:pricing-updated"));
  } catch {
    /* ignore */
  }
}

export function setRouteBusPricing(routeId: string, busId: string, patch: RouteBusPricing) {
  const store = readFleetPricing();
  const key = pricingKey(routeId, busId);
  const next: RouteBusPricing = {};
  if (patch.seater != null && patch.seater > 0) next.seater = patch.seater;
  if (patch.sleeper != null && patch.sleeper > 0) next.sleeper = patch.sleeper;
  if (!next.seater && !next.sleeper) delete store[key];
  else store[key] = next;
  writeFleetPricing(store);
}

export function getRouteBusPricing(routeId: string, busId: string): RouteBusPricing {
  return readFleetPricing()[pricingKey(routeId, busId)] ?? {};
}

function fallbackFromRouteBase(route: ManagedRoute | undefined, seatClass: SeatClass): number | undefined {
  if (!route) return undefined;
  const n = parseInt(route.basePrice.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return seatClass === "sleeper" ? Math.round(n * 1.15) : n;
}

export function getFareAmount(routeId: string, busId: string, seatClass: SeatClass): number | undefined {
  const stored = getRouteBusPricing(routeId, busId);
  const fromStore = stored[seatClass];
  if (fromStore != null && fromStore > 0) return fromStore;
  const route = readManagedRoutes().find((r) => r.id === routeId);
  return fallbackFromRouteBase(route, seatClass);
}

export function getFare(routeId: string, busId: string, seatClass: SeatClass): string {
  const amount = getFareAmount(routeId, busId, seatClass);
  return amount != null ? formatInr(amount) : "—";
}

export function routePriceSummary(routeId: string): string {
  const fleet = readFleet().filter((b) => b.status === "Active");
  const busIds = getBusesForRoute(routeId, fleet.map((b) => b.id));
  const amounts: number[] = [];
  for (const busId of busIds) {
    const bus = fleet.find((b) => b.id === busId);
    if (!bus) continue;
    for (const layout of getSeatLayoutsForBus(bus)) {
      const a = getFareAmount(routeId, busId, layout);
      if (a != null) amounts.push(a);
    }
  }
  if (!amounts.length) {
    const route = readManagedRoutes().find((r) => r.id === routeId);
    return route?.basePrice ?? "—";
  }
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return min === max ? formatInr(min) : `${formatInr(min)} – ${formatInr(max)}`;
}

export function buildPricingRows(): PricingRow[] {
  const routes = readManagedRoutes();
  const fleet = readFleet();
  const store = readFleetPricing();
  const rows: PricingRow[] = [];

  for (const route of routes) {
    const activeIds = fleet.filter((b) => b.status === "Active").map((b) => b.id);
    const busIds = getBusesForRoute(route.id, activeIds);
    for (const busId of busIds) {
      const bus = fleet.find((b) => b.id === busId);
      if (!bus) continue;
      const layouts = getSeatLayoutsForBus(bus);
      const p = store[pricingKey(route.id, busId)] ?? {};
      rows.push({
        routeId: route.id,
        routeLabel: `${route.from} → ${route.to}`,
        busId,
        busName: bus.name,
        layouts,
        seater: p.seater,
        sleeper: p.sleeper,
      });
    }
  }
  return rows;
}

