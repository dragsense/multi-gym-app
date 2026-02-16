// React
import { useId, useMemo } from "react";

// External Libraries
import {
  type ColumnDef,
  flexRender,
  type Table as TanstackTable,
} from "@tanstack/react-table";

// UI Components
import {
  Table as ShadcnTable,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@/components/ui/table";

// Custom UI Components
import { Pagination } from "@/components/shared-ui/pagination";
import { type IListPaginationState } from "@shared/interfaces/api/response.interface";

export interface ITableBaseProps<TData> {
  pageSizeOptions?: number[];
  pagination?: IListPaginationState;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData, index: number) => string;
  colClassName?: string;
  showPagination?: boolean;
  renderFooter?: (table: TanstackTable<TData>) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
  showHeader?: boolean;
}

export interface DataTableProps<T> extends ITableBaseProps<T> {
  table: TanstackTable<T>;
  columns: ColumnDef<T>[];
}

export function AppTable<TData>({
  table,
  columns,
  pageSizeOptions,
  pagination,
  onPageChange,
  onLimitChange,
  onRowClick,
  showPagination = true,
  renderFooter,
  emptyMessage = "No results found.",
  className = "",
  rowClassName,
  colClassName = "",
  showHeader = true,
}: DataTableProps<TData>) {
  // React 19: Essential IDs
  const componentId = useId();

  // React 19: Memoized empty message for better performance
  const memoizedEmptyMessage = useMemo(() => emptyMessage, [emptyMessage]);

  return (
    <ShadcnTable className={className} data-component-id={componentId}>
      {showHeader && (
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
      )}
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row, index) => (
            <TableRow
              key={row.id + "_" + index}
              data-state={row.getIsSelected() && "selected"}
              className={rowClassName?.(row.original, index)}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell key={cell.id + "_" + index} className={colClassName}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {memoizedEmptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>

      {(renderFooter ||
        (showPagination && pagination && onPageChange && onLimitChange)) && (
          <TableFooter>
            {renderFooter && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  {renderFooter(table)}
                </TableCell>
              </TableRow>
            )}

            {showPagination && pagination && onPageChange && onLimitChange && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Pagination
                    datalength={table.getRowModel().rows?.length || 0}
                    pageSizeOptions={pageSizeOptions}
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onLimitChange={onLimitChange}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableFooter>
        )}
    </ShadcnTable>
  );
}
