// External Libraries
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useId, useMemo } from 'react';

export function AppLoader({ children, className }: { children?: React.ReactNode, className?: string }) {
  // React 19: Essential IDs
  const componentId = useId();

  // React 19: Memoized loader for better performance
  const memoizedLoader = useMemo(() => (
    <Loader2 className="animate-spin" />
  ), []);

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      data-component-id={componentId}
    >
      <div className={cn("absolute top-0 left-0 w-full h-full bg-background/50 z-10 flex flex-col items-center justify-center rounded-lg", className)}>
        {children}
        {memoizedLoader}
      </div>

    </div>
  );
}
