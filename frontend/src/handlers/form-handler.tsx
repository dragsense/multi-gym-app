// React & Hooks
import React, {
  useEffect,
  useMemo,
  useActionState,
  useTransition,
  useDeferredValue,
  useSyncExternalStore,
  useInsertionEffect,
  useCallback,
} from "react";

// External Libraries
import { useForm } from "react-hook-form";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// UI Components
import { Form } from "@/components/ui/form";

// Error Components
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/shared-ui/error-fallback";

// Stores
import {
  deregisterStore,
  registerStore,
  useFormHandlerStore,
  useRegisteredStore,
  type TFormHandlerStore,
} from "@/stores";
import { toast } from "sonner";
import { type TQueryParams } from "@shared/types/api/param.type";
import { useShallow } from "zustand/shallow";
import { getDirtyData, pickKeys } from "@/utils";
import { classValidatorResolver } from "@/lib/validation";
import { dtoToFields } from "@/lib/fields/dto-to-feilds";
import { type ClassConstructor } from "class-transformer";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";

export interface IFormHandlerProps<
  TFormData,
  TResponse,
  TExtraProps extends Record<string, any> = {}
> {
  initialParams?: TQueryParams;
  mutationFn: (
    data: TFormData,
    params?: TQueryParams
  ) => Promise<TResponse | IMessageResponse | void>;
  FormComponent: React.ComponentType<{
    storeKey: string;
    store: TFormHandlerStore<TFormData, TResponse, TExtraProps>;
  }>;
  isEditing?: boolean;
  formProps?: TExtraProps;
  onSuccess?: (response: TResponse | IMessageResponse | void) => void;
  onError?: (error: Error) => void;
  initialValues: Readonly<TFormData>;
  validationMode?: EVALIDATION_MODES;
  dto: ClassConstructor<object>;
  storeKey: string;
}

export function FormHandler<
  TFormData,
  TResponse = any,
  TExtraProps extends Record<string, any> = {}
>({
  initialParams = {},
  mutationFn,
  FormComponent,
  formProps,
  isEditing = false,
  onSuccess,
  onError,
  initialValues,
  validationMode = EVALIDATION_MODES.OnChange,
  dto,
  storeKey,
}: IFormHandlerProps<TFormData, TResponse, TExtraProps>) {
  const formStoreKey = storeKey + "-form";

  // React 19: Enhanced field processing with deferred values
  const fields = useMemo(() => {
    return dtoToFields(dto);
  }, [dto]);

  // React 19: Deferred field processing
  useDeferredValue(fields);

  let store =
    useRegisteredStore<TFormHandlerStore<TFormData, TResponse, TExtraProps>>(
      formStoreKey
    );
  if (!store) {
    store = useFormHandlerStore<TFormData, TResponse, TExtraProps>(
      initialValues,
      formProps || ({} as TExtraProps),
      isEditing,
      fields as TFieldConfigObject<TFormData>
    );
    registerStore<TFormHandlerStore<TFormData, TResponse, TExtraProps>>(
      formStoreKey,
      store
    );
  }

  const filteredExtra = store(
    useShallow((state) =>
      pickKeys(
        state.extra,
        Object.keys(initialParams) as (keyof typeof initialParams)[]
      )
    )
  );

  // React 19: Enhanced transitions for better UX
  const [, startTransition] = useTransition();

  // React 19: useActionState for form actions with transitions
  const [, ,] = useActionState(
    async (_prevState: any, formData: any) => {
      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const isEditing = store.getState().isEditing;
            let processedData = formData;

            if (isEditing) {
              processedData = getDirtyData(formData, initialValues) as any;
            }

            const response = await mutationFn(processedData, {
              ...initialParams,
              filteredExtra,
            });

            store.getState().syncWithMutation({
              isSubmitting: false,
              error: null,
              isSuccess: true,
              response,
            });

            // toast.success("Form submitted successfully!");
            onSuccess?.(response);

            resolve({ success: true, data: response, error: null });
          } catch (error: any) {
            store.getState().syncWithMutation({
              isSubmitting: false,
              error,
              isSuccess: false,
              response: null,
            });

            toast.error(error.message || "Failed to submit form");
            onError?.(error);

            resolve({ success: false, data: null, error: error.message });
          }
        });
      });
    },
    { success: false, data: null, error: null }
  );

  const form = useForm({
    resolver: classValidatorResolver(dto),
    defaultValues: async () => initialValues,
    mode: validationMode,
  });

  // React 19: Enhanced form submission with proper transitions
  const handleSubmit = useCallback(
    async (formData: any) => {
      const isEditing = store.getState().isEditing;

      if (isEditing) {
        formData = getDirtyData(formData, initialValues) as TFormData;
      }
      // Use transition for better UX
      startTransition(async () => {
        try {
          store.getState().syncWithMutation({
            isSubmitting: true,
            error: null,
            isSuccess: false,
            response: null,
          });

          const response = await mutationFn(formData, {
            ...initialParams,
            filteredExtra,
          });

          store.getState().syncWithMutation({
            isSubmitting: false,
            error: null,
            isSuccess: true,
            response,
          });

          //toast.success("Form submitted successfully!");
          onSuccess?.(response);
        } catch (error: any) {
          store.getState().syncWithMutation({
            isSubmitting: false,
            error,
            isSuccess: false,
            response: null,
          });

          toast.error(error.message || "Failed to submit form");
          onError?.(error);
        }
      });
    },
    [
      store,
      initialValues,
      startTransition,
      mutationFn,
      initialParams,
      filteredExtra,
      onSuccess,
      onError,
    ]
  );

  useEffect(() => {
    registerStore(formStoreKey, store);
    store.getState().setOnSubmit(form.handleSubmit(handleSubmit));
    return () => {
      deregisterStore(formStoreKey);
      store.getState().reset();
    };
  }, [formStoreKey]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Form {...form}>
        <FormComponent storeKey={storeKey} store={store} />
      </Form>
    </ErrorBoundary>
  );
}
