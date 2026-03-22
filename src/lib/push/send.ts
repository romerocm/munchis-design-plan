import webpush from "web-push";
import { createServerClient } from "@/lib/supabase/server";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails("mailto:hello@eatmunchis.com", VAPID_PUBLIC, VAPID_PRIVATE);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to all registered subscriptions (Heidi's devices).
 * Silently cleans up expired/unsubscribed endpoints (410 Gone).
 */
export async function sendPushToAll(payload: PushPayload) {
  const supabase = createServerClient();
  const { data: subs } = await supabase.from("push_subscriptions").select("*");

  if (!subs || subs.length === 0) return;

  const message = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
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
        // 404 or 410 = subscription expired/unsubscribed, clean it up
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );

  return results;
}
