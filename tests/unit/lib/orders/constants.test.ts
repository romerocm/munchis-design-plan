import { describe, it, expect } from "vitest";
import {
  MAX_ORDER_QUANTITY,
  MIN_ORDER_QUANTITY,
  PAYMENT_WINDOW_MS,
  PAYMENT_WINDOW_MINUTES,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/lib/orders/constants";
import type { OrderStatus } from "@/types/database";

describe("Order quantity limits", () => {
  it("MAX_ORDER_QUANTITY is 12", () => {
    expect(MAX_ORDER_QUANTITY).toBe(12);
  });

  it("MIN_ORDER_QUANTITY is 1", () => {
    expect(MIN_ORDER_QUANTITY).toBe(1);
  });
});

describe("Payment window", () => {
  it("PAYMENT_WINDOW_MS is 20 minutes in milliseconds", () => {
    expect(PAYMENT_WINDOW_MS).toBe(20 * 60 * 1000);
    expect(PAYMENT_WINDOW_MS).toBe(1_200_000);
  });

  it("PAYMENT_WINDOW_MINUTES is 20", () => {
    expect(PAYMENT_WINDOW_MINUTES).toBe(20);
  });

  it("PAYMENT_WINDOW_MS and PAYMENT_WINDOW_MINUTES are consistent", () => {
    expect(PAYMENT_WINDOW_MS).toBe(PAYMENT_WINDOW_MINUTES * 60 * 1000);
  });
});

describe("ORDER_STATUS_COLORS", () => {
  const allStatuses: OrderStatus[] = ["pending", "confirmed", "expired", "cancelled", "picked_up"];

  it("has a color for every order status", () => {
    for (const status of allStatuses) {
      expect(ORDER_STATUS_COLORS[status]).toBeDefined();
      expect(typeof ORDER_STATUS_COLORS[status]).toBe("string");
    }
  });
});

describe("ORDER_STATUS_LABELS", () => {
  const allStatuses: OrderStatus[] = ["pending", "confirmed", "expired", "cancelled", "picked_up"];

  it("has a label for every order status", () => {
    for (const status of allStatuses) {
      expect(ORDER_STATUS_LABELS[status]).toBeDefined();
      expect(typeof ORDER_STATUS_LABELS[status]).toBe("string");
    }
  });

  it("confirmed shows as 'Paid'", () => {
    expect(ORDER_STATUS_LABELS.confirmed).toBe("Paid");
  });

  it("picked_up shows as 'Picked up'", () => {
    expect(ORDER_STATUS_LABELS.picked_up).toBe("Picked up");
  });
});
