import { useState, useTransition, useId } from "react";

export function useConfirm() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const [state, setState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
    variant?: "default" | "destructive";
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: null,
    onCancel: null,
  });

  const confirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    onCancel: () => void,
    variant?: "default" | "destructive"
  ) => {
    setState({
      isOpen: true,
      title,
      description,
      onConfirm,
      onCancel,
      variant,
    });
  };

  const onConfirm = () => {
    startTransition(() => {
      state.onConfirm?.();
      setState((prev) => ({ ...prev, isOpen: false }));
    });
  };

  const onCancel = () => {
    startTransition(() => {
      state.onCancel?.();
      setState((prev) => ({ ...prev, isOpen: false }));
    });
  };

  return {
    confirm,
    componentId,
    dialogProps: {
      open: state.isOpen,
      onOpenChange: (open: boolean) => open || onCancel(),
      title: state.title,
      description: state.description,
      onConfirm,
      onCancel,
      variant: state.variant,
    },
  };
}
