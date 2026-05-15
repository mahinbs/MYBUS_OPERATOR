"use client";

import { useMemo, useEffect, useState } from "react";
import {
  cancelBooking,
  readBookings,
  rebookSeat,
  writeBookings,
  updateBookingStatus,
  type BookingRecord,
  type RefundPolicy,
} from "../../lib/localBookings";

export default function BookingManagementScreen({
  onNavigate,
  panel = "owner",
}: {
  onNavigate: (page: string) => void;
  panel?: "owner" | "counter";
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>(() => readBookings());
  const [ticketFor, setTicketFor] = useState<BookingRecord | null>(null);
  const [cancelFor, setCancelFor] = useState<BookingRecord | null>(null);
  const [cancelPolicy, setCancelPolicy] = useState<RefundPolicy>("full");
  const [rebookFor, setRebookFor] = useState<BookingRecord | null>(null);
  const [rebookSeatVal, setRebookSeatVal] = useState("");

  useEffect(() => {
    const sync = () => setBookings(readBookings());
    window.addEventListener("mybus:bookings-updated", sync);
    return () => window.removeEventListener("mybus:bookings-updated", sync);
  }, []);

  const filtered = useMemo(
    () =>
      bookings.filter((b) => {
        const matchesSearch =
          b.passenger.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
        let matchesFilter = true;
        if (filter === "Walk-in") matchesFilter = b.source === "Walk-in";
        else if (filter === "Today") {
          const idNum = parseInt(b.id.replace(/\D/g, ""), 10);
          if (!Number.isFinite(idNum)) matchesFilter = true;
          else {
            const created = new Date(idNum);
            const now = new Date();
            matchesFilter =
              created.getFullYear() === now.getFullYear() &&
              created.getMonth() === now.getMonth() &&
              created.getDate() === now.getDate();
          }
        } else if (filter !== "All") matchesFilter = b.status === filter;
        return matchesSearch && matchesFilter;
      }),
    [bookings, search, filter]
  );

  const filterChips =
    panel === "counter"
      ? ["All", "Today", "Walk-in", "Confirmed", "Pending", "Cancelled"]
      : ["All", "Confirmed", "Pending", "Cancelled"];

  const confirmBooking = (id: string) => {
    setBookings((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, status: "Confirmed" } : b));
      writeBookings(next);
      return next;
    });
  };

  const cancelPending = (id: string) => {
    setBookings((prev) => {
      const next = prev.map((b) => (b.id === id && b.status === "Pending" ? { ...b, status: "Cancelled" } : b));
      writeBookings(next);
      return next;
    });
  };

  return (
    <div className="min-h-app w-full bg-[var(--app-surface)] pb-nav">
      <div className="rounded-b-[28px] bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pb-6 pt-safe shadow-xl sm:pt-12">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-white">Bookings</h1>
          <div className="flex gap-1">
            {panel === "counter" && (
              <button
                type="button"
                onClick={() => onNavigate("desk")}
                className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-500"
              >
                Desk
              </button>
            )}
            {panel === "owner" && (
              <button
                type="button"
                onClick={() => onNavigate("trips")}
                className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90 hover:bg-white/15"
              >
                Schedule
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/50"
          />
        </div>
      </div>

      <div className="mt-5 px-5">
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {filterChips.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === f ? "bg-[#7C3AED] text-white shadow-md" : "bg-white text-[#6B7280] shadow-sm ring-1 ring-slate-200/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
              <button type="button" onClick={() => setExpanded(expanded === b.id ? null : b.id)} className="w-full p-4 text-left">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                      <i className="ri-ticket-line text-sm text-[#7C3AED]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#111827]">{b.id}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{b.passenger}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        b.status === "Confirmed"
                          ? "bg-green-50 text-green-600"
                          : b.status === "Pending"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {b.status}
                    </span>
                    {b.source === "Walk-in" && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-semibold text-teal-700">Walk-in</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <i className="ri-map-pin-line text-[#9CA3AF]" /> {b.route}
                  </span>
                  <span className="font-bold text-[#7C3AED]">{b.amount}</span>
                </div>
              </button>
              {expanded === b.id && (
                <div className="border-t border-[#F3F4F6] px-4 pb-4 pt-1">
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-[#9CA3AF]">Phone</p>
                      <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="text-xs font-medium text-[#7C3AED]">
                        {b.phone}
                      </a>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9CA3AF]">Bus</p>
                      <p className="text-xs text-[#111827]">{b.bus}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9CA3AF]">Seat</p>
                      <p className="text-xs text-[#111827]">{b.seat}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9CA3AF]">Departure</p>
                      <p className="text-xs text-[#111827]">{b.time}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {b.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => confirmBooking(b.id)}
                          className="min-h-[44px] flex-1 rounded-xl bg-emerald-500 text-xs font-semibold text-white shadow-sm active:scale-[0.98]"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelPending(b.id)}
                          className="min-h-[44px] flex-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setTicketFor(b)}
                      className="min-h-[44px] flex-1 rounded-xl bg-[#F3F4F6] text-xs font-semibold text-[#374151] active:scale-[0.98]"
                    >
                      View ticket
                    </button>
                    {b.status === "Confirmed" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelFor(b);
                            setCancelPolicy("full");
                          }}
                          className="min-h-[44px] flex-1 rounded-xl bg-red-50 text-xs font-semibold text-red-700"
                        >
                          Cancel / refund
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRebookFor(b);
                            setRebookSeatVal(b.seat);
                          }}
                          className="min-h-[44px] flex-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                        >
                          Change seat
                        </button>
                      </>
                    )}
                    {panel === "owner" && (
                      <button
                        type="button"
                        onClick={() => onNavigate("fleet")}
                        className="min-h-[44px] flex-1 rounded-xl bg-violet-50 text-xs font-semibold text-[#5b21b6] active:scale-[0.98]"
                      >
                        Bus details
                      </button>
                    )}
                    {panel === "counter" && b.status === "Confirmed" && b.source === "Walk-in" && (
                      <button
                        type="button"
                        onClick={() => {
                          updateBookingStatus(b.id, "Cancelled");
                          setBookings(readBookings());
                        }}
                        className="min-h-[44px] flex-1 rounded-xl bg-red-50 text-xs font-semibold text-red-700 active:scale-[0.98]"
                      >
                        Cancel ticket
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {ticketFor && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:p-4" onClick={() => setTicketFor(null)}>
          <div
            className="w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-safe shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-title"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <h2 id="ticket-title" className="text-center text-lg font-bold text-slate-900">
              E-Ticket
            </h2>
            <p className="mt-1 text-center text-xs text-slate-500">{ticketFor.id}</p>
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-6">
              <div className="mb-2 grid h-28 w-28 place-items-center rounded-lg bg-white shadow-inner">
                <i className="ri-qr-code-line text-5xl text-slate-800" aria-hidden />
              </div>
              <p className="text-xs font-semibold text-slate-800">{ticketFor.passenger}</p>
              <p className="mt-1 text-center text-sm font-bold text-violet-700">{ticketFor.route}</p>
              <p className="mt-2 text-xs text-slate-600">
                Seat {ticketFor.seat} · {ticketFor.bus} · {ticketFor.time}
              </p>
              {ticketFor.source === "Walk-in" && <p className="mt-2 text-[10px] font-medium text-teal-700">Recorded offline on counter</p>}
            </div>
            <button
              type="button"
              onClick={() => {
                const text = `${ticketFor.id} ${ticketFor.passenger} ${ticketFor.route} seat ${ticketFor.seat} ${ticketFor.amount}`;
                if (navigator.share) void navigator.share({ title: "MY BUS Ticket", text });
                else void navigator.clipboard.writeText(text);
              }}
              className="mt-4 w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-800"
            >
              Share ticket
            </button>
            <button type="button" onClick={() => setTicketFor(null)} className="mt-2 w-full rounded-2xl bg-[#7C3AED] py-3.5 text-sm font-semibold text-white">
              Close
            </button>
          </div>
        </div>
      )}

      {cancelFor && (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/50" onClick={() => setCancelFor(null)}>
          <div className="w-full rounded-t-[28px] bg-white p-6 pb-safe" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Cancel {cancelFor.id}</h2>
            <div className="mt-3 flex gap-2">
              {(["full", "partial", "none"] as RefundPolicy[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCancelPolicy(p)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold capitalize ${
                    cancelPolicy === p ? "bg-violet-600 text-white" : "bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                cancelBooking(cancelFor.id, { policy: cancelPolicy });
                setBookings(readBookings());
                setCancelFor(null);
              }}
              className="mt-4 w-full rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white"
            >
              Confirm cancellation
            </button>
          </div>
        </div>
      )}

      {rebookFor && (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/50" onClick={() => setRebookFor(null)}>
          <div className="w-full rounded-t-[28px] bg-white p-6 pb-safe" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Change seat</h2>
            <input
              value={rebookSeatVal}
              onChange={(e) => setRebookSeatVal(e.target.value)}
              className="mt-3 w-full rounded-xl border px-3 py-3 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                rebookSeat(rebookFor.id, { seat: rebookSeatVal.trim().toUpperCase() });
                setBookings(readBookings());
                setRebookFor(null);
              }}
              className="mt-4 w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white"
            >
              Save seat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
