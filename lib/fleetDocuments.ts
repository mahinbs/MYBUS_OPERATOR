import { readBusOperations } from "./busOperationsStore";

export type BusDocuments = {
  rcExpiry?: string;
  insuranceExpiry?: string;
  permitExpiry?: string;
};

const STORAGE_KEY = "mybus_bus_documents_v1";

export function readAllBusDocuments(): Record<string, BusDocuments> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BusDocuments>;
  } catch {
    return {};
  }
}

export function readBusDocuments(busId: string): BusDocuments {
  return readAllBusDocuments()[busId] ?? {};
}

export function writeBusDocuments(busId: string, docs: BusDocuments) {
  const all = readAllBusDocuments();
  all[busId] = docs;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("mybus:documents-updated"));
  } catch {
    /* ignore */
  }
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const end = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export type DocAlert = { busId: string; field: string; days: number; severity: "warn" | "critical" };

export function collectDocumentAlerts(): DocAlert[] {
  const all = readAllBusDocuments();
  const alerts: DocAlert[] = [];
  for (const [busId, docs] of Object.entries(all)) {
    (["rcExpiry", "insuranceExpiry", "permitExpiry"] as const).forEach((field) => {
      const days = daysUntil(docs[field]);
      if (days == null) return;
      if (days <= 30) {
        alerts.push({
          busId,
          field: field.replace("Expiry", ""),
          days,
          severity: days <= 7 ? "critical" : "warn",
        });
      }
    });
  }
  return alerts.sort((a, b) => a.days - b.days);
}

export function collectMaintenanceAlerts(): { busId: string; message: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const ops = readBusOperations();
    const alerts: { busId: string; message: string }[] = [];
    Object.entries(ops).forEach(([busId, o]) => {
      if (o.nextService) {
        const days = daysUntil(o.nextService);
        if (days != null && days <= 14) {
          alerts.push({ busId, message: `Service due in ${days} day(s)` });
        }
      }
    });
    return alerts;
  } catch {
    return [];
  }
}
