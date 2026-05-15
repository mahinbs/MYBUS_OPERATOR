/** Shared driver roster for fleet reports and driver management UI. */

export type DriverRosterEntry = {
  id: string;
  name: string;
  phone: string;
  license: string;
  status: "Active" | "On Leave" | "Off Duty";
  assignedBus: string | null;
  rating: number;
  tripsDone: number;
  onTimePct: number;
};

export const DRIVER_ROSTER: DriverRosterEntry[] = [
  {
    id: "DRV-001",
    name: "Suresh Yadav",
    phone: "+91 98765 11111",
    license: "MH-2020-123456",
    status: "Active",
    assignedBus: "MB-001",
    rating: 4.8,
    tripsDone: 1240,
    onTimePct: 96,
  },
  {
    id: "DRV-002",
    name: "Amit Singh",
    phone: "+91 98765 22222",
    license: "DL-2019-654321",
    status: "Active",
    assignedBus: "MB-002",
    rating: 4.6,
    tripsDone: 980,
    onTimePct: 93,
  },
  {
    id: "DRV-003",
    name: "Ravi Kumar",
    phone: "+91 98765 33333",
    license: "KA-2021-789012",
    status: "On Leave",
    assignedBus: "MB-003",
    rating: 4.7,
    tripsDone: 756,
    onTimePct: 91,
  },
  {
    id: "DRV-004",
    name: "Deepak Sharma",
    phone: "+91 98765 44444",
    license: "TN-2018-345678",
    status: "Off Duty",
    assignedBus: null,
    rating: 4.9,
    tripsDone: 1560,
    onTimePct: 98,
  },
  {
    id: "DRV-005",
    name: "Manoj Patel",
    phone: "+91 98765 55555",
    license: "GJ-2022-901234",
    status: "Active",
    assignedBus: "MB-004",
    rating: 4.5,
    tripsDone: 420,
    onTimePct: 89,
  },
];

/** Counter operators assigned per bus (demo; owner can set lead operator in Team). */
export const COUNTER_BY_BUS: Record<string, { name: string; phone: string }> = {
  "MB-001": { name: "Anita Desai", phone: "+91 98100 10001" },
  "MB-002": { name: "Rohit Verma", phone: "+91 98100 10002" },
  "MB-003": { name: "Kavita Rao", phone: "+91 98100 10003" },
  "MB-004": { name: "Imran Khan", phone: "+91 98100 10004" },
};

export function driverForBus(busId: string): DriverRosterEntry | null {
  return DRIVER_ROSTER.find((d) => d.assignedBus === busId) ?? null;
}
