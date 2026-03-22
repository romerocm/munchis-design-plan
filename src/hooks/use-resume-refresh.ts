"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * When a PWA is suspended (iOS app switch, lock screen) and resumed,
 * any in-flight router.refresh() or fetch calls are dropped.
 * This hook detects the resume event and triggers a fresh refresh,
 * recovering from stuck loading states.
 *
 * Only refreshes if the app was hidden for at least `minHiddenMs` (default 2s)
 * to avoid unnecessary refreshes on quick tab switches.
 */
export function useResumeRefresh(minHiddenMs = 2000) {
  const router = useRouter();
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current) {
        const elapsed = Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
        if (elapsed >= minHiddenMs) {
          router.refresh();
        }
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [router, minHiddenMs]);
}
