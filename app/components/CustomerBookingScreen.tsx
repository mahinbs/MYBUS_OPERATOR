"use client";

import { useEffect, useMemo, useState } from "react";
import { addOnlineBooking, readBookings } from "../../lib/localBookings";
import { readFleet } from "../../lib/fleetPersistence";
import { formatEffectiveFare } from "../../lib/promoPricing";
import { readRoutesCatalog } from "../../lib/routesCatalog";
import { getBusesForRoute } from "../../lib/routeBusAssignments";
import { getSeatLayoutsForBus, SEAT_CLASS_LABELS, type SeatClass } from "../../lib/seatClasses";
import { tripsForDate } from "../../lib/tripStore";
import SeatMapPicker from "./SeatMapPicker";
import { isSeatTaken } from "../../lib/operatorDeskHelpers";

export default function CustomerBookingScreen({ onClose }: { onClose: () => void }) {
  const [bookings, setBookings] = useState(() => readBookings());
  const routes = useMemo(() => readRoutesCatalog(), []);
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const [tripId, setTripId] = useState("");
  const [busId, setBusId] = useState("");
  const [seatClass, setSeatClass] = useState<SeatClass>("seater");
  const [seat, setSeat] = useState("");
  const [passenger, setPassenger] = useState("");
  const [phone, setPhone] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const trips = useMemo(() => tripsForDate(today).filter((t) => t.routeId === routeId), [today, routeId]);
  const fleet = useMemo(() => readFleet().filter((b) => b.status === "Active"), []);
  const buses = useMemo(() => getBusesForRoute(routeId, fleet.map((b) => b.id)), [routeId, fleet]);

  useEffect(() => {
    const sync = () => setBookings(readBookings());
    window.addEventListener("mybus:bookings-updated", sync);
    return () => window.removeEventListener("mybus:bookings-updated", sync);
  }, []);

  useEffect(() => {
    if (!tripId && trips[0]) setTripId(trips[0].id);
    if (tripId && !trips.find((t) => t.id === tripId)) setTripId(trips[0]?.id ?? "");
  }, [trips, tripId]);

  useEffect(() => {
    const trip = trips.find((t) => t.id === tripId);
    const nextBus = trip?.busId ?? buses[0] ?? "";
    if (nextBus) setBusId(nextBus);
  }, [tripId, trips, buses]);

  const bus = fleet.find((b) => b.id === busId);
  const layouts = bus ? getSeatLayoutsForBus(bus) : (["seater"] as SeatClass[]);
  const fare = busId ? formatEffectiveFare(routeId, busId, seatClass, today) : "—";
  const route = routes.find((r) => r.id === routeId);
  const conflict = seat ? isSeatTaken(bookings, routeId, busId, seat, tripId) : false;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passenger.trim() || !phone.trim() || !seat.trim() || !busId) {
      setNotice("Fill all fields and pick a seat.");
      return;
    }
    if (conflict) {
      setNotice("Seat taken — choose another.");
      return;
    }
    addOnlineBooking({
      passenger: passenger.trim(),
      phone: phone.trim(),
      route: route?.label ?? routeId,
      routeId,
      tripId,
      bus: busId,
      seat: seat.trim().toUpperCase(),
      seatClass,
      amount: fare,
      time: trips.find((t) => t.id === tripId)?.departure ?? "—",
    });
    setNotice("Booking submitted! Pay at counter — status Pending until operator confirms.");
    setPassenger("");
    setSeat("");
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[var(--app-surface)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 pt-safe">
        <h1 className="text-lg font-bold text-slate-900">Book a ticket</h1>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-violet-600">
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">
        {notice && (
          <div className="mb-4 rounded-xl bg-violet-50 px-4 py-3 text-xs text-violet-900">{notice}</div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Route</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Departure today</label>
            <select
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              {trips.length === 0 ? (
                <option value="">No trips scheduled</option>
              ) : (
                trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.departure} · {t.busId}
                  </option>
                ))
              )}
            </select>
          </div>
          {layouts.length > 1 && (
            <div className="flex gap-2">
              {layouts.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSeatClass(l)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                    seatClass === l ? "bg-violet-600 text-white" : "bg-slate-100"
                  }`}
                >
                  {SEAT_CLASS_LABELS[l]}
                </button>
              ))}
            </div>
          )}
          {bus && (
            <SeatMapPicker
              capacity={bus.capacity}
              seatClass={seatClass}
              routeId={routeId}
              busId={busId}
              tripId={tripId}
              bookings={bookings}
              value={seat}
              onChange={setSeat}
            />
          )}
          <input
            placeholder="Passenger name"
            value={passenger}
            onChange={(e) => setPassenger(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
          />
          <p className="text-center text-sm font-bold text-violet-700">Fare: {fare}</p>
          <button type="submit" className="w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white">
            Request booking
          </button>
        </form>
      </div>
    </div>
  );
}
