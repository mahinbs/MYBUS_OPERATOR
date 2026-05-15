import { readBookings } from "./localBookings";
import { readFleet } from "./fleetPersistence";
import { tripsSummaryForDate } from "./tripStore";

function parseRupee(amount: string): number {
  const n = parseInt(amount.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function isTodayBooking(b: { id: string; time: string }): boolean {
  const idNum = parseInt(b.id.replace(/\D/g, ""), 10);
  if (Number.isFinite(idNum) && idNum > 100000) {
    const d = new Date(idNum);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  return true;
}

export type DashboardKpis = {
  totalBookings: number;
  totalBookingsChange: string;
  activeBuses: number;
  activeBusesChange: string;
  todayRevenue: number;
  todayRevenueLabel: string;
  todayRevenueChange: string;
  occupancyPct: number;
  occupancyChange: string;
};

export function computeDashboardKpis(): DashboardKpis {
  const bookings = readBookings();
  const fleet = readFleet();
  const activeBuses = fleet.filter((b) => b.status === "Active").length;
  const confirmed = bookings.filter((b) => b.status === "Confirmed");
  const todayConfirmed = confirmed.filter(isTodayBooking);
  const todayRevenue = todayConfirmed.reduce((s, b) => s + parseRupee(b.amount), 0);
  const todayIso = new Date().toISOString().slice(0, 10);
  const tripSum = tripsSummaryForDate(todayIso);

  const cancelled = bookings.filter((b) => b.status === "Cancelled").length;
  const cancelRate = bookings.length ? Math.round((cancelled / bookings.length) * 100) : 0;

  return {
    totalBookings: bookings.filter((b) => b.status !== "Cancelled").length,
    totalBookingsChange: `+${todayConfirmed.length} today`,
    activeBuses,
    activeBusesChange: `${fleet.length} total`,
    todayRevenue,
    todayRevenueLabel:
      todayRevenue >= 100000
        ? `₹ ${(todayRevenue / 100000).toFixed(2)}L`
        : todayRevenue >= 1000
          ? `₹ ${(todayRevenue / 1000).toFixed(1)}K`
          : `₹ ${todayRevenue.toLocaleString("en-IN")}`,
    todayRevenueChange: `${todayConfirmed.length} tickets`,
    occupancyPct: tripSum.occupancy || Math.min(95, Math.max(40, 100 - cancelRate)),
    occupancyChange: `${tripSum.count} trips today`,
  };
}
