import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { verifyToken } from "../services/auth.service";

/**
 * Controller to retrieve application settings, current user profile, notification preferences, and integrations
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let userId: number | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded?.id) userId = decoded.id;
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : undefined,
      include: {
        role: true,
        employee: {
          include: {
            role_rel: true,
          },
        },
        notification_preferences: true,
      },
    });

    const integrations = await prisma.integration.findMany({
      orderBy: { created_at: "asc" },
    });

    const formattedIntegrations = integrations.map((item) => ({
      key: item.key,
      name: item.name,
      description: item.description,
      short_code: item.short_code,
      connected: item.connected,
      last_sync: item.last_sync ? item.last_sync.toLocaleTimeString() : null,
    }));

    const formattedPreferences = (user?.notification_preferences || []).map((pref) => ({
      key: pref.preference_key,
      label: pref.label || pref.preference_key,
      description: pref.description || "",
      default_email: pref.default_email,
      default_push: pref.default_push,
    }));

    const dbRoles = await prisma.role.findMany({
      orderBy: { name: "asc" },
    });

    const rolesList = dbRoles.map((r) => ({
      label: r.name,
      value: r.name,
    }));

    const settingsData = {
      profile: {
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        role: user?.role?.name || user?.employee?.role_rel?.name || "Employee",
        timezone: user?.timezone || "Asia/Kolkata",
        avatar: user?.avatar || null,
      },
      roles: rolesList,
      integrations: formattedIntegrations,
      notification_preferences: formattedPreferences,
    };

    res.sendSuccess({
      message: "Settings loaded successfully",
      data: settingsData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update current user profile details
 *
 * @param req - Express request with updated profile payload
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { first_name, last_name, email, timezone, avatar } = req.body;

    const authHeader = req.headers.authorization;
    let userId: number | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded?.id) userId = decoded.id;
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : undefined,
    });

    if (!user) {
      res.sendError({
        statusCode: 404,
        message: "Active user account not found",
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        first_name: first_name ?? user.first_name,
        last_name: last_name ?? user.last_name,
        email: email ?? user.email,
        timezone: "Asia/Kolkata",
        avatar: avatar !== undefined ? avatar : user.avatar,
      },
    });

    res.sendSuccess({
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update user notification channel preferences
 *
 * @param req - Express request with notification preferences dictionary
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const updateNotificationPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { preferences } = req.body as {
      preferences: Record<string, { email: boolean; push: boolean }>;
    };

    const user = await prisma.user.findFirst();

    if (!user) {
      res.sendError({
        statusCode: 404,
        message: "Active user account not found",
      });
      return;
    }

    if (preferences) {
      for (const [key, val] of Object.entries(preferences)) {
        await prisma.notificationPreference.upsert({
          where: {
            user_id_preference_key: {
              user_id: user.id,
              preference_key: key,
            },
          },
          update: {
            default_email: val.email,
            default_push: val.push,
          },
          create: {
            user_id: user.id,
            preference_key: key,
            default_email: val.email,
            default_push: val.push,
          },
        });
      }
    }

    res.sendSuccess({
      message: "Notification preferences updated successfully",
    });
  } catch (err) {
    next(err);
  }
};
