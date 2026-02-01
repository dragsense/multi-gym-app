// React & Hooks
import React, { createContext, useContext, useDeferredValue, useMemo, useTransition, useId, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Types
import { type IAuthUser } from '@shared/interfaces/auth.interface';

// Services
import { me } from "@/services/auth.api";
import { ensureConnected, socketEmitter } from "@/utils/socket.service";

interface IAuthUserContextType {
  user?: IAuthUser;
  isLoading: boolean;
  error: Error | null;
  componentId: string;
  startTransition: (callback: () => void) => void;
}

const AuthUserContext = createContext<IAuthUserContextType | undefined>(undefined);

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const {
    data,
    isLoading,
    error,
  } = useQuery<IAuthUser>({
    queryKey: ["me"],
    queryFn: me,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });


  // React 19: Deferred user data for better performance
  const deferredUser = useDeferredValue(data);

  // Join user's websocket room once and leave on unmount
  useEffect(() => {
    const userId = deferredUser?.id;
    if (!userId) return;


    let isMounted = true;
    ensureConnected()
      .then(() => isMounted && socketEmitter<{ success: boolean; message: string }>('joinUserRoom', { userId }))
      .catch(() => { });

    return () => {
      isMounted = false;
      ensureConnected()
        .then(() => socketEmitter<{ success: boolean; message: string }>('leaveUserRoom', { userId }))
        .catch(() => { });
    };
  }, [deferredUser?.id]);

  // React 19: Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user: deferredUser,
    isLoading,
    error,
    componentId,
    startTransition,
  }), [deferredUser, isLoading, error, componentId, startTransition]);

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  const context = useContext(AuthUserContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a UserProvider");
  }
  return context;
}
