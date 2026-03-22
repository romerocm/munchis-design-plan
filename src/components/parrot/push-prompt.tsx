"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

/**
 * Minimal banner prompting Heidi to enable push notifications.
 * Only shows on dashboard, dismissible, remembers dismissal for 7 days.
 */
const DISMISS_KEY = "munchis-push-dismissed";
const DISMISS_DAYS = 7;

export function PushPrompt() {
  const { isSupported, permission, subscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (stored) {
      const expiry = parseInt(stored, 10);
      if (Date.now() < expiry) return; // still dismissed
    }
    setDismissed(false);
  }, []);

  // Register service worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!isSupported || subscribed || permission === "denied" || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400000));
  }

  async function handleEnable() {
    await subscribe();
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-forest/5 border border-forest/8">
      <div className="w-8 h-8 rounded-full bg-amber/15 flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5c0 2.1-.7 3.4-1.3 4.1a.75.75 0 00.55 1.15h10.5a.75.75 0 00.55-1.15c-.6-.7-1.3-2-1.3-4.1A4.5 4.5 0 008 1.5z" stroke="#C8872E" strokeWidth="1.2" />
          <path d="M6 11.25a2 2 0 004 0" stroke="#C8872E" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-forest">Get notified on new orders</p>
        <p className="text-xs text-forest/40">Even when the app is in the background</p>
      </div>
      <button
        onClick={handleEnable}
        className="px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-semibold flex-shrink-0 btn-press"
      >
        Enable
      </button>
      <button
        onClick={handleDismiss}
        className="text-forest/20 hover:text-forest/40 flex-shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
