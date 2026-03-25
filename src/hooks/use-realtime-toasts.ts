"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { isOwnOrder } from "@/lib/social-proof/own-order";
import {
  getRandomOrderToast,
  getRandomLowStockToast,
  getRandomSoldOutToast,
  type ToastEvent,
} from "@/lib/social-proof/variants";

const COOLDOWN_MS = 5_000;
const AUTO_DISMISS_MS = 4_000;
const MAX_QUEUE = 3;

interface RealtimeToastsConfig {
  dropId: string | undefined;
  flavorName: string;
  remaining: number;
}

export function useRealtimeToasts({ dropId, flavorName, remaining }: RealtimeToastsConfig) {
  const [currentToast, setCurrentToast] = useState<ToastEvent | null>(null);

  const queueRef = useRef<ToastEvent[]>([]);
  const lastShownAtRef = useRef(0);
  const ordersSinceRefreshRef = useRef(0);
  const remainingRef = useRef(remaining);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset counter when server sends fresh remaining
  useEffect(() => {
    remainingRef.current = remaining;
    ordersSinceRefreshRef.current = 0;
  }, [remaining]);

  const showToast = useCallback((toast: ToastEvent) => {
    setCurrentToast(toast);
    lastShownAtRef.current = Date.now();

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setCurrentToast(null);
    }, AUTO_DISMISS_MS);
  }, []);

  const enqueueToast = useCallback(
    (partial: Omit<ToastEvent, "id">) => {
      const toast: ToastEvent = { ...partial, id: crypto.randomUUID() };
      const now = Date.now();
      const cooldownElapsed = now - lastShownAtRef.current >= COOLDOWN_MS;

      if (cooldownElapsed && !currentToast) {
        showToast(toast);
      } else {
        queueRef.current.push(toast);
        if (queueRef.current.length > MAX_QUEUE) {
          queueRef.current.shift();
        }
      }
    },
    [currentToast, showToast]
  );

  const dismissToast = useCallback(() => {
    setCurrentToast(null);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  // Drain queue
  useEffect(() => {
    drainIntervalRef.current = setInterval(() => {
      if (
        !currentToast &&
        queueRef.current.length > 0 &&
        Date.now() - lastShownAtRef.current >= COOLDOWN_MS
      ) {
        const next = queueRef.current.shift()!;
        showToast(next);
      }
    }, 1_000);

    return () => {
      if (drainIntervalRef.current) clearInterval(drainIntervalRef.current);
    };
  }, [currentToast, showToast]);

  // Supabase realtime subscription
  useEffect(() => {
    if (!dropId) return;

    const supabase = createClient();
    supabaseRef.current = supabase;

    function setupChannel() {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(`social-proof-${Date.now()}`);

      // Listen for new orders
      channel.on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `drop_id=eq.${dropId}`,
        },
        (payload: { new: { id: string; quantity: number } }) => {
          if (isOwnOrder(payload.new.id)) return;

          const qty = payload.new.quantity || 1;
          ordersSinceRefreshRef.current += qty;
          const estimated = remainingRef.current - ordersSinceRefreshRef.current;

          if (estimated <= 0) {
            enqueueToast(getRandomSoldOutToast(flavorName));
          } else if (estimated <= 3) {
            enqueueToast(getRandomLowStockToast(estimated));
          } else {
            enqueueToast(getRandomOrderToast(flavorName));
          }
        }
      );

      // Listen for drop status changes (manual close → sold out)
      channel.on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "drops",
        },
        (payload: { new: { id: string; status: string } }) => {
          if (payload.new.id === dropId && payload.new.status === "closed") {
            enqueueToast(getRandomSoldOutToast(flavorName));
          }
        }
      );

      channel.subscribe();
      channelRef.current = channel;
    }

    setupChannel();

    // Reconnect on iOS PWA resume
    function onVisibilityChange() {
      if (!document.hidden) {
        setupChannel();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropId, flavorName]);

  return { currentToast, dismissToast };
}
