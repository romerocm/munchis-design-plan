export type TemplateName =
  | "order_received"
  | "payment_confirmed"
  | "payment_reminder"
  | "order_cancelled"
  | "last_call"
  | "pickup_reminder";

interface TemplateConfig {
  envKey: string;
  contentSid: string | undefined;
}

const TEMPLATES: Record<TemplateName, TemplateConfig> = {
  order_received: {
    envKey: "TWILIO_CONTENT_SID_ORDER_RECEIVED",
    get contentSid() { return process.env.TWILIO_CONTENT_SID_ORDER_RECEIVED; },
  },
  payment_confirmed: {
    envKey: "TWILIO_CONTENT_SID_PAYMENT_CONFIRMED",
    get contentSid() { return process.env.TWILIO_CONTENT_SID_PAYMENT_CONFIRMED; },
  },
  payment_reminder: {
    envKey: "TWILIO_CONTENT_SID_PAYMENT_REMINDER",
    get contentSid() { return process.env.TWILIO_CONTENT_SID_PAYMENT_REMINDER; },
  },
  order_cancelled: {
    envKey: "TWILIO_CONTENT_SID_ORDER_CANCELLED",
    get contentSid() { return process.env.TWILIO_CONTENT_SID_ORDER_CANCELLED; },
  },
  last_call: {
    envKey: "TWILIO_CONTENT_SID_LAST_CALL",
    get contentSid() { return process.env.TWILIO_CONTENT_SID_LAST_CALL; },
  },
  pickup_reminder: {
    envKey: "TWILIO_CONTENT_SID_PICKUP_REMINDER",
    get contentSid() { return process.env.TWILIO_CONTENT_SID_PICKUP_REMINDER; },
  },
};

export function getContentSid(templateName: TemplateName): string | null {
  return TEMPLATES[templateName].contentSid || null;
}

// --- Variable builders ---
// Twilio Content Templates use {{1}}, {{2}}, etc. as positional variables.
// Each builder maps domain data to the JSON ContentVariables string.

// NOTE: Twilio WhatsApp CTA buttons have constraints:
// - Button text must be static (no variables)
// - Website URL must have a static base with ONE variable appended at the end
// The base URLs are set in Twilio Console when creating templates:
//   - Payment links: https://eatmunchis.com/pay/{{N}}
//   - Map links:     https://eatmunchis.com/pickup/{{N}}
//   - Order links:   https://eatmunchis.com/{{N}}
// Variables here pass only the path suffix (e.g., the payment ID or empty string).

export function buildOrderReceivedVars(data: {
  customerName: string;
  quantity: number;
  flavorName: string;
  totalFormatted: string;
  paymentId: string;
}): string {
  return JSON.stringify({
    "1": data.customerName,
    "2": `${data.quantity}× ${data.flavorName}`,
    "3": data.totalFormatted,
    "4": data.paymentId,
  });
}

export function buildPaymentConfirmedVars(data: {
  customerName: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  quantity: number;
  flavorName: string;
  mapQuery: string;
}): string {
  return JSON.stringify({
    "1": data.customerName,
    "2": data.pickupDate,
    "3": data.pickupTime,
    "4": data.pickupLocation,
    "5": `${data.quantity}× ${data.flavorName}`,
    "6": data.mapQuery,
  });
}

export function buildPaymentReminderVars(data: {
  customerName: string;
  flavorName: string;
  paymentId: string;
}): string {
  return JSON.stringify({
    "1": data.customerName,
    "2": data.flavorName,
    "3": data.paymentId,
  });
}

export function buildOrderCancelledVars(data: {
  customerName: string;
  flavorName: string;
  closeDay: string;
}): string {
  return JSON.stringify({
    "1": data.customerName,
    "2": data.flavorName,
    "3": data.closeDay,
  });
}

export function buildLastCallVars(data: {
  dropNumber: number;
  flavorName: string;
}): string {
  return JSON.stringify({
    "1": `#${String(data.dropNumber).padStart(2, "0")}`,
    "2": data.flavorName,
  });
}

export function buildPickupReminderVars(data: {
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  quantity: number;
  flavorName: string;
  mapQuery: string;
}): string {
  return JSON.stringify({
    "1": data.pickupDate,
    "2": data.pickupTime,
    "3": data.pickupLocation,
    "4": `${data.quantity}× ${data.flavorName}`,
    "5": data.mapQuery,
  });
}

export function formatCentsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
