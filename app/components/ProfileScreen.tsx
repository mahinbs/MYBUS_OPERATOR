"use client";

import { useMemo, useState } from "react";
import type { ProfileSection } from "../operator-types";
import { useAuth } from "../../components/AuthProvider";
import { downloadBackupJson, lastSyncAt, restoreFromCloud, saveSnapshotToCloud } from "../../lib/cloudSync";

const menuItems: { icon: string; label: string; color: string; navigate?: string; onPress?: "documents" }[] = [
  { icon: "ri-bus-2-line", label: "My Fleet", color: "#7C3AED", navigate: "fleet" },
  { icon: "ri-route-line", label: "My Routes", color: "#8B5CF6", navigate: "routes" },
  { icon: "ri-bar-chart-box-line", label: "Reports", color: "#6D28D9", navigate: "earnings" },
  { icon: "ri-file-list-3-line", label: "Documents", color: "#A855F7", onPress: "documents" },
];

export default function ProfileScreen({
  section,
  onSectionChange,
  onNavigate,
  onLogout,
  onOpenMap,
  onOpenDrivers,
  onOpenNotifications,
  panel = "owner",
}: {
  section: ProfileSection;
  onSectionChange: (s: ProfileSection) => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onOpenMap: () => void;
  onOpenDrivers: () => void;
  onOpenNotifications: () => void;
  /** Counter operators see a reduced menu; owners see full shortcuts. */
  panel?: "owner" | "counter";
}) {
  const { user } = useAuth();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Push Notifications": true,
    "Booking Alerts": true,
    "Trip Reminders": true,
    "Payment Alerts": true,
    Marketing: false,
    "Dark Mode": false,
    "Biometric Login": false,
  });
  const [showDocuments, setShowDocuments] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showEditHint, setShowEditHint] = useState(false);

  const displayName = user?.name ?? "Rajesh Mehta";
  const displayEmail = user?.email ?? "rajesh@mybus.in";
  const displayAvatar =
    user?.avatar ??
    "https://readdy.ai/api/search-image?query=professional%20indian%20male%20business%20portrait%20headshot%20neutral%20background%20formal%20attire&width=120&height=120&seq=1&orientation=squarish";

  const profileMenuItems = useMemo(
    () => (panel === "counter" ? menuItems.filter((i) => i.label === "Documents") : menuItems),
    [panel]
  );

  const toggle = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const supportItems = [
    { icon: "ri-customer-service-2-line", label: "Help Center", color: "#7C3AED", action: () => setShowHelp(true) },
    { icon: "ri-phone-line", label: "Call Support", color: "#6D28D9", action: () => window.open("tel:18001234567", "_self") },
    { icon: "ri-map-pin-2-line", label: "Route Map", color: "#10B981", action: onOpenMap },
    { icon: "ri-id-card-line", label: "Drivers", color: "#F59E0B", action: onOpenDrivers },
    { icon: "ri-notification-3-line", label: "Notifications", color: "#8B5CF6", action: onOpenNotifications },
  ];

  const documents = [
    { name: "Operator licence", id: "DOC-OP-2026", date: "Jan 2026" },
    { name: "Fleet insurance", id: "DOC-INS-884", date: "Dec 2025" },
    { name: "GST certificate", id: "DOC-GST-112", date: "On file" },
  ];

  return (
    <div className="min-h-app w-full bg-[var(--app-surface)] pb-nav">
      <div className="bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pt-safe sm:pt-12 pb-6 rounded-b-[28px] shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-white font-bold text-xl">Profile</h1>
          <button
            type="button"
            aria-label="Edit profile"
            onClick={() => setShowEditHint(true)}
            className="touch-target w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15"
          >
            <i className="ri-edit-line text-white text-lg" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20">
            <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-bold text-lg truncate">{displayName}</h2>
            <p className="text-white/50 text-xs truncate">{displayEmail}</p>
            <p className="text-white/60 text-[10px] mt-1 font-medium uppercase tracking-wide">
              {panel === "counter" ? "Operator panel" : "Fleet owner panel"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div
          className="flex items-center bg-white rounded-2xl p-1 shadow-sm mb-5 ring-1 ring-slate-900/[0.04]"
          role="tablist"
          aria-label="Profile sections"
        >
          {(["profile", "settings", "support"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={section === tab}
              onClick={() => onSectionChange(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                section === tab ? "bg-[#7C3AED] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {section === "profile" && (
          <div className="space-y-4">
            {panel === "counter" && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100 ring-1 ring-white/10">
                <p className="font-semibold text-emerald-50">Counter / booking desk</p>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/90">
                  Walk-in sales and bookings use the <strong>Desk</strong> and <strong>Bookings</strong> tabs. Fleet, routes, and earnings are only on the{" "}
                  <strong>fleet owner</strong> demo.
                </p>
              </div>
            )}
            <div className="grid grid-cols-4 gap-3">
              {profileMenuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.navigate) onNavigate(item.navigate);
                    if (item.onPress === "documents") setShowDocuments(true);
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-1 active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-black/[0.04]" style={{ backgroundColor: item.color + "15" }}>
                    <i className={`${item.icon} text-lg`} style={{ color: item.color }} />
                  </div>
                  <span className="text-[10px] text-[#4B5563] font-medium text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4 ring-1 ring-slate-900/[0.04]">
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Company</p>
                <p className="text-sm text-[#111827] font-medium mt-0.5">Mehta Travels Pvt. Ltd.</p>
              </div>
              <div className="border-t border-[#F3F4F6] pt-3">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">GST Number</p>
                <p className="text-sm text-[#111827] font-medium mt-0.5">27AABCM1234A1Z5</p>
              </div>
              <div className="border-t border-[#F3F4F6] pt-3">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Operating Since</p>
                <p className="text-sm text-[#111827] font-medium mt-0.5">2015</p>
              </div>
              <div className="border-t border-[#F3F4F6] pt-3">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Fleet Size</p>
                <p className="text-sm text-[#111827] font-medium mt-0.5">20 Buses</p>
              </div>
            </div>
          </div>
        )}

        {section === "settings" && (
          <div className="space-y-4">
            {panel === "owner" && (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-900/[0.04]">
                <h3 className="text-sm font-bold text-slate-900">Cloud backup</h3>
                <p className="mt-1 text-[10px] text-slate-500">
                  Sync fleet, bookings, trips, and pricing on this device. Last: {lastSyncAt() ?? "never"}
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => saveSnapshotToCloud()}
                    className="rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white"
                  >
                    Save snapshot
                  </button>
                  <button
                    type="button"
                    onClick={() => restoreFromCloud()}
                    className="rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-800"
                  >
                    Restore snapshot
                  </button>
                  <button type="button" onClick={() => downloadBackupJson()} className="text-xs font-semibold text-violet-600">
                    Download JSON backup
                  </button>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-900/[0.04]">
              <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <p className="text-xs font-bold text-[#111827] flex items-center gap-2">
                  <i className="ri-notification-badge-fill text-[#7C3AED]" />
                  Push Notifications
                </p>
              </div>
              {[
                { key: "Push Notifications", icon: "ri-notification-3-line", desc: "Master switch" },
                { key: "Booking Alerts", icon: "ri-ticket-line", desc: "New & cancelled bookings" },
                { key: "Trip Reminders", icon: "ri-bus-2-line", desc: "Departures & arrivals" },
                { key: "Payment Alerts", icon: "ri-wallet-3-line", desc: "Settlements & refunds" },
                { key: "Marketing", icon: "ri-megaphone-line", desc: "Offers & promotions" },
              ].map((item, i, arr) => (
                <div
                  key={item.key}
                  className={`px-4 py-3.5 flex items-center justify-between ${i !== arr.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${item.icon} text-[#7C3AED] text-lg`} />
                    <div>
                      <span className="text-sm text-[#111827]">{item.key}</span>
                      <p className="text-[10px] text-[#9CA3AF]">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(item.key)}
                    role="switch"
                    aria-checked={toggles[item.key]}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${toggles[item.key] ? "bg-[#7C3AED]" : "bg-slate-200"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        toggles[item.key] ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-900/[0.04]">
              {[
                { key: "Dark Mode", icon: "ri-moon-line", toggle: true },
                { key: "Biometric Login", icon: "ri-fingerprint-line", toggle: true },
                { key: "Language", icon: "ri-global-line", toggle: false },
                { key: "Privacy & Security", icon: "ri-shield-check-line", toggle: false },
              ].map((item, i, arr) => (
                <div
                  key={item.key}
                  className={`px-4 py-3.5 flex items-center justify-between ${i !== arr.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${item.icon} text-[#7C3AED] text-lg`} />
                    <span className="text-sm text-[#111827]">{item.key}</span>
                  </div>
                  {item.toggle ? (
                    <button
                      type="button"
                      onClick={() => toggle(item.key)}
                      role="switch"
                      aria-checked={toggles[item.key]}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${toggles[item.key] ? "bg-[#7C3AED]" : "bg-slate-200"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          toggles[item.key] ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">English</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "support" && (
          <div className="space-y-3">
            {supportItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => item.action()}
                className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 ring-1 ring-slate-900/[0.04] text-left active:bg-slate-50"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.color + "15" }}>
                  <i className={`${item.icon} text-lg`} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827]">{item.label}</p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    {item.label === "Call Support" ? "1800-123-4567 · 24/7" : "Tap to open"}
                  </p>
                </div>
                <i className="ri-arrow-right-s-line text-[#9CA3AF] shrink-0" />
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="w-full mt-6 bg-red-50 text-red-600 font-semibold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 ring-1 ring-red-100 hover:bg-red-100/80 active:scale-[0.99] transition-colors"
        >
          <i className="ri-logout-box-r-line" /> Sign Out
        </button>
      </div>

      {showEditHint && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6" onClick={() => setShowEditHint(false)}>
          <div
            className="max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-hint-title"
          >
            <h2 id="edit-hint-title" className="text-lg font-bold text-slate-900">
              Edit profile
            </h2>
            <p className="mt-2 text-sm text-slate-600">Update your photo, phone, and company details from the operator web console, or contact MY BUS support to request changes.</p>
            <button type="button" onClick={() => setShowEditHint(false)} className="mt-5 w-full rounded-xl bg-[#7C3AED] py-3 text-sm font-semibold text-white">
              OK
            </button>
          </div>
        </div>
      )}

      {showDocuments && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:p-4" onClick={() => setShowDocuments(false)}>
          <div
            className="w-full max-w-[430px] rounded-t-[28px] bg-white p-5 pb-safe shadow-2xl max-h-[80dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="docs-title"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <h2 id="docs-title" className="text-lg font-bold text-slate-900 mb-4">
              Documents
            </h2>
            <div className="space-y-2">
              {documents.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-left active:bg-slate-100"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{d.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {d.id} · {d.date}
                    </p>
                  </div>
                  <i className="ri-download-2-line text-violet-600 text-lg" aria-hidden />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setShowDocuments(false)} className="mt-5 w-full rounded-2xl bg-[#7C3AED] py-3 text-sm font-semibold text-white">
              Done
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:p-4" onClick={() => setShowHelp(false)}>
          <div
            className="w-full max-w-[430px] rounded-t-[28px] bg-white p-5 pb-safe shadow-2xl max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
            <h2 id="help-title" className="text-lg font-bold text-slate-900 mb-3">
              Help Center
            </h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-xl bg-slate-50 p-3">
                <strong className="text-slate-900">Managing bookings</strong>
                <p className="mt-1 text-xs">Use Bookings to confirm pending seats, resend tickets, and void cancellations.</p>
              </li>
              <li className="rounded-xl bg-slate-50 p-3">
                <strong className="text-slate-900">Trips &amp; fleet</strong>
                <p className="mt-1 text-xs">Open Trips from the footer to adjust timings. Fleet lists every bus and status.</p>
              </li>
              <li className="rounded-xl bg-slate-50 p-3">
                <strong className="text-slate-900">Payouts</strong>
                <p className="mt-1 text-xs">Earnings shows route-wise revenue and recent transactions.</p>
              </li>
            </ul>
            <button type="button" onClick={() => setShowHelp(false)} className="mt-5 w-full rounded-2xl bg-[#7C3AED] py-3 text-sm font-semibold text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
