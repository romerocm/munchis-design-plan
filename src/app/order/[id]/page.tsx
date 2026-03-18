import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OrderStatusPage } from "@/components/order-status-page";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, drops(*)")
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  return <OrderStatusPage order={order} drop={order.drops} />;
}
