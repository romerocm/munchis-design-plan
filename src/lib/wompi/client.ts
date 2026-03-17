import { createHmac } from "crypto";

const SANDBOX = process.env.WOMPI_SANDBOX === "true";

const WOMPI_BASE_URL = SANDBOX
  ? "https://sandbox.wompi.co/v1"
  : "https://production.wompi.co/v1";

interface PaymentLinkParams {
  orderId: string;
  amountCents: number;
  customerName: string;
  customerWhatsapp: string;
  description: string;
}

interface PaymentLinkResponse {
  paymentLinkUrl: string;
  paymentId: string;
}

export async function createPaymentLink(
  params: PaymentLinkParams
): Promise<PaymentLinkResponse> {
  // Local dev: simulate when no Wompi keys configured
  if (SANDBOX && !process.env.WOMPI_PRIVATE_KEY) {
    const fakeId = `sandbox_${params.orderId.slice(0, 8)}`;
    return {
      paymentLinkUrl: `https://sandbox.wompi.co/pay/${fakeId}`,
      paymentId: fakeId,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const res = await fetch(`${WOMPI_BASE_URL}/payment_links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
    },
    body: JSON.stringify({
      name: params.description,
      description: `Order ${params.orderId.slice(0, 8)} for ${params.customerName}`,
      single_use: true,
      collect_shipping: false,
      currency: "USD", // El Salvador uses USD
      amount_in_cents: params.amountCents,
      redirect_url: `${appUrl}/order/${params.orderId}/confirmed`,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Wompi payment link creation failed: ${error}`);
  }

  const data = await res.json();
  return {
    paymentLinkUrl: data.data.url,
    paymentId: data.data.id,
  };
}

/**
 * Verify Wompi webhook signature.
 * Wompi sends:
 *   x-wompi-checksum: SHA256 hash
 *   x-wompi-timestamp: Unix timestamp
 * Hash = SHA256({transaction_id}{status}{reference}{amount_in_cents}{timestamp}{events_secret})
 */
export function verifyWompiSignature(
  checksum: string,
  timestamp: string,
  transaction: {
    id: string;
    status: string;
    reference: string;
    amount_in_cents: number;
  }
): boolean {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  if (!eventsSecret) {
    throw new Error("WOMPI_EVENTS_SECRET is not configured");
  }

  const concatenated = `${transaction.id}${transaction.status}${transaction.reference}${transaction.amount_in_cents}${timestamp}${eventsSecret}`;
  const expectedHash = createHmac("sha256", eventsSecret)
    .update(concatenated)
    .digest("hex");

  return checksum === expectedHash;
}

export function isSandbox(): boolean {
  return SANDBOX;
}
