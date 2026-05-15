"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ErrorBoundary } from "./ErrorBoundary";

/** Root client boundary so `useAuth()` is always inside one `AuthProvider` for the whole app. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  );
}
