import { config } from '@/config';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useId, useMemo, useTransition } from 'react';


type StoresMap = Map<string, any>;

interface IGlobalStore {
  stores: StoresMap;
  storeCount: number;
  // React 19: Enhanced store management with transitions
  addStore: <T>(key: string, store: T) => void;
  getStore: <T>(key: string) => T | undefined;
  removeStore: (key: string) => void;
  clearAllStores: () => void;
  hasStore: (key: string) => boolean;
  getStoreKeys: () => string[];
  // React 19: New methods for better performance
  getStoreIds: () => string[];
  getStoreCount: () => number;
}

export const useGlobalStore = create<IGlobalStore>()(
  devtools(
    (set, get) => ({
      stores: new Map(),
      storeCount: 0,

      addStore: (key, store) => {
        set((state) => {
          const newStores = new Map(state.stores);
          newStores.set(key, store);
          return { 
            stores: newStores,
            storeCount: newStores.size
          };
        });
      },

      getStore: (key) => {
        return get().stores.get(key);
      },

      removeStore: (key) => {
        set((state) => {
          const newStores = new Map(state.stores);
          newStores.delete(key);
          return { 
            stores: newStores,
            storeCount: newStores.size
          };
        });
      },

      clearAllStores: () => {
        set({
          stores: new Map(),
          storeCount: 0
        });
      },

      hasStore: (key) => {
        return get().stores.has(key);
      },

      getStoreKeys: () => {
        return Array.from(get().stores.keys());
      },

      // React 19: Enhanced store management methods
      getStoreIds: () => {
        return Array.from(get().stores.keys());
      },

      getStoreCount: () => {
        return get().stores.size;
      },
    }),
    {
      name: 'global-store',
      enabled: config.environment === 'development'
    }
  )
);