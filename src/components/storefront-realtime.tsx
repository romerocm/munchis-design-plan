"use client";

import { useMemo } from "react";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

export function StorefrontRealtime({ dropId }: { dropId?: string }) {
  const subs = useMemo(() => {
    const base: { table: string; event: "INSERT" | "UPDATE"; filter?: string }[] = [
      { table: "drops", event: "UPDATE" },
    ];
    if (dropId) {
      base.push({
        table: "orders",
        event: "INSERT",
        filter: `drop_id=eq.${dropId}`,
      });
    }
    return base;
  }, [dropId]);

  useRealtimeRefresh(subs, { debounceMs: 1000 });

  return null;
}
