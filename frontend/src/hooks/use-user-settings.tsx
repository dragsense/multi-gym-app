// React & Hooks
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { config } from "@/config";
import { useEffect } from "react";

// Types
import { type IUserSettings } from '@shared/interfaces/settings.interface';

// Services
import { fetchMySettings, fetchUserSettingsById } from "@/services/settings.api";

// Stores
import { registerStore } from "@/stores";

interface IUserSettingsStore {
    settings?: IUserSettings;
    isLoading: boolean;
    error: Error | null;
}

const STORE_KEY = "user-settings-store";

// Create the store
const createUserSettingsStore = () => {
    return create<IUserSettingsStore>()(
        devtools(
            () => ({
                settings: undefined,
                isLoading: false,
                error: null,
            }),
            {
                name: STORE_KEY,
                enabled: config.environment === 'development'
            }
        )
    );
};

// Register the store globally
let userSettingsStore: ReturnType<typeof createUserSettingsStore> | null = null;

const getUserSettingsStore = () => {
    if (!userSettingsStore) {
        userSettingsStore = createUserSettingsStore();
        registerStore(STORE_KEY, userSettingsStore);
    }
    return userSettingsStore;
};

// Hook that fetches settings
export function useUserSettings() {
    const store = getUserSettingsStore();

    const {
        data,
        isLoading,
        error,
    } = useQuery<IUserSettings>({
        queryKey: ["user-settings"],
        queryFn: fetchMySettings,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Sync React Query data with Zustand store
    useEffect(() => {
        if (data) {
            store.setState({ settings: data });
        }
    }, [data, store]);

    return {
        settings: data || store.getState().settings,
        isLoading: isLoading || store.getState().isLoading,
        error: error || store.getState().error,
    };
}

// Hook to fetch user settings by user ID (Super Admin only)
export function useUserSettingsById(userId: string | undefined, enabled: boolean = true) {
    const {
        data,
        isLoading,
        error,
    } = useQuery<IUserSettings>({
        queryKey: ['user-settings', userId],
        queryFn: () => fetchUserSettingsById(userId!),
        enabled: enabled && !!userId,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        settings: data,
        isLoading,
        error,
    };
}
