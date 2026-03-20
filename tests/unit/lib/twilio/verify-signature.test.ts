import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("twilio", () => ({
  validateRequest: vi.fn(),
}));

import { validateRequest } from "twilio";
import { verifyTwilioSignature } from "@/lib/twilio/verify-signature";

const mockValidateRequest = vi.mocked(validateRequest);

describe("verifyTwilioSignature", () => {
  beforeEach(() => {
    mockValidateRequest.mockReset();
    process.env.TWILIO_AUTH_TOKEN = "test-auth-token";
    delete process.env.TWILIO_WEBHOOK_URL;
  });

  it("returns false when TWILIO_AUTH_TOKEN is not set", () => {
    delete process.env.TWILIO_AUTH_TOKEN;
    const result = verifyTwilioSignature(
      "https://example.com/webhook",
      { Body: "hello" },
      "some-signature"
    );
    expect(result).toBe(false);
    expect(mockValidateRequest).not.toHaveBeenCalled();
  });

  it("validates against request URL when no TWILIO_WEBHOOK_URL set", () => {
    mockValidateRequest.mockReturnValue(true);
    const result = verifyTwilioSignature(
      "https://example.com/webhook",
      { Body: "hello" },
      "valid-sig"
    );
    expect(result).toBe(true);
    expect(mockValidateRequest).toHaveBeenCalledWith(
      "test-auth-token",
      "valid-sig",
      "https://example.com/webhook",
      { Body: "hello" }
    );
  });

  it("returns false for invalid signature", () => {
    mockValidateRequest.mockReturnValue(false);
    const result = verifyTwilioSignature(
      "https://example.com/webhook",
      { Body: "hello" },
      "bad-sig"
    );
    expect(result).toBe(false);
  });

  it("tries TWILIO_WEBHOOK_URL first when set", () => {
    process.env.TWILIO_WEBHOOK_URL = "https://production.com/api/webhooks/twilio";
    mockValidateRequest.mockReturnValue(true);

    const result = verifyTwilioSignature(
      "http://localhost/api/webhooks/twilio",
      { Body: "test" },
      "sig"
    );

    expect(result).toBe(true);
    // Should have tried the configured URL first
    expect(mockValidateRequest).toHaveBeenCalledWith(
      "test-auth-token",
      "sig",
      "https://production.com/api/webhooks/twilio",
      { Body: "test" }
    );
  });

  it("falls back to request URL when TWILIO_WEBHOOK_URL fails", () => {
    process.env.TWILIO_WEBHOOK_URL = "https://wrong-url.com/webhook";

    // First call (configured URL) fails, second call (request URL) succeeds
    mockValidateRequest
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const result = verifyTwilioSignature(
      "https://actual-url.com/api/webhooks/twilio",
      { Body: "test" },
      "sig"
    );

    expect(result).toBe(true);
    expect(mockValidateRequest).toHaveBeenCalledTimes(2);
    // First attempt: configured URL
    expect(mockValidateRequest).toHaveBeenNthCalledWith(
      1,
      "test-auth-token",
      "sig",
      "https://wrong-url.com/webhook",
      { Body: "test" }
    );
    // Second attempt: request URL
    expect(mockValidateRequest).toHaveBeenNthCalledWith(
      2,
      "test-auth-token",
      "sig",
      "https://actual-url.com/api/webhooks/twilio",
      { Body: "test" }
    );
  });

  it("returns false and logs warning when both URLs fail", () => {
    process.env.TWILIO_WEBHOOK_URL = "https://wrong-url.com/webhook";
    mockValidateRequest.mockReturnValue(false);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = verifyTwilioSignature(
      "https://also-wrong.com/webhook",
      { Body: "test" },
      "bad-sig"
    );

    expect(result).toBe(false);
    expect(mockValidateRequest).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Twilio signature verification failed")
    );
    warnSpy.mockRestore();
  });
});
