import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { findActiveDrop } from "@/lib/drops/find-active";
import { DropPage } from "@/components/drop-page";
import { DesktopDropPage } from "@/components/desktop/desktop-drop-page";
import { DropPageSkeleton, DesktopDropPageSkeleton } from "@/components/shared/skeleton";
import { StorefrontRealtime } from "@/components/storefront-realtime";

export const dynamic = "force-dynamic";

async function getActiveDrop() {
  const supabase = createServerClient();

  // Lazy expiration: expire stale orders and notify baker
  try {
    const { expireOrdersWithPush } = await import("@/lib/orders/expire-with-push");
    await expireOrdersWithPush();
  } catch {
    // best effort — pg_cron is the backstop
  }

  // Lazy promotion: move scheduled drops to "live" once orders_open_at has passed
  const now = new Date().toISOString();
  await supabase
    .from("drops")
    .update({ status: "live" })
    .eq("status", "scheduled")
    .lte("orders_open_at", now);

  // Fetch all drops and pick the active one by priority
  const { data: drops } = await supabase
    .from("drops")
    .select("*")
    .order("number", { ascending: false });

  const drop = findActiveDrop(drops || []) ?? null;

  if (!drop) return { drop: null, remaining: 0, nextDrop: null };

  const { data: remaining } = await supabase.rpc(
    "get_drop_remaining_capacity",
    { p_drop_id: drop.id }
  );

  // Find the next upcoming drop (scheduled or draft with future open date, excluding current)
  // Only expose scheduled drops to customers — drafts stay hidden
  const nextDrop = (drops || [])
    .filter(
      (d) =>
        (d.status === "scheduled" || d.status === "draft") &&
        d.id !== drop?.id &&
        new Date(d.orders_open_at) > new Date()
    )
    .sort((a, b) => a.orders_open_at.localeCompare(b.orders_open_at))[0] ?? null;

  return { drop, remaining: remaining ?? 0, nextDrop };
}

async function DropContent() {
  const { drop, remaining, nextDrop } = await getActiveDrop();
  return (
    <>
      <StorefrontRealtime
        dropId={drop?.id}
        flavorName={drop?.flavor_name ?? ""}
        remaining={remaining}
      />
      {/* Mobile: <1024px */}
      <div className="lg:hidden">
        <DropPage drop={drop} remaining={remaining} nextDrop={nextDrop} />
      </div>
      {/* Desktop: ≥1024px */}
      <div className="hidden lg:block">
        <DesktopDropPage drop={drop} remaining={remaining} nextDrop={nextDrop} />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <>
        <div className="lg:hidden"><DropPageSkeleton /></div>
        <div className="hidden lg:block"><DesktopDropPageSkeleton /></div>
      </>
    }>
      <DropContent />
    </Suspense>
  );
}
