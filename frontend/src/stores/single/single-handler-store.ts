// External Libraries
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Types
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";
import { type TQueryParams } from "@shared/types/api/param.type";

// Config
import { config } from "@/config";

export const useSingleHandlerStore = <
  TResponse,
  TExtra extends Record<string, any> = {}
>(
  name: string,
  initialParams: TQueryParams = {},
  initialExtra: TExtra = {} as TExtra
) => {
  return create<ISingleHandlerState<TResponse, TExtra>>()(
    devtools(
      (set) => ({
        name,
        params: initialParams,
        isLoading: false,
        error: null,
        response: null,
        action: "",
        payload: null,
        extra: initialExtra,

        // State setters
        setIsLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setResponse: (response) => set({ response }),
        setParams: (params) => set({ params }),

        // React 19: Enhanced action setting with transitions
        setAction: (action: string, payload: any = null) => {
          set({ payload, action });
        },

        setExtra: (key: string, value: any) =>
          set((state) => ({
            extra: {
              ...state.extra,
              ...(typeof value !== "function" ? { [key]: value } : {}),
            },
          })),

        resetExtra: () =>
          set({
            extra: initialExtra,
          }),

        syncWithQuery: ({ isLoading, error, isSuccess, response }) => {
          set({
            isLoading,
            error,
            isSuccess,
            ...(response !== undefined ? { response } : {}),
          });
        },

        // React 19: Enhanced reset with better state management
        reset: () =>
          set({
            payload: null,
            isLoading: false,
            error: null,
            response: null,
            isSuccess: false,
            action: "",
          }),
      }),
      {
        name: "single-handler-store",
        enabled: config.environment === "development",
      }
    )
  );
};

export type TSingleHandlerStore<
  TResponse,
  TExtra extends Record<string, any>
> = ReturnType<typeof useSingleHandlerStore<TResponse, TExtra>>;
