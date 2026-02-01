// External Libraries
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useId, useMemo, useTransition } from 'react';

// Types 
import { type IFormHandlerState } from '@/@types/handler-types/form.type';
import { type TFieldConfigObject } from '@/@types/form/field-config.type';

// Config
import { config } from '@/config';



export const useFormHandlerStore = <TFormData, TResponse, TExtra extends Record<string, any> = {}>(initalValues: TFormData,  initialExtra: TExtra = {} as TExtra, isEditing: boolean = false, fields: TFieldConfigObject<TFormData> = {} as TFieldConfigObject<TFormData>) => {
  return create<IFormHandlerState<TFormData, TResponse, TExtra>>()(
    devtools(
      (set) => ({
      
        isSubmitting: false,
        error: null,
        response: null,
        isSuccess: false,

        values: initalValues,
        extra: initialExtra,
        fields: fields,

        isEditing,
    
        setIsEditing: (isEditing) => set({ isEditing }),
        setError: (error) => set({ error }),
        setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
        setValues: (values) => set({ values }),
        setFields: (fields: TFieldConfigObject<TFormData>) => set({ fields }),
        setOnSubmit: (submitFn) => set({ onSubmit: submitFn }),

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


        syncWithMutation: ({ isSubmitting, error, isSuccess, response }) => {
          set({
            isSubmitting,
            error,
            isSuccess,
            ...(response !== undefined ? { response } : {})
          })
        },
        // React 19: Enhanced reset with better state management
        reset: () => set({
          isSubmitting: false,
          error: null,
          response: null,
          isSuccess: false,
          values: initalValues,
        })
      }),
      {
        name: 'form-handler-store',
        enabled: config.environment === 'development'
      }
    )
  );
};

export type TFormHandlerStore<TFormData, TResponse, TExtra extends Record<string, any> = any> = ReturnType<typeof useFormHandlerStore<TFormData, TResponse, TExtra>>;