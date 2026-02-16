import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useUserSettings } from "@/hooks/use-user-settings";
import { useWatch, useFormContext } from 'react-hook-form';

/**
 * Hook to be used inside a form that watches the pushEnabled field
 * and triggers permission request immediately when toggled on.
 * This should be rendered inside the Form component.
 */
export function usePushPermissionOnToggle(fieldName: string = 'notifications.pushEnabled') {
    const form = useFormContext();
    const {
        permission,
        requestPermission,
        subscribe,
        unsubscribe,
        isSupported,
        subscription,
        isInitializing
    } = usePushNotifications();

    // Watch the form field value
    const pushEnabled = useWatch({ name: fieldName, control: form?.control });

    // Track the previous value to detect changes
    const prevPushEnabledRef = useRef<boolean | undefined>(undefined);
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        // Wait until push infrastructure is initialized
        if (isInitializing || !form) return;

        const prevPushEnabled = prevPushEnabledRef.current;

        // Update the ref for next comparison
        prevPushEnabledRef.current = pushEnabled;

        // Skip the initial mount (first render)
        if (prevPushEnabled === undefined) {
            hasInitializedRef.current = true;
            return;
        }

        // Skip if not supported
        if (!isSupported) {
            if (pushEnabled && !hasInitializedRef.current) {
                toast.error('Push notifications are not supported in this browser');
            }
            hasInitializedRef.current = true;
            return;
        }

        const handleToggleChange = async () => {
            try {
                // Push was just enabled (changed from false to true)
                if (pushEnabled === true && prevPushEnabled === false) {
                    // Check permission status
                    if (permission === 'denied') {
                        toast.error(
                            'Push notifications are blocked. Please enable them in your browser settings.',
                            { duration: 5000 }
                        );
                        // Revert the toggle since we can't enable
                        form.setValue(fieldName, false, { shouldDirty: false });
                        return;
                    }

                    // Request permission if not granted yet
                    if (permission === 'default') {
                        const result = await requestPermission();
                        if (result === 'granted') {
                            const sub = await subscribe();
                            if (sub) {
                                toast.success('Push notifications enabled!');
                            }
                        } else {
                            toast.error('Push notification permission was denied');
                            // Revert the toggle since permission was denied
                            form.setValue(fieldName, false, { shouldDirty: false });
                        }
                    } else if (permission === 'granted') {
                        // Already have permission, subscribe if no subscription
                        if (!subscription) {
                            const sub = await subscribe();
                            if (sub) {
                                toast.success('Push notifications enabled!');
                            }
                        } else {
                            toast.success('Push notifications enabled!');
                        }
                    }
                }
                // Push was just disabled (changed from true to false)
                else if (pushEnabled === false && prevPushEnabled === true) {
                    if (subscription) {
                        await unsubscribe();
                    }
                    toast.info('Push notifications will be disabled. Remember to save settings!', { duration: 4000 });
                }
            } catch (err) {
                console.error('Failed to update push notification subscription:', err);
                toast.error('Failed to update push notification settings');
            }
        };

        handleToggleChange();
        hasInitializedRef.current = true;
    }, [
        pushEnabled,
        permission,
        requestPermission,
        subscribe,
        unsubscribe,
        isSupported,
        subscription,
        isInitializing,
        form,
        fieldName
    ]);
}

/**
 * Hook that automatically handles push notification subscription on mount/settings change:
 * Used in the DashboardLayout to re-subscribe when settings are loaded.
 */
export function useAutoPushSubscription() {
    const {
        permission,
        subscribe,
        isSupported,
        subscription,
        isInitializing
    } = usePushNotifications();
    const { settings } = useUserSettings();

    useEffect(() => {
        // Wait until push infrastructure is initialized
        if (isInitializing) return;
        if (!settings?.notifications?.pushEnabled) return;
        if (!isSupported) return;

        const autoSubscribe = async () => {
            try {
                // Only auto-subscribe if permission is already granted and no subscription
                if (permission === 'granted' && !subscription) {
                    await subscribe();
                    console.log('[AutoPush] Re-subscribed user with existing permission');
                }
            } catch (err) {
                console.error('Failed to auto-subscribe to push notifications:', err);
            }
        };

        autoSubscribe();
    }, [
        settings?.notifications?.pushEnabled,
        permission,
        subscribe,
        isSupported,
        subscription,
        isInitializing
    ]);
}

