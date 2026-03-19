import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

// We need to test the module with different env values, so we re-import per test group
describe("wompi/client", () => {
  describe("verifyWompiSignature", () => {
    beforeEach(() => {
      process.env.WOMPI_EVENTS_SECRET = "test-secret-123";
    });

    it("returns true for correct checksum", async () => {
      const { verifyWompiSignature } = await import("@/lib/wompi/client");

      const transaction = {
        id: "txn-1",
        status: "APPROVED",
        reference: "ref-1",
        amount_in_cents: 1110,
      };
      const timestamp = "1679000000";

      // Calculate expected hash
      const concatenated = `${transaction.id}${transaction.status}${transaction.reference}${transaction.amount_in_cents}${timestamp}${process.env.WOMPI_EVENTS_SECRET}`;
      const expectedHash = createHmac("sha256", process.env.WOMPI_EVENTS_SECRET!)
        .update(concatenated)
        .digest("hex");

      expect(verifyWompiSignature(expectedHash, timestamp, transaction)).toBe(true);
    });

    it("returns false for incorrect checksum", async () => {
      const { verifyWompiSignature } = await import("@/lib/wompi/client");

      const transaction = {
        id: "txn-1",
        status: "APPROVED",
        reference: "ref-1",
        amount_in_cents: 1110,
      };

      expect(verifyWompiSignature("wrong-hash", "1679000000", transaction)).toBe(false);
    });

    it("throws when WOMPI_EVENTS_SECRET is not set", async () => {
      delete process.env.WOMPI_EVENTS_SECRET;
      // Need fresh import to pick up cleared env
      vi.resetModules();
      const { verifyWompiSignature } = await import("@/lib/wompi/client");

      const transaction = { id: "t", status: "s", reference: "r", amount_in_cents: 0 };
      expect(() => verifyWompiSignature("hash", "ts", transaction)).toThrow(
        "WOMPI_EVENTS_SECRET is not configured"
      );
    });
  });

  describe("createPaymentLink", () => {
    beforeEach(() => {
      process.env.WOMPI_SANDBOX = "true";
      delete process.env.WOMPI_PRIVATE_KEY;
      vi.resetModules();
    });

    it("returns fake link in sandbox mode without private key", async () => {
      const { createPaymentLink } = await import("@/lib/wompi/client");

      const result = await createPaymentLink({
        orderId: "order-abc12345-rest",
        amountCents: 1110,
        customerName: "Maria",
        customerWhatsapp: "+50378901234",
        description: "3x Chocolate Chip",
      });

      expect(result.paymentLinkUrl).toContain("sandbox.wompi.co/pay/");
      expect(result.paymentId).toContain("sandbox_");
      expect(result.paymentId).toContain("order-ab");
    });
  });

  describe("isSandbox", () => {
    it("returns true when WOMPI_SANDBOX is 'true'", async () => {
      process.env.WOMPI_SANDBOX = "true";
      vi.resetModules();
      const { isSandbox } = await import("@/lib/wompi/client");
      expect(isSandbox()).toBe(true);
    });
  });
});
