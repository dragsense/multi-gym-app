// React & Hooks
import React, {
  useEffect,
  useMemo,
  useOptimistic,
  useTransition,
  useDeferredValue,
  useId,
  useCallback,
  useSyncExternalStore,
  useInsertionEffect,
} from "react";

// Types
import { type IPaginatedResponse } from "@shared/interfaces/api/response.interface";
import { type IListQueryParams } from "@shared/interfaces/api/param.interface";

// Custom Hooks
import { useApiPaginatedQuery } from "@/hooks/use-api-paginated-query";

// Error Components
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/shared-ui/error-fallback";

// Stores
import {
  registerStore,
  deregisterStore,
  type TListHandlerStore,
  useListHandlerStore,
  useRegisteredStore,
  type TSingleHandlerStore,
} from "@/stores";
import { useShallow } from "zustand/shallow";
import { pickKeys } from "@/utils";
import { ListActionComponentHandler } from "./list-action-handler";
import { type IListActionComponent } from "@/@types/handler-types";
import { type ClassConstructor } from "class-transformer";
import { dtoToFields } from "@/lib/fields/dto-to-feilds";
import { type TFieldConfigObject } from "@/@types/form/field-config.type";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import type { TQueryParams } from "@shared/types";
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { useI18n } from "@/hooks/use-i18n";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";

interface IListHandlerProps<
  TData,
  TListData,
  TExtraProps extends Record<string, any> = {},
  TSingleData = never,
  TSingleExtraProps extends Record<string, any> = {}
> {
  storeKey: string;
  name?: string;

  queryFn: (params: IListQueryParams) => Promise<IPaginatedResponse<TData>>;
  deleteFn?: (id: string | TQueryParams) => Promise<void>;
  onDeleteSuccess?: (store: TListHandlerStore<TData, TListData, TExtraProps>) => void;
  ListComponent: React.ComponentType<{
    storeKey: string;
    store: TListHandlerStore<TData, TListData, TExtraProps>;
    singleStore?: TSingleHandlerStore<TSingleData, TSingleExtraProps>;
  }>;
  listProps?: TExtraProps;
  initialParams?: IListQueryParams;
  actionComponents?: IListActionComponent<
    TListHandlerStore<TData, TListData, TExtraProps>,
    TSingleHandlerStore<TSingleData, TSingleExtraProps>
  >[];
  dto?: ClassConstructor<object>;
}

export function ListHandler<
  TData,
  TListData,
  TExtraProps extends Record<string, any> = {},
  TSingleData = never,
  TSingleExtraProps extends Record<string, any> = {}
>({
  name = "Item",
  queryFn,
  deleteFn = () => Promise.resolve(),
  onDeleteSuccess,
  ListComponent,
  initialParams = {},
  listProps = {} as TExtraProps,
  storeKey,
  actionComponents = [],
  dto,
}: IListHandlerProps<
  TData,
  TListData,
  TExtraProps,
  TSingleData,
  TSingleExtraProps
>) {
  const listStoreKey = storeKey + "-list";
  const singelStoreKey = storeKey + "-single";

  // React 19: Unique ID for list
  const [, startTransition] = useTransition();

  const componentId = useId();

  const singleStore =
    useRegisteredStore<TSingleHandlerStore<TSingleData, TSingleExtraProps>>(
      singelStoreKey
    );

  // React 19: Enhanced field processing with deferred values
  const filteredFields = useMemo(() => {
    if (!dto) return {};
    return dtoToFields(dto);
  }, [dto]);

  const defaultFormValues = useMemo(() => {
    const defaults = Object.keys(filteredFields).reduce((acc, key) => {
      if (Array.isArray(filteredFields[key])) {
        acc[key] = [];
      } else {
        if (typeof filteredFields[key] === "boolean") {
          acc[key] = false;
        } else acc[key] = "";
      }
      return acc;
    }, {} as any);

    return { ...defaults, ...(initialParams.filters || {}) };
  }, [filteredFields, initialParams.filters]);

  let store =
    useRegisteredStore<TListHandlerStore<TData, TListData, TExtraProps>>(
      listStoreKey
    );
  if (!store) {
    store = useListHandlerStore<TData, TListData, TExtraProps>(
      initialParams.filters || {},
      listProps,
      filteredFields as TFieldConfigObject<TListData>
    );
    registerStore<TListHandlerStore<TData, TListData, TExtraProps>>(
      listStoreKey,
      store
    );
  }

  useEffect(() => {
    registerStore(listStoreKey, store);
    return () => deregisterStore(listStoreKey);
  }, [listStoreKey, store]);

  const filteredExtra = store(
    useShallow((state) =>
      pickKeys(
        state.extra,
        Object.keys(
          initialParams.filters || {}
        ) as (keyof typeof initialParams)[]
      )
    )
  );

  const queryKey = [listStoreKey, JSON.stringify(filteredExtra)];


  // React 19: Enhanced query with transitions and optimistic updates
  const { setFilters, setLimit, setPage } = useApiPaginatedQuery<TData>(
    queryKey,
    async (params) => {
      return new Promise((resolve, reject) => {
        startTransition(async () => {
          store.setState({ isLoading: true });
          try {
            const response = await queryFn(params);
            store.setState({
              response: response.data,
              pagination: {
                page: response.page,
                limit: response.limit,
                total: response.total,
                lastPage: response.lastPage,
                hasNextPage: response.hasNextPage,
                hasPrevPage: response.hasPrevPage,
              },
              isLoading: false,
              error: null,
              isSuccess: true,
              // Don't update filters here - they're managed by the form
              _relations: params._relations || "",
              _select: params._select || "",
              sortBy: params.sortBy,
              sortOrder: params.sortOrder || "DESC",
              search: params.search || "",
              _countable: params._countable || "",
            });
            resolve(response);
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error));
            store.setState({
              response: null,
              pagination: {
                page: 1,
                limit: initialParams.limit || 10,
                total: 0,
                lastPage: 1,
                hasNextPage: false,
                hasPrevPage: false,
              },
              isLoading: false,
              error: err,
              isSuccess: false,
              // Don't reset filters on error - keep user's input
              sortBy: initialParams.sortBy || "createdAt",
              sortOrder: initialParams.sortOrder || "DESC",
              search: "",
            });
            reject(err);
          }
        });
      });
    },
    {
      page: initialParams.page || 1,
      limit: initialParams.limit || 10,
      sortBy: initialParams.sortBy || "createdAt",
      sortOrder: initialParams.sortOrder || "DESC",
      search: initialParams.search || "",
      _relations: initialParams._relations || "",
      _select: initialParams._select || "",
      _countable: initialParams._countable || "",
      filters: {
        ...(initialParams.filters || {}),
        ...(filteredExtra || {}),
      },
    }
  );

  const form = useForm({
    defaultValues: defaultFormValues,
  });

  const isUpdatingFromStoreRef = React.useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Subscribe to form changes - updates flow from form → query
    const formCallback = form.subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        // Skip if update is from store (form reset/setValue from store)
        if (isUpdatingFromStoreRef.current) {
          return;
        }

        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(() => {
          // Filter out empty string values before updating
          const cleanedValues = Object.keys(values).reduce((acc, key) => {
            if (
              values[key] !== "" &&
              values[key] !== null &&
              values[key] !== undefined
            ) {
              acc[key] = values[key];
            }
            return acc;
          }, {} as any);

          // Update store to keep it in sync
          store.setState({ filters: cleanedValues });
          // Update query to trigger API call
          setFilters(cleanedValues);
        }, 1000);
      },
    });

    // Subscribe to store changes - updates flow from store → form
    const storeUnsub = store.subscribe((state, prevState) => {
      // Update pagination
      if (state.pagination.page !== prevState.pagination.page) {
        setPage(state.pagination.page);
      }
      if (state.pagination.limit !== prevState.pagination.limit) {
        setLimit(state.pagination.limit);
      }

      // Handle filter changes from store (e.g., Clear Filters button)
      if (state.filters !== prevState.filters) {
        const currentValues = form.getValues();
        const hasChanges =
          JSON.stringify(currentValues) !== JSON.stringify(state.filters);

        if (hasChanges) {
          isUpdatingFromStoreRef.current = true;

          // Clear form if filters are empty
          if (Object.keys(state.filters).length === 0) {
            form.reset();
            setFilters({});
          } else {
            // Update form with new filter values
            Object.keys(state.filters).forEach((key) => {
              form.setValue(key as any, state.filters[key]);
            });
            setFilters(state.filters);
          }

          // Reset flag after a tick to allow form to update
          setTimeout(() => {
            isUpdatingFromStoreRef.current = false;
          }, 100);
        }
      }
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      formCallback();
      storeUnsub();
    };
  }, [form, store, setPage, setLimit, setFilters]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} key={componentId}>
      <Form {...form}>
        {ListComponent && (
          <ListComponent
            storeKey={storeKey}
            store={store}
            singleStore={singleStore}
          />
        )}

        <ListActionComponentHandler<
          TData,
          TExtraProps,
          TSingleData,
          TSingleExtraProps
        >
          actionComponents={actionComponents}
          storeKey={storeKey}
          store={store}
          singleStore={singleStore}
        />
      </Form>

      <DeleteDialog
        store={store}
        name={name}
        deleteFn={deleteFn}
        onDeleteSuccess={onDeleteSuccess}
      />
    </ErrorBoundary>
  );
}

const DeleteDialog = ({
  store,
  name,
  deleteFn,
  onDeleteSuccess,
}: {
  store: TListHandlerStore<any, any, any>;
  name: string;
  deleteFn: (id: string | TQueryParams) => Promise<void>;
  onDeleteSuccess: (store: TListHandlerStore<any, any, any>) => void;
}) => {
  const { confirm, dialogProps } = useConfirm();
  const { t } = useI18n();
  const action = store((state) => state.action);
  const [, startTransition] = useTransition();
  const { mutate: deleteItem } = useApiMutation(deleteFn, {
    onMutate: () => {
      startTransition(() => {
        store.getState().setIsLoading(true);
      });
    },
    onSuccess: () => {
      startTransition(() => {
        store.getState().setIsLoading(false);
        store.getState().setError(null);
        onDeleteSuccess?.(store);
        toast.success(buildSentence(t, "deleted", "successfully"));
      });
    },
    onError: (error: Error) => {
      startTransition(() => {
        store.getState().setIsLoading(false);
        store.getState().setError(error);
        toast.error(`Failed to delete ${name}: ${error.message}`);
      });
    },
  });

  useEffect(() => {
    if (store.getState().action === "delete") {
      confirm(
        buildSentence(t, "delete item"),
        buildSentence(t,"are","you","sure","you want to delete this",) + ` ${name}?`,
        () => {
          deleteItem(store.getState().payload);
        },
        () => {
          store.getState().setAction("", null);
        },
        "destructive"
      );
    }
  }, [action]);

  return <ConfirmDialog {...dialogProps} />;
};
