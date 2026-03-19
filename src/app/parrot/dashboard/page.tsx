import { createServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function ParrotDashboard() {
  const supabase = createServerClient();

  const [dropsRes, ordersRes, recipesRes, statsRes] = await Promise.all([
    supabase.from("drops").select("*").order("number", { ascending: false }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("recipes").select("*").order("updated_at", { ascending: false }),
    supabase.from("drop_stats").select("*"),
  ]);

  return (
    <DashboardClient
      drops={dropsRes.data || []}
      orders={ordersRes.data || []}
      recipes={recipesRes.data || []}
      dropStats={statsRes.data || []}
    />
  );
}
