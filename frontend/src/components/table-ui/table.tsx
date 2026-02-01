// React
import { type ReactNode } from "react";
import { useId, useMemo, useTransition, useDeferredValue } from "react";

// External Libraries
import { Loader2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

// Custom Hooks
import { useTable } from "@/hooks/use-table";

// UI Components
import { AppTable } from "@/components/layout-ui/app-table";

// Types

// Utils
import { cn } from "@/lib/utils";

// Stores
import type { TListHandlerStore } from "@/stores";
import { useShallow } from "zustand/shallow";


interface ITableProps<TData, TListData = any, TExtra extends Record<string, unknown> = any> {
  MainClassName?: string;
  error?: string | null;
  columns: ColumnDef<TData>[];
  listStore: TListHandlerStore<TData, TListData, TExtra>;
  onRowClick?: (row: TData) => void;
  pageSizeOptions?: number[];
  rowClassName?: (row: TData, index: number) => string;
  colClassName?: string;
  showPagination?: boolean;
  footerContent?: ReactNode;
  emptyMessage?: string;
  className?: string;
  showHeader?: boolean;
}

export function Table<TData, TListData = any, TExtra extends Record<string, unknown> = any>({
  columns,
  MainClassName,
  listStore,
  pageSizeOptions,
  onRowClick,
  showPagination = true,
  footerContent,
  emptyMessage = "No results found.",
  className = "",
  rowClassName,
  colClassName = "",
  showHeader = true,
}: ITableProps<TData, TListData, TExtra>) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const {
    response: data,
    isLoading: loading,
    error,
    pagination,
    setPagination,
  } = listStore(useShallow((state) => ({
    response: state.response,
    isLoading: state.isLoading,
    error: state.error,
    pagination: state.pagination,
    setPagination: state.setPagination,
    filteredFields: state.filteredFields,
  }))
  );

  // React 19: Deferred data for better performance
  const deferredData = useDeferredValue(data);

  // React 19: Smooth pagination changes
  const onPageChange = (page: number) => {
    startTransition(() => {
      setPagination({ page });
    });
  };

  const onLimitChange = (limit: number) => {
    startTransition(() => {
      setPagination({ limit });
    });
  };


  // React 19: Memoized table data for better performance
  const memoizedTableData = useMemo(() => deferredData || [], [deferredData]);

  const { table } = useTable<TData>({
    columns,
    data: memoizedTableData,
    defaultPageSize: pagination.limit || 10,
  });

  // React 19: Memoized loading state for better performance
  const memoizedLoadingState = useMemo(() => (
    <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ), []);

  return (
    <div className={cn(MainClassName)} data-component-id={componentId}>
      {loading && memoizedLoadingState}

      <AppTable
        onRowClick={onRowClick}
        emptyMessage={emptyMessage || "No results found."}
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        rowClassName={rowClassName}
        colClassName={colClassName}
        showPagination={showPagination}
        showHeader={showHeader}
        pageSizeOptions={pageSizeOptions}
        className={className}
        columns={columns}
        table={table}
        renderFooter={(table) => (
          <>
            {footerContent && footerContent}
            {error && (
              <p className="text-sm font-medium text-red-500 my-2">
                {error.message}
              </p>
            )}
          </>
        )}
      />
    </div>
  );
}
