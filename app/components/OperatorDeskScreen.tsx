"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { readRoutesCatalog, routeLabel } from "../../lib/routesCatalog";
import { formatEffectiveFare } from "../../lib/promoPricing";
import { getSeatLayoutsForBus, SEAT_CLASS_LABELS, type SeatClass } from "../../lib/seatClasses";
import {
  addWalkInBooking,
  findBookingsByPhone,
  readBookings,
  updateBookingStatus,
  type BookingRecord,
} from "../../lib/localBookings";
import { tripsForDate } from "../../lib/tripStore";
import SeatMapPicker from "./SeatMapPicker";
import ShiftPanel from "./ShiftPanel";
import { readFleet } from "../../lib/fleetPersistence";
import { getBusesForRoute } from "../../lib/routeBusAssignments";
import type { PersistedBus } from "../../lib/fleetPersistence";
import { readOwnerTeam } from "../../lib/ownerTeamStore";
import {
  computeDeskStats,
  isSeatTaken,
  recentWalkIns,
  todayDepartures,
} from "../../lib/operatorDeskHelpers";

export default function OperatorDeskScreen({
  onNavigate,
  panel = "owner",
}: {
  onNavigate: (page: string) => void;
  panel?: "owner" | "counter";
}) {
  const { user } = useAuth();
  const [fleet, setFleet] = useState<PersistedBus[]>(() => readFleet());
  const [bookings, setBookings] = useState<BookingRecord[]>(() => readBookings());
  const [routesCatalog, setRoutesCatalog] = useState(() => readRoutesCatalog());
  const [routeId, setRouteId] = useState(() => readRoutesCatalog()[0]?.id ?? "");
  const [tripId, setTripId] = useState("");
  const [busId, setBusId] = useState("");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [seatClass, setSeatClass] = useState<SeatClass>("seater");
  const [seat, setSeat] = useState("");
  const [passenger, setPassenger] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");
  const [payment, setPayment] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [notice, setNotice] = useState<string | null>(null);
  const [assignedOperator, setAssignedOperator] = useState(() => readOwnerTeam().operator);

  useEffect(() => {
    const syncFleet = () => setFleet(readFleet());
    const syncBookings = () => setBookings(readBookings());
    const syncTeam = () => setAssignedOperator(readOwnerTeam().operator);
    const syncRoutes = () => setRoutesCatalog(readRoutesCatalog());
    syncFleet();
    syncBookings();
    syncTeam();
    syncRoutes();
    window.addEventListener("mybus:fleet-updated", syncFleet);
    window.addEventListener("mybus:assignments-updated", syncFleet);
    window.addEventListener("mybus:bookings-updated", syncBookings);
    window.addEventListener("mybus:owner-team-updated", syncTeam);
    window.addEventListener("mybus:pricing-updated", syncRoutes);
    window.addEventListener("mybus:routes-updated", syncRoutes);
    window.addEventListener("mybus:trips-updated", syncRoutes);
    window.addEventListener("storage", () => {
      syncFleet();
      syncBookings();
      syncTeam();
      syncRoutes();
    });
    return () => {
      window.removeEventListener("mybus:fleet-updated", syncFleet);
      window.removeEventListener("mybus:assignments-updated", syncFleet);
      window.removeEventListener("mybus:bookings-updated", syncBookings);
      window.removeEventListener("mybus:owner-team-updated", syncTeam);
      window.removeEventListener("mybus:pricing-updated", syncRoutes);
      window.removeEventListener("mybus:routes-updated", syncRoutes);
      window.removeEventListener("mybus:trips-updated", syncRoutes);
    };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const tripsToday = useMemo(
    () => tripsForDate(today).filter((t) => t.routeId === routeId),
    [today, routeId, routesCatalog]
  );

  useEffect(() => {
    if (!tripId && tripsToday[0]) setTripId(tripsToday[0].id);
    if (tripId && !tripsToday.find((t) => t.id === tripId)) setTripId(tripsToday[0]?.id ?? "");
  }, [tripsToday, tripId]);

  const eligibleBuses = useMemo(() => {
    const ids = fleet.filter((b) => b.status === "Active").map((b) => b.id);
    if (!routeId) return ids;
    return getBusesForRoute(routeId, ids);
  }, [fleet, routeId]);

  useEffect(() => {
    if (!busId || !eligibleBuses.includes(busId)) {
      setBusId(eligibleBuses[0] ?? "");
    }
  }, [eligibleBuses, busId]);

  const selectedRoute = routesCatalog.find((r) => r.id === routeId);
  const busDetail = fleet.find((b) => b.id === busId);
  const seatLayouts = useMemo(
    () => (busDetail ? getSeatLayoutsForBus(busDetail) : ["seater"] as SeatClass[]),
    [busDetail]
  );

  useEffect(() => {
    if (!seatLayouts.includes(seatClass)) {
      setSeatClass(seatLayouts[0] ?? "seater");
    }
  }, [seatLayouts, seatClass]);

  const amountPreview = useMemo(() => {
    if (!routeId || !busId) return selectedRoute?.basePrice ?? "—";
    return formatEffectiveFare(routeId, busId, seatClass, today);
  }, [routeId, busId, seatClass, selectedRoute?.basePrice, today]);
  const deskStats = useMemo(() => computeDeskStats(bookings), [bookings]);
  const walkInRecent = useMemo(() => recentWalkIns(bookings, 5), [bookings]);
  const seatConflict = useMemo(
    () => (seat.trim() ? isSeatTaken(bookings, routeId, busId, seat, tripId) : false),
    [bookings, routeId, busId, seat, tripId]
  );
  const lookupResults = useMemo(
    () => (phoneLookup.trim().length >= 4 ? findBookingsByPhone(phoneLookup) : []),
    [phoneLookup, bookings]
  );
  const pendingOnline = useMemo(
    () => bookings.filter((b) => b.status === "Pending" && b.source === "Online").slice(0, 3),
    [bookings]
  );

  const displayName = user?.name ?? assignedOperator?.name ?? "Operator";
  const isCounter = panel === "counter";

  const submitWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!passenger.trim() || !phone.trim() || !routeId || !busId || !seat.trim()) {
      setNotice("Fill passenger, phone, route, bus, and seat.");
      return;
    }
    if (isSeatTaken(bookings, routeId, busId, seat, tripId)) {
      setNotice(`Seat ${seat.trim().toUpperCase()} is already booked on ${busId}. Pick another seat.`);
      return;
    }
    const routeLabelText = selectedRoute?.label ?? routeId;
    addWalkInBooking({
      passenger: passenger.trim(),
      phone: phone.trim(),
      route: routeLabelText,
      routeId,
      tripId: tripId || undefined,
      bus: busId,
      seat: seat.trim().toUpperCase(),
      seatClass,
      amount: payment === "Cash" ? `${amountPreview} (cash)` : `${amountPreview} (${payment})`,
      time: time.trim() || "—",
      operatorId: user?.id,
      operatorName: displayName,
    });
    setNotice(`Booking saved: ${passenger.trim()} · ${routeLabelText} · seat ${seat.trim().toUpperCase()}`);
    setPassenger("");
    setSeat("");
    setPhone("");
  };

  return (
    <div className="min-h-app w-full bg-[var(--app-surface)] pb-nav">
      <div className="rounded-b-[28px] bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-5 pb-6 pt-safe shadow-xl sm:pt-12">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200/90">
          {isCounter ? "Operator panel" : "Operator desk"}
        </p>
        <h1 className="text-xl font-bold text-white">
          {isCounter ? `Hi, ${displayName.split(" ")[0]}` : "Walk-in & counter"}
        </h1>
        <p className="mt-1 text-xs text-white/65">
          {isCounter
            ? "Today’s shift — walk-ins, boarding, and ticket lookup on this device."
            : "Works offline after load — data stays in browser storage."}
        </p>
        {isCounter && assignedOperator && (
          <p className="mt-2 text-[10px] text-emerald-200/90">
            Assigned by owner: {assignedOperator.name} · {assignedOperator.phone}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {!isCounter && (
            <>
              <button
                type="button"
                onClick={() => onNavigate("fleet")}
                className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold text-white/95 hover:bg-white/20"
              >
                Fleet
              </button>
              <button
                type="button"
                onClick={() => onNavigate("routes")}
                className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold text-white/95 hover:bg-white/20"
              >
                Routes
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onNavigate("bookings")}
            className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold text-white/95 hover:bg-white/20"
          >
            All bookings
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">
        {isCounter && user && (
          <ShiftPanel operatorId={user.id} operatorName={displayName} />
        )}

        {isCounter && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { label: "Walk-ins today", value: String(deskStats.walkInsToday), icon: "ri-walk-line" },
                { label: "Confirmed", value: String(deskStats.confirmed), icon: "ri-check-double-line" },
                { label: "Pending", value: String(deskStats.pending), icon: "ri-time-line" },
                { label: "Counter revenue", value: deskStats.revenueLabel, icon: "ri-wallet-3-line" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-900/[0.05]"
                >
                  <div className="flex items-center gap-2">
                    <i className={`${s.icon} text-sm text-indigo-600`} aria-hidden />
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-800">Departures today</h2>
                <span className="text-[10px] text-slate-500">{todayDepartures().length} services</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {todayDepartures().map((d) => (
                  <button
                    key={d.tripId}
                    type="button"
                    onClick={() => {
                      setRouteId(d.routeId);
                      setTripId(d.tripId);
                      setBusId(d.bus);
                      setTime(d.time);
                    }}
                    className="min-w-[140px] shrink-0 rounded-xl bg-white p-3 text-left ring-1 ring-slate-900/[0.05] active:scale-[0.99]"
                  >
                    <p className="text-[10px] font-semibold text-indigo-600">{d.time}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-800">{routeLabel(d.routeId)}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{d.bus}</p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        d.status === "Boarding"
                          ? "bg-amber-50 text-amber-700"
                          : d.status === "On time"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {d.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {pendingOnline.length > 0 && (
              <div className="mb-4 rounded-2xl bg-amber-50/80 p-3 ring-1 ring-amber-200/60">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-900">Online pending ({pendingOnline.length})</p>
                  <button
                    type="button"
                    onClick={() => onNavigate("bookings")}
                    className="text-[10px] font-semibold text-amber-800 underline"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {pendingOnline.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/80 px-2 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-800">{b.passenger}</p>
                        <p className="text-[10px] text-slate-500">
                          {b.route} · {b.seat}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateBookingStatus(b.id, "Confirmed");
                          setNotice(`Confirmed ${b.passenger} (${b.id})`);
                        }}
                        className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-semibold text-white"
                      >
                        Confirm
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {notice && (
          <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200/80">
            {notice}
          </div>
        )}

        <form onSubmit={submitWalkIn} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.04]">
          <h2 className="text-sm font-bold text-slate-900">New walk-in booking</h2>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Route</label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400"
            >
              {routesCatalog.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} · from {r.basePrice}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Bus</label>
            <select
              value={busId}
              onChange={(e) => setBusId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400"
            >
              {eligibleBuses.length === 0 ? (
                <option value="">No active buses</option>
              ) : (
                eligibleBuses.map((id) => {
                  const b = fleet.find((x) => x.id === id);
                  return (
                    <option key={id} value={id}>
                      {id} · {b?.name ?? "Bus"}
                    </option>
                  );
                })
              )}
            </select>
            {busDetail && (
              <p className="mt-1 text-[10px] text-slate-500">
                {busDetail.reg} · {busDetail.type} · {busDetail.capacity} seats
              </p>
            )}
          </div>
          {tripsToday.length > 0 && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Trip</label>
              <select
                value={tripId}
                onChange={(e) => {
                  setTripId(e.target.value);
                  const t = tripsToday.find((x) => x.id === e.target.value);
                  if (t) setBusId(t.busId);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
              >
                {tripsToday.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.departure} · {t.busId}
                  </option>
                ))}
              </select>
            </div>
          )}
          {seatLayouts.length > 1 && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Seat type
              </label>
              <div className="flex gap-2">
                {seatLayouts.map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() => setSeatClass(layout)}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${
                      seatClass === layout ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {SEAT_CLASS_LABELS[layout]} · {formatEffectiveFare(routeId, busId, layout, today)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {busDetail && (
            <SeatMapPicker
              capacity={busDetail.capacity}
              seatClass={seatClass}
              routeId={routeId}
              busId={busId}
              tripId={tripId}
              bookings={bookings}
              value={seat}
              onChange={setSeat}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Seat #</label>
              <input
                value={seat}
                onChange={(e) => setSeat(e.target.value)}
                placeholder="12A"
                className={`w-full rounded-xl border bg-slate-50 px-3 py-3 text-sm outline-none ${
                  seatConflict ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
                }`}
              />
              {seatConflict && (
                <p className="mt-1 text-[10px] font-medium text-red-600">Seat already taken on this bus</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Departure</label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="10:30 AM"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Passenger</label>
            <input
              value={passenger}
              onChange={(e) => setPassenger(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
            />
          </div>
          {isCounter && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Lookup by phone</label>
              <input value={phoneLookup} onChange={(e) => setPhoneLookup(e.target.value)} placeholder="Last 4+ digits" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              {lookupResults.length > 0 && (
                <ul className="mt-2 space-y-1 text-[10px] text-slate-600">
                  {lookupResults.slice(0, 3).map((b) => (
                    <li key={b.id}>{b.passenger} · {b.route} · {b.seat}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Payment</label>
            <div className="flex gap-2">
              {(["Cash", "UPI", "Card"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPayment(p)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                    payment === p ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-xs font-semibold text-violet-700">Fare: {amountPreview}</p>
          <button
            type="submit"
            disabled={seatConflict}
            className="w-full rounded-2xl bg-violet-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save booking
          </button>
        </form>

        {isCounter && walkInRecent.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800">Recent walk-ins</h2>
              <button
                type="button"
                onClick={() => onNavigate("bookings")}
                className="text-[10px] font-semibold text-violet-600"
              >
                See all →
              </button>
            </div>
            <div className="space-y-2">
              {walkInRecent.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-900/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">{b.passenger}</p>
                    <p className="text-[10px] text-slate-500">
                      {b.route} · {b.bus} · {b.seat}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-slate-500">{b.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCounter && (
          <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-[11px] text-violet-900">
            <p className="font-semibold">Fleet maintenance</p>
            <p className="mt-1 text-violet-800">
              Use the <strong>Fleet</strong> tab to run daily bus operations, inspections, and set maintenance status.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("fleet")}
              className="mt-2 text-xs font-semibold text-[#5b21b6] underline"
            >
              Open Fleet operations →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
