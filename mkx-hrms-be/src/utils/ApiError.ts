/**
 * Custom application error class representing an operational HTTP error
 */
export class ApiError extends Error {
  /** HTTP status code associated with this error */
  public statusCode: number;
  /** Optional array of granular validation or field-level errors */
  public errors?: unknown[];
  /** Distinguishes operational errors from unexpected internal programmer bugs */
  public isOperational: boolean;

  /**
   * Initializes a new instance of ApiError
   *
   * @param statusCode - HTTP status code (e.g. 400, 404, 500)
   * @param message - Human-readable error description
   * @param errors - Optional array of additional error details
   * @param stack - Optional specific stack trace
   */
  constructor(statusCode: number, message: string, errors?: unknown[], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Factory method for creating a 400 Bad Request error
   *
   * @param message - Custom error message
   * @param errors - Optional array of validation errors
   * @returns Configured ApiError instance
   */
  static badRequest(message = "Bad Request", errors?: unknown[]): ApiError {
    return new ApiError(400, message, errors);
  }

  /**
   * Factory method for creating a 401 Unauthorized error
   *
   * @param message - Custom error message
   * @returns Configured ApiError instance
   */
  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Factory method for creating a 403 Forbidden error
   *
   * @param message - Custom error message
   * @returns Configured ApiError instance
   */
  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Factory method for creating a 404 Not Found error
   *
   * @param message - Custom error message
   * @returns Configured ApiError instance
   */
  static notFound(message = "Resource Not Found"): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Factory method for creating a 409 Conflict error
   *
   * @param message - Custom error message
   * @returns Configured ApiError instance
   */
  static conflict(message = "Resource Conflict"): ApiError {
    return new ApiError(409, message);
  }

  /**
   * Factory method for creating a 500 Internal Server error
   *
   * @param message - Custom error message
   * @returns Configured ApiError instance
   */
  static internal(message = "Internal Server Error"): ApiError {
    return new ApiError(500, message);
  }
}
