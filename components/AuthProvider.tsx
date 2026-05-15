"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { clearOwnerTeam } from "../lib/ownerTeamStore";

const STORAGE_USERS = "mybus_operator_users";
const STORAGE_SESSION = "mybus_operator_session";
/** Set by demo tiles before reload — survives static hosts that strip ?demo= from the URL. */
const PENDING_DEMO_KEY = "mybus_pending_demo_v1";

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  accountKind?: "owner" | "counter";
};

type StoredOperator = {
  id: string;
  email: string;
  name: string;
  password: string;
  company: string;
  accountKind?: "owner" | "counter";
};

function loadUsers(): StoredOperator[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredOperator[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => ({
      ...r,
      accountKind: r.accountKind === "counter" ? "counter" : "owner",
    }));
  } catch {
    return [];
  }
}

function saveUsers(users: StoredOperator[]) {
  try {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

/** Ensures demo emails and legacy sessions map to the right panel (owner vs counter). */
export function normalizeUser(u: User): User {
  const email = (u.email ?? "").trim().toLowerCase();
  let kind: "owner" | "counter" = u.accountKind === "counter" ? "counter" : "owner";
  if (email === "counter@mybus.in") kind = "counter";
  if (email === "demo@mybus.in") kind = "owner";
  const ac = (u as { accountKind?: string }).accountKind;
  if (typeof ac === "string" && ac.toLowerCase() === "counter") kind = "counter";
  return {
    ...u,
    email: u.email,
    accountKind: kind,
    role: kind === "counter" ? "Counter operator" : "Fleet owner",
  };
}

function persistSession(user: User | null) {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_SESSION);
      return;
    }
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(normalizeUser(user)));
  } catch {
    /* private mode / quota — session stays in memory only */
  }
}

function toUser(row: StoredOperator): User {
  const kind = row.accountKind === "counter" ? "counter" : "owner";
  return normalizeUser({
    id: row.id,
    email: row.email,
    name: row.name,
    role: kind === "counter" ? "Counter operator" : "Fleet owner",
    company: row.company || "MY BUS Operator",
    accountKind: kind,
    avatar:
      "https://readdy.ai/api/search-image?query=professional%20indian%20male%20business%20portrait%20headshot%20neutral%20background%20formal%20attire&width=100&height=100&seq=1&orientation=squarish",
  });
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, accountKind: "owner" | "counter") => "ok" | "duplicate" | "invalid";
  loginDemo: () => void;
  loginDemoCounter: () => void;
  /** Prefer for UI: logs in without full page reload (always works in same tab). */
  enterOwnerDemo: () => void;
  enterOperatorDemo: () => void;
  clearStoredAccounts: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  register: () => "invalid",
  loginDemo: () => {},
  loginDemoCounter: () => {},
  enterOwnerDemo: () => {},
  enterOperatorDemo: () => {},
  clearStoredAccounts: () => {},
  logout: () => {},
});

const DEMO_USER: User = {
  id: "OP-DEMO",
  email: "demo@mybus.in",
  name: "Demo Owner",
  role: "Fleet owner",
  company: "MY BUS Transit Pvt Ltd",
  accountKind: "owner",
  avatar:
    "https://readdy.ai/api/search-image?query=professional%20indian%20male%20business%20portrait%20headshot%20neutral%20background%20formal%20attire&width=100&height=100&seq=1&orientation=squarish",
};

const DEMO_COUNTER_USER: User = {
  id: "OP-DEMO-COUNTER",
  email: "counter@mybus.in",
  name: "Demo Counter",
  role: "Counter operator",
  company: "MY BUS Transit Pvt Ltd",
  accountKind: "counter",
  avatar:
    "https://readdy.ai/api/search-image?query=friendly%20indian%20transport%20staff%20uniform%20portrait%20neutral%20background&width=100&height=100&seq=2&orientation=squarish",
};

/** Reads one-shot demo intent from sessionStorage (set before reload). */
function consumePendingDemoSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_DEMO_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_DEMO_KEY);
    const d = raw.trim().toLowerCase();
    if (d === "owner") {
      const session = normalizeUser({ ...DEMO_USER });
      persistSession(session);
      return session;
    }
    if (d === "operator" || d === "counter") {
      const session = normalizeUser({ ...DEMO_COUNTER_USER });
      persistSession(session);
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

/** If URL has ?demo=owner or ?demo=operator, build session, persist, strip param. Returns null if no demo param. */
function consumeUrlDemoSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get("demo");
    if (!raw) return null;
    const d = raw.trim().toLowerCase();
    let session: User | null = null;
    if (d === "owner") session = normalizeUser({ ...DEMO_USER });
    else if (d === "operator" || d === "counter") session = normalizeUser({ ...DEMO_COUNTER_USER });
    else return null;

    persistSession(session);
    url.searchParams.delete("demo");
    const clean = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", clean || url.pathname);
    return session;
  } catch {
    return null;
  }
}

/**
 * Demo tiles: write intent to sessionStorage then reload same URL.
 * Avoids relying on ?demo=… (often stripped by static file servers / GitHub Pages).
 */
export function navigateToOwnerDemo(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_DEMO_KEY, "owner");
  } catch {
    try {
      persistOwnerDemoAndReload();
    } catch {
      /* ignore */
    }
    return;
  }
  window.location.reload();
}

export function navigateToOperatorDemo(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_DEMO_KEY, "operator");
  } catch {
    try {
      persistOperatorDemoAndReload();
    } catch {
      /* ignore */
    }
    return;
  }
  window.location.reload();
}

/** Writes session to localStorage and reloads (backup path). */
export function persistOwnerDemoAndReload(): void {
  if (typeof window === "undefined") return;
  try {
    const session = normalizeUser({ ...DEMO_USER });
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  } catch {
    throw new Error("Could not save demo session (storage may be blocked).");
  }
  window.location.reload();
}

export function persistOperatorDemoAndReload(): void {
  if (typeof window === "undefined") return;
  try {
    const session = normalizeUser({ ...DEMO_COUNTER_USER });
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  } catch {
    throw new Error("Could not save demo session (storage may be blocked).");
  }
  window.location.reload();
}

function readPersistedSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.email) return null;
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useLayoutEffect(() => {
    const fromPending = consumePendingDemoSession();
    const fromUrl = fromPending ? null : consumeUrlDemoSession();
    const restored = fromPending ?? fromUrl ?? readPersistedSession();
    if (restored) setUser(restored);
    if (typeof window !== "undefined") {
      (window as Window & { __MYBUS_READY?: boolean }).__MYBUS_READY = true;
      const failEl = document.getElementById("mybus-script-fail");
      if (failEl) failEl.style.display = "none";
    }
  }, []);

  const login = useCallback((email: string, password: string) => {
    const e = email.trim().toLowerCase();
    const p = password;
    if (!e || p.length < 6) return false;

    const rows = loadUsers();
    const row = rows.find((r) => r.email === e && r.password === p);
    if (row) {
      const u = toUser(row);
      setUser(u);
      persistSession(u);
      return true;
    }

    if (e === "counter@mybus.in") {
      const u = normalizeUser({ ...DEMO_COUNTER_USER });
      setUser(u);
      persistSession(u);
      return true;
    }

    // Demo-style sign-in: first install, or reserved demo email
    if (rows.length === 0 || e === "demo@mybus.in") {
      const u = normalizeUser(
        e === "demo@mybus.in" ? { ...DEMO_USER } : { ...DEMO_USER, email: e, name: "Operator", accountKind: "owner" }
      );
      setUser(u);
      persistSession(u);
      return true;
    }

    return false;
  }, []);

  const enterOwnerDemo = useCallback(() => {
    const session = normalizeUser({ ...DEMO_USER });
    flushSync(() => {
      setUser(session);
    });
    persistSession(session);
  }, []);

  const enterOperatorDemo = useCallback(() => {
    const session = normalizeUser({ ...DEMO_COUNTER_USER });
    flushSync(() => {
      setUser(session);
    });
    persistSession(session);
  }, []);

  const loginDemo = useCallback(() => {
    enterOwnerDemo();
  }, [enterOwnerDemo]);

  const loginDemoCounter = useCallback(() => {
    enterOperatorDemo();
  }, [enterOperatorDemo]);

  const clearStoredAccounts = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_USERS);
      localStorage.removeItem(STORAGE_SESSION);
      sessionStorage.removeItem(PENDING_DEMO_KEY);
      clearOwnerTeam();
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const register = useCallback((name: string, email: string, password: string, accountKind: "owner" | "counter") => {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    const p = password;
    if (!n || !e || p.length < 6) return "invalid";
    if (!e.includes("@")) return "invalid";

    const rows = loadUsers();
    if (rows.some((r) => r.email === e)) return "duplicate";

    const row: StoredOperator = {
      id: `OP-${Date.now()}`,
      email: e,
      name: n,
      password: p,
      company: `${n.split(" ")[0] || n} Travels`,
      accountKind,
    };
    saveUsers([...rows, row]);
    const u = toUser(row);
    setUser(u);
    persistSession(u);
    return "ok";
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    persistSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      loginDemo,
      loginDemoCounter,
      enterOwnerDemo,
      enterOperatorDemo,
      clearStoredAccounts,
      logout,
    }),
    [user, login, register, loginDemo, loginDemoCounter, enterOwnerDemo, enterOperatorDemo, clearStoredAccounts, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
