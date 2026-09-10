import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { comparePassword, generateToken, hashPassword, verifyToken } from "../services/auth.service";

/**
 * Controller to handle user login and JWT token issuance
 *
 * @param req - Express request with email and password in body
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.sendError({
        statusCode: 400,
        message: "Email and password are required",
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email.trim(), mode: "insensitive" },
      },
      include: {
        role: true,
        employee: {
          include: {
            role_rel: true,
            department_rel: true,
            manager: true,
          },
        },
      },
    });

    if (!user) {
      res.sendError({
        statusCode: 401,
        message: "Invalid email or password",
      });
      return;
    }

    let isPasswordValid = false;

    if (user.password_hash) {
      isPasswordValid = await comparePassword(password, user.password_hash);
    }

    if (!isPasswordValid) {
      res.sendError({
        statusCode: 401,
        message: "Invalid email or password",
      });
      return;
    }

    let employee = user.employee;
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { employee_id: user.employee_id },
            { email: { equals: user.email, mode: "insensitive" } },
          ],
        },
        include: {
          role_rel: true,
          department_rel: true,
          manager: true,
        },
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role?.name || employee?.role_rel?.name || "Employee",
      employee_db_id: employee?.id,
      employee_code: employee?.employee_id || user.employee_id,
    });

    const userProfile = {
      id: user.id,
      employee_id: employee?.employee_id || user.employee_id,
      employee_db_id: employee?.id || null,
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      avatar: user.avatar || employee?.avatar || null,
      role: user.role?.name || employee?.role_rel?.name || "Employee",
      department: employee?.department_rel?.name || "Engineering",
      status: employee?.status || user.status || "Active",
      join_date: employee?.join_date ? employee.join_date.toISOString().split("T")[0] : null,
      manager_name: employee?.manager?.name || null,
      timezone: user.timezone,
    };

    res.sendSuccess({
      message: "Login successful",
      data: {
        token,
        user: userProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to handle user logout
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.sendSuccess({
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to retrieve currently authenticated user profile
 *
 * @param req - Express request with attached user context
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.sendError({
        statusCode: 401,
        message: "Authentication token missing or invalid",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      res.sendError({
        statusCode: 401,
        message: "Invalid or expired token",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: true,
        employee: {
          include: {
            role_rel: true,
            department_rel: true,
            manager: true,
          },
        },
      },
    });

    if (!user) {
      res.sendError({
        statusCode: 404,
        message: "User profile not found",
      });
      return;
    }

    let employee = user.employee;
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { employee_id: user.employee_id },
            { email: { equals: user.email, mode: "insensitive" } },
          ],
        },
        include: {
          role_rel: true,
          department_rel: true,
          manager: true,
        },
      });
    }

    const userProfile = {
      id: user.id,
      employee_id: employee?.employee_id || user.employee_id,
      employee_db_id: employee?.id || null,
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      avatar: user.avatar || employee?.avatar || null,
      role: user.role?.name || employee?.role_rel?.name || "Employee",
      department: employee?.department_rel?.name || "Engineering",
      status: employee?.status || user.status || "Active",
      join_date: employee?.join_date ? employee.join_date.toISOString().split("T")[0] : null,
      manager_name: employee?.manager?.name || null,
      timezone: user.timezone,
    };

    res.sendSuccess({
      message: "Profile retrieved successfully",
      data: userProfile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Validates a one-time set-password token from the welcome email
 *
 * @param req - Express request with `token` in query string
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const verifySetPasswordToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.query.token as string;

    if (!token) {
      res.sendError({ statusCode: 400, message: "Token is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { password_reset_token: token },
      select: { id: true, first_name: true, password_reset_expires: true },
    });

    if (!user || !user.password_reset_expires || user.password_reset_expires < new Date()) {
      res.sendError({
        statusCode: 400,
        message: "This link has expired or is invalid. Please contact HR for a new invitation.",
      });
      return;
    }

    res.sendSuccess({
      message: "Token is valid",
      data: { firstName: user.first_name },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Consumes a one-time set-password token and updates the user's password
 *
 * @param req - Express request with `token`, `password`, and `confirmPassword` in body
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const setPasswordWithToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      res.sendError({ statusCode: 400, message: "Token, password, and confirmPassword are required" });
      return;
    }

    if (password !== confirmPassword) {
      res.sendError({ statusCode: 400, message: "Passwords do not match" });
      return;
    }

    if (password.length < 8) {
      res.sendError({ statusCode: 400, message: "Password must be at least 8 characters" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { password_reset_token: token },
    });

    if (!user || !user.password_reset_expires || user.password_reset_expires < new Date()) {
      res.sendError({
        statusCode: 400,
        message: "This link has expired or is invalid. Please contact HR for a new invitation.",
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    res.sendSuccess({ message: "Password set successfully. You can now log in." });
  } catch (err) {
    next(err);
  }
};
