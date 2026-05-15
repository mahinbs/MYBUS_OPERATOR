"use client";

import { useEffect, useState } from "react";
import { routePriceSummary } from "../../lib/fleetPricing";
import { readRouteStops, writeRouteStops } from "../../lib/routeStopsStore";
import { readFleet } from "../../lib/fleetPersistence";
import { BASE_ROUTES, readManagedRoutes, ROUTES_STORAGE_KEY, type ManagedRoute } from "../../lib/managedRoutes";
import { readRouteBusAssignments, writeRouteBusAssignments } from "../../lib/routeBusAssignments";


export default function RouteManagementScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [assignRev, setAssignRev] = useState(0);

  const [routesState, setRoutesState] = useState<ManagedRoute[]>(() => readManagedRoutes());
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [stopsDraft, setStopsDraft] = useState({ pickups: "", drops: "" });
  const [form, setForm] = useState<{
    from: string;
    to: string;
    distance: string;
    duration: string;
    basePrice: string;
    trips: string; // keep as string for input
  }>({ from: "", to: "", distance: "", duration: "", basePrice: "", trips: "" });

  const activeRoute = routesState.find((r) => r.id === selectedRoute) ?? null;

  useEffect(() => {
    const sync = () => setRoutesState(readManagedRoutes());
    sync();
    window.addEventListener("mybus:pricing-updated", sync);
    return () => window.removeEventListener("mybus:pricing-updated", sync);
  }, []);

  const openEdit = () => {
    if (!activeRoute) return;
    setForm({
      from: activeRoute.from,
      to: activeRoute.to,
      distance: activeRoute.distance,
      duration: activeRoute.duration,
      basePrice: activeRoute.basePrice,
      trips: String(activeRoute.trips),
    });
    setShowEditModal(true);
  };

  const closeEdit = () => {
    setShowEditModal(false);
  };

  const saveEdit = () => {
    if (!activeRoute) return;
    const from = form.from.trim();
    const to = form.to.trim();
    const distance = form.distance.trim();
    const duration = form.duration.trim();
    const basePrice = form.basePrice.trim();
    const tripsNum = Number.parseInt(form.trips.trim(), 10);

    if (!from || !to || !distance || !duration || !basePrice || !Number.isFinite(tripsNum) || tripsNum < 0) return;

    const next = routesState.map((r) =>
      r.id === activeRoute.id
        ? {
            ...r,
            from,
            to,
            distance,
            duration,
            basePrice,
            trips: tripsNum,
          }
        : r
    );

    setRoutesState(next);
    try {
      // Store as partial objects to keep storage format stable if we add fields later.
      const patchToStore = next.map((r) => ({
        id: r.id,
        from: r.from,
        to: r.to,
        distance: r.distance,
        duration: r.duration,
        basePrice: r.basePrice,
        trips: r.trips,
      }));
      localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(patchToStore));
      window.dispatchEvent(new Event("mybus:routes-updated"));
    } catch {
      // ignore
    }
    closeEdit();
    setAssignRev((x) => x + 1);
  };

  return (
    <div className={`min-h-app w-full bg-[#F0F0F5] ${selectedRoute ? "pb-nav-lg" : "pb-nav"}`}>
      {/* Dark header */}
      <div className="bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pt-safe sm:pt-12 pb-6 rounded-b-[28px] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-bold text-xl">Routes</h1>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            aria-label="Add route"
          >
            <i className="ri-add-line text-lg text-white" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
            <p className="text-white font-bold text-lg">24</p>
            <p className="text-white/50 text-[10px]">Active Routes</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
            <p className="text-white font-bold text-lg">156</p>
            <p className="text-white/50 text-[10px]">Trips/Day</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        {!selectedRoute ? (
          <div className="space-y-4">
            {routesState.map((route) => (
              <button
                type="button"
                key={route.id}
                onClick={() => setSelectedRoute(route.id)}
                className="w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm"
              >
                <div className="h-28 relative">
                  <img src={route.image} alt={`${route.from} to ${route.to}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-sm font-semibold">{route.from}</span>
                      <i className="ri-arrow-right-line text-xs" />
                      <span className="text-sm font-semibold">{route.to}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full">{route.id}</span>
                    <span className="text-xs font-bold text-[#7C3AED]">{routePriceSummary(route.id)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[#6B7280]">
                    <span className="flex items-center gap-1"><i className="ri-route-line text-[#9CA3AF]" /> {route.distance}</span>
                    <span className="flex items-center gap-1"><i className="ri-time-line text-[#9CA3AF]" /> {route.duration}</span>
                    <span className="flex items-center gap-1"><i className="ri-bus-2-line text-[#9CA3AF]" /> {route.trips} trips</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            {/* Back button */}
            <button
              type="button"
              onClick={() => setSelectedRoute(null)}
              className="mb-4 flex items-center gap-1 text-xs font-medium text-[#7C3AED]"
            >
              <i className="ri-arrow-left-line" /> Back to Routes
            </button>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
              <div className="h-36 relative">
                <img
                  src={activeRoute?.image ?? ""}
                  alt={activeRoute ? `${activeRoute.from} to ${activeRoute.to}` : "Route"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 text-white mb-1">
                    <span className="text-lg font-bold">{activeRoute?.from}</span>
                    <i className="ri-arrow-right-line" />
                    <span className="text-lg font-bold">{activeRoute?.to}</span>
                  </div>
                  <span className="text-white/70 text-xs">
                    {activeRoute?.distance} · {activeRoute?.duration}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Fares (all buses)</p>
                    <p className="text-lg font-bold text-[#7C3AED]">
                      {activeRoute ? routePriceSummary(activeRoute.id) : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9CA3AF]">Trips Today</p>
                    <p className="text-lg font-bold text-[#111827]">{activeRoute?.trips}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openEdit}
                      className="flex-1 rounded-xl bg-[#7C3AED] py-2.5 text-xs font-medium text-white active:scale-[0.99]"
                    >
                      Edit Route
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate("trips")}
                      className="flex-1 rounded-xl bg-[#F3F4F6] py-2.5 text-xs font-medium text-[#6B7280]"
                    >
                      Schedule
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => activeRoute && onNavigate(`pricing:${activeRoute.id}`)}
                    className="w-full rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-xs font-semibold text-[#5b21b6]"
                  >
                    Set seater & sleeper fares
                  </button>
                </div>
              </div>
            </div>

            {/* Bus assignment */}
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm" key={assignRev}>
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-[#111827]">
                <i className="ri-bus-wifi-line text-[#7C3AED]" />
                Assign buses to this route
              </h3>
              <p className="mb-3 text-[10px] leading-relaxed text-[#6B7280]">
                Counter staff only see buses you tick here (otherwise every active bus can be sold on this route).
              </p>
              <div className="space-y-2">
                {readFleet()
                  .filter((b) => b.status === "Active")
                  .map((bus) => {
                    const allActive = readFleet().filter((b) => b.status === "Active").map((b) => b.id);
                    const stored = activeRoute ? readRouteBusAssignments()[activeRoute.id] : undefined;
                    const effective = stored?.length ? stored : allActive;
                    const checked = effective.includes(bus.id);
                    return (
                      <label
                        key={bus.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          className="h-4 w-4 rounded border-slate-300 text-[#7C3AED] accent-[#7C3AED]"
                          onChange={(e) => {
                            if (!activeRoute) return;
                            const all = readFleet()
                              .filter((b) => b.status === "Active")
                              .map((b) => b.id);
                            const map = readRouteBusAssignments();
                            let cur = map[activeRoute.id];
                            if (!cur || cur.length === 0) cur = [...all];
                            const set = new Set(cur);
                            if (e.target.checked) set.add(bus.id);
                            else set.delete(bus.id);
                            let next = [...set];
                            if (next.length === 0) next = [...all];
                            const allSelected = all.length > 0 && all.every((id) => next.includes(id));
                            if (allSelected) {
                              const m = { ...map };
                              delete m[activeRoute.id];
                              writeRouteBusAssignments(m);
                            } else {
                              writeRouteBusAssignments({ ...map, [activeRoute.id]: next });
                            }
                            setAssignRev((x) => x + 1);
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#111827]">{bus.id}</p>
                          <p className="truncate text-[10px] text-[#6B7280]">{bus.name}</p>
                        </div>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Pickup Points */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                  <i className="ri-map-pin-2-line text-[#7C3AED]" /> Pickup Points
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const s = readRouteStops(activeRoute!.id);
                    setStopsDraft({ pickups: s.pickups.join("\n"), drops: s.drops.join("\n") });
                    setShowStopsModal(true);
                  }}
                  className="text-[10px] font-semibold text-[#7C3AED]"
                >
                  Edit stops
                </button>
              </div>
              <div className="space-y-2">
                {readRouteStops(activeRoute!.id).pickups.map((p, i) => (
                  <div key={p} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] text-xs font-bold">{i + 1}</div>
                    <span className="text-xs text-[#4B5563]">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop Points */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <h3 className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-1.5">
                <i className="ri-flag-line text-[#7C3AED]" /> Drop Points
              </h3>
              <div className="space-y-2">
                {readRouteStops(activeRoute!.id).drops.map((p, i) => (
                  <div key={p} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] text-xs font-bold">{i + 1}</div>
                    <span className="text-xs text-[#4B5563]">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditModal && activeRoute && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:p-4"
          onClick={closeEdit}
          role="presentation"
        >
          <div
            className="w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-white p-5 pb-safe shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-route-title"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <h2 id="edit-route-title" className="text-lg font-bold text-slate-900">
              Edit route
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Updates are saved on this device and will reflect in this screen.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500">From</label>
                <input
                  value={form.from}
                  onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500">To</label>
                <input
                  value={form.to}
                  onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-slate-500">Distance</label>
                  <input
                    value={form.distance}
                    onChange={(e) => setForm((p) => ({ ...p, distance: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-slate-500">Duration</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-slate-500">Base price</label>
                  <input
                    value={form.basePrice}
                    onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-slate-500">Trips today</label>
                  <input
                    value={form.trips}
                    onChange={(e) => setForm((p) => ({ ...p, trips: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="flex-1 rounded-2xl bg-[#7C3AED] py-3 text-sm font-semibold text-white active:scale-[0.99]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showStopsModal && activeRoute && (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/50" onClick={() => setShowStopsModal(false)}>
          <div className="w-full rounded-t-[28px] bg-white p-6 pb-safe" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Edit stops</h3>
            <p className="mt-1 text-xs text-slate-500">One stop per line</p>
            <label className="mt-3 block text-xs text-slate-500">Pickups</label>
            <textarea
              value={stopsDraft.pickups}
              onChange={(e) => setStopsDraft((d) => ({ ...d, pickups: e.target.value }))}
              className="mt-1 h-24 w-full rounded-xl border p-2 text-sm"
            />
            <label className="mt-3 block text-xs text-slate-500">Drops</label>
            <textarea
              value={stopsDraft.drops}
              onChange={(e) => setStopsDraft((d) => ({ ...d, drops: e.target.value }))}
              className="mt-1 h-24 w-full rounded-xl border p-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                writeRouteStops(activeRoute.id, {
                  pickups: stopsDraft.pickups.split("\n").map((s) => s.trim()).filter(Boolean),
                  drops: stopsDraft.drops.split("\n").map((s) => s.trim()).filter(Boolean),
                });
                setShowStopsModal(false);
              }}
              className="mt-4 w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white"
            >
              Save stops
            </button>
          </div>
        </div>
      )}
    </div>
  );
}