import { describe, it, expect } from "vitest";
import {
  buildOrderReceivedVars,
  buildPaymentConfirmedVars,
  buildPaymentReminderVars,
  buildOrderCancelledVars,
  buildLastCallVars,
  buildPickupReminderVars,
  formatCentsToDollars,
} from "@/lib/twilio/templates";

describe("twilio/templates", () => {
  describe("formatCentsToDollars", () => {
    it("formats cents to dollar string", () => {
      expect(formatCentsToDollars(1850)).toBe("$18.50");
    });

    it("formats zero", () => {
      expect(formatCentsToDollars(0)).toBe("$0.00");
    });

    it("formats single digit cents", () => {
      expect(formatCentsToDollars(5)).toBe("$0.05");
    });
  });

  describe("buildOrderReceivedVars", () => {
    it("produces correct positional variables", () => {
      const result = JSON.parse(
        buildOrderReceivedVars({
          customerName: "Andrea",
          quantity: 5,
          flavorName: "Chocolate Chip",
          totalFormatted: "$18.50",
          paymentId: "pay_abc123",
        })
      );

      expect(result["1"]).toBe("Andrea");
      expect(result["2"]).toBe("5× Chocolate Chip");
      expect(result["3"]).toBe("$18.50");
      expect(result["4"]).toBe("pay_abc123");
    });
  });

  describe("buildPaymentConfirmedVars", () => {
    it("produces correct positional variables", () => {
      const result = JSON.parse(
        buildPaymentConfirmedVars({
          customerName: "Andrea",
          pickupDate: "2026-03-22",
          pickupTime: "14:00",
          pickupLocation: "Multiplaza, main entrance",
          quantity: 5,
          flavorName: "Chocolate Chip",
          mapQuery: "Multiplaza%2C%20main%20entrance",
        })
      );

      expect(result["1"]).toBe("Andrea");
      expect(result["5"]).toBe("5× Chocolate Chip");
      expect(result["6"]).toBe("Multiplaza%2C%20main%20entrance");
    });
  });

  describe("buildPaymentReminderVars", () => {
    it("produces correct positional variables", () => {
      const result = JSON.parse(
        buildPaymentReminderVars({
          customerName: "Andrea",
          flavorName: "Chocolate Chip",
          paymentId: "pay_abc123",
        })
      );

      expect(result["1"]).toBe("Andrea");
      expect(result["2"]).toBe("Chocolate Chip");
      expect(result["3"]).toBe("pay_abc123");
    });
  });

  describe("buildOrderCancelledVars", () => {
    it("produces correct positional variables", () => {
      const result = JSON.parse(
        buildOrderCancelledVars({
          customerName: "Andrea",
          flavorName: "Chocolate Chip",
          closeDay: "jueves",
        })
      );

      expect(result["1"]).toBe("Andrea");
      expect(result["2"]).toBe("Chocolate Chip");
      expect(result["3"]).toBe("jueves");
    });
  });

  describe("buildLastCallVars", () => {
    it("formats drop number with leading zero", () => {
      const result = JSON.parse(
        buildLastCallVars({
          dropNumber: 1,
          flavorName: "Chocolate Chip",
        })
      );

      expect(result["1"]).toBe("#01");
      expect(result["2"]).toBe("Chocolate Chip");
    });

    it("handles double-digit drop numbers", () => {
      const result = JSON.parse(
        buildLastCallVars({
          dropNumber: 12,
          flavorName: "Matcha",
        })
      );

      expect(result["1"]).toBe("#12");
    });
  });

  describe("buildPickupReminderVars", () => {
    it("produces correct positional variables", () => {
      const result = JSON.parse(
        buildPickupReminderVars({
          pickupDate: "2026-03-22",
          pickupTime: "14:00",
          pickupLocation: "Multiplaza, entrada principal",
          quantity: 5,
          flavorName: "Chocolate Chip",
          mapQuery: "Multiplaza%2C%20entrada%20principal",
        })
      );

      expect(result["1"]).toBe("domingo, 22 de marzo");
      expect(result["2"]).toBe("2:00 PM");
      expect(result["4"]).toBe("5× Chocolate Chip");
      expect(result["5"]).toBe("Multiplaza%2C%20entrada%20principal");
    });
  });
});
