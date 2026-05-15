import type { BookingRecord } from "./localBookings";
import { readBookings } from "./localBookings";
import { readFleet, type PersistedBus } from "./fleetPersistence";
import { ROUTES_CATALOG } from "./routesCatalog";
import { readOwnerTeam } from "./ownerTeamStore";
import { COUNTER_BY_BUS, driverForBus } from "./driverRoster";

export type RoutePerformance = {
  routeId: string;
  label: string;
  bookings: number;
  confirmed: number;
  cancelled: number;
  revenue: number;
  revenueLabel: string;
  occupancyPct: number;
  tripsRun: number;
  cancelRatePct: number;
  score: number;
  tier: "excellent" | "good" | "average" | "low";
  insight: string;
};

export type BusPerformance = {
  busId: string;
  busName: string;
  reg: string;
  status: string;
  bookings: number;
  confirmed: number;
  revenue: number;
  revenueLabel: string;
  occupancyPct: number;
  onTimePct: number;
  operatorName: string;
  operatorPhone: string;
  driverName: string | null;
  driverPhone: string | null;
  driverStatus: string | null;
  driverRating: number | null;
  score: number;
  tier: "excellent" | "good" | "average" | "low";
  insight: string;
};

export type FleetReportSnapshot = {
  generatedAt: string;
  periodLabel: string;
  totalRevenue: number;
  totalRevenueLabel: string;
  totalBookings: number;
  fleetActive: number;
  fleetTotal: number;
  bestRoutes: RoutePerformance[];
  leastRoutes: RoutePerformance[];
  allRoutes: RoutePerformance[];
  buses: BusPerformance[];
};

function parseRupee(amount: string): number {
  const n = parseInt(amount.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function formatRupee(n: number): string {
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹ ${(n / 1000).toFixed(1)}K`;
  return `₹ ${n.toLocaleString("en-IN")}`;
}

/** Baseline when a route has few/no bookings in storage (demo analytics). */
const ROUTE_BASELINE: Record<string, { trips: number; occupancy: number; revenue: number }> = {
  "RT-101": { trips: 48, occupancy: 88, revenue: 216000 },
  "RT-205": { trips: 36, occupancy: 72, revenue: 234000 },
  "RT-312": { trips: 24, occupancy: 58, revenue: 228000 },
};

function tierFromScore(score: number): RoutePerformance["tier"] {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 50) return "average";
  return "low";
}

function routeInsight(r: RoutePerformance): string {
  if (r.tier === "excellent") return "Strong demand and solid occupancy — keep frequency and pricing.";
  if (r.tier === "good") return "Healthy route — monitor peak slots for extra trips.";
  if (r.tier === "average") return "Moderate performance — review timing, fares, or counter promotions.";
  return "Underperforming — consider schedule changes, bus swap, or marketing push.";
}

function busInsight(b: BusPerformance): string {
  if (b.status === "Maintenance") return "Bus offline — revenue impact until returned to active fleet.";
  if (b.tier === "excellent") return "Top performer — maintain driver and operator pairing.";
  if (b.tier === "good") return "Reliable unit — track occupancy on weak route days.";
  if (b.tier === "average") return "Room to improve — check route assignment and desk upsell.";
  return "Needs attention — review operator desk conversion and driver on-time record.";
}

function aggregateRoutes(bookings: BookingRecord[]): RoutePerformance[] {
  const byRoute = new Map<string, { confirmed: BookingRecord[]; cancelled: number }>();

  for (const b of bookings) {
    const key = b.routeId ?? b.route;
    const cur = byRoute.get(key) ?? { confirmed: [], cancelled: 0 };
    if (b.status === "Cancelled") cur.cancelled += 1;
    else if (b.status === "Confirmed" || b.status === "Pending") cur.confirmed.push(b);
    byRoute.set(key, cur);
  }

  return ROUTES_CATALOG.map((cat) => {
    const key = cat.id;
    const data = byRoute.get(key) ?? byRoute.get(cat.label) ?? { confirmed: [], cancelled: 0 };
    const baseline = ROUTE_BASELINE[key] ?? { trips: 20, occupancy: 60, revenue: 100000 };
    const confirmed = data.confirmed.filter((b) => b.status === "Confirmed");
    const revenueFromBookings = confirmed.reduce((s, b) => s + parseRupee(b.amount), 0);
    const revenue = revenueFromBookings > 0 ? revenueFromBookings : baseline.revenue;
    const bookingsCount = data.confirmed.length + data.cancelled;
    const tripsRun = Math.max(baseline.trips, bookingsCount);
    const occupancyPct =
      confirmed.length > 0
        ? Math.min(98, Math.round((confirmed.length / Math.max(tripsRun * 0.85, 1)) * 100))
        : baseline.occupancy;
    const cancelRatePct =
      bookingsCount > 0 ? Math.round((data.cancelled / bookingsCount) * 100) : Math.max(2, 100 - baseline.occupancy);
    const revenueScore = Math.min(100, (revenue / 250000) * 100);
    const score = Math.round(revenueScore * 0.4 + occupancyPct * 0.35 + (100 - cancelRatePct) * 0.25);
    const tier = tierFromScore(score);
    const row: RoutePerformance = {
      routeId: key,
      label: cat.label,
      bookings: bookingsCount,
      confirmed: confirmed.length,
      cancelled: data.cancelled,
      revenue,
      revenueLabel: formatRupee(revenue),
      occupancyPct,
      tripsRun,
      cancelRatePct,
      score,
      tier,
      insight: "",
    };
    row.insight = routeInsight(row);
    return row;
  }).sort((a, b) => b.score - a.score);
}

function aggregateBuses(bookings: BookingRecord[], fleet: PersistedBus[]): BusPerformance[] {
  const team = readOwnerTeam();
  const fallbackOperator = team.operator;

  return fleet.map((bus) => {
    const busBookings = bookings.filter((b) => b.bus === bus.id);
    const confirmed = busBookings.filter((b) => b.status === "Confirmed");
    const revenue = confirmed.reduce((s, b) => s + parseRupee(b.amount), 0);
    const cap = bus.capacity || 40;
    const occupancyPct =
      confirmed.length > 0
        ? Math.min(99, Math.round((confirmed.length / Math.max(cap * 0.5, 1)) * 100))
        : bus.status === "Active"
          ? 55 + (bus.id.charCodeAt(bus.id.length - 1) % 25)
          : 0;
    const driver = driverForBus(bus.id);
    const counter = COUNTER_BY_BUS[bus.id];
    const operatorName = counter?.name ?? fallbackOperator?.name ?? "Not assigned";
    const operatorPhone = counter?.phone ?? fallbackOperator?.phone ?? "—";
    const onTimePct = driver?.onTimePct ?? (bus.status === "Active" ? 90 : 0);
    const revenueScore = Math.min(100, (revenue / 50000) * 100 + (bus.status === "Active" ? 30 : 0));
    const score = Math.round(
      revenueScore * 0.35 +
        occupancyPct * 0.3 +
        onTimePct * 0.2 +
        (driver?.rating ?? 4) * 4 +
        (bus.status === "Active" ? 10 : -20)
    );
    const clamped = Math.max(0, Math.min(100, score));
    const tier = tierFromScore(clamped);
    const row: BusPerformance = {
      busId: bus.id,
      busName: bus.name,
      reg: bus.reg,
      status: bus.status,
      bookings: busBookings.length,
      confirmed: confirmed.length,
      revenue,
      revenueLabel: revenue > 0 ? formatRupee(revenue) : "₹ 0",
      occupancyPct,
      onTimePct,
      operatorName,
      operatorPhone,
      driverName: driver?.name ?? null,
      driverPhone: driver?.phone ?? null,
      driverStatus: driver?.status ?? null,
      driverRating: driver?.rating ?? null,
      score: clamped,
      tier,
      insight: "",
    };
    row.insight = busInsight(row);
    return row;
  }).sort((a, b) => b.score - a.score);
}

export function buildFleetReports(bookings?: BookingRecord[]): FleetReportSnapshot {
  const rows = bookings ?? (typeof window !== "undefined" ? readBookings() : []);
  const fleet = typeof window !== "undefined" ? readFleet() : [];
  const allRoutes = aggregateRoutes(rows);
  const bestRoutes = allRoutes.filter((r) => r.tier === "excellent" || r.tier === "good").slice(0, 2);
  const leastRoutes = [...allRoutes].sort((a, b) => a.score - b.score).slice(0, 2);
  const buses = aggregateBuses(rows, fleet);
  const totalRevenue = allRoutes.reduce((s, r) => s + r.revenue, 0);

  return {
    generatedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    periodLabel: "Last 30 days (live bookings + fleet baseline)",
    totalRevenue,
    totalRevenueLabel: formatRupee(totalRevenue),
    totalBookings: rows.filter((b) => b.status !== "Cancelled").length,
    fleetActive: fleet.filter((b) => b.status === "Active").length,
    fleetTotal: fleet.length,
    bestRoutes: bestRoutes.length ? bestRoutes : allRoutes.slice(0, 2),
    leastRoutes,
    allRoutes,
    buses,
  };
}
