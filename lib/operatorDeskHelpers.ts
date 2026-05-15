import type { BookingRecord } from "./localBookings";
import { tripsForDate, enrichTripRow } from "./tripStore";

export type DeskStats = {
  walkInsToday: number;
  pending: number;
  confirmed: number;
  revenueLabel: string;
};

export function todayDepartures() {
  const today = new Date().toISOString().slice(0, 10);
  return tripsForDate(today).map((t) => {
    const e = enrichTripRow(t);
    const statusMap: Record<string, "Boarding" | "On time" | "Scheduled" | "Delayed"> = {
      Boarding: "Boarding",
      Scheduled: "Scheduled",
      Delayed: "Delayed",
      Departed: "On time",
      "En Route": "On time",
      Completed: "On time",
      Cancelled: "Scheduled",
    };
    return {
      tripId: t.id,
      routeId: t.routeId,
      time: t.departure,
      bus: t.busId,
      status: statusMap[t.status] ?? "Scheduled",
      routeLabel: t.routeLabel,
      seats: e.seats,
    };
  });
}

function parseRupee(amount: string): number {
  const n = parseInt(amount.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function normalizeSeat(seat: string): string {
  return seat.replace(/^(SL|ST)-/, "").trim().toUpperCase();
}

function isTodayWalkIn(b: BookingRecord): boolean {
  if (b.source !== "Walk-in") return false;
  const idNum = parseInt(b.id.replace(/\D/g, ""), 10);
  if (!Number.isFinite(idNum)) return true;
  const created = new Date(idNum);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

export function computeDeskStats(bookings: BookingRecord[]): DeskStats {
  const walkIns = bookings.filter((b) => b.source === "Walk-in");
  const walkInsToday = walkIns.filter(isTodayWalkIn);
  const active = walkInsToday.filter((b) => b.status !== "Cancelled");
  const pending = active.filter((b) => b.status === "Pending").length;
  const confirmed = active.filter((b) => b.status === "Confirmed").length;
  const total = active.reduce((sum, b) => sum + parseRupee(b.amount), 0);
  const revenueLabel = total > 0 ? `₹ ${total.toLocaleString("en-IN")}` : "₹ 0";
  return { walkInsToday: walkInsToday.length, pending, confirmed, revenueLabel };
}

export function isSeatTaken(
  bookings: BookingRecord[],
  routeId: string,
  bus: string,
  seat: string,
  tripId?: string,
  excludeId?: string
): boolean {
  const s = normalizeSeat(seat);
  if (!s || !bus || !routeId) return false;
  return bookings.some((b) => {
    if (b.id === excludeId || b.status === "Cancelled" || b.bus !== bus) return false;
    if (tripId && b.tripId && b.tripId !== tripId) return false;
    if (!tripId && b.routeId && b.routeId !== routeId) return false;
    return normalizeSeat(b.seat) === s;
  });
}

export function recentWalkIns(bookings: BookingRecord[], limit = 5): BookingRecord[] {
  return bookings.filter((b) => b.source === "Walk-in").slice(0, limit);
}

export function counterSalesToday(bookings: BookingRecord[]) {
  const map = new Map<string, { name: string; count: number; revenue: number }>();
  bookings
    .filter((b) => b.source === "Walk-in" && b.status !== "Cancelled" && isTodayWalkIn(b))
    .forEach((b) => {
      const key = b.operatorId ?? b.operatorName ?? "Unknown";
      const cur = map.get(key) ?? { name: b.operatorName ?? key, count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += parseRupee(b.amount);
      map.set(key, cur);
    });
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}
