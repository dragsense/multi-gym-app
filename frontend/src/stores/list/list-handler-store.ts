// External Libraries
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useId, useMemo, useTransition } from "react";

// Types
import {
  type IListHandlerBaseState,
  type IListHandlerState,
} from "@/@types/handler-types/list.type";
import { type IListPaginationState } from "@shared/interfaces/api/response.interface";

// Config
import { config } from "@/config";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";

const initialPaginationState: IListPaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  lastPage: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export const useListHandlerStore = <
  TResponse,
  TUserListData = any,
  TExtra extends Record<string, any> = {}
>(
  initialFilters: Record<string, any> = {},
  initialExtra: TExtra = {} as TExtra,
  filteredFields: TFieldConfigObject<TUserListData> = {} as TFieldConfigObject<TUserListData>
) => {
  return create<IListHandlerState<TResponse, TUserListData, TExtra>>()(
    devtools(
      (set) => ({
        // Base state
        isLoading: false,
        error: null,
        response: null,
        isSuccess: false,
        pagination: initialPaginationState,
        action: "",

        payload: null,

        extra: initialExtra,
        filteredFields: filteredFields,

        // Query state
        filters: initialFilters,
        sortBy: "createdAt",
        sortOrder: "DESC",
        search: "",
        _relations: "",
        _select: "",
        _countable: "",
        // Setters
        setFilters: (filters) => set({ filters }),
        setFilteredFields: (fields) => set({ filteredFields: fields }),
        setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
        setSearch: (search) => set({ search }),
        setRelations: (relations) => set({ _relations: relations }),
        setSelect: (select) => set({ _select: select }),
        setCountable: (countable) => set({ _countable: countable }),
        setPagination: (pagination) =>
          set((state) => ({
            pagination: { ...state.pagination, ...pagination },
          })),
        setIsLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setResponse: (response) => set({ response }),

        // React 19: Enhanced item action setter with transitions
        setAction: (action, payload) => set({ action, payload }),

        setExtra: (key, value) =>
          set((state) => ({
            extra: {
              ...state.extra,
              [key]: value,
            },
          })),

        resetExtra: () =>
          set({
            extra: initialExtra,
          }),

        // Query sync
        syncWithQuery: ({
          isLoading,
          error,
          isSuccess,
          response,
          pagination,
        }) => {
          const update: Partial<IListHandlerBaseState<TResponse>> = {
            isLoading,
            error,
            isSuccess,
          };
          if (response !== undefined) {
            update.response = response;
          }
          if (pagination !== undefined) {
            update.pagination = { ...initialPaginationState, ...pagination };
          }
          set(update);
        },
        // React 19: Enhanced reset with better state management
        reset: () =>
          set({
            isLoading: false,
            error: null,
            response: null,
            isSuccess: false,
            pagination: initialPaginationState,
            filters: initialFilters,
            sortBy: "createdAt",
            sortOrder: "DESC",
            search: "",
            _relations: "",
            _select: "",
            _countable: "",
          }),
      }),
      {
        name: "list-handler-store",
        enabled: config.environment === "development",
      }
    )
  );
};

export type TListHandlerStore<
  TResponse,
  TUserListData,
  TExtra extends Record<string, any>
> = ReturnType<typeof useListHandlerStore<TResponse, TUserListData, TExtra>>;
