import { describe, it, expect } from "vitest";

// normalizeWhatsApp is a pure function, safe to import directly
import { normalizeWhatsApp } from "@/lib/twilio/client";

describe("twilio/client", () => {
  describe("normalizeWhatsApp", () => {
    it("adds whatsapp: prefix to E.164 number", () => {
      expect(normalizeWhatsApp("+50378901234")).toBe("whatsapp:+50378901234");
    });

    it("adds +503 for 8-digit local numbers", () => {
      expect(normalizeWhatsApp("78901234")).toBe("whatsapp:+50378901234");
    });

    it("adds + prefix for numbers without it", () => {
      expect(normalizeWhatsApp("50378901234")).toBe("whatsapp:+50378901234");
    });

    it("strips non-numeric characters except +", () => {
      expect(normalizeWhatsApp("+503 7890-1234")).toBe("whatsapp:+50378901234");
    });

    it("handles already-prefixed whatsapp number", () => {
      // Edge case: if someone passes whatsapp:+503... it should still work
      // After stripping non-numeric except +, "whatsapp:" becomes empty, leaving the number
      expect(normalizeWhatsApp("whatsapp:+50378901234")).toBe("whatsapp:+50378901234");
    });
  });
});
