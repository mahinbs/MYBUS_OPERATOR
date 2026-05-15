/** Seat inventory types a bus can sell on a route. */

export type SeatClass = "seater" | "sleeper";

export const SEAT_CLASS_LABELS: Record<SeatClass, string> = {
  seater: "Seater",
  sleeper: "Sleeper",
};

export function getSeatLayoutsForBus(bus: { type: string; seatLayouts?: SeatClass[] }): SeatClass[] {
  if (bus.seatLayouts?.length) {
    const uniq = [...new Set(bus.seatLayouts.filter((c): c is SeatClass => c === "seater" || c === "sleeper"))];
    if (uniq.length) return uniq;
  }
  const t = bus.type.toLowerCase();
  if (t.includes("semi")) return ["seater", "sleeper"];
  if (t.includes("sleeper") && t.includes("seat")) return ["seater", "sleeper"];
  if (t.includes("sleeper")) return ["sleeper"];
  return ["seater"];
}
