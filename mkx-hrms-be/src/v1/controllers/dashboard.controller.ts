import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";

/**
 * Computes human-friendly dynamic relative time string
 *
 * @param date - Date instance to compare against current time
 * @returns Formatted relative time string
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toISOString().split("T")[0];
}

/**
 * Controller to fetch comprehensive dashboard metrics, activities, and performers
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getDashboardOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({ where: { status: "Active" } });
    const onLeaveToday = await prisma.employee.count({ where: { status: "On Leave" } });
    const activeCandidates = await prisma.candidate.count({ where: { status: "Active" } });

    const activities = await prisma.activityLog.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
    });

    const topEmployees = await prisma.employee.findMany({
      where: { status: "Active" },
      take: 4,
      orderBy: { created_at: "asc" },
    });

    const formattedActivities = activities.map((act) => {
      const timeStr = formatRelativeTime(act.created_at);
      let coreDescription = act.subtext;
      if (coreDescription.includes(" • ")) {
        coreDescription = coreDescription.split(" • ")[0];
      }

      return {
        id: act.id,
        initials: act.initials || act.name.charAt(0).toUpperCase(),
        name: act.name,
        subtext: `${coreDescription} • ${timeStr}`,
        diff: coreDescription,
        time_ago: timeStr,
        status_label: act.status_label,
        status_type: act.status_type as "success" | "warning" | "error" | "info",
        bg_alpha: act.bg_alpha || "rgba(0, 177, 216, 0.1)",
        created_at: act.created_at.toISOString(),
      };
    });

    const formattedPerformers = topEmployees.map((emp, idx) => ({
      name: emp.name,
      role: emp.role,
      deals: 18 - idx * 3,
      avatar: emp.avatar || undefined,
    }));

    const overview = {
      kpi_metrics: {
        total_employees: totalEmployees,
        active_workforce: activeEmployees,
        on_leave_today: onLeaveToday,
        active_candidates: activeCandidates,
      },
      recent_activities: formattedActivities,
      top_performers: formattedPerformers,
    };

    res.sendSuccess({
      message: "Dashboard overview fetched successfully",
      data: overview,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch all activity logs with search and pagination support
 *
 * @param req - Express request with optional query params
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getAllActivities = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = (req.query.search as string) || "";

    const andConditions: Array<Record<string, unknown>> = [];

    if (search.trim()) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { subtext: { contains: search, mode: "insensitive" } },
          { status_label: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    const activities = await prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      take: limit,
    });

    const formatted = activities.map((act) => {
      const timeStr = formatRelativeTime(act.created_at);
      let coreDescription = act.subtext;
      if (coreDescription.includes(" • ")) {
        coreDescription = coreDescription.split(" • ")[0];
      }

      return {
        id: act.id,
        initials: act.initials || act.name.charAt(0).toUpperCase(),
        name: act.name,
        subtext: `${coreDescription} • ${timeStr}`,
        diff: coreDescription,
        time_ago: timeStr,
        status_label: act.status_label,
        status_type: act.status_type as "success" | "warning" | "error" | "info",
        bg_alpha: act.bg_alpha || "rgba(0, 177, 216, 0.1)",
        created_at: act.created_at.toISOString(),
      };
    });

    res.sendSuccess({
      message: "Activity logs fetched successfully",
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};
