"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SubscriptionConfig {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
}

/**
 * Subscribe to Supabase realtime changes and auto-refresh the page.
 *
 * Handles iOS PWA suspend/resume: when the app returns to the foreground,
 * the websocket is likely dead. We detect this via `visibilitychange`,
 * tear down the old channel, and re-subscribe on a fresh one.
 */
export function useRealtimeRefresh(
  subscriptions: SubscriptionConfig[],
  options?: { debounceMs?: number }
) {
  const router = useRouter();
  const debounceMs = options?.debounceMs ?? 500;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    function setupChannel() {
      // Clean up previous channel if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(`realtime-refresh-${Date.now()}`);

      for (const sub of subscriptions) {
        channel.on(
          "postgres_changes" as never,
          {
            event: sub.event ?? "*",
            schema: "public",
            table: sub.table,
            ...(sub.filter ? { filter: sub.filter } : {}),
          },
          () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              router.refresh();
            }, debounceMs);
          }
        );
      }

      channel.subscribe();
      channelRef.current = channel;
    }

    setupChannel();

    // Reconnect when app returns from background (iOS PWA suspend kills the websocket)
    function onVisibilityChange() {
      if (!document.hidden) {
        setupChannel();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [router, debounceMs, subscriptions]);
}
