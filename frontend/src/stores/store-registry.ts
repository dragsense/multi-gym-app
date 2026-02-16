
// Stores
import { useGlobalStore } from '@/stores';
import { useId, useMemo, useTransition } from 'react';


// React 19: Enhanced store registry with better performance
export function useRegisteredStore<TStore>(key: string) {
    return useGlobalStore.getState().getStore<TStore>(key);
}

export function registerStore<TStore>(key: string, store: TStore) {
  useGlobalStore.getState().addStore(key, store);
  return store;
}

export function deregisterStore(key: string) {
  useGlobalStore.getState().removeStore(key);
}

// React 19: Enhanced store management with transitions
export function useStoreRegistry() {
  const globalStore = useGlobalStore();
  
  // React 19: Memoized store operations for better performance
  const storeOperations = useMemo(() => ({
    register: <TStore>(key: string, store: TStore) => {
      globalStore.addStore(key, store);
      return store;
    },
    deregister: (key: string) => {
      globalStore.removeStore(key);
    },
    getStore: <TStore>(key: string) => {
      return globalStore.getStore<TStore>(key);
    },
    hasStore: (key: string) => {
      return globalStore.hasStore(key);
    },
    getStoreKeys: () => {
      return globalStore.getStoreKeys();
    },
    getStoreCount: () => {
      return globalStore.getStoreCount();
    },
    clearAll: () => {
      globalStore.clearAllStores();
    }
  }), [globalStore]);

  return storeOperations;
}