import { readBookings } from "./localBookings";
import { readFleet } from "./fleetPersistence";
import { readManagedRoutes } from "./managedRoutes";

export type TripStatus = "Scheduled" | "Boarding" | "Departed" | "En Route" | "Completed" | "Cancelled" | "Delayed";

export type ScheduledTrip = {
  id: string;
  routeId: string;
  routeLabel: string;
  busId: string;
  busName: string;
  date: string; // YYYY-MM-DD
  departure: string;
  arrival: string;
  status: TripStatus;
  driverId?: string;
};

const STORAGE_KEY = "mybus_trips_v1";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_TRIPS: ScheduledTrip[] = [
  {
    id: "TRP-401",
    routeId: "RT-101",
    routeLabel: "Mumbai → Pune",
    busId: "MB-001",
    busName: "Volvo 9600 AC Sleeper",
    date: todayIso(),
    departure: "06:00 AM",
    arrival: "09:30 AM",
    status: "Departed",
  },
  {
    id: "TRP-203",
    routeId: "RT-205",
    routeLabel: "Delhi → Jaipur",
    busId: "MB-002",
    busName: "Scania Metrolink",
    date: todayIso(),
    departure: "08:30 AM",
    arrival: "01:45 PM",
    status: "En Route",
  },
  {
    id: "TRP-105",
    routeId: "RT-312",
    routeLabel: "Bangalore → Hyderabad",
    busId: "MB-003",
    busName: "Mercedes Benz OC500",
    date: todayIso(),
    departure: "10:00 PM",
    arrival: "06:45 AM",
    status: "Scheduled",
  },
];

export function readTrips(): ScheduledTrip[] {
  if (typeof window === "undefined") return DEFAULT_TRIPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TRIPS));
      return DEFAULT_TRIPS;
    }
    const parsed = JSON.parse(raw) as ScheduledTrip[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_TRIPS;
  } catch {
    return DEFAULT_TRIPS;
  }
}

export function writeTrips(trips: ScheduledTrip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    window.dispatchEvent(new Event("mybus:trips-updated"));
  } catch {
    /* ignore */
  }
}

export function upsertTrip(trip: ScheduledTrip) {
  const list = readTrips();
  const idx = list.findIndex((t) => t.id === trip.id);
  if (idx >= 0) list[idx] = trip;
  else list.unshift(trip);
  writeTrips(list);
  return trip;
}

export function updateTripStatus(id: string, status: TripStatus) {
  const list = readTrips();
  const next = list.map((t) => (t.id === id ? { ...t, status } : t));
  writeTrips(next);
}

export function createTrip(input: Omit<ScheduledTrip, "id">): ScheduledTrip {
  const id = `TRP-${Date.now().toString().slice(-5)}`;
  const trip: ScheduledTrip = { ...input, id };
  upsertTrip(trip);
  return trip;
}

export function tripsForDate(date: string): ScheduledTrip[] {
  return readTrips().filter((t) => t.date === date);
}

export function tripById(id: string): ScheduledTrip | undefined {
  return readTrips().find((t) => t.id === id);
}

export function tripSeatStats(tripId: string): { booked: number; capacity: number; revenue: number } {
  const trip = tripById(tripId);
  if (!trip) return { booked: 0, capacity: 40, revenue: 0 };
  const bus = readFleet().find((b) => b.id === trip.busId);
  const capacity = bus?.capacity ?? 40;
  const bookings = readBookings().filter(
    (b) => b.tripId === tripId && b.status !== "Cancelled"
  );
  const revenue = bookings.reduce((s, b) => {
    const n = parseInt(b.amount.replace(/[^\d]/g, ""), 10);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
  return { booked: bookings.length, capacity, revenue };
}

export function enrichTripRow(trip: ScheduledTrip) {
  const stats = tripSeatStats(trip.id);
  return {
    ...trip,
    seats: `${stats.booked}/${stats.capacity}`,
    revenue: stats.revenue > 0 ? `₹ ${stats.revenue.toLocaleString("en-IN")}` : "—",
    occupancyPct: stats.capacity ? Math.round((stats.booked / stats.capacity) * 100) : 0,
  };
}

export function tripsSummaryForDate(date: string) {
  const trips = tripsForDate(date).map(enrichTripRow);
  const totalRevenue = trips.reduce((s, t) => {
    const n = parseInt(t.revenue.replace(/[^\d]/g, ""), 10);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
  const avgOcc =
    trips.length > 0 ? Math.round(trips.reduce((s, t) => s + t.occupancyPct, 0) / trips.length) : 0;
  return { count: trips.length, occupancy: avgOcc, revenue: totalRevenue };
}

export function seedTripFromRouteBus(routeId: string, busId: string, departure: string, arrival: string) {
  const route = readManagedRoutes().find((r) => r.id === routeId);
  const bus = readFleet().find((b) => b.id === busId);
  if (!route || !bus) return null;
  return createTrip({
    routeId,
    routeLabel: `${route.from} → ${route.to}`,
    busId,
    busName: bus.name,
    date: todayIso(),
    departure,
    arrival,
    status: "Scheduled",
  });
}
