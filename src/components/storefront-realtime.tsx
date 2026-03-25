"use client";

import { useMemo } from "react";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useRealtimeToasts } from "@/hooks/use-realtime-toasts";
import { SocialProofToast } from "@/components/social-proof-toast";

interface StorefrontRealtimeProps {
  dropId?: string;
  flavorName?: string;
  remaining?: number;
}

export function StorefrontRealtime({
  dropId,
  flavorName = "",
  remaining = 0,
}: StorefrontRealtimeProps) {
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

  const { currentToast, dismissToast } = useRealtimeToasts({
    dropId,
    flavorName,
    remaining,
  });

  return <SocialProofToast toast={currentToast} onDismiss={dismissToast} />;
}
