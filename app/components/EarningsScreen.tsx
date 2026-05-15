"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const revenueData = [
  { day: "Mon", revenue: 42000 },
  { day: "Tue", revenue: 38000 },
  { day: "Wed", revenue: 51000 },
  { day: "Thu", revenue: 45000 },
  { day: "Fri", revenue: 62000 },
  { day: "Sat", revenue: 78000 },
  { day: "Sun", revenue: 55000 },
];

const topRoutes = [
  { route: "Mumbai → Pune", trips: 48, revenue: "₹ 2.16L", pct: 92 },
  { route: "Delhi → Jaipur", trips: 36, revenue: "₹ 2.34L", pct: 85 },
  { route: "Bangalore → Hyderabad", trips: 24, revenue: "₹ 2.28L", pct: 78 },
];

const transactions = [
  { id: "TX-001", passenger: "Rahul Kumar", amount: "₹ 450", method: "UPI", status: "Success", time: "10:32 AM" },
  { id: "TX-002", passenger: "Priya Sharma", amount: "₹ 650", method: "Card", status: "Success", time: "10:45 AM" },
  { id: "TX-003", passenger: "Amit Patel", amount: "₹ 950", method: "Wallet", status: "Success", time: "11:01 AM" },
  { id: "TX-004", passenger: "Sneha Gupta", amount: "₹ 450", method: "UPI", status: "Failed", time: "11:15 AM" },
];

const paymentBreakdown = [
  { method: "UPI", count: 486, amount: "₹ 2.19L", pct: 52, color: "#7C3AED" },
  { method: "Card", count: 234, amount: "₹ 1.52L", pct: 30, color: "#8B5CF6" },
  { method: "Wallet", count: 156, amount: "₹ 78K", pct: 18, color: "#C4B5FD" },
];

export default function EarningsScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [range, setRange] = useState<"Week" | "Month">("Week");

  return (
    <div className="min-h-app w-full bg-[var(--app-surface)] pb-nav">
      <div className="bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pt-safe sm:pt-12 pb-6 rounded-b-[28px] shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
              aria-label="Back to home"
            >
              <i className="ri-arrow-left-line text-lg text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Earnings</h1>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onNavigate("reports")}
              className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90 hover:bg-white/15"
            >
              Reports
            </button>
            <button
              type="button"
              onClick={() => onNavigate("bookings")}
              className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/90 hover:bg-white/15"
            >
              Bookings
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Total Revenue</p>
            <p className="text-white font-bold text-2xl mt-0.5">₹ 12.85L</p>
          </div>
          <div className="flex-1">
            <p className="text-white/50 text-[10px] uppercase tracking-wider">This Month</p>
            <p className="text-white font-bold text-2xl mt-0.5">₹ 3.71L</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        {/* Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#111827]">Revenue Trend</h3>
            <button
              type="button"
              onClick={() => setRange((r) => (r === "Week" ? "Month" : "Week"))}
              className="rounded-full bg-[#7C3AED]/15 px-2 py-1 text-[10px] font-semibold text-[#7C3AED]"
            >
              {range === "Week" ? "This week" : "This month"}
            </button>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                <YAxis hide />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={28}>
                  {revenueData.map((entry, index) => (
                    <Cell key={index} fill={index === 5 ? "#7C3AED" : "#EDE9FE"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
          <h3 className="text-sm font-bold text-[#111827] mb-3">Top Performing Routes</h3>
          <div className="space-y-3">
            {topRoutes.map((r, i) => (
              <div key={r.route}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] text-[10px] font-bold">{i + 1}</span>
                    <span className="text-xs text-[#111827] font-medium">{r.route}</span>
                  </div>
                  <span className="text-xs font-bold text-[#7C3AED]">{r.revenue}</span>
                </div>
                <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden ml-7">
                  <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${r.pct}%` }} />
                </div>
                <p className="text-[10px] text-[#9CA3AF] ml-7 mt-0.5">{r.trips} trips · {r.pct}% occupancy</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
          <h3 className="text-sm font-bold text-[#111827] mb-3">Payment Methods</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-full relative">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7C3AED" strokeWidth="4" strokeDasharray="52 100" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-52" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#C4B5FD" strokeWidth="4" strokeDasharray="18 100" strokeDashoffset="-82" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              {paymentBreakdown.map((p) => (
                <div key={p.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[10px] text-[#4B5563]">{p.method}</span>
                  </div>
                  <span className="text-[10px] text-[#9CA3AF]">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-bold text-[#111827]">Recent Transactions</h3>
          </div>
          {transactions.map((tx, i) => (
            <div
              key={tx.id}
              className={`px-4 py-3 flex items-center justify-between ${
                i !== transactions.length - 1 ? "border-b border-[#F3F4F6]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.method === "UPI" ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                  : tx.method === "Card" ? "bg-blue-50 text-blue-500"
                  : "bg-amber-50 text-amber-500"
                }`}>
                  <i className={`${tx.method === "UPI" ? "ri-qr-code-line" : tx.method === "Card" ? "ri-bank-card-line" : "ri-wallet-3-line"} text-sm`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#111827]">{tx.passenger}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{tx.id} · {tx.method}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#111827]">{tx.amount}</p>
                <p className={`text-[10px] ${tx.status === "Success" ? "text-green-600" : "text-red-600"}`}>{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}