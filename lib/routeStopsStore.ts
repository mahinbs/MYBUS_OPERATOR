const STORAGE_KEY = "mybus_route_stops_v1";

export type RouteStops = {
  pickups: string[];
  drops: string[];
};

const DEFAULTS: Record<string, RouteStops> = {
  "RT-101": {
    pickups: ["Mumbai Central", "Bandra Terminus", "Thane", "Kalyan"],
    drops: ["Pune Station", "Swargate", "Katraj", "Koregaon Park"],
  },
  "RT-205": {
    pickups: ["ISBT Kashmere Gate", "Dhaula Kuan", "Gurgaon Bus Stand"],
    drops: ["Sindhi Camp", "MI Road", "Tonk Road"],
  },
  "RT-312": {
    pickups: ["Majestic", "Electronic City", "Hebbal"],
    drops: ["Secunderabad", "Gachibowli", "LB Nagar"],
  },
};

export function readAllRouteStops(): Record<string, RouteStops> {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Record<string, RouteStops>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function readRouteStops(routeId: string): RouteStops {
  return readAllRouteStops()[routeId] ?? { pickups: [], drops: [] };
}

export function writeRouteStops(routeId: string, stops: RouteStops) {
  const all = readAllRouteStops();
  all[routeId] = stops;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("mybus:route-stops-updated"));
  } catch {
    /* ignore */
  }
}
