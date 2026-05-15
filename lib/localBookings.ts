import type { SeatClass } from "./seatClasses";

export type RefundPolicy = "full" | "partial" | "none";

export type BookingRecord = {
  id: string;
  passenger: string;
  phone: string;
  route: string;
  routeId?: string;
  tripId?: string;
  bus: string;
  seat: string;
  seatClass?: SeatClass;
  amount: string;
  status: string;
  time: string;
  source: "Online" | "Walk-in";
  operatorId?: string;
  operatorName?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundPolicy?: RefundPolicy;
  cancelReason?: string;
};

const STORAGE_KEY = "mybus_bookings_v2";

const seed: BookingRecord[] = [
  {
    id: "BK-1001",
    passenger: "Rahul Kumar",
    phone: "+91 98765 43210",
    route: "Mumbai → Pune",
    routeId: "RT-101",
    tripId: "TRP-401",
    bus: "MB-001",
    seat: "12A",
    seatClass: "sleeper",
    amount: "₹ 450",
    status: "Confirmed",
    time: "10:30 AM",
    source: "Online",
  },
  {
    id: "BK-1002",
    passenger: "Priya Sharma",
    phone: "+91 87654 32109",
    route: "Delhi → Jaipur",
    routeId: "RT-205",
    tripId: "TRP-203",
    bus: "MB-002",
    seat: "08B",
    seatClass: "seater",
    amount: "₹ 650",
    status: "Confirmed",
    time: "02:00 PM",
    source: "Online",
  },
  {
    id: "BK-1003",
    passenger: "Amit Patel",
    phone: "+91 76543 21098",
    route: "Bangalore → Hyderabad",
    routeId: "RT-312",
    tripId: "TRP-105",
    bus: "MB-003",
    seat: "05C",
    seatClass: "sleeper",
    amount: "₹ 950",
    status: "Pending",
    time: "06:15 PM",
    source: "Online",
  },
  {
    id: "BK-1004",
    passenger: "Sneha Gupta",
    phone: "+91 65432 10987",
    route: "Mumbai → Pune",
    routeId: "RT-101",
    bus: "MB-001",
    seat: "15D",
    seatClass: "sleeper",
    amount: "₹ 450",
    status: "Cancelled",
    time: "10:30 AM",
    source: "Online",
    cancelledAt: new Date().toISOString(),
    refundPolicy: "full",
    refundAmount: 450,
  },
  {
    id: "BK-1005",
    passenger: "Vikram Rao",
    phone: "+91 54321 09876",
    route: "Delhi → Jaipur",
    routeId: "RT-205",
    tripId: "TRP-203",
    bus: "MB-004",
    seat: "22A",
    seatClass: "seater",
    amount: "₹ 650",
    status: "Confirmed",
    time: "02:00 PM",
    source: "Online",
  },
];

function parseSeatClassFromSeat(seat: string): SeatClass | undefined {
  if (seat.startsWith("SL-")) return "sleeper";
  if (seat.startsWith("ST-")) return "seater";
  return undefined;
}

function normalize(raw: unknown): BookingRecord[] {
  if (!Array.isArray(raw)) return seed;
  return raw.map((b: BookingRecord) => {
    const seatClass = b.seatClass ?? parseSeatClassFromSeat(b.seat);
    let seat = b.seat;
    if (seatClass && !seat.startsWith("SL-") && !seat.startsWith("ST-")) {
      seat = seat.replace(/^(SL|ST)-/, "");
    }
    return {
      ...b,
      seat,
      seatClass,
      source: b.source === "Walk-in" ? "Walk-in" : "Online",
      routeId: b.routeId,
      tripId: b.tripId,
      operatorId: b.operatorId,
      operatorName: b.operatorName,
      cancelledAt: b.cancelledAt,
      refundAmount: b.refundAmount,
      refundPolicy: b.refundPolicy,
      cancelReason: b.cancelReason,
    };
  });
}

export function readBookings(): BookingRecord[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return normalize(JSON.parse(raw));
  } catch {
    return seed;
  }
}

export function writeBookings(rows: BookingRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new Event("mybus:bookings-updated"));
  } catch {
    /* ignore */
  }
}

export function addWalkInBooking(
  row: Omit<BookingRecord, "id" | "source" | "status"> & { status?: string; source?: BookingRecord["source"] }
) {
  const list = readBookings();
  const id = `BK-${Date.now().toString().slice(-6)}`;
  const next: BookingRecord = {
    id,
    passenger: row.passenger,
    phone: row.phone,
    route: row.route,
    routeId: row.routeId,
    tripId: row.tripId,
    bus: row.bus,
    seat: row.seat,
    seatClass: row.seatClass,
    amount: row.amount,
    time: row.time,
    status: row.status ?? "Confirmed",
    source: row.source ?? "Walk-in",
    operatorId: row.operatorId,
    operatorName: row.operatorName,
  };
  writeBookings([next, ...list]);
  return next;
}

export function addOnlineBooking(
  row: Omit<BookingRecord, "id" | "source" | "status"> & { status?: string }
) {
  const list = readBookings();
  const id = `BK-${Date.now().toString().slice(-6)}`;
  const next: BookingRecord = {
    ...row,
    id,
    status: row.status ?? "Pending",
    source: "Online",
  };
  writeBookings([next, ...list]);
  return next;
}

export function updateBookingStatus(id: string, status: BookingRecord["status"]) {
  const list = readBookings();
  const next = list.map((b) => (b.id === id ? { ...b, status } : b));
  writeBookings(next);
  return next.find((b) => b.id === id) ?? null;
}

export function cancelBooking(
  id: string,
  opts: { policy: RefundPolicy; reason?: string; refundPercent?: number }
) {
  const list = readBookings();
  const booking = list.find((b) => b.id === id);
  if (!booking) return null;
  const fare = parseInt(booking.amount.replace(/[^\d]/g, ""), 10) || 0;
  let refundAmount = 0;
  if (opts.policy === "full") refundAmount = fare;
  else if (opts.policy === "partial") {
    const pct = opts.refundPercent ?? 50;
    refundAmount = Math.round(fare * (pct / 100));
  }
  const next = list.map((b) =>
    b.id === id
      ? {
          ...b,
          status: "Cancelled",
          cancelledAt: new Date().toISOString(),
          refundPolicy: opts.policy,
          refundAmount,
          cancelReason: opts.reason,
        }
      : b
  );
  writeBookings(next);
  return next.find((b) => b.id === id) ?? null;
}

export function rebookSeat(
  id: string,
  patch: { seat?: string; bus?: string; tripId?: string; amount?: string; seatClass?: SeatClass }
) {
  const list = readBookings();
  const next = list.map((b) => (b.id === id ? { ...b, ...patch } : b));
  writeBookings(next);
  return next.find((b) => b.id === id) ?? null;
}

export function findBookingsByPhone(phone: string): BookingRecord[] {
  const q = phone.replace(/\D/g, "");
  if (!q) return [];
  return readBookings().filter((b) => b.phone.replace(/\D/g, "").includes(q));
}
