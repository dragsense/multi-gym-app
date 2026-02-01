import { type IMessageResponse } from "@shared/interfaces";

export type TItemActionProps = {
  itemName: string;
  action: string;
  type?: string;
  id: string;
};

export type TListHandlerComponentProps<T, S = unknown> = {
  storeKey: string;
  store: T;
  singleStore?: S;
};

export interface IListActionComponent<T, S = unknown> {
  action: string;
  comp: React.ComponentType<TListHandlerComponentProps<T, S>>;
}

export type THandlerComponentProps<T> = {
  storeKey: string;
  store: T;
};

export interface IActionComponent<T> {
  action: string;
  comp: React.ComponentType<THandlerComponentProps<T>>;
}

export interface MutationFns<TFormData, TResponse> {
  deleteFn?: (id: string) => Promise<void>;
  updateFn?: (id: string) => (item: TFormData) => Promise<IMessageResponse>;
  createFn?: (
    item: Omit<TFormData, "id" | "createdAt" | "updatedAt">
  ) => Promise<TResponse>;
  onSuccess?: (
    action: string
  ) => (response: TResponse | IMessageResponse | void) => void;
}

export * from "./form.type";
export * from "./list.type";
export * from "./single.type";
