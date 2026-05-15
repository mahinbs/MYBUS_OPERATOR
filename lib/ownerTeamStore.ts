const STORAGE_KEY = "mybus_owner_team_v1";

export type AssignedOperator = { name: string; email: string; phone: string };
export type AssignedDriver = { name: string; phone: string; license: string };

export type OwnerTeamState = {
  operator: AssignedOperator | null;
  driver: AssignedDriver | null;
};

const empty: OwnerTeamState = { operator: null, driver: null };

export function readOwnerTeam(): OwnerTeamState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<OwnerTeamState>;
    return {
      operator:
        p?.operator && typeof p.operator === "object" && "name" in p.operator ? (p.operator as AssignedOperator) : null,
      driver: p?.driver && typeof p.driver === "object" && "name" in p.driver ? (p.driver as AssignedDriver) : null,
    };
  } catch {
    return empty;
  }
}

export function writeOwnerTeam(next: OwnerTeamState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("mybus:owner-team-updated"));
  } catch {
    /* ignore */
  }
}

export function clearOwnerTeam() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
