import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { findActiveDrop } from "@/lib/drops/find-active";
import { DropPage } from "@/components/drop-page";
import { DesktopDropPage } from "@/components/desktop/desktop-drop-page";
import { DropPageSkeleton, DesktopDropPageSkeleton } from "@/components/shared/skeleton";

export const dynamic = "force-dynamic";

async function getActiveDrop() {
  const supabase = createServerClient();

  // Lazy expiration: belt-and-suspenders alongside pg_cron
  try {
    await supabase.rpc("expire_stale_orders");
  } catch {
    // pg_cron handles this if RPC fails
  }

  // Fetch all drops and pick the active one by priority
  const { data: drops } = await supabase
    .from("drops")
    .select("*")
    .order("number", { ascending: false });

  const drop = findActiveDrop(drops || []) ?? null;

  if (!drop) return { drop: null, remaining: 0 };

  const { data: remaining } = await supabase.rpc(
    "get_drop_remaining_capacity",
    { p_drop_id: drop.id }
  );

  return { drop, remaining: remaining ?? 0 };
}

async function DropContent() {
  const { drop, remaining } = await getActiveDrop();
  return (
    <>
      {/* Mobile: <1024px */}
      <div className="lg:hidden">
        <DropPage drop={drop} remaining={remaining} />
      </div>
      {/* Desktop: ≥1024px */}
      <div className="hidden lg:block">
        <DesktopDropPage drop={drop} remaining={remaining} />
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
