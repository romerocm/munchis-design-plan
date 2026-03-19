import type { Order } from "@/types/database";

let counter = 0;

export function makeOrder(overrides: Partial<Order> = {}): Order {
  counter++;
  const now = new Date().toISOString();
  return {
    id: `order-${counter}-${Date.now()}`,
    drop_id: `drop-1`,
    status: "pending",
    customer_name: "Maria Alejandra",
    customer_whatsapp: "+50370001234",
    customer_email: null,
    quantity: 3,
    total_cents: 1110,
    payment_expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    paid_at: null,
    picked_up_at: null,
    wompi_payment_id: null,
    wompi_payment_link: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function makeConfirmedOrder(overrides: Partial<Order> = {}): Order {
  return makeOrder({
    status: "confirmed",
    paid_at: new Date().toISOString(),
    wompi_payment_id: "sandbox_pay_123",
    wompi_payment_link: "https://sandbox.wompi.co/pay/sandbox_pay_123",
    ...overrides,
  });
}

export function makeExpiredOrder(overrides: Partial<Order> = {}): Order {
  return makeOrder({
    status: "expired",
    payment_expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
    ...overrides,
  });
}
