import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { User } from "../../types/user.types";

/**
 * Controller to retrieve users with optional pagination and standard formatting
 *
 * @param req - Express request with optional query params `page` and `limit`
 * @param res - Express response with augmented response middleware helpers
 * @param next - Next middleware delegate for centralized error capture
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const [totalItems, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
    ]);

    res.paginate<User[]>(
      users as unknown as User[],
      totalItems,
      page,
      limit,
      "Users fetched successfully",
    );
  } catch (err) {
    next(err);
  }
};
