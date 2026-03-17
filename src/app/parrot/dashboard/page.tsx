import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function ParrotDashboard() {
  const supabase = createServerClient();

  const { data: drops } = await supabase
    .from("drops")
    .select("*")
    .order("number", { ascending: false });

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return <DashboardClient drops={drops || []} orders={orders || []} />;
}
