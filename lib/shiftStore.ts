import { readBookings } from "./localBookings";

export type ShiftRecord = {
  id: string;
  operatorId: string;
  operatorName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  closingCash?: number;
  note?: string;
};

const STORAGE_KEY = "mybus_shifts_v1";
const ACTIVE_KEY = "mybus_active_shift_id";

function parseRupee(amount: string): number {
  const n = parseInt(amount.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function readShifts(): ShiftRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShiftRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeShifts(rows: ShiftRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new Event("mybus:shift-updated"));
  } catch {
    /* ignore */
  }
}

export function getActiveShiftId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function getActiveShift(): ShiftRecord | null {
  const id = getActiveShiftId();
  if (!id) return null;
  return readShifts().find((s) => s.id === id && !s.closedAt) ?? null;
}

export function openShift(operatorId: string, operatorName: string, openingFloat: number) {
  const id = `SH-${Date.now().toString().slice(-6)}`;
  const shift: ShiftRecord = {
    id,
    operatorId,
    operatorName,
    openedAt: new Date().toISOString(),
    openingFloat,
  };
  writeShifts([shift, ...readShifts()]);
  localStorage.setItem(ACTIVE_KEY, id);
  window.dispatchEvent(new Event("mybus:shift-updated"));
  return shift;
}

export function closeShift(closingCash: number, note?: string) {
  const id = getActiveShiftId();
  if (!id) return null;
  const list = readShifts().map((s) =>
    s.id === id ? { ...s, closedAt: new Date().toISOString(), closingCash, note } : s
  );
  writeShifts(list);
  localStorage.removeItem(ACTIVE_KEY);
  return list.find((s) => s.id === id) ?? null;
}

export function shiftSalesSummary(shiftId: string) {
  const shift = readShifts().find((s) => s.id === shiftId);
  if (!shift) return { cash: 0, upi: 0, card: 0, total: 0, count: 0 };
  const opened = new Date(shift.openedAt).getTime();
  const closed = shift.closedAt ? new Date(shift.closedAt).getTime() : Date.now();
  const rows = readBookings().filter((b) => {
    if (b.operatorId !== shift.operatorId || b.status === "Cancelled") return false;
    const ts = parseInt(b.id.replace(/\D/g, ""), 10);
    if (!Number.isFinite(ts)) return b.source === "Walk-in";
    return ts >= opened && ts <= closed;
  });
  let cash = 0;
  let upi = 0;
  let card = 0;
  rows.forEach((b) => {
    const amt = parseRupee(b.amount);
    const lower = b.amount.toLowerCase();
    if (lower.includes("upi")) upi += amt;
    else if (lower.includes("card")) card += amt;
    else cash += amt;
  });
  return { cash, upi, card, total: cash + upi + card, count: rows.length };
}
