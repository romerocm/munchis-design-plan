import { createServerClient } from "@/lib/supabase/server";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to all registered subscriptions (Heidi's devices).
 * Silently cleans up expired/unsubscribed endpoints (410 Gone).
 * Uses dynamic require for web-push (CommonJS module) to avoid ESM issues.
 */
export async function sendPushToAll(payload: PushPayload) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const webpush = require("web-push");

  const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("Push: VAPID keys not configured");
    return;
  }

  webpush.setVapidDetails("mailto:hello@eatmunchis.com", VAPID_PUBLIC, VAPID_PRIVATE);

  const supabase = createServerClient();
  const { data: subs, error: dbError } = await supabase.from("push_subscriptions").select("*");

  if (dbError) {
    console.error("Push: failed to fetch subscriptions:", dbError.message);
    return;
  }

  if (!subs || subs.length === 0) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub: { id: string; endpoint: string; keys_p256dh: string; keys_auth: string }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          message
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Push send failed:", (err as Error).message || err);
        }
      }
    })
  );
}
