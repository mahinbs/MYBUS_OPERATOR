"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import type { PersistedBus } from "../../lib/fleetPersistence";
import { DEFAULT_FLEET, readFleet, writeFleet } from "../../lib/fleetPersistence";
import { getRoutesForBus } from "../../lib/routeBusAssignments";
import type { BusOperations } from "../../lib/busOperationsStore";
import { isOpsChecklistComplete, readOpsForBus, writeOpsForBus } from "../../lib/busOperationsStore";
import { getSeatLayoutsForBus, SEAT_CLASS_LABELS, type SeatClass } from "../../lib/seatClasses";

const amenityChips = ["WiFi", "Charging", "Water", "Blanket", "Entertainment", "Meals", "GPS", "AC"];

type Draft = {
  name: string;
  reg: string;
  type: string;
  capacity: string;
  amenities: string[];
  seatLayouts: SeatClass[];
};

const emptyDraft = (): Draft => ({ name: "", reg: "", type: "", capacity: "", amenities: [], seatLayouts: ["seater"] });

function formatOpsTime(iso?: string) {
  if (!iso) return "Not recorded yet";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "Not recorded yet";
  }
}

function OwnerOpsSummary({ busId, status }: { busId: string; status: string }) {
  const ops = readOpsForBus(busId);
  const checklistDone = isOpsChecklistComplete(ops);
  const inMaintenance = status === "Maintenance";

  return (
    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Operator maintenance log</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
            inMaintenance ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {inMaintenance ? "In maintenance" : "Active · road ready"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
            checklistDone ? "bg-violet-100 text-violet-800" : "bg-slate-200 text-slate-600"
          }`}
        >
          {checklistDone ? "Daily checks complete" : "Checks pending"}
        </span>
      </div>
      <ul className="space-y-1 text-[10px] text-slate-600">
        <li className="flex items-center gap-1.5">
          <i className={ops.dailyInspection ? "ri-checkbox-circle-fill text-emerald-600" : "ri-close-circle-line text-slate-400"} />
          Inspection {ops.dailyInspection ? "done" : "pending"}
        </li>
        <li className="flex items-center gap-1.5">
          <i className={ops.cleaned ? "ri-checkbox-circle-fill text-emerald-600" : "ri-close-circle-line text-slate-400"} />
          Cleaning {ops.cleaned ? "done" : "pending"}
        </li>
        <li className="flex items-center gap-1.5">
          <i className={ops.tyresOk ? "ri-checkbox-circle-fill text-emerald-600" : "ri-close-circle-line text-slate-400"} />
          Tyres {ops.tyresOk ? "OK" : "pending"}
        </li>
      </ul>
      {(ops.odometerKm || ops.fuelLevel || ops.nextService) && (
        <p className="mt-2 text-[10px] text-slate-500">
          {ops.odometerKm && <span>Odometer {ops.odometerKm} km · </span>}
          {ops.fuelLevel && <span>Fuel {ops.fuelLevel} · </span>}
          {ops.nextService && <span>Service {ops.nextService}</span>}
        </p>
      )}
      <p className="mt-2 text-[9px] text-slate-400">Last updated by operator: {formatOpsTime(ops.updatedAt)}</p>
    </div>
  );
}

export default function BusManagementScreen({
  onNavigate,
  panel = "owner",
}: {
  onNavigate: (page: string) => void;
  panel?: "owner" | "operator";
}) {
  const isOperator = panel === "operator";
  const isOwner = !isOperator;
  const [buses, setBuses] = useState<PersistedBus[]>(() => readFleet());
  const [, bumpRouteAssignments] = useReducer((x: number) => x + 1, 0);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [opsBusId, setOpsBusId] = useState<string | null>(null);
  const [opsForm, setOpsForm] = useState<BusOperations>(() => readOpsForBus(""));
  const [, bumpOpsView] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const syncFleet = () => setBuses(readFleet());
    const syncOps = () => bumpOpsView();
    window.addEventListener("mybus:fleet-updated", syncFleet);
    window.addEventListener("mybus:bus-ops-updated", syncOps);
    return () => {
      window.removeEventListener("mybus:fleet-updated", syncFleet);
      window.removeEventListener("mybus:bus-ops-updated", syncOps);
    };
  }, []);

  useEffect(() => {
    const onAssign = () => bumpRouteAssignments();
    window.addEventListener("mybus:assignments-updated", onAssign);
    return () => window.removeEventListener("mybus:assignments-updated", onAssign);
  }, []);

  useEffect(() => {
    if (opsBusId) setOpsForm(readOpsForBus(opsBusId));
  }, [opsBusId]);

  const stats = useMemo(() => {
    const active = buses.filter((b) => b.status === "Active").length;
    const maint = buses.filter((b) => b.status === "Maintenance").length;
    const avgCap = buses.length ? Math.round(buses.reduce((s, b) => s + b.capacity, 0) / buses.length) : 0;
    return { active, maint, avgCap };
  }, [buses]);

  const filtered = useMemo(
    () =>
      buses.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) || b.reg.toLowerCase().includes(search.toLowerCase())
      ),
    [buses, search]
  );

  const editingBus = selectedBusId ? buses.find((b) => b.id === selectedBusId) : null;

  useEffect(() => {
    if (!showAddModal) return;
    if (editingBus) {
      setDraft({
        name: editingBus.name,
        reg: editingBus.reg,
        type: editingBus.type,
        capacity: String(editingBus.capacity),
        amenities: [...editingBus.amenities],
        seatLayouts: [...getSeatLayoutsForBus(editingBus)],
      });
    } else {
      setDraft(emptyDraft());
    }
  }, [showAddModal, editingBus]);

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedBusId(null);
    setDraft(emptyDraft());
  };

  const toggleSeatLayout = (layout: SeatClass) => {
    setDraft((prev) => {
      const has = prev.seatLayouts.includes(layout);
      let next = has ? prev.seatLayouts.filter((l) => l !== layout) : [...prev.seatLayouts, layout];
      if (next.length === 0) next = [layout];
      return { ...prev, seatLayouts: next };
    });
  };

  const toggleAmenity = (a: string) => {
    setDraft((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a) ? prev.amenities.filter((x) => x !== a) : [...prev.amenities, a],
    }));
  };

  const saveBus = () => {
    const cap = Number.parseInt(draft.capacity, 10);
    if (!draft.name.trim() || !draft.reg.trim() || !draft.type.trim() || !Number.isFinite(cap) || cap <= 0) {
      return;
    }

    if (editingBus) {
      setBuses((prev) => {
        const next = prev.map((b) =>
          b.id === editingBus.id
            ? {
                ...b,
                name: draft.name.trim(),
                reg: draft.reg.trim(),
                type: draft.type.trim(),
                capacity: cap,
                amenities: [...draft.amenities],
                seatLayouts: draft.seatLayouts.length ? [...draft.seatLayouts] : undefined,
              }
            : b
        );
        writeFleet(next);
        return next;
      });
    } else {
      const id = `MB-${String(Date.now()).slice(-3)}`;
      setBuses((prev) => {
        const next = [
          ...prev,
          {
            id,
            name: draft.name.trim(),
            reg: draft.reg.trim(),
            type: draft.type.trim(),
            capacity: cap,
            status: "Active",
            image: DEFAULT_FLEET[0]?.image ?? "",
            amenities: [...draft.amenities],
            seatLayouts: draft.seatLayouts.length ? [...draft.seatLayouts] : undefined,
          },
        ];
        writeFleet(next);
        return next;
      });
    }
    closeModal();
  };

  const toggleBusStatus = (busId: string) => {
    setBuses((prev) => {
      const next = prev.map((b) =>
        b.id === busId ? { ...b, status: b.status === "Active" ? "Maintenance" : "Active" } : b
      );
      writeFleet(next);
      return next;
    });
  };

  const saveOps = () => {
    if (!opsBusId) return;
    writeOpsForBus(opsBusId, opsForm);
    setOpsBusId(null);
  };

  return (
    <div className="min-h-app w-full bg-[var(--app-surface)] pb-nav">
      <div className="bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pt-safe sm:pt-12 pb-6 rounded-b-[28px] shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{isOperator ? "Fleet operations" : "Fleet"}</h1>
            {isOperator && <p className="mt-0.5 text-[11px] text-white/70">Daily checks & maintenance</p>}
            {isOwner && <p className="mt-0.5 text-[11px] text-white/70">View operator maintenance status</p>}
          </div>
          {isOwner && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onNavigate("routes")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
              aria-label="Routes"
            >
              <i className="ri-route-line text-lg text-white" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedBusId(null);
                setShowAddModal(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
              aria-label="Add bus"
            >
              <i className="ri-add-line text-lg text-white" />
            </button>
          </div>
          )}
        </div>
        <div className="relative">
          <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buses..."
            className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/50"
          />
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="mb-5 flex gap-3">
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-bold text-[#111827]">{stats.active}</p>
            <p className="text-[10px] text-[#9CA3AF]">Active</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-bold text-amber-600">{stats.maint}</p>
            <p className="text-[10px] text-[#9CA3AF]">Maintenance</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-bold text-[#7C3AED]">{stats.avgCap}</p>
            <p className="text-[10px] text-[#9CA3AF]">Avg capacity</p>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((bus) => {
            const routeIds = getRoutesForBus(bus.id);
            return (
            <div key={bus.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="relative h-32">
                <img src={bus.image} alt={bus.name} className="h-full w-full object-cover" />
                <div className="absolute right-3 top-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      bus.status === "Active" ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                    }`}
                  >
                    {bus.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111827]">{bus.name}</h3>
                  <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] text-[#9CA3AF]">{bus.id}</span>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <i className="ri-car-line text-[#9CA3AF]" /> {bus.reg}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-armchair-line text-[#9CA3AF]" /> {bus.capacity} seats
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-shape-line text-[#9CA3AF]" /> {bus.type}
                  </span>
                </div>
                <p className="mb-3 text-[10px] leading-snug text-[#6B7280]">
                  <span className="font-semibold text-[#374151]">Routes </span>
                  {routeIds.length > 0 ? routeIds.join(", ") : "All routes (not restricted)"}
                </p>
                {isOwner && <OwnerOpsSummary busId={bus.id} status={bus.status} />}
                <div className="flex flex-col gap-2">
                  {isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBusId(bus.id);
                          setShowAddModal(true);
                        }}
                        className="min-h-[44px] w-full rounded-xl bg-[#7C3AED] py-2 text-xs font-semibold text-white active:scale-[0.98]"
                      >
                        Edit bus
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate("trips")}
                        className="min-h-[44px] w-full rounded-xl bg-[#F3F4F6] py-2 text-xs font-semibold text-[#374151] active:scale-[0.98]"
                      >
                        Trips
                      </button>
                    </>
                  )}
                  {isOperator && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpsBusId(bus.id)}
                        className="min-h-[44px] w-full rounded-xl border border-violet-200 bg-violet-50 py-2 text-xs font-semibold text-[#5b21b6] active:scale-[0.98]"
                      >
                        Bus operations
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBusStatus(bus.id)}
                        className="min-h-[44px] w-full rounded-xl bg-amber-50 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 active:scale-[0.98]"
                      >
                        {bus.status === "Active" ? "Set maintenance" : "Mark active & road ready"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {isOwner && showAddModal && (
        <div
          className="fixed inset-0 z-[90] flex items-end bg-black/50"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bus-modal-title"
          >
            <div className="shrink-0 px-6 pb-2 pt-4">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E5E7EB]" aria-hidden />
              <h3 id="bus-modal-title" className="mb-1 text-lg font-bold text-[#111827]">
                {editingBus ? "Edit bus" : "Add new bus"}
              </h3>
              {editingBus ? (
                <p className="text-xs text-[#6B7280]">
                  Updating {editingBus.id} · {editingBus.reg}
                </p>
              ) : (
                <p className="text-xs text-[#6B7280]">Add a vehicle to your fleet</p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-[#6B7280]">Bus Name</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. Volvo 9600"
                    className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#6B7280]">Registration Number</label>
                  <input
                    type="text"
                    value={draft.reg}
                    onChange={(e) => setDraft((d) => ({ ...d, reg: e.target.value }))}
                    placeholder="e.g. MH-01-AB-1234"
                    className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs text-[#6B7280]">Type</label>
                    <input
                      type="text"
                      value={draft.type}
                      onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                      placeholder="Sleeper / Seater"
                      className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-[#6B7280]">Capacity</label>
                    <input
                      type="number"
                      min={1}
                      value={draft.capacity}
                      onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
                      placeholder="40"
                      className="w-full rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[#6B7280]">Seat types sold</label>
                  <p className="mb-2 text-[10px] text-slate-500">Tick both for dual seater + sleeper inventory.</p>
                  <div className="mb-4 flex gap-2">
                    {(["seater", "sleeper"] as const).map((layout) => (
                      <button
                        key={layout}
                        type="button"
                        onClick={() => isOwner && toggleSeatLayout(layout)}
                        disabled={!isOwner}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${
                          draft.seatLayouts.includes(layout)
                            ? "bg-[#7C3AED] text-white"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        } ${!isOwner ? "opacity-60" : ""}`}
                      >
                        {SEAT_CLASS_LABELS[layout]}
                      </button>
                    ))}
                  </div>
                  <label className="mb-1.5 block text-xs text-[#6B7280]">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {amenityChips.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          draft.amenities.includes(a) ? "bg-[#7C3AED] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-6 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3">
              <button type="button" onClick={saveBus} className="w-full rounded-2xl bg-[#7C3AED] py-3.5 text-sm font-semibold text-white active:scale-[0.99]">
                {editingBus ? "Save changes" : "Add bus"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isOperator && opsBusId && (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/50" onClick={() => setOpsBusId(null)} role="presentation">
          <div
            className="flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bus-ops-title"
          >
            <div className="shrink-0 px-6 pb-2 pt-4">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E5E7EB]" aria-hidden />
              <h3 id="bus-ops-title" className="text-lg font-bold text-[#111827]">
                Bus operations
              </h3>
              <p className="text-xs text-[#6B7280]">
                {opsBusId}
                {buses.find((b) => b.id === opsBusId) ? ` · ${buses.find((b) => b.id === opsBusId)!.name}` : ""}
              </p>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#6B7280]">Odometer (km)</label>
                  <input
                    value={opsForm.odometerKm}
                    onChange={(e) => setOpsForm((f) => ({ ...f, odometerKm: e.target.value }))}
                    className="w-full rounded-xl bg-[#F3F4F6] px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#6B7280]">Fuel</label>
                  <input
                    value={opsForm.fuelLevel}
                    onChange={(e) => setOpsForm((f) => ({ ...f, fuelLevel: e.target.value }))}
                    placeholder="e.g. Full"
                    className="w-full rounded-xl bg-[#F3F4F6] px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6B7280]">Next service</label>
                <input
                  value={opsForm.nextService}
                  onChange={(e) => setOpsForm((f) => ({ ...f, nextService: e.target.value }))}
                  className="w-full rounded-xl bg-[#F3F4F6] px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6B7280]">Driver notes</label>
                <textarea
                  value={opsForm.driverNotes}
                  onChange={(e) => setOpsForm((f) => ({ ...f, driverNotes: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl bg-[#F3F4F6] px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={opsForm.dailyInspection}
                    onChange={(e) => setOpsForm((f) => ({ ...f, dailyInspection: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#7C3AED]"
                  />
                  <span className="text-sm text-[#374151]">Daily inspection done</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={opsForm.cleaned}
                    onChange={(e) => setOpsForm((f) => ({ ...f, cleaned: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#7C3AED]"
                  />
                  <span className="text-sm text-[#374151]">Bus cleaned</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={opsForm.tyresOk}
                    onChange={(e) => setOpsForm((f) => ({ ...f, tyresOk: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#7C3AED]"
                  />
                  <span className="text-sm text-[#374151]">Tyres OK</span>
                </label>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-white px-6 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3">
              <button
                type="button"
                onClick={() => setOpsBusId(null)}
                className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-[#374151]"
              >
                Cancel
              </button>
              <button type="button" onClick={saveOps} className="flex-1 rounded-2xl bg-[#7C3AED] py-3.5 text-sm font-semibold text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
