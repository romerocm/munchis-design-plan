import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function ParrotDashboard() {
  // Defense-in-depth: verify auth even though middleware already checks
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect("/parrot/login");
  }

  const bakerEmails = (process.env.BAKER_EMAILS || "heidi@munchis.sv").split(
    ","
  );
  if (!user.email || !bakerEmails.includes(user.email)) {
    redirect("/parrot/login");
  }

  const supabase = createServerClient();

  // Lazy promotion: move scheduled drops to "live" once orders_open_at has passed
  const now = new Date().toISOString();
  await supabase
    .from("drops")
    .update({ status: "live" })
    .eq("status", "scheduled")
    .lte("orders_open_at", now);

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
