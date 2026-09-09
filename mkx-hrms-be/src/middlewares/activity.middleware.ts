import { Request, Response, NextFunction } from "express";
import { prisma } from "../libraries/prisma";
import { verifyToken } from "../v1/services/auth.service";

/**
 * Snapshot model for tracking pre-mutation state of database entities
 */
interface EntitySnapshot {
  id?: number | string;
  name?: string;
  title?: string;
  status?: string;
  role?: string;
  department?: string;
  stage?: string;
  manager_name?: string;
  email?: string;
  leave_type?: string;
  author_name?: string;
  category?: string;
  employee_id?: number | null;
  user_id?: number | null;
  employee?: { name?: string; id?: number } | null;
}

/**
 * Helper to compute two-letter uppercase initials from a full name
 *
 * @param name - Full name or label
 * @returns Initials string
 */
function extractInitials(name: string): string {
  const clean = name.replace(/\([^)]*\)/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Middleware to intercept modifying HTTP requests and track entity changes
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const activityTrackingMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const method = req.method.toUpperCase();

  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  const rawUrl = req.originalUrl || req.url;
  const pathWithoutQuery = rawUrl.split("?")[0];

  if (
    pathWithoutQuery.includes("/export") ||
    pathWithoutQuery.includes("/health") ||
    pathWithoutQuery.includes("/auth/login") ||
    pathWithoutQuery.includes("/auth/logout")
  ) {
    return next();
  }

  let snapshot: EntitySnapshot | null = null;
  const segments = pathWithoutQuery.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const secondLastSegment = segments.length > 1 ? segments[segments.length - 2] : "";

  const targetId = !isNaN(Number(lastSegment))
    ? Number(lastSegment)
    : lastSegment === "status" && !isNaN(Number(secondLastSegment))
      ? Number(secondLastSegment)
      : lastSegment;

  const idStr = String(targetId);
  const numericId = !isNaN(Number(targetId)) ? Number(targetId) : undefined;

  try {
    if (
      pathWithoutQuery.includes("/employees") &&
      (method === "PUT" || method === "PATCH" || method === "DELETE")
    ) {
      const emp = await prisma.employee.findFirst({
        where: {
          OR: [...(numericId ? [{ id: numericId }] : []), { employee_id: idStr }],
        },
      });
      if (emp) {
        snapshot = {
          id: emp.id,
          name: emp.name,
          status: emp.status,
          role: emp.role,
          department: emp.department,
          manager_name: emp.manager_name || undefined,
          email: emp.email,
          employee_id: emp.id,
          user_id: emp.user_id,
        };
      }
    } else if (
      pathWithoutQuery.includes("/leaves") &&
      (method === "PUT" || method === "PATCH" || method === "DELETE")
    ) {
      const leave = await prisma.leave.findFirst({
        where: {
          OR: [...(numericId ? [{ id: numericId }] : []), { leave_code: idStr }],
        },
        include: { employee: true },
      });
      if (leave) {
        snapshot = {
          id: leave.id,
          status: leave.status,
          leave_type: leave.leave_type,
          employee_id: leave.employee_id,
          employee: { name: leave.employee?.name, id: leave.employee?.id },
        };
      }
    } else if (
      pathWithoutQuery.includes("/recruitment") &&
      (method === "PUT" ||
        method === "PATCH" ||
        method === "DELETE" ||
        pathWithoutQuery.includes("/onboard"))
    ) {
      const candidate = await prisma.candidate.findFirst({
        where: {
          OR: [...(numericId ? [{ id: numericId }] : []), { candidate_code: idStr }],
        },
      });
      if (candidate) {
        snapshot = {
          id: candidate.id,
          name: candidate.name,
          stage: candidate.stage,
          status: candidate.status,
          role: candidate.position,
          department: candidate.department,
          employee_id: candidate.employee_id,
        };
      }
    } else if (
      pathWithoutQuery.includes("/blogs") &&
      (method === "PUT" || method === "PATCH" || method === "DELETE")
    ) {
      const blog = await prisma.blogPost.findFirst({
        where: {
          OR: [...(numericId ? [{ id: numericId }] : []), { slug: idStr }],
        },
      });
      if (blog) {
        snapshot = {
          id: blog.id,
          title: blog.title,
          status: blog.status,
          category: blog.category,
          author_name: blog.author_name,
        };
      }
    }
  } catch {
    /** Gracefully bypass snapshot errors */
  }

  res.on("finish", async () => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return;
    }

    try {
      let actorUserId: number | null = null;
      let actorEmployeeId: number | null = null;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        if (decoded?.id) {
          actorUserId = decoded.id;
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { employee: true },
          });
          if (user?.employee?.id) {
            actorEmployeeId = user.employee.id;
          }
        }
      }

      const body = req.body && typeof req.body === "object" ? req.body : {};
      let name = "System";
      let subtext = "Action completed";
      let statusLabel = "Updated";
      let statusType: "success" | "warning" | "error" | "info" = "info";
      let bgAlpha = "rgba(0, 177, 216, 0.1)";

      if (pathWithoutQuery.includes("/employees")) {
        if (method === "POST") {
          const empName =
            body.name ||
            [body.first_name, body.last_name].filter(Boolean).join(" ") ||
            "New Employee";
          name = `${empName} (Employee)`;
          subtext = `New Hire • ${body.department || "Organization"} (${body.role || "Staff"})`;
          statusLabel = "New Hire";
          statusType = "success";
          bgAlpha = "rgba(69, 186, 80, 0.1)";
        } else if (method === "PUT" || method === "PATCH") {
          const empName = snapshot?.name || body.name || "Employee";
          name = `${empName} (Employee)`;
          const diffs: string[] = [];

          if (snapshot && body.status && body.status !== snapshot.status) {
            diffs.push(`Status: "${snapshot.status}" → "${body.status}"`);
          }
          if (snapshot && body.role && body.role !== snapshot.role) {
            diffs.push(`Role: "${snapshot.role}" → "${body.role}"`);
          }
          if (snapshot && body.department && body.department !== snapshot.department) {
            diffs.push(`Department: "${snapshot.department}" → "${body.department}"`);
          }
          if (snapshot && body.manager_name && body.manager_name !== snapshot.manager_name) {
            diffs.push(`Manager: "${snapshot.manager_name}" → "${body.manager_name}"`);
          }
          if (diffs.length === 0) {
            diffs.push("Updated employee profile records");
          }

          subtext = diffs.join(", ");
          statusLabel = (body.status as string) || "Updated";
          if (body.status === "Inactive") {
            statusType = "error";
            bgAlpha = "rgba(241, 77, 76, 0.1)";
          } else if (body.status === "Active") {
            statusType = "success";
            bgAlpha = "rgba(69, 186, 80, 0.1)";
          } else {
            statusType = "info";
            bgAlpha = "rgba(0, 177, 216, 0.1)";
          }
        } else if (method === "DELETE") {
          const empName = snapshot?.name || "Employee";
          name = `${empName} (Employee)`;
          subtext = "Removed from active workforce directory";
          statusLabel = "Deleted";
          statusType = "error";
          bgAlpha = "rgba(241, 77, 76, 0.1)";
        }
      } else if (pathWithoutQuery.includes("/leaves")) {
        if (method === "PATCH" || method === "PUT") {
          const empName = snapshot?.employee?.name || "Employee";
          name = `${empName} (Leave Req)`;
          const oldStatus = snapshot?.status || "Pending";
          const newStatus = (body.status as string) || "Updated";
          subtext = `Status: "${oldStatus}" → "${newStatus}" (${snapshot?.leave_type || "Leave"})`;
          statusLabel = newStatus;
          if (newStatus === "Approved") {
            statusType = "success";
            bgAlpha = "rgba(69, 186, 80, 0.1)";
          } else if (newStatus === "Rejected") {
            statusType = "error";
            bgAlpha = "rgba(241, 77, 76, 0.1)";
          } else {
            statusType = "warning";
            bgAlpha = "rgba(255, 139, 37, 0.1)";
          }
        } else if (method === "POST") {
          name = `${body.employee_name || "Employee"} (Leave Req)`;
          subtext = `Requested ${body.leave_type || "Annual"} leave (${body.days_count || 1} days)`;
          statusLabel = "Pending";
          statusType = "warning";
          bgAlpha = "rgba(255, 139, 37, 0.1)";
        }
      } else if (pathWithoutQuery.includes("/recruitment")) {
        if (pathWithoutQuery.includes("/onboard")) {
          const candName = snapshot?.name || body.name || "Candidate";
          name = `${candName} (Onboarding)`;
          subtext = `Hired into workforce as ${snapshot?.role || body.role || "Employee"}`;
          statusLabel = "Hired";
          statusType = "success";
          bgAlpha = "rgba(69, 186, 80, 0.1)";
        } else if (method === "POST") {
          const candName = body.name || "Candidate";
          name = `${candName} (Candidate)`;
          subtext = `Applied for ${body.position || "Role"} • ${body.department || "Operations"}`;
          statusLabel = "Applied";
          statusType = "info";
          bgAlpha = "rgba(0, 177, 216, 0.1)";
        } else if (method === "PUT" || method === "PATCH") {
          const candName = snapshot?.name || body.name || "Candidate";
          name = `${candName} (Candidate)`;
          const diffs: string[] = [];
          if (snapshot && body.stage && body.stage !== snapshot.stage) {
            diffs.push(`Stage: "${snapshot.stage}" → "${body.stage}"`);
          }
          if (snapshot && body.status && body.status !== snapshot.status) {
            diffs.push(`Status: "${snapshot.status}" → "${body.status}"`);
          }
          if (diffs.length === 0) diffs.push("Updated candidate application");
          subtext = diffs.join(", ");
          statusLabel = (body.stage as string) || (body.status as string) || "Updated";
          statusType =
            statusLabel === "Hired" ? "success" : statusLabel === "Rejected" ? "error" : "info";
          bgAlpha =
            statusType === "success"
              ? "rgba(69, 186, 80, 0.1)"
              : statusType === "error"
                ? "rgba(241, 77, 76, 0.1)"
                : "rgba(0, 177, 216, 0.1)";
        }
      } else if (pathWithoutQuery.includes("/blogs")) {
        if (method === "POST") {
          name = `${body.author_name || "Admin"} (Blog)`;
          subtext = `Created article: "${body.title || "Untitled"}"`;
          statusLabel = (body.status as string) || "Draft";
          statusType = body.status === "Published" ? "success" : "warning";
          bgAlpha = statusType === "success" ? "rgba(69, 186, 80, 0.1)" : "rgba(255, 139, 37, 0.1)";
        } else if (method === "PUT" || method === "PATCH") {
          name = `${snapshot?.author_name || body.author_name || "Admin"} (Blog)`;
          const diffs: string[] = [];
          if (snapshot && body.status && body.status !== snapshot.status) {
            diffs.push(`Status: "${snapshot.status}" → "${body.status}"`);
          }
          if (snapshot && body.title && body.title !== snapshot.title) {
            diffs.push(`Title: "${snapshot.title}" → "${body.title}"`);
          }
          if (snapshot && body.category && body.category !== snapshot.category) {
            diffs.push(`Category: "${snapshot.category}" → "${body.category}"`);
          }
          if (diffs.length === 0) diffs.push("Updated article content");
          subtext = diffs.join(", ");
          statusLabel = (body.status as string) || snapshot?.status || "Updated";
          statusType =
            statusLabel === "Published" ? "success" : statusLabel === "Draft" ? "warning" : "info";
          bgAlpha =
            statusType === "success"
              ? "rgba(69, 186, 80, 0.1)"
              : statusType === "warning"
                ? "rgba(255, 139, 37, 0.1)"
                : "rgba(0, 177, 216, 0.1)";
        } else if (method === "DELETE") {
          name = `${snapshot?.author_name || "Admin"} (Blog)`;
          subtext = `Deleted article: "${snapshot?.title || "Article"}"`;
          statusLabel = "Deleted";
          statusType = "error";
          bgAlpha = "rgba(241, 77, 76, 0.1)";
        }
      } else {
        name = "System Operation";
        subtext = `${method} ${pathWithoutQuery}`;
        statusLabel = method === "DELETE" ? "Deleted" : method === "POST" ? "Created" : "Updated";
        statusType = method === "DELETE" ? "error" : "info";
        bgAlpha = "rgba(0, 177, 216, 0.1)";
      }

      const initials = extractInitials(name);

      await prisma.activityLog.create({
        data: {
          user_id: actorUserId,
          employee_id:
            actorEmployeeId || (snapshot?.employee_id ? Number(snapshot.employee_id) : null),
          initials,
          name,
          subtext: subtext.slice(0, 255),
          status_label: statusLabel.slice(0, 50),
          status_type: statusType,
          bg_alpha: bgAlpha,
        },
      });
    } catch {
      /** Fail-safe logging */
    }
  });

  next();
};
