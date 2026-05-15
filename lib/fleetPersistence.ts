import type { SeatClass } from "./seatClasses";

/** Mirrors BusRow in BusManagementScreen — persisted so Desk & Routes see the same fleet. */

export type PersistedBus = {
  id: string;
  name: string;
  reg: string;
  type: string;
  capacity: number;
  status: string;
  image: string;
  amenities: string[];
  /** When set, bus sells both seater and sleeper inventory (owner configures in Fleet). */
  seatLayouts?: SeatClass[];
};

const STORAGE_KEY = "mybus_fleet_v1";

export const DEFAULT_FLEET: PersistedBus[] = [
  {
    id: "MB-001",
    name: "Volvo 9600 AC Sleeper",
    reg: "MH-01-AB-1234",
    type: "Sleeper",
    capacity: 40,
    status: "Active",
    image:
      "https://readdy.ai/api/search-image?query=modern%20blue%20luxury%20volvo%20bus%20side%20view%20on%20road%2C%20clean%20background%2C%20professional%20transport%20photography&width=400&height=200&seq=10&orientation=landscape",
    amenities: ["WiFi", "Charging", "Water", "Blanket", "GPS", "AC"],
  },
  {
    id: "MB-002",
    name: "Scania Metrolink",
    reg: "DL-03-CD-5678",
    type: "Seater",
    capacity: 45,
    status: "Active",
    image:
      "https://readdy.ai/api/search-image?query=modern%20red%20scania%20intercity%20bus%20side%20view%20on%20highway%2C%20clean%20background%2C%20professional%20transport%20photography&width=400&height=200&seq=11&orientation=landscape",
    amenities: ["WiFi", "Charging", "Meals", "GPS", "AC"],
  },
  {
    id: "MB-003",
    name: "Mercedes Benz OC500",
    reg: "KA-05-EF-9012",
    type: "Sleeper",
    capacity: 36,
    status: "Maintenance",
    image:
      "https://readdy.ai/api/search-image?query=modern%20silver%20mercedes%20bus%20side%20view%20on%20road%2C%20clean%20background%2C%20professional%20transport%20photography&width=400&height=200&seq=12&orientation=landscape",
    amenities: ["WiFi", "Water", "Blanket", "AC"],
  },
  {
    id: "MB-004",
    name: "Ashok Leyland Oyster",
    reg: "TN-07-GH-3456",
    type: "Semi-Sleeper",
    capacity: 42,
    status: "Active",
    image:
      "https://readdy.ai/api/search-image?query=modern%20white%20ashok%20leyland%20intercity%20bus%20side%20view%20on%20highway%2C%20clean%20background%2C%20professional%20transport%20photography&width=400&height=200&seq=13&orientation=landscape",
    amenities: ["Charging", "Water", "Entertainment", "GPS", "AC"],
    seatLayouts: ["seater", "sleeper"],
  },
];

export function readFleet(): PersistedBus[] {
  if (typeof window === "undefined") return DEFAULT_FLEET;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FLEET;
    const parsed = JSON.parse(raw) as PersistedBus[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_FLEET;
  } catch {
    return DEFAULT_FLEET;
  }
}

export function writeFleet(buses: PersistedBus[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buses));
    window.dispatchEvent(new Event("mybus:fleet-updated"));
  } catch {
    /* ignore */
  }
}

export function fleetBusIds(): string[] {
  return readFleet().map((b) => b.id);
}
