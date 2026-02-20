// React
import type { ReactNode } from "react";
import { useId, useMemo, useTransition } from "react";
import { useShallow } from "zustand/shallow";

// External Libraries
import { Loader2 } from "lucide-react";

// Utils
import { cn } from "@/lib/utils";

// Stores
import type { TFormHandlerStore } from "@/stores";

interface IFormProps<
  TFormData,
  TResponse,
  TExtraProps extends Record<string, any> = {}
> {
  className?: string;
  children: ReactNode;
  formStore: TFormHandlerStore<TFormData, TResponse, TExtraProps>;
  /** Optional id for the underlying form element (e.g. for external submit buttons) */
  formId?: string;
}

export function Form<
  TFormData,
  TResponse,
  TExtraProps extends Record<string, any> = {}
>({
  className,
  children,
  formStore,
  formId,
}: IFormProps<TFormData, TResponse, TExtraProps>) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const { isSubmitting, error, onSubmit } = formStore(
    useShallow((state) => ({
      onSubmit: state.onSubmit,
      isSubmitting: state.isSubmitting,
      error: state.error,
    }))
  );

  // React 19: Memoized loading state for better performance
  const memoizedLoadingState = useMemo(
    () => (
      <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
    []
  );

  // React 19: Memoized error message for better performance
  const memoizedErrorMessage = useMemo(() => {
    if (!error) return null;
    return (
      <p className="text-sm font-medium text-red-500 my-2">{error.message}</p>
    );
  }, [error]);

  // React 19: Smooth form submission
  const handleSubmit = (e: React.FormEvent) => {
    startTransition(() => {
      onSubmit(e);
    });
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      data-component-id={componentId}
    >
      <div className={cn("relative", className)}>
        {isSubmitting && memoizedLoadingState}
        {children}
        {memoizedErrorMessage}
      </div>
    </form>
  );
}
