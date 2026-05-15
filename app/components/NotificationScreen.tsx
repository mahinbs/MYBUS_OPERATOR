"use client";

import { useEffect, useMemo, useState } from "react";

type NotificationRow = {
  title: string;
  body: string;
  time: string;
  type: string;
  unread: boolean;
};

const initialNotifications: NotificationRow[] = [
  { title: "New booking received", body: "MB-401: Seat 12A booked by Rahul Kumar", time: "2 min ago", type: "booking", unread: true },
  { title: "Trip departure alert", body: "MB-203 has departed Delhi Terminal on time", time: "15 min ago", type: "trip", unread: true },
  { title: "Payment settled", body: "₹ 24,500 credited to your account", time: "1 hr ago", type: "payment", unread: true },
  { title: "Bus maintenance due", body: "MB-003 is due for scheduled maintenance", time: "3 hrs ago", type: "alert", unread: false },
  { title: "Low occupancy alert", body: "MB-105 has only 5 bookings for today", time: "5 hrs ago", type: "alert", unread: false },
  { title: "New review received", body: "Passenger rated trip MB-401 with 5 stars", time: "8 hrs ago", type: "review", unread: false },
];

const typeColors: Record<string, string> = {
  booking: "bg-green-50 text-green-600",
  trip: "bg-blue-50 text-blue-600",
  payment: "bg-[#7C3AED]/10 text-[#7C3AED]",
  alert: "bg-amber-50 text-amber-600",
  review: "bg-pink-50 text-pink-600",
};

const typeIcons: Record<string, string> = {
  booking: "ri-ticket-line",
  trip: "ri-bus-2-line",
  payment: "ri-wallet-3-line",
  alert: "ri-alert-line",
  review: "ri-star-line",
};

export default function NotificationScreen({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<NotificationRow[]>(initialNotifications);

  const unreadCount = useMemo(() => items.filter((n) => n.unread).length, [items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        <div className="flex shrink-0 justify-center pb-1 pt-3" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-slate-300/90" />
        </div>
        <div className="rounded-t-[28px] bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pb-6 pt-2 sm:rounded-t-[28px]">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="flex h-10 w-10 shrink-0 touch-target items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
            >
              <i className="ri-arrow-left-line text-lg text-white" aria-hidden />
            </button>
            <h2 id="notifications-title" className="flex-1 truncate text-center text-lg font-bold text-white">
              Notifications
            </h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-white/50 sm:text-left">
            {unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-safe pt-4">
          <div className="space-y-3">
            {items.map((n, i) => (
              <div
                key={i}
                className={`flex gap-3 rounded-2xl p-3.5 transition-colors ${
                  n.unread ? "bg-violet-50/80 ring-1 ring-violet-100" : "border border-slate-100 bg-white"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeColors[n.type]}`}>
                  <i className={`${typeIcons[n.type]} text-lg`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-[#111827]">{n.title}</p>
                    {n.unread && <div className="h-2 w-2 shrink-0 rounded-full bg-[#7C3AED]" />}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#6B7280]">{n.body}</p>
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
