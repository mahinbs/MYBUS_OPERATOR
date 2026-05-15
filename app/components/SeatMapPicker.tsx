"use client";

import { useMemo } from "react";
import type { BookingRecord } from "../../lib/localBookings";
import { generateSeatLabels, takenSeats } from "../../lib/seatMap";
import type { SeatClass } from "../../lib/seatClasses";

export default function SeatMapPicker({
  capacity,
  seatClass,
  routeId,
  busId,
  tripId,
  bookings,
  value,
  onChange,
}: {
  capacity: number;
  seatClass: SeatClass;
  routeId: string;
  busId: string;
  tripId?: string;
  bookings: BookingRecord[];
  value: string;
  onChange: (seat: string) => void;
}) {
  const labels = useMemo(() => generateSeatLabels(capacity, seatClass), [capacity, seatClass]);
  const taken = useMemo(
    () => takenSeats(bookings, routeId, busId, tripId),
    [bookings, routeId, busId, tripId]
  );

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pick seat</p>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
        {labels.map((label) => {
          const isTaken = taken.has(label.toUpperCase());
          const selected = value.toUpperCase() === label.toUpperCase();
          return (
            <button
              key={label}
              type="button"
              disabled={isTaken}
              onClick={() => onChange(label)}
              className={`rounded-lg py-2 text-[10px] font-semibold ${
                isTaken
                  ? "cursor-not-allowed bg-slate-200 text-slate-400 line-through"
                  : selected
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-violet-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
