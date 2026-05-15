const STORAGE_KEY = "mybus_route_bus_assignments_v1";

export function readRouteBusAssignments(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeRouteBusAssignments(map: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    dispatchAssignmentsUpdated();
  } catch {
    /* ignore */
  }
}

/** Buses assigned to a route. Empty config = all fleet buses available until you assign on the route screen. */
export function getBusesForRoute(routeId: string, allBusIds: string[]): string[] {
  const map = readRouteBusAssignments();
  const assigned = map[routeId];
  if (assigned?.length) return assigned.filter((id) => allBusIds.includes(id));
  return allBusIds;
}

export function setBusesForRoute(routeId: string, busIds: string[]) {
  const map = { ...readRouteBusAssignments(), [routeId]: [...new Set(busIds)] };
  writeRouteBusAssignments(map);
}

export function toggleBusOnRoute(routeId: string, busId: string, checked: boolean) {
  const map = readRouteBusAssignments();
  const cur = new Set(map[routeId] ?? []);
  if (checked) cur.add(busId);
  else cur.delete(busId);
  const next = { ...map, [routeId]: [...cur] };
  writeRouteBusAssignments(next);
}

export function getRoutesForBus(busId: string): string[] {
  const map = readRouteBusAssignments();
  return Object.entries(map)
    .filter(([, ids]) => ids.includes(busId))
    .map(([rid]) => rid);
}

function dispatchAssignmentsUpdated() {
  try {
    window.dispatchEvent(new Event("mybus:assignments-updated"));
  } catch {
    /* ignore */
  }
}
