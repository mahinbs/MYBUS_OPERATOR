"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readFleet } from "../../lib/fleetPersistence";
import { readManagedRoutes } from "../../lib/managedRoutes";
import {
  createTrip,
  enrichTripRow,
  readTrips,
  tripsForDate,
  tripsSummaryForDate,
  updateTripStatus,
  upsertTrip,
  type ScheduledTrip,
  type TripStatus,
} from "../../lib/tripStore";

const STATUS_OPTIONS: TripStatus[] = [
  "Scheduled",
  "Boarding",
  "Departed",
  "En Route",
  "Delayed",
  "Completed",
  "Cancelled",
];

type TripForm = {
  routeId: string;
  busId: string;
  departure: string;
  arrival: string;
  date: string;
  editingId: string | null;
};

const emptyForm = (): TripForm => ({
  routeId: "",
  busId: "",
  departure: "",
  arrival: "",
  date: new Date().toISOString().slice(0, 10),
  editingId: null,
});

export default function TripSchedulingScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [trips, setTrips] = useState<ScheduledTrip[]>(() => readTrips());
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<TripForm>(emptyForm);
  const routes = useMemo(() => readManagedRoutes(), []);
  const fleet = useMemo(() => readFleet().filter((b) => b.status === "Active"), []);

  const refresh = useCallback(() => setTrips(readTrips()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("mybus:trips-updated", refresh);
    window.addEventListener("mybus:bookings-updated", refresh);
    return () => {
      window.removeEventListener("mybus:trips-updated", refresh);
      window.removeEventListener("mybus:bookings-updated", refresh);
    };
  }, [refresh]);

  const dayTrips = useMemo(() => tripsForDate(selectedDate).map(enrichTripRow), [trips, selectedDate]);
  const summary = useMemo(() => tripsSummaryForDate(selectedDate), [trips, selectedDate]);

  const openNewTrip = () => {
    setForm({ ...emptyForm(), date: selectedDate, routeId: routes[0]?.id ?? "", busId: fleet[0]?.id ?? "" });
    setShowAddModal(true);
  };

  const openEditTrip = (trip: ScheduledTrip) => {
    setForm({
      routeId: trip.routeId,
      busId: trip.busId,
      departure: trip.departure,
      arrival: trip.arrival,
      date: trip.date,
      editingId: trip.id,
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setForm(emptyForm());
  };

  const saveTrip = () => {
    const route = routes.find((r) => r.id === form.routeId);
    const bus = fleet.find((b) => b.id === form.busId);
    if (!route || !bus) return;
    const payload = {
      routeId: form.routeId,
      routeLabel: `${route.from} \u2192 ${route.to}`,
      busId: form.busId,
      busName: bus.name,
      date: form.date,
      departure: form.departure.trim() || "-",
      arrival: form.arrival.trim() || "-",
      status: "Scheduled" as TripStatus,
    };
    if (form.editingId) {
      const existing = readTrips().find((t) => t.id === form.editingId);
      if (existing) upsertTrip({ ...existing, ...payload });
    } else {
      createTrip(payload);
    }
    closeModal();
    refresh();
  };

  const revenueLabel =
    summary.revenue >= 100000
      ? `Rs ${(summary.revenue / 100000).toFixed(2)}L`
      : summary.revenue >= 1000
        ? `Rs ${(summary.revenue / 1000).toFixed(1)}K`
        : `Rs ${summary.revenue.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-app w-full bg-[#F0F0F5] pb-nav">
      <div className="rounded-b-[28px] bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pb-6 pt-safe shadow-xl sm:pt-12">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-white">Schedule</h1>
          <div className="flex gap-2">
            <button type="button" onClick={() => onNavigate("bookings")} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10" aria-label="Bookings">
              <i className="ri-ticket-line text-lg text-white" />
            </button>
            <button type="button" onClick={openNewTrip} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10" aria-label="Add trip">
              <i className="ri-add-line text-lg text-white" />
            </button>
          </div>
        </div>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white" />
      </div>

      <div className="mt-5 px-5">
        <div className="mb-5 flex gap-3">
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-bold text-[#111827]">{summary.count}</p>
            <p className="text-[10px] text-[#9CA3AF]">Trips</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-bold text-[#7C3AED]">{summary.occupancy}%</p>
            <p className="text-[10px] text-[#9CA3AF]">Occupancy</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-bold text-[#10B981]">{revenueLabel}</p>
            <p className="text-[10px] text-[#9CA3AF]">Revenue</p>
          </div>
        </div>

        <div className="space-y-4">
          {dayTrips.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">No trips on this date.</p>
          ) : (
            dayTrips.map((trip) => (
              <div key={trip.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">{trip.id}</p>
                    <p className="text-[10px] text-slate-500">{trip.busName}</p>
                    <p className="text-xs text-slate-600">{trip.routeLabel}</p>
                  </div>
                  <select
                    value={trip.status}
                    onChange={(e) => {
                      updateTripStatus(trip.id, e.target.value as TripStatus);
                      refresh();
                    }}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[10px]"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mb-2 text-[11px] text-slate-500">
                  {trip.departure} - {trip.arrival} | {trip.seats} | {trip.revenue}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onNavigate("desk")} className="flex-1 rounded-xl bg-violet-50 py-2 text-[11px] font-semibold text-violet-800">
                    Sell seats
                  </button>
                  <button type="button" onClick={() => openEditTrip(trip)} className="flex-1 rounded-xl bg-slate-100 py-2 text-[11px] font-semibold">
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/50" onClick={closeModal} role="presentation">
          <div className="w-full rounded-t-[28px] bg-white p-6 pb-safe" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3 className="mb-4 text-lg font-bold">{form.editingId ? "Edit trip" : "Schedule trip"}</h3>
            <div className="space-y-3">
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm" />
              <select value={form.routeId} onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value }))} className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm">
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.from} - {r.to}
                  </option>
                ))}
              </select>
              <select value={form.busId} onChange={(e) => setForm((f) => ({ ...f, busId: e.target.value }))} className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm">
                {fleet.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} {b.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Departure" value={form.departure} onChange={(e) => setForm((f) => ({ ...f, departure: e.target.value }))} className="rounded-xl bg-slate-100 px-4 py-3 text-sm" />
                <input placeholder="Arrival" value={form.arrival} onChange={(e) => setForm((f) => ({ ...f, arrival: e.target.value }))} className="rounded-xl bg-slate-100 px-4 py-3 text-sm" />
              </div>
            </div>
            <button type="button" onClick={saveTrip} className="mt-4 w-full rounded-2xl bg-violet-600 py-3.5 text-sm font-semibold text-white">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
