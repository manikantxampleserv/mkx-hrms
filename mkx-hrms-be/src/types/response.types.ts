/**
 * Standard metadata structure for paginated API responses
 */
export interface PaginationMeta {
  /** The current active page index (1-based) */
  page: number;
  /** Maximum number of records returned per page */
  limit: number;
  /** Total count of records matching the query criteria */
  totalItems: number;
  /** Total computed page count */
  totalPages: number;
  /** Indicates whether a subsequent page exists */
  hasNextPage: boolean;
  /** Indicates whether an anterior page exists */
  hasPrevPage: boolean;
}

/**
 * Standard contract for successful HTTP responses
 *
 * @template T - Type of the response data payload
 */
export interface ApiResponse<T = unknown> {
  /** Status indicator showing true for successful operations */
  success: true;
  /** HTTP status code returned to client */
  statusCode: number;
  /** Human-readable status message */
  message: string;
  /** Response payload data */
  data?: T;
  /** Optional pagination metadata for paginated collection responses */
  pagination?: PaginationMeta;
}

/**
 * Standard contract for unsuccessful or erroneous HTTP responses
 */
export interface ApiErrorResponse {
  /** Status indicator showing false for failed operations */
  success: false;
  /** HTTP status code returned to client */
  statusCode: number;
  /** Human-readable error description */
  message: string;
  /** Optional error identifier, message, or detail */
  error?: unknown;
  /** Optional validation errors array */
  errors?: unknown[];
  /** Execution stack trace (omitted in production environments) */
  stack?: string;
}

/**
 * Options accepted by the sendSuccess response helper
 *
 * @template T - Structure of the data payload
 */
export interface SuccessResponseOptions<T = unknown> {
  /** Human-readable success message */
  message?: string;
  /** Result payload to deliver */
  data?: T;
  /** HTTP status code (defaults to 200) */
  statusCode?: number;
  /** Optional pagination metadata */
  pagination?: PaginationMeta;
}

/**
 * Options accepted by the sendError response helper
 */
export interface ErrorResponseOptions {
  /** Human-readable error message */
  message?: string;
  /** HTTP status code (defaults to 500) */
  statusCode?: number;
  /** Specific error detail or string */
  error?: unknown;
  /** Array of specific validation or operational errors */
  errors?: unknown[];
  /** Execution stack trace */
  stack?: string;
}
