"use client";

import dynamic from "next/dynamic";

const ReaddyAssistantNudge = dynamic(() => import("./ReaddyAssistantNudge"), {
  ssr: false,
  loading: () => null,
});

/** Loads third-party DOM helpers only on the client (required by Next.js App Router). */
export function ClientWidgets() {
  return <ReaddyAssistantNudge />;
}
