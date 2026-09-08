import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

/**
 * 404 Not Found fallback middleware for unhandled route paths
 *
 * @param req - Incoming request object
 * @param _res - Express response object
 * @param next - Delegate function to pass error to errorHandler
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global centralized error handling middleware
 *
 * Catches all operational ApiErrors, database constraint exceptions,
 * and unexpected system errors, delivering a consistent JSON response.
 *
 * @param err - Error instance thrown or forwarded by route handlers
 * @param _req - Incoming Express request
 * @param res - Express response object
 * @param _next - Next middleware delegate function
 */
export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: unknown[] | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if ("code" in err && typeof err.code === "string") {
    /**
     * Handle common Prisma database constraint error codes
     */
    if (err.code === "P2002") {
      statusCode = 409;
      message = "A unique constraint violation occurred in the database";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "The requested record was not found in the database";
    }
  }

  logger.error(`${statusCode} - ${message} - ${err.message}`, err);

  if (typeof res.sendError === "function") {
    res.sendError({
      message,
      statusCode,
      error: err.name,
      errors,
      stack: err.stack,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: err.name,
      errors,
      stack: err.stack,
    });
  }
}
