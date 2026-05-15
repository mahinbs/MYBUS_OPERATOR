"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import TabBar from "./components/TabBar";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/DashboardScreen";
import BusManagementScreen from "./components/BusManagementScreen";
import RouteManagementScreen from "./components/RouteManagementScreen";
import TripSchedulingScreen from "./components/TripSchedulingScreen";
import BookingManagementScreen from "./components/BookingManagementScreen";
import OperatorDeskScreen from "./components/OperatorDeskScreen";
import EarningsScreen from "./components/EarningsScreen";
import ReportsScreen from "./components/ReportsScreen";
import PricingScreen from "./components/PricingScreen";
import ProfileScreen from "./components/ProfileScreen";
import NotificationScreen from "./components/NotificationScreen";
import RouteMapView from "./components/RouteMapView";
import DriverManagementScreen from "./components/DriverManagementScreen";
import CustomerBookingScreen from "./components/CustomerBookingScreen";
import type { ProfileSection } from "./operator-types";

const COUNTER_TABS = new Set(["desk", "fleet", "bookings", "profile"]);
const OWNER_TABS = new Set(["dashboard", "fleet", "routes", "pricing", "trips", "bookings", "earnings", "reports", "profile"]);

function AppContent() {
  const { user, logout, clearStoredAccounts } = useAuth();
  const isCounter = user?.accountKind === "counter";
  const [activeTab, setActiveTab] = useState("dashboard");

  const displayTab = useMemo(() => {
    if (!user) return activeTab;
    if (isCounter && !COUNTER_TABS.has(activeTab)) return "desk";
    if (!isCounter && !OWNER_TABS.has(activeTab)) return "dashboard";
    return activeTab;
  }, [user, isCounter, activeTab]);
  const [profileSection, setProfileSection] = useState<ProfileSection>("profile");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);
  const [pricingRouteId, setPricingRouteId] = useState<string | undefined>(undefined);
  const [showCustomerPortal, setShowCustomerPortal] = useState(false);
  const sessionUserRef = useRef<string | null>(null);

  useEffect(() => {
    const id = user?.id ?? null;
    if (id && sessionUserRef.current !== id) {
      sessionUserRef.current = id;
      if (user?.accountKind === "counter") setActiveTab("desk");
      else setActiveTab("dashboard");
    }
    if (!id) sessionUserRef.current = null;
  }, [user]);

  useLayoutEffect(() => {
    if (!user) return;
    if (user.accountKind === "counter" && !COUNTER_TABS.has(activeTab)) setActiveTab("desk");
    if (user.accountKind !== "counter" && !OWNER_TABS.has(activeTab)) setActiveTab("dashboard");
  }, [user, activeTab]);

  const handleMainTabChange = useCallback(
    (tab: string) => {
      if (user?.accountKind === "counter" && !COUNTER_TABS.has(tab)) {
        setActiveTab("desk");
        return;
      }
      if (user && user.accountKind !== "counter" && !OWNER_TABS.has(tab)) {
        setActiveTab("dashboard");
        return;
      }
      setActiveTab(tab);
      if (tab === "profile") setProfileSection("profile");
    },
    [user?.accountKind, user]
  );

  const openProfile = useCallback((section: ProfileSection = "profile") => {
    setActiveTab("profile");
    setProfileSection(section);
  }, []);

  const renderScreen = () => {
    switch (displayTab) {
      case "dashboard":
        return (
          <DashboardScreen
            onNavigate={handleMainTabChange}
            onOpenProfile={openProfile}
            onNotifications={() => setShowNotifications(true)}
            onOpenDrivers={() => setShowDrivers(true)}
          />
        );
      case "fleet":
        return (
          <BusManagementScreen
            onNavigate={handleMainTabChange}
            panel={isCounter ? "operator" : "owner"}
          />
        );
      case "routes":
        return (
          <RouteManagementScreen
            onNavigate={(tab) => {
              if (tab.startsWith("pricing:")) {
                setPricingRouteId(tab.slice("pricing:".length) || undefined);
                setActiveTab("pricing");
                return;
              }
              handleMainTabChange(tab);
            }}
          />
        );
      case "pricing":
        return (
          <PricingScreen
            onNavigate={handleMainTabChange}
            initialRouteId={pricingRouteId}
          />
        );
      case "trips":
        return <TripSchedulingScreen onNavigate={handleMainTabChange} />;
      case "desk":
        if (!isCounter) {
          return (
            <DashboardScreen
              onNavigate={handleMainTabChange}
              onOpenProfile={openProfile}
              onNotifications={() => setShowNotifications(true)}
              onOpenDrivers={() => setShowDrivers(true)}
            />
          );
        }
        return <OperatorDeskScreen onNavigate={handleMainTabChange} panel="counter" />;
      case "bookings":
        return <BookingManagementScreen onNavigate={handleMainTabChange} panel={isCounter ? "counter" : "owner"} />;
      case "earnings":
        return <EarningsScreen onNavigate={handleMainTabChange} />;
      case "reports":
        return <ReportsScreen onNavigate={handleMainTabChange} />;
      case "profile":
        return (
          <ProfileScreen
            section={profileSection}
            onSectionChange={setProfileSection}
            onNavigate={handleMainTabChange}
            onLogout={logout}
            onOpenMap={() => setShowMap(true)}
            onOpenDrivers={() => setShowDrivers(true)}
            onOpenNotifications={() => setShowNotifications(true)}
            panel={isCounter ? "counter" : "owner"}
          />
        );
      default:
        return (
          <DashboardScreen
            onNavigate={handleMainTabChange}
            onOpenProfile={openProfile}
            onNotifications={() => setShowNotifications(true)}
            onOpenDrivers={() => setShowDrivers(true)}
          />
        );
    }
  };

  return (
    <div className="relative z-[58] isolate flex min-h-app w-full min-w-0 flex-col bg-gradient-to-b from-zinc-100 via-zinc-200/90 to-zinc-300/80 sm:py-8 sm:px-4">
      <div
        className="relative mx-auto flex min-h-app w-full min-w-0 max-w-[430px] flex-col overflow-x-hidden bg-[var(--app-surface)] shadow-[0_24px_64px_-12px_rgba(15,23,42,0.28)] ring-1 ring-black/[0.06] sm:min-h-[812px] sm:rounded-[2rem]"
        role="application"
        aria-label={isCounter ? "MY BUS — operator panel" : "MY BUS — fleet owner panel"}
      >
        {!user ? (
          <div className="relative z-[100] min-h-app w-full">
            <LoginScreen
              onLoginSuccess={() => {}}
              onClearStored={clearStoredAccounts}
              onBookOnline={() => setShowCustomerPortal(true)}
            />
          </div>
        ) : (
          <>
            {renderScreen()}
            {!showMap && !showDrivers && (
              <TabBar activeTab={displayTab} onTabChange={handleMainTabChange} variant={isCounter ? "counter" : "owner"} />
            )}
            {showNotifications && <NotificationScreen onClose={() => setShowNotifications(false)} />}
            {showMap && <RouteMapView onClose={() => setShowMap(false)} />}
            {showDrivers && <DriverManagementScreen onClose={() => setShowDrivers(false)} />}
            {showCustomerPortal && <CustomerBookingScreen onClose={() => setShowCustomerPortal(false)} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return <AppContent />;
}
