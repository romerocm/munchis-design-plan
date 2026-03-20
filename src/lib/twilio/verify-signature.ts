import { validateRequest } from "twilio";

/**
 * Verify that an incoming webhook request is authentically from Twilio
 * using HMAC-SHA1 signature validation.
 *
 * Tries the configured TWILIO_WEBHOOK_URL first (canonical production URL),
 * then falls back to the raw request URL. This handles reverse proxy / CDN
 * scenarios where req.url differs from what Twilio signed against.
 */
export function verifyTwilioSignature(
  requestUrl: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const webhookUrl = process.env.TWILIO_WEBHOOK_URL;

  // Try configured URL first, then fall back to request URL
  if (webhookUrl) {
    if (validateRequest(authToken, signature, webhookUrl, params)) return true;
  }

  if (validateRequest(authToken, signature, requestUrl, params)) return true;

  // Both failed — log for debugging but don't silently swallow
  console.warn(
    `Twilio signature verification failed. Tried URLs: ${[webhookUrl, requestUrl].filter(Boolean).join(", ")}`
  );
  return false;
}
