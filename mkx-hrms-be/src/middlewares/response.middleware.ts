import { Request, Response, NextFunction } from "express";
import {
  ApiResponse,
  ApiErrorResponse,
  PaginationMeta,
  SuccessResponseOptions,
  ErrorResponseOptions,
} from "../types/response.types";

declare global {
  namespace Express {
    interface Response {
      /**
       * Sends a standardized successful API response
       *
       * @template T - Type of payload data
       * @param options - Response payload, message, status code, and optional pagination
       */
      sendSuccess<T = unknown>(options?: SuccessResponseOptions<T>): this;

      /**
       * Sends a standardized error API response
       *
       * @param options - Error message, status code, error detail, and validation items
       */
      sendError(options?: ErrorResponseOptions): this;

      /**
       * Convenience method to send a paginated collection response
       *
       * @template T - Array collection type
       * @param data - The array of items for current page
       * @param totalItems - Total count of matching items in the database
       * @param page - Current page number
       * @param limit - Page size limit
       * @param message - Optional message
       */
      paginate<T = unknown>(
        data: T,
        totalItems: number,
        page: number,
        limit: number,
        message?: string,
      ): this;
    }
  }
}

/**
 * Calculates standard pagination metadata given total items count, active page, and limit
 *
 * @param totalItems - Total number of available records
 * @param page - Current 1-based page index
 * @param limit - Records limit per page
 * @returns Formatted PaginationMeta object
 */
export function calculatePagination(
  totalItems: number,
  page: number,
  limit: number,
): PaginationMeta {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.ceil(totalItems / safeLimit) || 1;

  return {
    page: safePage,
    limit: safeLimit,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

/**
 * Express middleware that binds standard response helpers to the Response object
 *
 * @param _req - Incoming Express request
 * @param res - Express response object being augmented
 * @param next - Next middleware delegate function
 */
export function responseMiddleware(_req: Request, res: Response, next: NextFunction): void {
  /**
   * Helper implementation to format and send standard success responses
   */
  res.sendSuccess = function <T = unknown>(options: SuccessResponseOptions<T> = {}) {
    const {
      message = "Operation completed successfully",
      data,
      statusCode = 200,
      pagination,
    } = options;

    const responseBody: ApiResponse<T> = {
      success: true,
      statusCode,
      message,
      ...(data !== undefined && { data }),
      ...(pagination && { pagination }),
    };

    return res.status(statusCode).json(responseBody);
  };

  /**
   * Helper implementation to format and send standard error responses
   */
  res.sendError = function (options: ErrorResponseOptions = {}) {
    const {
      message = "An unexpected error occurred",
      statusCode = 500,
      error,
      errors,
      stack,
    } = options;

    const isProduction = process.env.NODE_ENV === "production";

    const responseBody: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(error !== undefined && { error }),
      ...(errors && { errors }),
      ...(!isProduction && stack && { stack }),
    };

    return res.status(statusCode).json(responseBody);
  };

  /**
   * Helper implementation to format paginated collections
   */
  res.paginate = function <T = unknown>(
    data: T,
    totalItems: number,
    page: number,
    limit: number,
    message = "Records retrieved successfully",
  ) {
    const pagination = calculatePagination(totalItems, page, limit);

    return res.sendSuccess({
      message,
      data,
      statusCode: 200,
      pagination,
    });
  };

  next();
}
