import { useEffect, useState, useCallback } from "react";
import { useNotifications } from "./use-notifications";

export interface PushNotificationPermission {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<boolean>;
  subscription: PushSubscription | null;
  isInitializing: boolean;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

export function usePushNotifications(): PushNotificationPermission {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const { notifications } = useNotifications();

  // Check browser support
  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if (!isSupported) {
      setIsInitializing(false);
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js",
          {
            scope: "/",
          }
        );
        console.log("Service Worker registered:", registration);

        // Get existing subscription
        const existingSubscription =
          await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
        }
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    registerServiceWorker();
  }, [isSupported]);

  // Request permission
  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!isSupported) {
        throw new Error("Push notifications are not supported in this browser");
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== "granted") {
      console.warn("Cannot subscribe: permission not granted or not supported");
      return null;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn("VAPID public key not configured");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        setSubscription(existingSubscription);
        return existingSubscription;
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(newSubscription);
      console.log("Push subscription created:", newSubscription);

      // Send subscription to backend
      try {
        const { subscribeToPush } = await import('@/services/notification.api');

        // Convert ArrayBuffer keys to base64url
        const p256dhKey = newSubscription.getKey('p256dh');
        const authKey = newSubscription.getKey('auth');

        const p256dhBase64 = btoa(
          String.fromCharCode(...new Uint8Array(p256dhKey)),
        )
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');

        const authBase64 = btoa(
          String.fromCharCode(...new Uint8Array(authKey)),
        )
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');

        await subscribeToPush({
          endpoint: newSubscription.endpoint,
          keys: {
            p256dh: p256dhBase64,
            auth: authBase64,
          },
          userAgent: navigator.userAgent,
        });
        console.log('Push subscription sent to backend');
      } catch (error) {
        console.error('Failed to send subscription to backend:', error);
      }

      return newSubscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return null;
    }
  }, [isSupported, permission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const unsubscribed = await subscription.unsubscribe();
      if (unsubscribed) {
        // Remove from backend
        try {
          const { unsubscribeFromPush } = await import(
            '@/services/notification.api',
          );
          await unsubscribeFromPush(subscription.endpoint);
        } catch (error) {
          console.error('Failed to remove subscription from backend:', error);
        }

        setSubscription(null);
        console.log("Unsubscribed from push notifications");
      }
      return unsubscribed;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }, [subscription]);

  // Convert VAPID key
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Auto-subscribe when permission is granted and new notifications arrive
  useEffect(() => {
    if (
      permission === "granted" &&
      isSupported &&
      !subscription &&
      notifications.length > 0
    ) {
      subscribe();
    }
  }, [permission, isSupported, subscription, notifications, subscribe]);

  return {
    permission,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe,
    subscription,
    isInitializing,
  };
}

