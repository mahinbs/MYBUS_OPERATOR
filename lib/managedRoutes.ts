/** Shared route list (merged with localStorage edits from Routes screen). */

export type ManagedRoute = {
  id: string;
  from: string;
  to: string;
  distance: string;
  duration: string;
  basePrice: string;
  trips: number;
  image: string;
};

export const ROUTES_STORAGE_KEY = "mybus_routes_v1";

export const BASE_ROUTES: ManagedRoute[] = [
  {
    id: "RT-101",
    from: "Mumbai",
    to: "Pune",
    distance: "152 km",
    duration: "3h 30m",
    basePrice: "₹ 450",
    trips: 8,
    image:
      "https://readdy.ai/api/search-image?query=scenic%20highway%20road%20between%20two%20indian%20cities%2C%20green%20landscape%2C%20clear%20sky%2C%20travel%20photography&width=400&height=140&seq=20&orientation=landscape",
  },
  {
    id: "RT-205",
    from: "Delhi",
    to: "Jaipur",
    distance: "280 km",
    duration: "5h 15m",
    basePrice: "₹ 650",
    trips: 12,
    image:
      "https://readdy.ai/api/search-image?query=golden%20desert%20highway%20road%20in%20rajasthan%20india%2C%20scenic%20landscape%2C%20travel%20photography&width=400&height=140&seq=21&orientation=landscape",
  },
  {
    id: "RT-312",
    from: "Bangalore",
    to: "Hyderabad",
    distance: "570 km",
    duration: "8h 45m",
    basePrice: "₹ 950",
    trips: 5,
    image:
      "https://readdy.ai/api/search-image?query=modern%20highway%20through%20green%20south%20indian%20countryside%2C%20scenic%20travel%20photography&width=400&height=140&seq=22&orientation=landscape",
  },
];

export function readManagedRoutes(): ManagedRoute[] {
  if (typeof window === "undefined") return BASE_ROUTES;
  try {
    const raw = localStorage.getItem(ROUTES_STORAGE_KEY);
    if (!raw) return BASE_ROUTES;
    const parsed = JSON.parse(raw) as Partial<ManagedRoute>[];
    if (!Array.isArray(parsed)) return BASE_ROUTES;
    const byId = new Map<string, Partial<ManagedRoute>>();
    parsed.forEach((r) => {
      if (r && typeof r === "object" && typeof r.id === "string") byId.set(r.id, r);
    });
    return BASE_ROUTES.map((base) => {
      const patch = byId.get(base.id);
      if (!patch) return base;
      return {
        ...base,
        from: typeof patch.from === "string" ? patch.from : base.from,
        to: typeof patch.to === "string" ? patch.to : base.to,
        distance: typeof patch.distance === "string" ? patch.distance : base.distance,
        duration: typeof patch.duration === "string" ? patch.duration : base.duration,
        basePrice: typeof patch.basePrice === "string" ? patch.basePrice : base.basePrice,
        trips: typeof patch.trips === "number" && Number.isFinite(patch.trips) ? patch.trips : base.trips,
      };
    });
  } catch {
    return BASE_ROUTES;
  }
}

export function managedRouteLabel(route: ManagedRoute): string {
  return `${route.from} → ${route.to}`;
}
