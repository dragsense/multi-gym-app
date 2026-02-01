// React
import type { ReactNode } from "react";
import { useId, useMemo } from "react";

// Custom UI Components
import {
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface IDialogProps {
  title: string | ReactNode;
  description?: string;
  footerContent?: ReactNode;
  children: ReactNode;
}

export const AppDialog = ({
  title,
  description,
  footerContent,
  children,
}: IDialogProps) => {
  // React 19: Essential IDs
  const componentId = useId();

  // React 19: Memoized title for better performance
  const memoizedTitle = useMemo(() => {
    return typeof title === "string" ? (
      <DialogTitle>{title}</DialogTitle>
    ) : (
      title
    );
  }, [title]);

  return (
    <div data-component-id={componentId} className="space-y-6">
      <DialogHeader>
        {memoizedTitle}
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      {children}

      {footerContent && (
        <DialogFooter className="mt-6">{footerContent}</DialogFooter>
      )}
    </div>
  );
};
