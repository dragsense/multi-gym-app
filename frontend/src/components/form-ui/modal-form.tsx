// React
import { type ReactNode } from "react";
import { useId, useMemo, useTransition } from "react";

// UI Components
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Store
import type { TFormHandlerStore } from "@/stores";

// Utility Function
import { cn } from "@/lib/utils";
import { Form } from "./form";

type TDialogWidth =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl"
  | "10xl";

const widthMap: Record<string, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  "6xl": "sm:max-w-6xl",
  "7xl": "sm:max-w-7xl",
  "8xl": "sm:max-w-8xl",
  "9xl": "sm:max-w-9xl",
  "10xl": "sm:max-w-10xl",
};

interface IModalFormProps<
  TFormData,
  TResponse,
  TExtraProps extends Record<string, any> = {}
> {
  className?: string;
  open: boolean;
  onOpenChange: (state: boolean) => void;
  title: string;
  description?: string;
  footerContent?: ReactNode;
  children: ReactNode;
  width?: TDialogWidth;
  formStore: TFormHandlerStore<TFormData, TResponse, TExtraProps>;
}

export function ModalForm<
  TFormData,
  TResponse,
  TExtraProps extends Record<string, any> = {}
>({
  open,
  onOpenChange,
  title,
  description,
  footerContent,
  children,
  width = "lg",
  formStore,
  className,
}: IModalFormProps<TFormData, TResponse, TExtraProps>) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  // React 19: Memoized width class for better performance
  const memoizedWidthClass = useMemo(
    () => widthMap[width] || "sm:max-w-lg",
    [width]
  );

  // React 19: Smooth modal state changes
  const handleOpenChange = (newOpen: boolean) => {
    startTransition(() => {
      onOpenChange(newOpen);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        forceMount
        className={cn(`max-h-[90vh] overflow-y-auto`, memoizedWidthClass)}
        data-component-id={componentId}
      >
        <Form<TFormData, TResponse, TExtraProps>
          formStore={formStore}
          className={className}
        >
          <AppDialog
            title={title}
            description={description}
            footerContent={footerContent}
          >
            {children}
          </AppDialog>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
