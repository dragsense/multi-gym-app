import React, { useMemo, useId, useDeferredValue } from "react";

// Types
import type { THandlerComponentProps, IActionComponent } from "@/@types/handler-types";
import type { TSingleHandlerStore } from "@/stores";


interface ActionComponentRendererProps<
  TData,
  TListActionProps extends Record<string, any> = {}
> {
  actionComponents?: IActionComponent<TSingleHandlerStore<TData, TListActionProps>>[];
  storeKey: string;
  store: TSingleHandlerStore<TData, TListActionProps>;
}

// React 19: Enhanced action components mapping with deferred processing
const useActionComponentsMap = <TData, TListActionProps extends Record<string, any> = {}>(
  components: IActionComponent<TSingleHandlerStore<TData, TListActionProps>>[] | undefined
) => {
  return React.useMemo(() => {
    if (!components) return null;

    return components.reduce((acc, extra) => {
      acc[extra.action] = extra.comp;
      return acc;
    }, {} as Record<string, React.ComponentType<THandlerComponentProps<TSingleHandlerStore<TData, TListActionProps>>>>);
  }, [components]);
};

export const ActionComponentHandler = <
  IData,
  TListActionProps extends Record<string, any> = {}
>({
  actionComponents,
  storeKey,
  store,
}: ActionComponentRendererProps<IData, TListActionProps>) => {
  // React 19: Enhanced IDs and transitions
  const actionId = useId();
  
  // React 19: Deferred action components for better performance
  const actionComponentsMap = useActionComponentsMap<IData, TListActionProps>(actionComponents);
  const deferredActionComponents = useDeferredValue(actionComponentsMap);
  

  if (!store) {
    return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
  }

  const action = store((state) => state.action);

  // React 19: Enhanced component rendering with deferred values and transitions
  return useMemo(() => {
    if (!action || !deferredActionComponents) return null;

    const ActionComp = deferredActionComponents[action];
    if (!ActionComp) return null;

    return (
      <ActionComp
        key={`action-comp-${action}-${storeKey}-${actionId}`}
        storeKey={storeKey}
        store={store}
      />
    );
  }, [action, deferredActionComponents, storeKey, actionId]);
};
