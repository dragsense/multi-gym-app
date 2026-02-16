import React, { useMemo, useId, useTransition, useDeferredValue, useCallback } from "react";

// Types
import { type TListHandlerComponentProps, type IListActionComponent } from "@/@types/handler-types";
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";



interface ListActionComponentRendererProps<
  IData,
  TActionProps extends Record<string, any> = {},
  TSingleData = never,
  TSingleExtraProps extends Record<string, any> = {}
> {
  actionComponents?: IListActionComponent<TListHandlerStore<IData, TActionProps>, TSingleHandlerStore<TSingleData, TSingleExtraProps>>[];
  storeKey: string;
  store: TListHandlerStore<IData, TActionProps>;
  singleStore?: TSingleHandlerStore<TSingleData, TSingleExtraProps>;
}

// React 19: Enhanced action components mapping with deferred processing
const useActionComponentsMap = <IData, TActionProps extends Record<string, any> = {}, TSingleData = never, TSingleExtraProps extends Record<string, any> = {}>(
  components: IListActionComponent<TListHandlerStore<IData, TActionProps>, TSingleHandlerStore<TSingleData, TSingleExtraProps>>[] | undefined
) => {
  return useMemo(() => {
    if (!components) return null;

    return components.reduce((acc, extra) => {
      acc[extra.action] = extra.comp;
      return acc;
    }, {} as Record<string, React.ComponentType<TListHandlerComponentProps<TListHandlerStore<IData, TActionProps>, TSingleHandlerStore<TSingleData, TSingleExtraProps>>>>);
  }, [components]);
};

export const ListActionComponentHandler = <
  IData,
  TActionProps extends Record<string, any> = {},
  TSingleData = never,
  TSingleExtraProps extends Record<string, any> = {}
>({
  actionComponents,
  storeKey,
  store,
  singleStore,
}: ListActionComponentRendererProps<IData, TActionProps, TSingleData, TSingleExtraProps>) => {
  // React 19: Enhanced IDs and transitions for list actions
  const actionId = useId();
  const componentId = useId();
  const [isPending, startTransition] = useTransition();

  // React 19: Deferred action components for better performance
  const actionComponentsMap = useActionComponentsMap<IData, TActionProps, TSingleData, TSingleExtraProps>(actionComponents);
  const deferredActionComponents = useDeferredValue(actionComponentsMap);


  if (!store) {
    return <div>List store "{storeKey}" not found. Did you forget to register it?</div>;
  }

  const action = store((state) => state.action);

  // React 19: Enhanced component rendering with deferred values and transitions
  return useMemo(() => {
    if (!action || !deferredActionComponents) return null;

    const ActionComp = deferredActionComponents[action];
    if (!ActionComp) return null;

    return (
      <div
        data-pending={isPending}
        data-action={action}
        data-store-key={storeKey}
        data-component-id={componentId}
        data-has-single-store={!!singleStore}
      >
        <ActionComp
          key={`action-comp-${action}-${storeKey}-${actionId}`}
          storeKey={storeKey}
          store={store}
          singleStore={singleStore}
        />
      </div>
    );
  }, [action, deferredActionComponents, storeKey, store, singleStore, actionId, componentId, isPending]);
};