import { useEffect } from 'react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useUserSettings } from "@/hooks/use-user-settings";

export function useAutoPushSubscription() {
    const { permission, requestPermission, subscribe, isSupported, subscription, isInitializing } = usePushNotifications();
    const { settings } = useUserSettings(); // get settings directly from store

    useEffect(() => {
        // Wait until push infrastructure is initialized and settings are loaded
        if (isInitializing || !settings?.notifications?.pushEnabled || !isSupported) return;

        const enablePush = async () => {
            try {
                // If we already have a subscription, we're all set
                if (subscription) return;

                // If permission is already granted but we're missing the browser subscription
                // (e.g. site data cleared), re-subscribe silently.
                if (permission === 'granted') {
                    await subscribe();
                    // No toast here to avoid spamming on refresh
                }
                // If permission hasn't been requested yet ('default'), 
                // this is likely the first time they enabled the setting.
                else if (permission === 'default') {
                    const result = await requestPermission();
                    if (result === 'granted') {
                        const sub = await subscribe();
                        if (sub) {
                            toast.success('Push notifications enabled!');
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to enable push notifications:', err);
            }
        };

        enablePush();
    }, [settings, permission, requestPermission, subscribe, isSupported, subscription, isInitializing]);
}
