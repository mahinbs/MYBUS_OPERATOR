"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readFleet, type PersistedBus } from "../../lib/fleetPersistence";
import {
  buildPricingRows,
  formatInr,
  parseRupeeInput,
  setRouteBusPricing,
  type PricingRow,
} from "../../lib/fleetPricing";
import { readManagedRoutes, type ManagedRoute } from "../../lib/managedRoutes";
import { SEAT_CLASS_LABELS } from "../../lib/seatClasses";
import { readPromoRules, writePromoRules, type PromoRule } from "../../lib/promoPricing";

type DraftPrices = { seater: string; sleeper: string };

function emptyDraft(): DraftPrices {
  return { seater: "", sleeper: "" };
}

function draftFromRow(row: PricingRow): DraftPrices {
  return {
    seater: row.seater != null ? String(row.seater) : "",
    sleeper: row.sleeper != null ? String(row.sleeper) : "",
  };
}

export default function PricingScreen({
  onNavigate,
  initialRouteId,
}: {
  onNavigate: (page: string) => void;
  initialRouteId?: string;
}) {
  const [routes, setRoutes] = useState<ManagedRoute[]>(() => readManagedRoutes());
  const [fleet, setFleet] = useState<PersistedBus[]>(() => readFleet());
  const [filterRoute, setFilterRoute] = useState(initialRouteId ?? "all");
  const [rows, setRows] = useState<PricingRow[]>(() => buildPricingRows());
  const [drafts, setDrafts] = useState<Record<string, DraftPrices>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [promos, setPromos] = useState<PromoRule[]>(() => readPromoRules());

  const refresh = useCallback(() => {
    setRoutes(readManagedRoutes());
    setFleet(readFleet());
    const next = buildPricingRows();
    setRows(next);
    const d: Record<string, DraftPrices> = {};
    next.forEach((r) => {
      d[`${r.routeId}|${r.busId}`] = draftFromRow(r);
    });
    setDrafts(d);
  }, []);

  useEffect(() => {
    refresh();
    const onPricing = () => refresh();
    const onFleet = () => refresh();
    window.addEventListener("mybus:pricing-updated", onPricing);
    window.addEventListener("mybus:fleet-updated", onFleet);
    window.addEventListener("mybus:assignments-updated", onFleet);
    window.addEventListener("mybus:promo-updated", () => setPromos(readPromoRules()));
    window.addEventListener("storage", onFleet);
    return () => {
      window.removeEventListener("mybus:pricing-updated", onPricing);
      window.removeEventListener("mybus:fleet-updated", onFleet);
      window.removeEventListener("mybus:assignments-updated", onFleet);
      window.removeEventListener("storage", onFleet);
    };
  }, [refresh]);

  const filteredRows = useMemo(
    () => (filterRoute === "all" ? rows : rows.filter((r) => r.routeId === filterRoute)),
    [rows, filterRoute]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, PricingRow[]>();
    filteredRows.forEach((r) => {
      const list = map.get(r.routeId) ?? [];
      list.push(r);
      map.set(r.routeId, list);
    });
    return map;
  }, [filteredRows]);

  const saveRow = (row: PricingRow) => {
    const key = `${row.routeId}|${row.busId}`;
    const draft = drafts[key] ?? emptyDraft();
    const patch: { seater?: number; sleeper?: number } = {};
    if (row.layouts.includes("seater")) {
      const v = parseRupeeInput(draft.seater);
      if (v == null) {
        setNotice(`Enter a valid seater fare for ${row.busId}.`);
        return;
      }
      patch.seater = v;
    }
    if (row.layouts.includes("sleeper")) {
      const v = parseRupeeInput(draft.sleeper);
      if (v == null) {
        setNotice(`Enter a valid sleeper fare for ${row.busId}.`);
        return;
      }
      patch.sleeper = v;
    }
    setRouteBusPricing(row.routeId, row.busId, patch);
    setNotice(`Saved fares for ${row.busId} on ${row.routeLabel}`);
    refresh();
  };

  const updateDraft = (key: string, field: keyof DraftPrices, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] ?? emptyDraft()), [field]: value } }));
  };

  return (
    <div className="min-h-app w-full bg-[var(--app-surface)] pb-nav">
      <div className="rounded-b-[28px] bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pb-6 pt-safe shadow-xl sm:pt-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Pricing</h1>
            <p className="mt-0.5 text-[11px] text-white/70">Set seater & sleeper fares per route and bus</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("routes")}
            className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-semibold text-white"
          >
            Routes
          </button>
        </div>
        <select
          value={filterRoute}
          onChange={(e) => setFilterRoute(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="all" className="text-slate-900">
            All routes
          </option>
          {routes.map((r) => (
            <option key={r.id} value={r.id} className="text-slate-900">
              {r.from} → {r.to}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 px-5">
        {notice && (
          <div className="mb-4 rounded-2xl bg-violet-50 px-4 py-3 text-xs font-medium text-violet-900 ring-1 ring-violet-200">
            {notice}
          </div>
        )}

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-800">All configured fares</p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            Buses with both seater and sleeper need two prices. Operators use these fares at the walk-in desk.
          </p>
          <p className="mt-2 text-[10px] text-slate-400">{filteredRows.length} bus–route combinations</p>
        </div>

        {filteredRows.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            No active buses on this route. Assign buses under Routes first.
          </div>
        ) : (
          <div className="space-y-5">
            {[...grouped.entries()].map(([routeId, routeRows]) => (
              <section key={routeId} className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-bold text-slate-900">
                  {routeRows[0]?.routeLabel ?? routeId}
                  <span className="ml-2 text-[10px] font-normal text-slate-400">{routeId}</span>
                </h2>
                <div className="space-y-3">
                  {routeRows.map((row) => {
                    const key = `${row.routeId}|${row.busId}`;
                    const draft = drafts[key] ?? draftFromRow(row);
                    const bus = fleet.find((b) => b.id === row.busId);
                    return (
                      <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{row.busId}</p>
                            <p className="text-[10px] text-slate-500">{row.busName}</p>
                            <p className="mt-1 text-[10px] text-violet-700">
                              Layout: {row.layouts.map((l) => SEAT_CLASS_LABELS[l]).join(" + ")}
                            </p>
                          </div>
                          {bus && (
                            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] text-slate-500">
                              {bus.type}
                            </span>
                          )}
                        </div>
                        <div className={`grid gap-2 ${row.layouts.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {row.layouts.includes("seater") && (
                            <div>
                              <label className="mb-1 block text-[10px] font-medium text-slate-500">Seater (₹)</label>
                              <input
                                inputMode="numeric"
                                value={draft.seater}
                                onChange={(e) => updateDraft(key, "seater", e.target.value)}
                                placeholder="e.g. 420"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                              />
                            </div>
                          )}
                          {row.layouts.includes("sleeper") && (
                            <div>
                              <label className="mb-1 block text-[10px] font-medium text-slate-500">Sleeper (₹)</label>
                              <input
                                inputMode="numeric"
                                value={draft.sleeper}
                                onChange={(e) => updateDraft(key, "sleeper", e.target.value)}
                                placeholder="e.g. 520"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                              />
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[10px] text-slate-500">
                            {row.seater != null && <span>Seater {formatInr(row.seater)} </span>}
                            {row.sleeper != null && <span>Sleeper {formatInr(row.sleeper)}</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => saveRow(row)}
                            className="rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-semibold text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Promo rules</h2>
          <p className="mt-1 text-[10px] text-slate-500">Weekday discount and weekend surcharge apply at the operator desk.</p>
          <div className="mt-3 space-y-2">
            {promos.map((rule) => (
              <label key={rule.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-xs font-medium text-slate-800">{rule.label}</span>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => {
                    const next = promos.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
                    setPromos(next);
                    writePromoRules(next);
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <p className="mt-6 pb-4 text-center text-[10px] text-slate-400">
          Tip: enable both layouts on a bus under Fleet → Edit bus → Seat types sold.
        </p>
      </div>
    </div>
  );
}
