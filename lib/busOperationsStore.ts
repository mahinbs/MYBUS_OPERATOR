export type BusOperations = {
  odometerKm: string;
  fuelLevel: string;
  nextService: string;
  driverNotes: string;
  dailyInspection: boolean;
  cleaned: boolean;
  tyresOk: boolean;
  /** ISO timestamp when operator last saved this checklist */
  updatedAt?: string;
};

export function isOpsChecklistComplete(ops: BusOperations): boolean {
  return ops.dailyInspection && ops.cleaned && ops.tyresOk;
}

const STORAGE_KEY = "mybus_bus_operations_v1";

const defaultOps: BusOperations = {
  odometerKm: "",
  fuelLevel: "",
  nextService: "",
  driverNotes: "",
  dailyInspection: false,
  cleaned: false,
  tyresOk: false,
};

export function readBusOperations(): Record<string, BusOperations> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, BusOperations>;
    return typeof p === "object" && p ? p : {};
  } catch {
    return {};
  }
}

export function readOpsForBus(busId: string): BusOperations {
  const all = readBusOperations();
  return { ...defaultOps, ...all[busId] };
}

export function writeOpsForBus(busId: string, patch: Partial<BusOperations>) {
  const all = {
    ...readBusOperations(),
    [busId]: { ...readOpsForBus(busId), ...patch, updatedAt: new Date().toISOString() },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("mybus:bus-ops-updated"));
  } catch {
    /* ignore */
  }
}
