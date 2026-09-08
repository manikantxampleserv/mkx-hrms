import { Request, Response, NextFunction } from "express";
import { verifyToken, AuthTokenPayload } from "../v1/services/auth.service";

/**
 * Express Request interface extension attaching authenticated user payload
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Authentication middleware verifying Bearer JWT token from request header
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.sendError({
      statusCode: 401,
      message: "Authorization token required",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.sendError({
      statusCode: 401,
      message: "Invalid or expired token",
    });
    return;
  }

  req.user = decoded;
  next();
};
