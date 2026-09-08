import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";
import { api } from "libraries/axios";
import toast from "react-hot-toast";

/**
 * Payload parameters required for dispatching a custom mutation request.
 *
 * @template TVariables - Structure of request body payload or query parameters
 * @template TData - Expected response payload type
 * @template TError - Expected error payload structure
 */
interface CustomMutationVariables<TVariables, TData = unknown, TError = AxiosError> {
  /** Relative endpoint URL target */
  url: string;
  /** HTTP verb to execute for the request */
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Optional request payload data to be serialized */
  data?: TVariables;
  /** Optional Axios configuration parameters such as custom headers */
  config?: AxiosRequestConfig;
  /** Optional custom toast messaging configuration to display during mutation lifecycle */
  toastMessages?: {
    /** Status message displayed while the mutation is in flight */
    loading?: string;
    /** Static string or factory function generating success feedback message */
    success?: string | ((data: TData) => string);
    /** Static string or factory function generating error feedback message */
    error?: string | ((error: TError) => string);
  };
}

/**
 * Generalized React Query mutation hook for executing data modification requests.
 *
 * Provides integrated feedback handling via toast notifications, automatic request
 * dispatching through the configured Axios client, and lifecycle event orchestration.
 *
 * @template TData - Expected response data payload returned by the mutation
 * @template TError - Expected error shape, defaulting to AxiosError
 * @template TVariables - Structure of data arguments supplied during invocation
 * @template TContext - Optional optimistic update context payload
 *
 * @param options - Mutation configuration options, callbacks, and global toast feedback overrides
 *
 * @returns React Query mutation result object with mutate/mutateAsync functions and execution states
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCustomMutation<User, AxiosError, CreateUserDto>({
 *   toastMessages: {
 *     loading: "Creating user...",
 *     success: (user) => `User ${user.first_name} created successfully!`,
 *     error: "Failed to create user."
 *   },
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: ["users"] });
 *   }
 * });
 *
 * mutate({
 *   url: "/v1/users",
 *   method: "POST",
 *   data: { first_name: "Alice", email: "alice@mkx.com" }
 * });
 * ```
 */
export function useCustomMutation<
  TData = unknown,
  TError = AxiosError,
  TVariables = unknown,
  TContext = unknown,
>(
  options?: Omit<
    UseMutationOptions<TData, TError, CustomMutationVariables<TVariables, TData, TError>, TContext>,
    "mutationFn"
  > & {
    toastMessages?: {
      loading?: string;
      success?: string | ((data: TData) => string);
      error?: string | ((error: TError) => string);
    };
  },
): UseMutationResult<TData, TError, CustomMutationVariables<TVariables, TData, TError>, TContext> {
  const { toastMessages: defaultToastMessages, ...mutationOptions } = options || {};

  return useMutation<TData, TError, CustomMutationVariables<TVariables, TData, TError>, TContext>({
    mutationFn: async (
      variables: CustomMutationVariables<TVariables, TData, TError>,
    ): Promise<TData> => {
      const apiCall = api
        .request<TData>({
          url: variables.url,
          method: variables.method,
          data: variables.data,
          ...variables.config,
        })
        .then((res) => res.data);

      if (defaultToastMessages || variables.toastMessages) {
        const activeToastMessages = variables.toastMessages || defaultToastMessages!;
        toast.promise(apiCall, {
          loading: activeToastMessages.loading || "Processing...",
          success: (data) =>
            typeof activeToastMessages.success === "function"
              ? activeToastMessages.success(data)
              : activeToastMessages.success || "Success!",
          error: (err) =>
            typeof activeToastMessages.error === "function"
              ? activeToastMessages.error(err)
              : activeToastMessages.error ||
                (err as AxiosError<{ error?: string }>).response?.data?.error ||
                err.message ||
                "An error occurred",
        });
      }

      return apiCall;
    },
    ...mutationOptions,
  });
}
