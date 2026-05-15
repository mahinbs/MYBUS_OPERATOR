"use client";

import { useEffect, useState } from "react";
import {
  closeShift,
  getActiveShift,
  openShift,
  shiftSalesSummary,
  type ShiftRecord,
} from "../../lib/shiftStore";

export default function ShiftPanel({
  operatorId,
  operatorName,
}: {
  operatorId: string;
  operatorName: string;
}) {
  const [shift, setShift] = useState<ShiftRecord | null>(() => getActiveShift());
  const [floatInput, setFloatInput] = useState("500");
  const [closeCash, setCloseCash] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setShift(getActiveShift());
    window.addEventListener("mybus:shift-updated", sync);
    window.addEventListener("mybus:bookings-updated", sync);
    return () => {
      window.removeEventListener("mybus:shift-updated", sync);
      window.removeEventListener("mybus:bookings-updated", sync);
    };
  }, []);

  const sales = shift ? shiftSalesSummary(shift.id) : null;

  const handleOpen = () => {
    const n = parseInt(floatInput.replace(/\D/g, ""), 10);
    if (!Number.isFinite(n) || n < 0) {
      setMsg("Enter opening float amount.");
      return;
    }
    openShift(operatorId, operatorName, n);
    setShift(getActiveShift());
    setMsg("Shift opened.");
  };

  const handleClose = () => {
    if (!shift) return;
    const n = parseInt(closeCash.replace(/\D/g, ""), 10);
    if (!Number.isFinite(n)) {
      setMsg("Enter closing cash counted.");
      return;
    }
    closeShift(n);
    setShift(null);
    setMsg(`Shift closed. Expected cash ~ Rs ${sales?.cash ?? 0} + float.`);
  };

  if (!shift) {
    return (
      <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="text-xs font-bold text-slate-800">Open shift</p>
        <p className="mt-1 text-[10px] text-slate-500">Count opening cash float before selling tickets.</p>
        <div className="mt-2 flex gap-2">
          <input
            value={floatInput}
            onChange={(e) => setFloatInput(e.target.value)}
            placeholder="Opening float"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            inputMode="numeric"
          />
          <button type="button" onClick={handleOpen} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white">
            Open
          </button>
        </div>
        {msg && <p className="mt-2 text-[10px] text-violet-700">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl bg-emerald-50/80 p-4 ring-1 ring-emerald-200">
      <p className="text-xs font-bold text-emerald-900">Shift active · {shift.operatorName}</p>
      {sales && (
        <p className="mt-1 text-[10px] text-emerald-800">
          {sales.count} sales · Cash Rs {sales.cash} · UPI Rs {sales.upi} · Card Rs {sales.card}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <input
          value={closeCash}
          onChange={(e) => setCloseCash(e.target.value)}
          placeholder="Closing cash counted"
          className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
          inputMode="numeric"
        />
        <button type="button" onClick={handleClose} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">
          Close shift
        </button>
      </div>
      {msg && <p className="mt-2 text-[10px] text-emerald-800">{msg}</p>}
    </div>
  );
}
