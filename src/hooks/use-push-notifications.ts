"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getToken } from "@/lib/auth/get-token";

type Permission = "default" | "granted" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<Permission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // Register SW and check existing subscription on mount
  useEffect(() => {
    if (!isSupported) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as Permission);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registrationRef.current = reg;
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setSubscribed(!!sub);
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return false;
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as Permission);
      if (perm !== "granted") {
        setLoading(false);
        return false;
      }

      // Ensure SW is registered
      let registration = registrationRef.current;
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
        registrationRef.current = registration;
        // Wait for it to be active
        await navigator.serviceWorker.ready;
      }

      const applicationServerKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to server
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return false;
      }

      const res = await fetch("/api/parrot/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (res.ok) {
        setSubscribed(true);
        setLoading(false);
        return true;
      }

      console.error("Push subscribe API failed:", await res.text());
      setLoading(false);
      return false;
    } catch (err) {
      console.error("Push subscribe failed:", err);
      setLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = registrationRef.current || await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const token = await getToken();
      if (token) {
        await fetch("/api/parrot/push/subscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint }),
        });
      }

      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  }, [isSupported]);

  return { isSupported, permission, subscribed, loading, subscribe, unsubscribe };
}
