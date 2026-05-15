import type { BookingRecord } from "./localBookings";
import { readBookings } from "./localBookings";

/** Generate seat labels for a bus capacity (demo layout). */
export function generateSeatLabels(capacity: number, seatClass: "seater" | "sleeper"): string[] {
  const cols = seatClass === "sleeper" ? 3 : 4;
  const rows = Math.ceil(capacity / cols);
  const labels: string[] = [];
  for (let r = 1; r <= rows && labels.length < capacity; r++) {
    for (let c = 0; c < cols && labels.length < capacity; c++) {
      const letter = String.fromCharCode(65 + c);
      labels.push(`${r}${letter}`);
    }
  }
  return labels;
}

export function takenSeats(
  bookings: BookingRecord[],
  routeId: string,
  busId: string,
  tripId?: string
): Set<string> {
  const taken = new Set<string>();
  bookings
    .filter((b) => {
      if (b.status === "Cancelled") return false;
      if (b.bus !== busId) return false;
      if (tripId && b.tripId) return b.tripId === tripId;
      return b.routeId === routeId || !b.routeId;
    })
    .forEach((b) => {
      const seat = b.seat.replace(/^(SL|ST)-/, "");
      taken.add(seat.toUpperCase());
    });
  return taken;
}

export function isSeatLabelTaken(
  bookings: BookingRecord[],
  routeId: string,
  busId: string,
  seatLabel: string,
  tripId?: string
): boolean {
  return takenSeats(bookings, routeId, busId, tripId).has(seatLabel.toUpperCase());
}
