// React & Hooks
import { useState, useDeferredValue, useMemo } from "react";

// External Libraries
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
} from "@tanstack/react-table";


interface UseTableOptions<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  defaultPageSize?: number;
}

export function useTable<TData>({
  columns,
  data,
  defaultPageSize = 10,
}: UseTableOptions<TData>) {
  // React 19: Enhanced table state management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  // React 19: Deferred data for better performance with large datasets
  const deferredData = useDeferredValue(data);
  
  // React 19: Memoized columns for better performance
  const memoizedColumns = useMemo(() => columns, [columns]);
  
  const table = useReactTable({
    data: deferredData,
    columns: memoizedColumns,
    manualPagination: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination, 
  });

  return {
    table,
  };
}