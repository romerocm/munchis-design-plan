import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isSandbox, verifyWompiSignature } from "@/lib/wompi/client";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  // Verify webhook signature in production mode
  if (!isSandbox()) {
    const checksum = req.headers.get("x-wompi-checksum");
    const timestamp = req.headers.get("x-wompi-timestamp");

    if (!checksum || !timestamp) {
      console.error("Wompi webhook: missing signature headers");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const transaction = body.data?.transaction;
    if (!transaction) {
      return NextResponse.json({ error: "Missing transaction data" }, { status: 400 });
    }

    const valid = verifyWompiSignature(checksum, timestamp, {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amount_in_cents: transaction.amount_in_cents,
    });

    if (!valid) {
      console.error("Wompi webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = body.event;
  const transaction = body.data?.transaction;
  const paymentLinkId = transaction?.payment_link_id;
  const status = transaction?.status;

  if (event === "transaction.updated" && paymentLinkId) {
    if (status === "APPROVED") {
      // Confirm order. Idempotent: .eq("status", "pending") prevents double-processing
      const { error } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("wompi_payment_id", paymentLinkId)
        .eq("status", "pending");

      if (error) {
        console.error("Failed to confirm order:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
    } else if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
      // Free capacity by expiring the declined order
      const { error } = await supabase
        .from("orders")
        .update({ status: "expired" })
        .eq("wompi_payment_id", paymentLinkId)
        .eq("status", "pending");

      if (error) {
        console.error("Failed to expire declined order:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
