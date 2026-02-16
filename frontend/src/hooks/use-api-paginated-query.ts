import { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { IPaginatedResponse } from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { TQueryParams } from "@shared/types/api/param.type";

type Mode = "paged" | "infinite";

type BaseOptions<T> = Omit<
  UseQueryOptions<IPaginatedResponse<T>, Error>,
  "queryKey" | "queryFn"
>;

type InfiniteOptions<T> = BaseOptions<T> & {
  mode: "infinite";
  reverseOrder?: boolean;
};

type PagedOptions<T> = BaseOptions<T> & {
  mode?: "paged"; // default
};

type Options<T> = InfiniteOptions<T> | PagedOptions<T>;

/** ---- Return Types (discriminated by `mode`) ---- */
type CommonReturn<T> = {
  data: IPaginatedResponse<T> | undefined;
  params: IListQueryParams;
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
  setFilters: (filters: TQueryParams | Record<string, any>) => void;
  resetToFirstPage: () => void;
} & ReturnType<typeof useQuery<IPaginatedResponse<any>, Error>>;

type PagedReturn<T> = CommonReturn<T> & {
  mode: "paged";
  /** Only in paged mode */
  loadNextPage: () => void;
  loadPrevPage: () => void;
  /** Simple pager helper: [1, 2, 3, ...lastPage] */
  pager: number[];
};

type InfiniteReturn<T> = CommonReturn<T> & {
  mode: "infinite";
  /** No paged navigators here */
};

export function useApiPaginatedQuery<T = any>(
  queryKey: string | any[],
  queryFn: (params: IListQueryParams) => Promise<IPaginatedResponse<T>>,
  initialParams: IListQueryParams = { page: 1, limit: 10 },
  options?: Options<T>
): Options<T> extends { mode: "infinite" } ? InfiniteReturn<T> : PagedReturn<T> {
  const mode: Mode = (options?.mode ?? "paged") as Mode;
  const reverseOrder = (options as InfiniteOptions<T> | undefined)?.reverseOrder ?? false;

  const [params, setParams] = useState<IListQueryParams>(initialParams);
  const [accumulated, setAccumulated] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(initialParams.page ?? 1);

  // React 19: Deferred params for better performance
  const deferredParams = useDeferredValue(params);

  const key = useMemo(
    () => [...(Array.isArray(queryKey) ? queryKey : [queryKey]), deferredParams],
    [queryKey, deferredParams]
  );

  const query = useQuery<IPaginatedResponse<T>, Error>({
    queryKey: key,
    queryFn: () => queryFn(deferredParams),
    ...(options as BaseOptions<T>),
  });

  // Accumulate only in infinite mode
  useEffect(() => {
    if (!query.data || mode !== "infinite") return;

    if ((params.page ?? 1) === 1) setAccumulated(query.data.data);
    else {
      setAccumulated((prev) =>
        reverseOrder ? [...query.data!.data, ...prev] : [...prev, ...query.data!.data]
      );
    }
  }, [query.data, params.page, mode, reverseOrder]);

  // --------- Updaters (common) ----------
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    if (mode === "infinite") setAccumulated([]);
    setParams((prev) => ({ ...prev, page }));
  }, [mode]);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
    setParams((prev) => ({ ...prev, page: 1 }));
    setAccumulated([]);
  }, []);

  const setLimit = useCallback((limit: number) => {
    setCurrentPage(1);
    setParams((prev) => ({ ...prev, limit, page: 1 }));
    setAccumulated([]);
  }, []);

  const setFilters = useCallback((filters: TQueryParams | Record<string, any>) => {
    setCurrentPage(1);
    setParams((prev) => ({ ...prev, filters, page: 1 }));
    setAccumulated([]);
  }, []);

  // --------- Derived data ----------
  const mergedData: IPaginatedResponse<T> | undefined = useMemo(() => {
    if (!query.data) return query.data;
    if (mode === "infinite") {
      return { ...query.data, data: accumulated };
    }
    return query.data;
  }, [query.data, mode, accumulated]);

  const pagination = useMemo(() => ({
    page: mode === "infinite" ? currentPage : (params.page ?? 1),
    limit: params.limit ?? 10,
    total: query.data?.total ?? 0,
    lastPage: query.data?.lastPage ?? 1,
    hasNextPage: query.data?.hasNextPage ?? false,
    hasPrevPage: query.data?.hasPrevPage ?? false,
  }), [mode, currentPage, params.limit, params.page, query.data]);

  // --------- Paged-only helpers ----------
  const loadNextPage = useCallback(() => {
    setPage(Math.min((pagination.page ?? 1) + 1, pagination.lastPage || (pagination.page ?? 1)));
  }, [pagination.page, pagination.lastPage, setPage]);

  const loadPrevPage = useCallback(() => {
    setPage(Math.max((pagination.page ?? 1) - 1, 1));
  }, [pagination.page, setPage]);

  const pager = useMemo<number[]>(() => {
    const last = pagination.lastPage || 1;
    // If you need windowed pager, replace this with a range around current page
    return Array.from({ length: last }, (_, i) => i + 1);
  }, [pagination.lastPage]);

  // --------- Return (discriminated by mode) ----------
  const common = {
    ...query,
    mode,
    data: mergedData,
    params,
    pagination,
    setPage,
    setLimit,
    setFilters,
    resetToFirstPage,
  };

  if (mode === "paged") {
    return {
      ...(common as any),
      loadNextPage,
      loadPrevPage,
      pager,
    } as any;
  }

  // Infinite mode: no paged helpers exposed
  return common as any;
}
