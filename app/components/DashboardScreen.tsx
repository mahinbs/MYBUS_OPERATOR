"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProfileSection } from "../operator-types";
import { readOwnerTeam, writeOwnerTeam, type AssignedDriver, type AssignedOperator } from "../../lib/ownerTeamStore";
import { computeDashboardKpis } from "../../lib/dashboardStats";
import { collectDocumentAlerts, collectMaintenanceAlerts } from "../../lib/fleetDocuments";
import { tripsForDate, enrichTripRow } from "../../lib/tripStore";

type QuickAction = { label: string; icon: string; nav: string; hint?: string };

const quickActions: QuickAction[] = [
  { label: "Reports", icon: "ri-bar-chart-2-line", nav: "reports", hint: "Routes & buses" },
  { label: "Fleet", icon: "ri-bus-2-line", nav: "fleet", hint: "Buses & maintenance status" },
  { label: "Pricing", icon: "ri-price-tag-3-line", nav: "pricing", hint: "Seater & sleeper fares" },
  { label: "Routes", icon: "ri-route-line", nav: "routes", hint: "Stops & buses" },
  { label: "Bookings", icon: "ri-ticket-line", nav: "bookings", hint: "All tickets" },
];


const recentActivity = [
  { action: "New booking confirmed", detail: "MB-401, Seat 12A", time: "5 min ago" },
  { action: "Bus MB-203 departed", detail: "Delhi Terminal", time: "12 min ago" },
  { action: "Payment received", detail: "₹ 2,400 from R. Kumar", time: "18 min ago" },
  { action: "Seat cancellation", detail: "MB-105, Seat 8B", time: "25 min ago" },
];

const statNav: Record<string, string> = {
  "Total Bookings": "bookings",
  "Active Buses": "fleet",
  "Today's Revenue": "earnings",
  Occupancy: "reports",
};

export default function DashboardScreen({
  onNavigate,
  onOpenProfile,
  onNotifications,
  onOpenDrivers,
}: {
  onNavigate: (page: string) => void;
  onOpenProfile: (section?: ProfileSection) => void;
  onNotifications: () => void;
  onOpenDrivers: () => void;
}) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("Today");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [kpis, setKpis] = useState(() => computeDashboardKpis());
  const [alerts, setAlerts] = useState<{ busId: string; text: string; severity: string }[]>([]);

  useEffect(() => {
    const refresh = () => {
      setKpis(computeDashboardKpis());
      const doc = collectDocumentAlerts().map((a) => ({
        busId: a.busId,
        text: `${a.field} expires in ${a.days}d`,
        severity: a.severity,
      }));
      const maint = collectMaintenanceAlerts().map((a) => ({
        busId: a.busId,
        text: a.message,
        severity: "warn",
      }));
      setAlerts([...doc, ...maint].slice(0, 5));
    };
    refresh();
    window.addEventListener("mybus:bookings-updated", refresh);
    window.addEventListener("mybus:fleet-updated", refresh);
    window.addEventListener("mybus:trips-updated", refresh);
    window.addEventListener("mybus:documents-updated", refresh);
    return () => {
      window.removeEventListener("mybus:bookings-updated", refresh);
      window.removeEventListener("mybus:fleet-updated", refresh);
      window.removeEventListener("mybus:trips-updated", refresh);
      window.removeEventListener("mybus:documents-updated", refresh);
    };
  }, []);

  const stats = [
    { label: "Total Bookings", value: String(kpis.totalBookings), change: kpis.totalBookingsChange, icon: "ri-file-list-3-line", color: "#7C3AED" },
    { label: "Active Buses", value: String(kpis.activeBuses), change: kpis.activeBusesChange, icon: "ri-bus-2-line", color: "#8B5CF6" },
    { label: "Today's Revenue", value: kpis.todayRevenueLabel, change: kpis.todayRevenueChange, icon: "ri-wallet-3-line", color: "#6D28D9" },
    { label: "Occupancy", value: `${kpis.occupancyPct}%`, change: kpis.occupancyChange, icon: "ri-bar-chart-line", color: "#4C1D95" },
  ];

  const upcomingTrips = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tripsForDate(today).slice(0, 4).map((t) => {
      const e = enrichTripRow(t);
      return {
        id: t.id,
        route: t.routeLabel,
        time: t.departure,
        bus: t.busName,
        seats: e.seats,
        status: t.status === "Boarding" ? "Boarding" : t.status === "Delayed" ? "Delayed" : "On Time",
      };
    });
  }, [kpis]);
  const [opName, setOpName] = useState("");
  const [opEmail, setOpEmail] = useState("");
  const [opPhone, setOpPhone] = useState("");
  const [drName, setDrName] = useState("");
  const [drPhone, setDrPhone] = useState("");
  const [drLicense, setDrLicense] = useState("");

  const syncFormsFromStore = useCallback(() => {
    const t = readOwnerTeam();
    if (t.operator) {
      setOpName(t.operator.name);
      setOpEmail(t.operator.email);
      setOpPhone(t.operator.phone);
    } else {
      setOpName("");
      setOpEmail("");
      setOpPhone("");
    }
    if (t.driver) {
      setDrName(t.driver.name);
      setDrPhone(t.driver.phone);
      setDrLicense(t.driver.license);
    } else {
      setDrName("");
      setDrPhone("");
      setDrLicense("");
    }
  }, []);

  useEffect(() => {
    if (!showTeamModal) return;
    syncFormsFromStore();
  }, [showTeamModal, syncFormsFromStore]);

  const saveTeam = () => {
    const cur = readOwnerTeam();
    let operator: AssignedOperator | null = cur.operator;
    if (opName.trim() && opEmail.trim() && opPhone.trim()) {
      operator = { name: opName.trim(), email: opEmail.trim(), phone: opPhone.trim() };
    } else if (!opName.trim() && !opEmail.trim() && !opPhone.trim()) {
      operator = null;
    }
    let driver: AssignedDriver | null = cur.driver;
    if (drName.trim() && drPhone.trim()) {
      driver = { name: drName.trim(), phone: drPhone.trim(), license: drLicense.trim() || "—" };
    } else if (!drName.trim() && !drPhone.trim()) {
      driver = null;
    }
    writeOwnerTeam({ operator, driver });
    setShowTeamModal(false);
  };

  return (
    <div className="min-h-app w-full bg-[var(--app-surface)] pb-nav">
      <div className="bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pt-safe sm:pt-12 pb-7 rounded-b-[28px] shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=professional%20indian%20male%20business%20portrait%20headshot%20neutral%20background%20formal%20attire&width=100&height=100&seq=1&orientation=squarish"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Rajesh Mehta</h2>
              <p className="text-white/50 text-[11px]">Fleet Owner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNotifications}
              aria-label="Notifications, 3 unread"
              className="touch-target w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative transition-colors hover:bg-white/15 active:scale-95"
            >
              <i className="ri-notification-3-line text-white/80 text-lg w-5 h-5 flex items-center justify-center" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#1a0b2e]">
                3
              </span>
            </button>
            <button
              type="button"
              aria-label="Operator settings"
              onClick={() => onOpenProfile("settings")}
              className="touch-target w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-colors hover:bg-white/15 active:scale-95"
            >
              <i className="ri-settings-3-line text-white/80 text-lg w-5 h-5 flex items-center justify-center" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
          <i className="ri-map-pin-line text-white/60 text-xs" />
          <span className="text-white/70 text-xs">Mumbai, Maharashtra</span>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {["Today", "Week", "Month"].map((range) => (
              <button
                type="button"
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                aria-pressed={selectedTimeRange === range}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-[0.98] ${
                  selectedTimeRange === range
                    ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
                    : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 hover:bg-slate-50"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Open earnings and analytics"
            onClick={() => onNavigate("earnings")}
            className="touch-target w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ring-1 ring-slate-200/60 hover:bg-slate-50 active:scale-95"
          >
            <i className="ri-arrow-right-s-line text-[#7C3AED] text-lg" />
          </button>
        </div>

        {alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {alerts.map((a) => (
              <div
                key={`${a.busId}-${a.text}`}
                className={`rounded-xl px-3 py-2 text-[11px] ${
                  a.severity === "critical" ? "bg-red-50 text-red-800 ring-1 ring-red-200" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                }`}
              >
                <strong>{a.busId}</strong> — {a.text}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat) => (
            <button
              type="button"
              key={stat.label}
              onClick={() => onNavigate(statNav[stat.label] ?? "dashboard")}
              className="bg-white rounded-2xl p-4 text-left shadow-[var(--shadow-card)] ring-1 ring-slate-900/[0.04] transition-transform active:scale-[0.99] hover:ring-violet-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: stat.color + "18" }}
                >
                  <i className={`${stat.icon} text-base`} style={{ color: stat.color }} />
                </div>
                <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-xl font-bold text-[#111827]">{stat.value}</p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">{stat.label}</p>
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-slate-900/[0.04]">
          <h3 className="text-sm font-bold text-[#111827] mb-1">Team</h3>
          <p className="text-[11px] text-[#6B7280] mb-3">Assign your counter operator and lead driver. Saved on this device.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowTeamModal(true)}
              className="flex-1 rounded-xl bg-[#7C3AED] py-2.5 text-xs font-semibold text-white active:scale-[0.99]"
            >
              Assign operator
            </button>
            <button
              type="button"
              onClick={() => onOpenDrivers()}
              className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-[#374151] active:scale-[0.99]"
            >
              Manage drivers
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827]">Quick actions</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onNavigate("reports")}
                className="text-[11px] font-semibold text-violet-600 hover:text-violet-700"
              >
                Reports →
              </button>
              <button
                type="button"
                onClick={() => onNavigate("earnings")}
                className="text-[11px] font-semibold text-violet-600 hover:text-violet-700"
              >
                Earnings →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                type="button"
                key={action.label}
                onClick={() => onNavigate(action.nav)}
                className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-slate-900/[0.05] transition-colors hover:bg-violet-50/40 active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <i className={`${action.icon} text-base`} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-800">{action.label}</span>
                  {action.hint && <span className="block truncate text-[10px] text-slate-500">{action.hint}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#111827]">Upcoming Trips</h3>
            <button
              type="button"
              onClick={() => onNavigate("trips")}
              className="text-[#7C3AED] text-xs font-semibold flex items-center gap-0.5 rounded-lg px-2 py-1 -mr-1 hover:bg-violet-50 active:scale-[0.98]"
            >
              View All <i className="ri-arrow-right-s-line" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl p-4 shadow-[var(--shadow-card)] ring-1 ring-slate-900/[0.04]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                      <i className="ri-bus-2-line text-[#7C3AED] text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{trip.id}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{trip.bus}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      trip.status === "On Time"
                        ? "bg-green-50 text-green-600"
                        : trip.status === "Boarding"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {trip.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <i className="ri-map-pin-line text-[#9CA3AF] text-xs" />
                    <p className="text-xs text-[#4B5563]">{trip.route}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <i className="ri-time-line text-[#9CA3AF] text-xs" />
                      <p className="text-xs text-[#4B5563]">{trip.time}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="ri-user-line text-[#9CA3AF] text-xs" />
                      <p className="text-xs text-[#4B5563]">{trip.seats}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#111827]">Recent Activity</h3>
            <button
              type="button"
              onClick={onNotifications}
              className="text-[#7C3AED] text-xs font-semibold rounded-lg px-2 py-1 hover:bg-violet-50"
            >
              See All
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] ring-1 ring-slate-900/[0.04] overflow-hidden">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className={`px-4 py-3 flex items-center justify-between ${
                  i !== recentActivity.length - 1 ? "border-b border-[#F3F4F6]" : ""
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-[#111827]">{activity.action}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{activity.detail}</p>
                </div>
                <p className="text-[10px] text-[#9CA3AF]">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showTeamModal && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => setShowTeamModal(false)}
          role="presentation"
        >
          <div
            className="max-h-[88dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-white p-5 pb-safe shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-title"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <h2 id="team-modal-title" className="text-lg font-bold text-slate-900">
              Assign team
            </h2>
            <p className="mt-1 text-xs text-slate-500">Counter operator (walk-in desk) and lead driver for your fleet.</p>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="mb-2 text-xs font-bold text-slate-800">Counter operator</p>
                <label className="mb-2 block text-[10px] font-medium text-slate-500">Name</label>
                <input
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  placeholder="Full name"
                />
                <label className="mb-2 block text-[10px] font-medium text-slate-500">Email</label>
                <input
                  value={opEmail}
                  onChange={(e) => setOpEmail(e.target.value)}
                  type="email"
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  placeholder="operator@company.com"
                />
                <label className="mb-2 block text-[10px] font-medium text-slate-500">Phone</label>
                <input
                  value={opPhone}
                  onChange={(e) => setOpPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  placeholder="+91 …"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="mb-2 text-xs font-bold text-slate-800">Lead driver</p>
                <label className="mb-2 block text-[10px] font-medium text-slate-500">Name</label>
                <input
                  value={drName}
                  onChange={(e) => setDrName(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  placeholder="Driver name"
                />
                <label className="mb-2 block text-[10px] font-medium text-slate-500">Phone</label>
                <input
                  value={drPhone}
                  onChange={(e) => setDrPhone(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  placeholder="+91 …"
                />
                <label className="mb-2 block text-[10px] font-medium text-slate-500">License (optional)</label>
                <input
                  value={drLicense}
                  onChange={(e) => setDrLicense(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  placeholder="DL number"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button type="button" onClick={saveTeam} className="flex-1 rounded-2xl bg-[#7C3AED] py-3 text-sm font-semibold text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
