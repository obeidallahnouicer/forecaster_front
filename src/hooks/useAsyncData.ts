// useAsyncData - Comprehensive hook for fetching and managing async data

import { useState, useEffect, useCallback, useRef } from "react";

export type AsyncStatus = "idle" | "loading" | "success" | "error" | "timeout";

export interface AsyncDataState<T> {
  data: T | null;
  status: AsyncStatus;
  error: Error | null;
  isLoading: boolean;
  isEmpty: boolean;
}

interface UseAsyncDataOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing async data fetching with loading, error, and timeout states
 */
export const useAsyncData = <T,>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncDataOptions = {}
): AsyncDataState<T> & { retry: () => void } => {
  const {
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!isMountedRef.current) return;

    setStatus("loading");
    setError(null);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Request timeout")),
        timeout
      )
    );

    try {
      const result = await Promise.race([fetchFn(), timeoutPromise]);

      if (isMountedRef.current) {
        setData(result);
        setStatus("success");
        retryCountRef.current = 0;
        onSuccess?.(result);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));

      // Handle timeout
      if (error.message === "Request timeout") {
        setStatus("timeout");
      } else if (retryCountRef.current < retries) {
        retryCountRef.current++;
        setStatus("loading");
        
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, retryCountRef.current - 1))
        );
        
        return fetch();
      } else {
        setStatus("error");
      }

      setError(error);
      onError?.(error);
    }
  }, [fetchFn, timeout, retries, retryDelay, onSuccess, onError]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    fetch();
  }, [fetch]);

  useEffect(() => {
    isMountedRef.current = true;
    fetch();

    return () => {
      isMountedRef.current = false;
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, dependencies);

  return {
    data,
    status,
    error,
    isLoading: status === "loading",
    isEmpty: data === null || (Array.isArray(data) && data.length === 0),
    retry,
  };
};

/**
 * Hook for managing multiple concurrent async requests
 */
export const useAsyncDataMultiple = <T extends Record<string, any>>(
  fetchFns: Record<keyof T, () => Promise<T[keyof T]>>,
  dependencies: any[] = [],
  options: UseAsyncDataOptions = {}
) => {
  const [allData, setAllData] = useState<T | null>(null);
  const [statuses, setStatuses] = useState<Record<keyof T, AsyncStatus>>(() => {
    const initial: Record<string, AsyncStatus> = {};
    Object.keys(fetchFns).forEach((key) => {
      initial[key] = "idle";
    });
    return initial as Record<keyof T, AsyncStatus>;
  });
  const [errors, setErrors] = useState<Record<keyof T, Error | null>>(() => {
    const initial: Record<string, Error | null> = {};
    Object.keys(fetchFns).forEach((key) => {
      initial[key] = null;
    });
    return initial as Record<keyof T, Error | null>;
  });

  const isLoadingAny = Object.values(statuses).some((s) => s === "loading");
  const isErrorAny = Object.values(statuses).some((s) => s === "error");

  const fetch = useCallback(async () => {
    const results: Record<string, any> = {};
    const newStatuses: Record<string, AsyncStatus> = {};
    const newErrors: Record<string, Error | null> = {};

    // Update all statuses to loading
    Object.keys(fetchFns).forEach((key) => {
      newStatuses[key] = "loading";
    });
    setStatuses(newStatuses as Record<keyof T, AsyncStatus>);

    // Fetch all concurrently
    await Promise.all(
      Object.entries(fetchFns).map(async ([key, fetchFn]) => {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Request timeout")),
              options.timeout || 30000
            )
          );

          const result = await Promise.race([fetchFn(), timeoutPromise]);
          results[key] = result;
          newStatuses[key] = "success";
          newErrors[key] = null;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          newErrors[key] = error;
          newStatuses[key] = error.message === "Request timeout" ? "timeout" : "error";
        }
      })
    );

    setAllData(results as T);
    setStatuses(newStatuses as Record<keyof T, AsyncStatus>);
    setErrors(newErrors as Record<keyof T, Error | null>);
  }, [fetchFns, options.timeout]);

  const retry = useCallback(async () => {
    await fetch();
  }, [fetch]);

  useEffect(() => {
    fetch();
  }, dependencies);

  return {
    data: allData,
    statuses,
    errors,
    isLoadingAny,
    isErrorAny,
    retry,
  };
};

/**
 * Hook for paginated data fetching
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export const useAsyncDataPaginated = <T,>(
  fetchFn: (page: number, pageSize: number) => Promise<any>,
  pageSize: number = 20,
  options: UseAsyncDataOptions = {}
) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(
    async (pageNum: number) => {
      setStatus("loading");
      setError(null);

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Request timeout")),
            options.timeout || 30000
          )
        );

        const result = await Promise.race([
          fetchFn(pageNum, pageSize),
          timeoutPromise,
        ]);

        // Handle various response formats from backend
        let items: T[] = [];
        let totalCount = 0;

        if (result) {
          // Support both { items, total } and { rows, count } format
          if (Array.isArray(result)) {
            items = result;
            totalCount = result.length;
          } else if (typeof result === 'object') {
            items = result.items || result.rows || [];
            totalCount = result.total || result.count || items.length;
          }
        }

        if (pageNum === 1) {
          setData({ items, total: totalCount });
        } else {
          setData((prev: any) => ({
            items: [...(prev?.items || []), ...items],
            total: totalCount,
          }));
        }

        setTotal(totalCount);
        setStatus("success");
        setPage(pageNum);
        options.onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus(error.message === "Request timeout" ? "timeout" : "error");
        options.onError?.(error);
      }
    },
    [fetchFn, pageSize, options]
  );

  const loadMore = useCallback(() => {
    fetch(page + 1);
  }, [fetch, page]);

  const retry = useCallback(() => {
    fetch(page);
  }, [fetch, page]);

  useEffect(() => {
    fetch(1);
  }, []);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    },
    status,
    error,
    isLoading: status === "loading",
    isEmpty: !data || (typeof data === 'object' && (!data.items || data.items.length === 0)),
    loadMore,
    retry,
  };
};
