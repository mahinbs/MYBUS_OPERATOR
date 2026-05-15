"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const READDY_IFRAME = 'iframe[src*="readdy.ai"]';

function getFixedShell(el: HTMLElement): HTMLElement | null {
  try {
    let cur: HTMLElement | null = el;
    let lastFixed: HTMLElement | null = null;
    while (cur && cur !== document.body) {
      if (getComputedStyle(cur).position === "fixed") lastFixed = cur;
      cur = cur.parentElement;
    }
    return lastFixed;
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function ReaddyAssistantNudge() {
  const shellRef = useRef<HTMLElement | null>(null);
  const foundRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [showHandle, setShowHandle] = useState(false);
  const drag = useRef({ active: false, px: 0, py: 0, startX: 0, startY: 0, ox: 0, oy: 0 });

  const applyNudge = useCallback(() => {
    try {
      const iframe = document.querySelector(READDY_IFRAME) as HTMLIFrameElement | null;
      if (!iframe) return;
      const shell = getFixedShell(iframe);
      if (!shell) return;
      shellRef.current = shell;

      const maxW = 430;
      const inset = Math.max(0, (window.innerWidth - maxW) / 2);
      const right = inset + 12;
      const bottom = `calc(7rem + env(safe-area-inset-bottom, 0px))`;

      shell.style.setProperty("z-index", "56", "important");
      shell.style.setProperty("right", `${right}px`, "important");
      shell.style.setProperty("bottom", bottom, "important");
      shell.style.setProperty("left", "auto", "important");
      shell.style.setProperty("top", "auto", "important");

      const { px, py } = drag.current;
      shell.style.setProperty("transform", `translate(${px}px, ${py}px)`, "important");

      if (!foundRef.current) {
        foundRef.current = true;
        setShowHandle(true);
      }
    } catch {
      /* Readdy DOM may differ; never break the app */
    }
  }, []);

  useEffect(() => {
    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyNudge();
      });
    };

    schedule();
    const iv = setInterval(schedule, 1200);
    let mo: MutationObserver | null = null;
    try {
      mo = new MutationObserver(schedule);
      mo.observe(document.body, { childList: true, subtree: true });
    } catch {
      /* ignore */
    }
    window.addEventListener("resize", schedule);
    const stop = setTimeout(() => clearInterval(iv), 25000);
    return () => {
      clearInterval(iv);
      clearTimeout(stop);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      mo?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [applyNudge]);

  const onHandleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!shellRef.current) return;
    drag.current = {
      ...drag.current,
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      ox: drag.current.px,
      oy: drag.current.py,
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onHandleMove = (e: React.PointerEvent) => {
    if (!drag.current.active || !shellRef.current) return;
    e.preventDefault();
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const px = clamp(drag.current.ox + dx, -200, 120);
    const py = clamp(drag.current.oy + dy, -380, 120);
    drag.current.px = px;
    drag.current.py = py;
    shellRef.current.style.setProperty("transform", `translate(${px}px, ${py}px)`, "important");
  };

  const onHandleUp = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      aria-label="Drag to move the assistant button"
      title="Drag sideways or up — moves the chat button away from the nav bar"
      className={`fixed left-3 z-[65] flex h-12 w-11 items-center justify-center rounded-2xl border border-white/25 bg-zinc-900/90 text-white shadow-lg backdrop-blur-sm transition-opacity ${
        showHandle ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{
        bottom: "calc(7.1rem + env(safe-area-inset-bottom, 0px))",
      }}
      onPointerDown={onHandleDown}
      onPointerMove={onHandleMove}
      onPointerUp={onHandleUp}
      onPointerCancel={onHandleUp}
    >
      <i className="ri-move-line text-xl" aria-hidden />
    </button>
  );
}
