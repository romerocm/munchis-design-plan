"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SubscriptionConfig {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
}

export function useRealtimeRefresh(
  subscriptions: SubscriptionConfig[],
  options?: { debounceMs?: number }
) {
  const router = useRouter();
  const debounceMs = options?.debounceMs ?? 500;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("realtime-refresh");

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

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [router, debounceMs, subscriptions]);
}
