"use client";

import Script from "next/script";
import { ClientWidgets } from "./ClientWidgets";

/** Loads Readdy assistant only on the client after mount; keep off the login screen so it cannot steal taps. */
export function ReaddyAssistantBundle() {
  return (
    <>
      <ClientWidgets />
      <Script
        src="https://readdy.ai/api/public/assistant/widget?projectId=cc143bab-0e4d-4504-a5d3-b810c1118d57"
        strategy="afterInteractive"
        data-mode="hybrid"
        data-voice-show-transcript="true"
        data-theme="light"
        data-size="compact"
        data-accent-color="#7C3AED"
        data-button-base-color="#1F2937"
        data-button-accent-color="#FFFFFF"
        data-main-label="BusFleet Assistant"
        data-start-button-text="Talk"
        data-end-button-text="End"
        data-empty-chat-message="How can I help with your fleet today?"
        data-empty-voice-message="Ask me about routes, bookings, or drivers"
      />
    </>
  );
}
