// React types
import type { ReactNode } from "react";
import { useId, useMemo } from "react";

// UI Components
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


interface CardProps {
  header?: ReactNode;
  loading?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void
}

export function AppCard({
  header,
  loading,
  children,
  footer,
  className,
  onClick

}: CardProps) {
  // React 19: Essential IDs
  const componentId = useId();

  // React 19: Memoized loading state for better performance
  const memoizedLoadingState = useMemo(() => (
    <Skeleton />
  ), []);

  return (
    <Card className={className} onClick={onClick} data-component-id={componentId}>
      {header && <CardHeader>
        {header}
      </CardHeader>}
      <CardContent>
        {loading ? memoizedLoadingState : children}
      </CardContent>
      {footer && <CardFooter>
        {footer}
      </CardFooter>}
    </Card>
  );
}
