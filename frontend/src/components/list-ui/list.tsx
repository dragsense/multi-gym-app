// React
import { type ReactNode } from "react";
import { useId, useMemo, useTransition, useDeferredValue } from "react";

// External Libraries
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom UI Components
import { Pagination } from "@/components/shared-ui/pagination";

// Utils
import { cn } from "@/lib/utils";

// Stores
import type { TListHandlerStore } from "@/stores";
import { useShallow } from "zustand/shallow";

interface IListProps<TData, TListData = any, TExtra extends Record<string, unknown> = any> {
  className?: string;
  limit?: number;
  children?: ReactNode;
  renderItem: (item: TData, index: number) => React.ReactNode;
  emptyMessage?: string;
  listStore: TListHandlerStore<TData, TListData, TExtra>;
  // Pagination props
  showPagination?: boolean;
  showLoadMore?: boolean;
  pageSizeOptions?: number[];
  rowClassName?: string;
  colClassName?: string;
  getItemKey?: (item: any, index: number) => string | number;
}

export function List<TData, TListData = any, TExtra extends Record<string, unknown> = any>({

  renderItem,
  className,
  emptyMessage = "No results found.",
  listStore,
  limit,
  // Pagination props
  showPagination = true,
  showLoadMore = false,
  pageSizeOptions = [5, 10, 20, 30, 40, 50],

  rowClassName = "flex gap-3 flex-wrap",
  colClassName = "",
  getItemKey = (item: any, index: number) => index,
}: IListProps<TData, TListData, TExtra>) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const {
    response: data,
    isLoading: loading,
    error,
    pagination,
    setPagination,
  } = listStore(
    useShallow((state) => ({
      response: state.response,
      isLoading: state.isLoading,
      error: state.error,
      pagination: state.pagination,
      setPagination: state.setPagination,
    }))
  );


  // React 19: Smooth pagination changes
  const handlePageChange = (page: number) => {
    startTransition(() => {
      setPagination({ page });
    });
  };

  const handleLimitChange = (limit: number) => {
    startTransition(() => {
      setPagination({ limit });
    });
  };

  // React 19: Memoized display data for better performance
  const memoizedDisplayData = useMemo(() => {
    console.log("memoizedDisplayData", data);
    let displayData = data || [];
    if (limit) {
      displayData = displayData.slice(0, limit);
    }
    return displayData;
  }, [data, limit]);

  // React 19: Memoized loading state for better performance
  const memoizedLoadingState = useMemo(() => (
    <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ), []);

  return (
    <div className={cn("relative flex flex-col gap-6", className)} data-component-id={componentId}>
      {loading && memoizedLoadingState}
      <div className={cn("space-y-3", colClassName)}>
        <div className={rowClassName}>
          {memoizedDisplayData.length > 0 ? (
            memoizedDisplayData.map((item, index) => (
              <div key={getItemKey(item, index)} className="flex-1">
                {renderItem(item, index)}
                
              </div>
            ))
          ) : (<div className="w-full text-sm text-muted-foreground text-center py-8">
            {emptyMessage}
          </div>)}
        </div>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-500 my-2">{error.message}</p>
      )}

      {/* Load More Button */}
      {showLoadMore && pagination?.hasNextPage && !limit && memoizedDisplayData && memoizedDisplayData.length > 0 && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange((pagination.page || 1) + 1)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      {/* Pagination */}
      {(showPagination && !limit && memoizedDisplayData && memoizedDisplayData.length > 0) && (
        <div className="flex flex-col gap-4 pt-6 border-t">
          <div className="w-full">
            <Pagination
              datalength={memoizedDisplayData.length}
              pageSizeOptions={pageSizeOptions}
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
        </div>
      )}

    </div>
  );
}