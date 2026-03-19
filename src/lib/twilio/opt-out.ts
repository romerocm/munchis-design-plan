import { createServerClient } from "@/lib/supabase/server";

export async function isOptedOut(whatsapp: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("whatsapp_opt_outs")
    .select("id")
    .eq("whatsapp", whatsapp)
    .maybeSingle();

  return !!data;
}

export async function recordOptOut(whatsapp: string): Promise<void> {
  const supabase = createServerClient();
  await supabase
    .from("whatsapp_opt_outs")
    .upsert({ whatsapp }, { onConflict: "whatsapp" });
}

export async function removeOptOut(whatsapp: string): Promise<void> {
  const supabase = createServerClient();
  await supabase
    .from("whatsapp_opt_outs")
    .delete()
    .eq("whatsapp", whatsapp);
}
