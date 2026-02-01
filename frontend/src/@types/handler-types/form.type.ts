// Types
import type { StoreApi } from "zustand";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";

export type MutationFn<TFormData, TResponse> = (data: TFormData) => Promise<TResponse | IMessageResponse | void>;


export interface IFormHandlerBaseState<TResponse> {
  response: TResponse | IMessageResponse | void | null;
  isSubmitting: boolean;
  error: Error | null;
  isSuccess: boolean;
}



export interface IFormHandlerState<TFormData, TResponse, TExtra extends Record<string, any> = {}> extends IFormHandlerBaseState<TResponse> {
  values: TFormData;
  extra: TExtra;
  fields: TFieldConfigObject<TFormData>;
  isEditing: boolean;

  setIsEditing: (isEditing: boolean) => void;
  setFields: (fields: TFieldConfigObject<TFormData>) => void;
  setExtra: <K extends keyof TExtra>(key: K, value: TExtra[K]) => void;
  resetExtra: () => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setError: (error: Error | null) => void;
  onSubmit: (e: React.BaseSyntheticEvent | undefined) => void;
  setOnSubmit: (submitFn: (e: React.BaseSyntheticEvent | undefined) => void) => void;
  setValues: (values: TFormData) => void;
  syncWithMutation: (state: IFormHandlerBaseState<TResponse>) => void;
  reset: () => void;

  
}

export type IFormStoreApi<TFormData, TResponse, TExtra extends Record<string, any>> = StoreApi<IFormHandlerState<TFormData, TResponse, TExtra>>;