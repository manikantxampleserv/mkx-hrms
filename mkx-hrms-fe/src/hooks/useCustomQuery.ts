import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions, UseQueryResult, QueryKey } from "@tanstack/react-query";
import { api } from "libraries/axios";
import { AxiosError } from "axios";

/**
 * Configuration options for the custom query hook, omitting managed query keys and functions.
 *
 * @template TQueryFnData - Type of data returned directly from the API endpoint
 * @template TError - Type of error object produced upon failure, defaults to AxiosError
 * @template TData - Transformed data structure yielded to consumer components
 * @template TQueryKey - Structured tuple or string representing the React Query cache key
 */
type CustomQueryOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  "queryKey" | "queryFn"
>;

/**
 * Generalized React Query wrapper hook for fetching data via GET requests.
 *
 * Automatically delegates HTTP communication through the configured Axios client instance
 * and registers responses into the global React Query client cache.
 *
 * @template TQueryFnData - Raw response payload yielded by the API request
 * @template TError - Expected error shape, defaulting to AxiosError
 * @template TData - Resulting data structure after any optional select transformations
 * @template TQueryKey - Tuple or identifier for cache invalidation and query deduplication
 *
 * @param queryKey - Unique cache key identifier for tracking the active query
 * @param url - Relative endpoint URL path to be requested via Axios GET
 * @param options - Optional query configuration overrides (staleTime, enabled, select, etc.)
 *
 * @returns React Query query result object containing data, error states, and lifecycle flags
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCustomQuery<User[]>(
 *   ["users"],
 *   "/v1/users",
 *   { staleTime: 60000 }
 * );
 * ```
 */
export function useCustomQuery<
  TQueryFnData = unknown,
  TError = AxiosError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  url: string,
  options?: CustomQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<TQueryFnData> => {
      const { data } = await api.get<TQueryFnData>(url);
      return data;
    },
    ...options,
  });
}
