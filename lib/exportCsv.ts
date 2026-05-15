import type { BookingRecord } from "./localBookings";
import { readBookings } from "./localBookings";

export function bookingsToCsv(rows: BookingRecord[] = readBookings()): string {
  const headers = [
    "id",
    "passenger",
    "phone",
    "route",
    "routeId",
    "tripId",
    "bus",
    "seat",
    "seatClass",
    "amount",
    "status",
    "source",
    "operatorName",
    "time",
    "refundAmount",
    "cancelReason",
  ];
  const escape = (v: string | number | undefined) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  rows.forEach((b) => {
    lines.push(
      headers.map((h) => escape((b as Record<string, string | number | undefined>)[h])).join(",")
    );
  });
  return lines.join("\n");
}

export function downloadBookingsCsv(filename = "mybus-bookings.csv") {
  const csv = bookingsToCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
