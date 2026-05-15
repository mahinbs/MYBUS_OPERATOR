"use client";

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Fleet owner: full app. Counter: desk + bookings + account only. */
  variant?: "owner" | "counter";
}

const ownerTabs = [
  { id: "dashboard", label: "Home", icon: "ri-home-5-line", activeIcon: "ri-home-5-fill" },
  { id: "fleet", label: "Fleet", icon: "ri-bus-2-line", activeIcon: "ri-bus-2-fill" },
  { id: "trips", label: "Trips", icon: "ri-calendar-schedule-line", activeIcon: "ri-calendar-schedule-fill" },
  { id: "bookings", label: "Book", icon: "ri-ticket-line", activeIcon: "ri-ticket-fill" },
  { id: "profile", label: "Account", icon: "ri-user-3-line", activeIcon: "ri-user-3-fill" },
] as const;

const counterTabs = [
  { id: "desk", label: "Desk", icon: "ri-store-2-line", activeIcon: "ri-store-2-fill" },
  { id: "fleet", label: "Fleet", icon: "ri-bus-2-line", activeIcon: "ri-bus-2-fill" },
  { id: "bookings", label: "Bookings", icon: "ri-ticket-line", activeIcon: "ri-ticket-fill" },
  { id: "profile", label: "Account", icon: "ri-user-3-line", activeIcon: "ri-user-3-fill" },
] as const;

export default function TabBar({ activeTab, onTabChange, variant = "owner" }: TabBarProps) {
  const tabs = variant === "counter" ? counterTabs : ownerTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[70] flex justify-center border-t border-slate-200/90 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl"
      aria-label={variant === "counter" ? "Operator navigation" : "Fleet owner navigation"}
    >
      <div className="flex w-full max-w-[430px] items-stretch justify-around gap-0 px-2 pb-[max(8px,env(safe-area-inset-bottom,0px))] pt-2">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[48px] min-w-0 flex-1 max-w-[86px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 transition-colors active:bg-violet-50/80"
            >
              <i
                className={`text-[22px] leading-none ${active ? tab.activeIcon : tab.icon} ${active ? "text-[#7C3AED]" : "text-slate-400"}`}
                aria-hidden
              />
              <span
                className={`max-w-full truncate px-0.5 text-[9px] font-bold uppercase tracking-wide ${active ? "text-[#7C3AED]" : "text-slate-500"}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
