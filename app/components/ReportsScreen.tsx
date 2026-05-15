"use client";

import { useEffect, useMemo, useState } from "react";
import { buildFleetReports, type BusPerformance, type RoutePerformance } from "../../lib/fleetReports";
import { readBookings } from "../../lib/localBookings";
import { downloadBookingsCsv } from "../../lib/exportCsv";
import { counterSalesToday } from "../../lib/operatorDeskHelpers";

const tierStyles: Record<RoutePerformance["tier"], { bg: string; text: string; label: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Top performer" },
  good: { bg: "bg-violet-50", text: "text-violet-700", label: "Strong" },
  average: { bg: "bg-amber-50", text: "text-amber-700", label: "Average" },
  low: { bg: "bg-red-50", text: "text-red-700", label: "Needs attention" },
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[10px]">
        <span className="text-slate-500">Performance score</span>
        <span className="font-bold text-slate-800">{score}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function RouteCard({ route, variant }: { route: RoutePerformance; variant: "best" | "least" }) {
  const t = tierStyles[route.tier];
  return (
    <div
      className={`rounded-2xl p-4 ring-1 ${
        variant === "best" ? "bg-white ring-emerald-200/80" : "bg-white ring-red-200/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{route.label}</p>
          <p className="text-[10px] text-slate-500">{route.routeId} · {route.tripsRun} trips run</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${t.bg} ${t.text}`}>
          {t.label}
        </span>
      </div>
      <ScoreBar score={route.score} />
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <p className="text-slate-500">Revenue</p>
          <p className="font-semibold text-slate-900">{route.revenueLabel}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <p className="text-slate-500">Occupancy</p>
          <p className="font-semibold text-slate-900">{route.occupancyPct}%</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <p className="text-slate-500">Bookings</p>
          <p className="font-semibold text-slate-900">
            {route.confirmed} confirmed · {route.cancelled} cancelled
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1.5">
          <p className="text-slate-500">Cancel rate</p>
          <p className="font-semibold text-slate-900">{route.cancelRatePct}%</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-snug text-slate-600">{route.insight}</p>
    </div>
  );
}

function BusCard({ bus, expanded, onToggle }: { bus: BusPerformance; expanded: boolean; onToggle: () => void }) {
  const t = tierStyles[bus.tier];
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-900/[0.05]">
      <button type="button" onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <i className="ri-bus-2-line text-lg text-violet-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold text-slate-900">{bus.busName}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${t.bg} ${t.text}`}>
                {bus.score}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {bus.busId} · {bus.reg} · {bus.status}
            </p>
          </div>
          <i className={`ri-arrow-${expanded ? "up" : "down"}-s-line text-slate-400`} aria-hidden />
        </div>
        <ScoreBar score={bus.score} />
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-2">
          <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-violet-50/80 p-2.5">
              <p className="font-semibold text-violet-900">Counter operator</p>
              <p className="mt-1 font-medium text-slate-800">{bus.operatorName}</p>
              <a href={`tel:${bus.operatorPhone.replace(/\s/g, "")}`} className="text-violet-600">
                {bus.operatorPhone}
              </a>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="font-semibold text-slate-800">Assigned driver</p>
              {bus.driverName ? (
                <>
                  <p className="mt-1 font-medium text-slate-800">{bus.driverName}</p>
                  <p className="text-slate-500">{bus.driverStatus}</p>
                  <a href={`tel:${(bus.driverPhone ?? "").replace(/\s/g, "")}`} className="text-violet-600">
                    {bus.driverPhone}
                  </a>
                  {bus.driverRating != null && (
                    <p className="mt-1 text-amber-600">
                      <i className="ri-star-fill text-[10px]" /> {bus.driverRating} rating
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-slate-500">No driver assigned</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
              <p className="text-slate-500">Revenue</p>
              <p className="font-semibold">{bus.revenueLabel}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
              <p className="text-slate-500">Occupancy</p>
              <p className="font-semibold">{bus.occupancyPct}%</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
              <p className="text-slate-500">On-time departures</p>
              <p className="font-semibold">{bus.onTimePct}%</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
              <p className="text-slate-500">Bookings</p>
              <p className="font-semibold">{bus.confirmed} confirmed</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-snug text-slate-600">{bus.insight}</p>
        </div>
      )}
    </div>
  );
}

export default function ReportsScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [bookings, setBookings] = useState(() => readBookings());
  const [expandedBus, setExpandedBus] = useState<string | null>(null);
  const [section, setSection] = useState<"overview" | "routes" | "fleet">("overview");

  useEffect(() => {
    const sync = () => setBookings(readBookings());
    window.addEventListener("mybus:bookings-updated", sync);
    window.addEventListener("mybus:fleet-updated", sync);
    window.addEventListener("mybus:owner-team-updated", sync);
    return () => {
      window.removeEventListener("mybus:bookings-updated", sync);
      window.removeEventListener("mybus:fleet-updated", sync);
      window.removeEventListener("mybus:owner-team-updated", sync);
    };
  }, []);

  const report = useMemo(() => buildFleetReports(bookings), [bookings]);
  const counterSales = useMemo(() => counterSalesToday(bookings), [bookings]);

  return (
    <div className="min-h-app w-full bg-[var(--app-surface)] pb-nav">
      <div className="rounded-b-[28px] bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pb-6 pt-safe shadow-xl sm:pt-12">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
              aria-label="Back to home"
            >
              <i className="ri-arrow-left-line text-lg text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Reports</h1>
              <p className="text-[10px] text-white/55">{report.periodLabel}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadBookingsCsv()}
              className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => onNavigate("earnings")}
              className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90"
            >
              Earnings
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Fleet revenue", value: report.totalRevenueLabel },
            { label: "Active buses", value: `${report.fleetActive}/${report.fleetTotal}` },
            { label: "Bookings", value: String(report.totalBookings) },
            { label: "Updated", value: report.generatedAt.split(",")[0] ?? report.generatedAt },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-[9px] uppercase tracking-wide text-white/50">{s.label}</p>
              <p className="text-sm font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              ["overview", "Overview"],
              ["routes", "Routes"],
              ["fleet", "Fleet & crew"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`flex-1 rounded-lg py-2 text-[11px] font-semibold ${
                section === id ? "bg-white text-violet-700 shadow-sm" : "text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === "overview" && (
          <div className="space-y-5">
            {counterSales.length > 0 && (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-900/[0.05]">
                <h2 className="mb-2 text-sm font-bold text-slate-900">Counter sales today</h2>
                {counterSales.map((c) => (
                  <div key={c.name} className="flex justify-between text-xs py-1">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-slate-500">
                      {c.count} · Rs {c.revenue.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <i className="ri-trophy-line text-emerald-600" /> Best performing routes
              </h2>
              <div className="space-y-3">
                {report.bestRoutes.map((r) => (
                  <RouteCard key={r.routeId} route={r} variant="best" />
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <i className="ri-alert-line text-red-500" /> Least working routes
              </h2>
              <p className="mb-2 text-[11px] text-slate-500">
                Lowest scores — review schedules, pricing, and counter sales on these corridors.
              </p>
              <div className="space-y-3">
                {report.leastRoutes.map((r) => (
                  <RouteCard key={`least-${r.routeId}`} route={r} variant="least" />
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-bold text-slate-900">Top buses (summary)</h2>
              <div className="space-y-2">
                {report.buses.slice(0, 2).map((b) => (
                  <div key={b.busId} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-900/[0.05]">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{b.busName}</p>
                      <p className="text-[10px] text-slate-500">
                        {b.operatorName} · {b.driverName ?? "No driver"}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-violet-600">{b.score}/100</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSection("fleet")}
                className="mt-2 w-full text-center text-[11px] font-semibold text-violet-600"
              >
                View all bus performance →
              </button>
            </div>
          </div>
        )}

        {section === "routes" && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">All routes ranked by composite score (revenue, occupancy, cancellations).</p>
            {report.allRoutes.map((r, i) => (
              <div key={r.routeId} className="relative">
                <span className="absolute -left-1 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                  {i + 1}
                </span>
                <div className="pl-6">
                  <RouteCard route={r} variant={r.tier === "low" || r.tier === "average" ? "least" : "best"} />
                </div>
              </div>
            ))}
          </div>
        )}

        {section === "fleet" && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Each bus shows counter operator, assigned driver, revenue, occupancy, and on-time performance.
            </p>
            {report.buses.map((b) => (
              <BusCard
                key={b.busId}
                bus={b}
                expanded={expandedBus === b.busId}
                onToggle={() => setExpandedBus((id) => (id === b.busId ? null : b.busId))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
