// Types
import type { StoreApi } from "zustand";
import { type TQueryParams } from "@shared/types/api/param.type";

export interface ISingleHandlerBaseState<TResponse> {
  response?: TResponse | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
}

export interface ISingleHandlerState<
  TResponse,
  TExtra extends Record<string, any> = {}
> extends ISingleHandlerBaseState<TResponse> {
  id: string;
  name: string;
  params: TQueryParams;
  action: string;
  payload: any;
  extra: TExtra;

  setExtra: <K extends keyof TExtra>(key: K, value?: TExtra[K]) => void;
  resetExtra: () => void;

  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  setResponse: (response: TResponse) => void;
  setParams: (params: TQueryParams) => void;
  setAction: (action: string, payload?: any) => void;
  setResetActions: () => void;
  syncWithQuery: (state: ISingleHandlerBaseState<TResponse>) => void;

  reset: () => void;
}

export type ISingleStoreApi<
  TResponse,
  TExtra extends Record<string, any>
> = StoreApi<ISingleHandlerState<TResponse, TExtra>>;
