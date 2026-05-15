/** Client-side backup/restore simulating cloud sync until a real API exists. */

const SYNC_KEY = "mybus_cloud_snapshot_v1";
const LAST_SYNC_KEY = "mybus_last_sync_at";

const BUNDLE_KEYS = [
  "mybus_fleet_v1",
  "mybus_bookings_v2",
  "mybus_trips_v1",
  "mybus_fleet_pricing_v1",
  "mybus_routes_v1",
  "mybus_route_bus_assignments_v1",
  "mybus_route_stops_v1",
  "mybus_bus_operations_v1",
  "mybus_promo_v1",
  "mybus_bus_documents_v1",
  "mybus_shifts_v1",
];

export type SyncBundle = Record<string, string>;

export function exportBundle(): SyncBundle {
  const bundle: SyncBundle = {};
  if (typeof window === "undefined") return bundle;
  BUNDLE_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val) bundle[key] = val;
  });
  return bundle;
}

export function saveSnapshotToCloud(): { ok: boolean; at: string } {
  const bundle = exportBundle();
  const at = new Date().toISOString();
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(bundle));
    localStorage.setItem(LAST_SYNC_KEY, at);
    window.dispatchEvent(new Event("mybus:cloud-synced"));
    return { ok: true, at };
  } catch {
    return { ok: false, at };
  }
}

export function restoreFromCloud(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (!raw) return false;
    const bundle = JSON.parse(raw) as SyncBundle;
    Object.entries(bundle).forEach(([key, val]) => {
      localStorage.setItem(key, val);
    });
    window.dispatchEvent(new Event("mybus:cloud-synced"));
    window.dispatchEvent(new Event("mybus:fleet-updated"));
    window.dispatchEvent(new Event("mybus:bookings-updated"));
    window.dispatchEvent(new Event("mybus:trips-updated"));
    window.dispatchEvent(new Event("mybus:pricing-updated"));
    return true;
  } catch {
    return false;
  }
}

export function lastSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function downloadBackupJson() {
  const bundle = exportBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mybus-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
