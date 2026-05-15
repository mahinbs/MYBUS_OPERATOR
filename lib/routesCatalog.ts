import { readManagedRoutes } from "./managedRoutes";
import { routePriceSummary } from "./fleetPricing";

export type RouteCatalogEntry = {
  id: string;
  label: string;
  from: string;
  to: string;
  basePrice: string;
};

export function readRoutesCatalog(): RouteCatalogEntry[] {
  if (typeof window === "undefined") return ROUTES_CATALOG;
  return readManagedRoutes().map((r) => ({
    id: r.id,
    label: `${r.from} → ${r.to}`,
    from: r.from,
    to: r.to,
    basePrice: routePriceSummary(r.id),
  }));
}

/** Static fallback for SSR / first paint. */
export const ROUTES_CATALOG: RouteCatalogEntry[] = [
  { id: "RT-101", label: "Mumbai → Pune", from: "Mumbai", to: "Pune", basePrice: "₹ 380 – ₹ 520" },
  { id: "RT-205", label: "Delhi → Jaipur", from: "Delhi", to: "Jaipur", basePrice: "₹ 580 – ₹ 720" },
  { id: "RT-312", label: "Bangalore → Hyderabad", from: "Bangalore", to: "Hyderabad", basePrice: "₹ 890 – ₹ 950" },
];

export function routeLabel(id: string): string {
  return readRoutesCatalog().find((r) => r.id === id)?.label ?? ROUTES_CATALOG.find((r) => r.id === id)?.label ?? id;
}
