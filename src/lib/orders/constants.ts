import type { OrderStatus } from "@/types/database";

/** Maximum number of items per order */
export const MAX_ORDER_QUANTITY = 12;
export const MIN_ORDER_QUANTITY = 1;

/** Payment window duration */
export const PAYMENT_WINDOW_MS = 2 * 60 * 60 * 1000;
export const PAYMENT_WINDOW_HOURS = 2;

/** CSS class mapping for order status badges */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-600",
  picked_up: "bg-forest text-white",
};

/** Human-readable labels for order statuses */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Paid",
  expired: "Expired",
  cancelled: "Cancelled",
  picked_up: "Picked up",
};
