// React & Hooks
import React, { useEffect, useTransition, useDeferredValue } from "react";

// Types
import { type IActionComponent } from "@/@types/handler-types";
import { type TQueryParams } from "@shared/types/api/param.type";

// Error Components
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/shared-ui/error-fallback";

// UI Components
import { ActionComponentHandler } from "./action-handler";

// Stores
import {
  deregisterStore,
  registerStore,
  type TSingleHandlerStore,
  useRegisteredStore,
  useSingleHandlerStore,
} from "@/stores";

// Hooks
import { useApiQuery } from "@/hooks/use-api-query";
import { pickKeys } from "@/utils";
import { useShallow } from "zustand/shallow";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export interface ISingleHandlerProps<
  IData,
  TExtraProps extends Record<string, any> = {}
> {
  storeKey: string;
  listStoreKey?: string;
  enabled?: boolean;
  name?: string;
  initialParams?: TQueryParams;
  queryFn: (id: string, queryParams: TQueryParams) => Promise<IData>;

  SingleComponent: React.ComponentType<{
    storeKey: string;
    store: TSingleHandlerStore<IData, TExtraProps>;
  }>;
  actionComponents?: IActionComponent<
    TSingleHandlerStore<IData, TExtraProps>
  >[];
  singleProps?: TExtraProps;
}

export function SingleHandler<
  IData,
  TExtraProps extends Record<string, any> = {}
>({
  name = "Item",
  initialParams = {},
  enabled = false,
  queryFn,

  storeKey,
  SingleComponent,
  singleProps,
  actionComponents = [],
}: ISingleHandlerProps<IData, TExtraProps>) {
  // React 19: Enhanced transitions for better UX
  const [, startTransition] = useTransition();

  const singleStoreKey = storeKey + "-single";

  let store =
    useRegisteredStore<TSingleHandlerStore<IData, TExtraProps>>(singleStoreKey);
  if (!store) {
    store = useSingleHandlerStore<IData, TExtraProps>(
      name,
      initialParams,
      singleProps || ({} as TExtraProps)
    );
    registerStore<TSingleHandlerStore<IData, TExtraProps>>(
      singleStoreKey,
      store
    );
  }

  useEffect(() => {
    registerStore(singleStoreKey, store);
    return () => deregisterStore(singleStoreKey);
  }, [singleStoreKey, store]);

  const payload = store((state) => state.payload);
  const params = store((state) => state.params);
  const filteredExtra = store(
    useShallow((state) =>
      pickKeys(
        state.extra,
        Object.keys(initialParams) as (keyof typeof initialParams)[]
      )
    )
  );

  const deferredFilteredExtra = useDeferredValue(filteredExtra);

  const queryKey = [
    singleStoreKey,
    JSON.stringify(payload),
    JSON.stringify(deferredFilteredExtra),
  ];

  // React 19: Enhanced query with transitions
  useApiQuery<IData>(
    queryKey,
    async (params) => {
      return new Promise((resolve, reject) => {
        startTransition(async () => {
          store.setState({ isLoading: true });
          try {
            const response = await queryFn(payload, {
              ...params,
              ...params,
              ...deferredFilteredExtra,
            });
            store.setState({
              isLoading: false,
              error: null,
              response: response,
              isSuccess: true,
            });
            resolve(response);
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error));
            store.setState({
              response: null,
              isLoading: false,
              error: err,
              isSuccess: false,
            });
            reject(err);
          }
        });
      });
    },
    {
      ...params,
      ...deferredFilteredExtra,
    },
    {
      enabled: !!payload || enabled,
    }
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <>
        {SingleComponent && (
          <SingleComponent storeKey={storeKey} store={store} />
        )}

        <ActionComponentHandler<IData, TExtraProps>
          actionComponents={actionComponents}
          storeKey={storeKey}
          store={store}
        />
      </>
    </ErrorBoundary>
  );
}
