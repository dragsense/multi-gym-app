// React
import { useMemo, useState, useCallback } from "react";

export interface IUseFrontendPaginationReturn<T> {
  paginatedData: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    lastPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

/**
 * Reusable hook for frontend pagination
 * Takes an array of data and paginates it on the client side
 * 
 * @param data - The array of data to paginate
 * @param initialLimit - Initial items per page (default: 5)
 * @returns Paginated data and pagination controls
 */
export function useFrontendPagination<T>(
  data: T[] | undefined,
  initialLimit: number = 5
): IUseFrontendPaginationReturn<T> {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  // Frontend pagination
  const paginatedData = useMemo(() => {
    if (!data) return [];
    const start = (page - 1) * limit;
    const end = start + limit;
    return data.slice(start, end);
  }, [data, page, limit]);

  const total = data?.length || 0;
  const lastPage = Math.ceil(total / limit);
  const hasNextPage = page < lastPage;
  const hasPrevPage = page > 1;

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return {
    paginatedData,
    pagination: {
      page,
      limit,
      total,
      lastPage,
      hasNextPage,
      hasPrevPage,
    },
    setPage: handlePageChange,
    setLimit: handleLimitChange,
  };
}

