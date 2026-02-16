// Types
import type { StoreApi } from "zustand";
import { type IListPaginationState } from "@shared/interfaces/api/response.interface";
import { type TFieldConfigObject } from "../form/field-config.type";

export interface IListQueryState {
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  search: string;
  _relations: string;
  _select: string;
  _countable: string;
}

export interface IListHandlerBaseState<TResponse> {
  response: TResponse[] | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  pagination: IListPaginationState;
}

export interface IListHandlerState<TResponse, TUserListData = any, TExtra extends Record<string, any> = {}> extends IListHandlerBaseState<TResponse>, IListQueryState {
  
  extra: TExtra;
  payload: any;
  action: string;
  filteredFields: TFieldConfigObject<TUserListData>;
  
  setExtra: <K extends keyof TExtra>(key: K, value: TExtra[K]) => void;
  resetExtra: () => void;
  setFilteredFields: (fields: TFieldConfigObject<TUserListData>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSort: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  setSearch: (search: string) => void;
  setRelations: (relations: string) => void;
  setSelect: (select: string) => void;
  setCountable: (countable: string) => void;
  setPagination: (pagination: Partial<IListPaginationState>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  setResponse: (response: TResponse[]) => void;
  syncWithQuery: (queryState: IListHandlerBaseState<TResponse>) => void;
  setAction: (action: string, payload?: any) => void;
  reset: () => void;
}

export type IListStoreApi<TResponse, TUserListData, TExtra extends Record<string, any>> = StoreApi<IListHandlerState<TResponse, TUserListData, TExtra>>;