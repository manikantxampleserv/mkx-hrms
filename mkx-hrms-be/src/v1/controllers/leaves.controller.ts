import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { prisma } from "../../libraries/prisma";
import { generateExcelBuffer } from "../services/excel.service";
import { sendLeaveApprovalEmail } from "../services/email.service";
import { logger } from "../../utils/logger";

/**
 * Controller to retrieve all leave requests with optional filtering
 *
 * @param req - Express request with optional query params `search`, `status`
 * @param res - Express response with augmented response helpers
 * @param next - Next middleware delegate
 */
export const getLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";
    const department = (req.query.department as string) || "All";
    const leaveType = (req.query.leaveType as string) || "All";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const whereClause: {
      AND?: Array<Record<string, unknown>>;
      status?: string;
      leave_type_rel?: { name?: { equals?: string; mode?: "insensitive" } };
      start_date?: { gte?: Date };
      end_date?: { lte?: Date };
      employee?: { department_rel?: { name?: string } };
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search.trim()) {
      andConditions.push({
        OR: [
          { leave_code: { contains: search, mode: "insensitive" } },
          { reason: { contains: search, mode: "insensitive" } },
          { leave_type_rel: { name: { contains: search, mode: "insensitive" } } },
          {
            employee: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { department_rel: { name: { contains: search, mode: "insensitive" } } },
              ],
            },
          },
        ],
      });
    }

    if (status !== "All") {
      whereClause.status = status;
    }
    if (leaveType !== "All") {
      whereClause.leave_type_rel = {
        name: { equals: leaveType, mode: "insensitive" },
      };
    }
    if (department !== "All") {
      whereClause.employee = {
        department_rel: { name: department },
      };
    }
    if (startDate) {
      whereClause.start_date = { gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.end_date = { lte: end };
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const records = await prisma.leave.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        employee: {
          include: {
            department_rel: true,
          },
        },
        leave_type_rel: true,
      },
    });

    const formatted = records.map((item) => ({
      id: item.leave_code,
      db_id: item.id,
      name: item.employee.name,
      email: item.employee.email,
      department: item.employee.department_rel?.name || "General",
      leave_type_id: item.leave_type_id,
      leave_type: item.leave_type_rel?.name || "General Leave",
      leave_type_color: item.leave_type_rel?.color || undefined,
      start_date: item.start_date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      end_date: item.end_date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      days_count: item.days_count,
      reason: item.reason,
      status: item.status as "Pending" | "Approved" | "Rejected",
      applied_on: item.applied_on.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      avatar: item.employee.avatar || undefined,
    }));

    res.sendSuccess({
      message: "Leave requests fetched successfully",
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to compute leave management KPI cards
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getLeaveStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    const now = new Date();
    const yearMonth = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    }).format(now);
    const [year, month] = yearMonth.split("-").map(Number);
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const pendingCount = await prisma.leave.count({ where: { status: "Pending" } });
    const approvedCount = await prisma.leave.count({ where: { status: "Approved" } });
    const rejectedCount = await prisma.leave.count({ where: { status: "Rejected" } });

    /**
     * Determine staff currently away on approved leave today
     */
    const activeLeavesToday = await prisma.leave.findMany({
      where: {
        status: "Approved",
        start_date: { lte: todayDate },
        end_date: { gte: todayDate },
      },
      select: { employee_id: true },
    });
    const onLeaveTodayCount = new Set(activeLeavesToday.map((l) => l.employee_id)).size;

    /**
     * Count leaves scheduled to take place within the current calendar month
     */
    const plannedThisMonth = await prisma.leave.count({
      where: {
        status: "Approved",
        start_date: { lte: monthEnd },
        end_date: { gte: monthStart },
      },
    });

    /**
     * Calculate approval rate across all adjudicated leave decisions
     */
    const decidedCount = approvedCount + rejectedCount;
    const rate = decidedCount > 0 ? ((approvedCount / decidedCount) * 100).toFixed(1) : "0.0";

    const cards = [
      {
        id: "active-requests",
        title: "Pending Requests",
        value: String(pendingCount),
        subtext: "Requiring manager approval",
        icon_name: "Activity",
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "on-leave-today",
        title: "On Leave Today",
        value: String(onLeaveTodayCount),
        subtext: "Staff currently away from office",
        icon_name: "Calendar",
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "scheduled-month",
        title: "Planned This Month",
        value: String(plannedThisMonth),
        subtext: "Upcoming scheduled leave windows",
        icon_name: "Clock",
        icon_color: "text-[#ff8b25]",
        icon_bg: "bg-[#ff8b25]/10",
      },
      {
        id: "approval-rate",
        title: "Approval Rate",
        value: `${rate}%`,
        subtext: "Average across all departments",
        icon_name: "CheckCircle2",
        icon_color: "text-[#ad87ed]",
        icon_bg: "bg-[#ad87ed]/10",
      },
    ];

    res.sendSuccess({
      message: "Leave statistics fetched successfully",
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper to adjust leave balance for an employee upon approval or reversal
 *
 * @param employeeId - Database ID of employee
 * @param leaveTypeId - ID of the leave type
 * @param year - The calendar year
 * @param daysDelta - Positive if consuming balance, negative if releasing balance
 */
const adjustLeaveBalance = async (
  employeeId: number,
  leaveTypeId: number,
  year: number,
  daysDelta: number,
): Promise<void> => {
  try {
    const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType) return;

    const allocated = leaveType.days_per_year;
    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year,
        },
      },
    });

    if (existingBalance) {
      const newUsed = Math.max(0, existingBalance.used + daysDelta);
      const newRemaining = Math.max(0, existingBalance.allocated - newUsed);
      await prisma.leaveBalance.update({
        where: { id: existingBalance.id },
        data: {
          used: newUsed,
          remaining: newRemaining,
        },
      });
    } else {
      const newUsed = Math.max(0, daysDelta);
      const newRemaining = Math.max(0, allocated - newUsed);
      await prisma.leaveBalance.create({
        data: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year,
          allocated,
          used: newUsed,
          remaining: newRemaining,
        },
      });
    }
  } catch (balanceError: unknown) {
    logger.error("Failed to adjust leave balance:", balanceError);
  }
};

/**
 * Controller to update the status of a leave request
 *
 * @param req - Express request with leave ID and new status
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const updateLeaveStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    const existing = await prisma.leave.findFirst({
      where: {
        OR: [{ leave_code: id }, { id: !isNaN(Number(id)) ? Number(id) : undefined }],
      },
    });

    if (!existing) {
      res.sendError({
        statusCode: 404,
        message: "Leave request not found",
      });
      return;
    }

    const updated = await prisma.leave.update({
      where: { id: existing.id },
      data: { status },
      include: { leave_type_rel: true, employee: true },
    });

    if (status === "Approved" && existing.status !== "Approved") {
      const year = new Date(existing.start_date).getFullYear();
      await adjustLeaveBalance(
        existing.employee_id,
        existing.leave_type_id,
        year,
        existing.days_count,
      );
    } else if (status !== "Approved" && existing.status === "Approved") {
      const year = new Date(existing.start_date).getFullYear();
      await adjustLeaveBalance(
        existing.employee_id,
        existing.leave_type_id,
        year,
        -existing.days_count,
      );
    }

    res.sendSuccess({
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to export leave requests as an Excel (.xlsx) spreadsheet
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const exportLeaves = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const leaves = await prisma.leave.findMany({
      orderBy: { created_at: "desc" },
      include: {
        employee: {
          include: {
            department_rel: true,
          },
        },
        leave_type_rel: true,
      },
    });

    const exportData = leaves.map((leave) => ({
      "Leave Code": leave.leave_code,
      Employee: leave.employee?.name || "Unknown",
      Department: leave.employee?.department_rel?.name || "General",
      "Leave Type": leave.leave_type_rel?.name || "General Leave",
      "Start Date": leave.start_date ? leave.start_date.toISOString().split("T")[0] : "",
      "End Date": leave.end_date ? leave.end_date.toISOString().split("T")[0] : "",
      "Days Count": leave.days_count,
      Reason: leave.reason || "",
      Status: leave.status,
      "Applied On": leave.created_at ? leave.created_at.toISOString().split("T")[0] : "",
    }));

    const buffer = await generateExcelBuffer("Leaves", exportData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="Leaves_Export.xlsx"');

    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch dynamic leave filter options (departments, leave types) directly from database
 *
 * @param _req - Express request instance
 * @param res - Express response with sendSuccess helper
 * @param next - Express next middleware function
 */
export const getLeaveFilters = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dbDepartments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbLeaveTypes = await prisma.leaveType.findMany({
      where: { status: "Active" },
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbLeaves = await prisma.leave.findMany({
      select: {
        leave_type_rel: {
          select: { name: true },
        },
        employee: {
          select: {
            department_rel: {
              select: { name: true },
            },
          },
        },
      },
    });

    const departmentsSet = new Set<string>(dbDepartments.map((d) => d.name));
    const leaveTypesSet = new Set<string>(dbLeaveTypes.map((lt) => lt.name));

    dbLeaves.forEach((item) => {
      if (item.employee?.department_rel?.name)
        departmentsSet.add(item.employee.department_rel.name);
      if (item.leave_type_rel?.name) leaveTypesSet.add(item.leave_type_rel.name);
    });

    res.sendSuccess({
      message: "Leave filter options retrieved successfully",
      data: {
        departments: Array.from(departmentsSet).sort(),
        leaveTypes: Array.from(leaveTypesSet).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller allowing an employee to apply for a leave
 *
 * @param req - Express request with leave application payload
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const createLeave = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let { employee_id, leave_type, leave_type_id, start_date, end_date, reason } = req.body;

    if (!employee_id && req.user?.employee_db_id) {
      employee_id = req.user.employee_db_id;
    }

    if (!employee_id) {
      const firstEmp = await prisma.employee.findFirst({
        orderBy: { id: "asc" },
      });
      if (firstEmp) employee_id = firstEmp.id;
    }

    if (!employee_id || (!leave_type && !leave_type_id) || !start_date || !end_date) {
      res.sendError({
        statusCode: 400,
        message: "Employee ID, leave type, start date, and end date are required",
      });
      return;
    }

    let resolvedEmpId: number;
    if (typeof employee_id === "number") {
      resolvedEmpId = employee_id;
    } else {
      const parsed = parseInt(String(employee_id), 10);
      if (!isNaN(parsed) && String(parsed) === String(employee_id)) {
        resolvedEmpId = parsed;
      } else {
        const emp = await prisma.employee.findFirst({
          where: { employee_id: String(employee_id) },
        });
        if (!emp) {
          res.sendError({
            statusCode: 404,
            message: `Employee with ID ${employee_id} not found`,
          });
          return;
        }
        resolvedEmpId = emp.id;
      }
    }

    let resolvedLeaveTypeId: number | null = null;
    if (leave_type_id) {
      resolvedLeaveTypeId = Number(leave_type_id);
    } else if (leave_type) {
      const lt = await prisma.leaveType.findFirst({
        where: {
          OR: [
            { name: { equals: String(leave_type), mode: "insensitive" } },
            { code: { equals: String(leave_type), mode: "insensitive" } },
          ],
        },
      });
      if (lt) resolvedLeaveTypeId = lt.id;
    }

    if (!resolvedLeaveTypeId) {
      const defaultLt = await prisma.leaveType.findFirst({
        where: { status: "Active" },
        orderBy: { id: "asc" },
      });
      if (defaultLt) resolvedLeaveTypeId = defaultLt.id;
    }

    if (!resolvedLeaveTypeId) {
      res.sendError({
        statusCode: 400,
        message: "A valid leave type is required",
      });
      return;
    }

    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      res.sendError({
        statusCode: 400,
        message: "Invalid start or end date format",
      });
      return;
    }

    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const leaveCode = `LV-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const approvalToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newLeave = await prisma.leave.create({
      data: {
        leave_code: leaveCode,
        employee_id: resolvedEmpId,
        leave_type_id: resolvedLeaveTypeId,
        start_date: startDateObj,
        end_date: endDateObj,
        days_count: daysCount,
        reason: reason || "Personal time off request",
        status: "Pending",
        approval_token: approvalToken,
        approval_token_expires: expiresAt,
      },
      include: { employee: true, leave_type_rel: true },
    });

    if (newLeave.employee.manager_id) {
      const manager = await prisma.employee.findUnique({
        where: { id: newLeave.employee.manager_id },
      });
      if (manager && manager.email) {
        sendLeaveApprovalEmail({
          managerName: manager.name,
          managerEmail: manager.email,
          employeeName: newLeave.employee.name,
          leaveType: newLeave.leave_type_rel.name,
          startDate: newLeave.start_date.toISOString().split("T")[0],
          endDate: newLeave.end_date.toISOString().split("T")[0],
          daysCount: newLeave.days_count,
          reason: newLeave.reason,
          approvalToken,
        }).catch((err) => {
          logger.error("Failed to send leave approval email to manager:", err);
        });
      }
    }

    res.sendSuccess({
      message: "Leave application submitted successfully",
      data: {
        id: newLeave.leave_code,
        db_id: newLeave.id,
        leave_code: newLeave.leave_code,
        employee_name: newLeave.employee.name,
        leave_type_id: newLeave.leave_type_id,
        leave_type: newLeave.leave_type_rel.name,
        start_date: newLeave.start_date.toISOString().split("T")[0],
        end_date: newLeave.end_date.toISOString().split("T")[0],
        days_count: newLeave.days_count,
        reason: newLeave.reason,
        status: newLeave.status,
        applied_on: newLeave.created_at.toISOString().split("T")[0],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to retrieve an employee's personal leave requests and balance quotas
 *
 * @param req - Express request with optional employee_id or token context
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getMyLeaves = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let employeeId = req.query.employee_id
      ? Number(req.query.employee_id)
      : req.user?.employee_db_id;

    if (!employeeId && req.query.employee_code) {
      const emp = await prisma.employee.findFirst({
        where: { employee_id: String(req.query.employee_code) },
      });
      if (emp) employeeId = emp.id;
    }

    if (!employeeId) {
      const firstEmp = await prisma.employee.findFirst({
        orderBy: { id: "asc" },
      });
      if (firstEmp) employeeId = firstEmp.id;
    }

    if (!employeeId) {
      res.sendError({
        statusCode: 400,
        message: "Employee ID is required",
      });
      return;
    }

    const records = await prisma.leave.findMany({
      where: { employee_id: employeeId },
      orderBy: { created_at: "desc" },
      include: { employee: true, leave_type_rel: true },
    });

    const formattedHistory = records.map((item) => ({
      id: item.leave_code,
      db_id: item.id,
      leave_code: item.leave_code,
      leave_type_id: item.leave_type_id,
      leave_type: item.leave_type_rel?.name || "Leave",
      start_date: item.start_date.toISOString().split("T")[0],
      end_date: item.end_date.toISOString().split("T")[0],
      days_count: item.days_count,
      reason: item.reason,
      status: item.status,
      applied_on: item.created_at.toISOString().split("T")[0],
    }));

    const activeLeaveTypes = await prisma.leaveType.findMany({
      where: { status: "Active" },
      orderBy: { created_at: "asc" },
    });

    const currentYear = new Date().getFullYear();
    const dynamicBalances = await Promise.all(
      activeLeaveTypes.map(async (lt) => {
        let balance = await prisma.leaveBalance.findUnique({
          where: {
            employee_id_leave_type_id_year: {
              employee_id: employeeId,
              leave_type_id: lt.id,
              year: currentYear,
            },
          },
        });

        if (!balance) {
          const usedFromRecords = records
            .filter((r) => r.status === "Approved" && r.leave_type_id === lt.id)
            .reduce((sum, r) => sum + r.days_count, 0);

          balance = await prisma.leaveBalance.create({
            data: {
              employee_id: employeeId,
              leave_type_id: lt.id,
              year: currentYear,
              allocated: lt.days_per_year,
              used: usedFromRecords,
              remaining: Math.max(0, lt.days_per_year - usedFromRecords),
            },
          });
        }

        return {
          id: lt.id,
          name: lt.name,
          code: lt.code,
          total: balance.allocated,
          used: balance.used,
          remaining: balance.remaining,
          color: lt.color || "#4f46e5",
          is_paid: lt.is_paid,
        };
      }),
    );

    const resolveQuota = (
      keyword: string,
      fallbackTotal: number,
    ): { total: number; used: number; remaining: number } => {
      const found = dynamicBalances.find((item) =>
        item.name.toLowerCase().includes(keyword.toLowerCase()),
      );
      if (found) {
        return {
          total: found.total,
          used: found.used,
          remaining: found.remaining,
        };
      }
      return {
        total: fallbackTotal,
        used: 0,
        remaining: fallbackTotal,
      };
    };

    const pendingCount = records.filter((r) => r.status === "Pending").length;

    res.sendSuccess({
      message: "Personal leaves retrieved successfully",
      data: {
        balances: {
          annual: resolveQuota("Annual", 18),
          sick: resolveQuota("Sick", 10),
          casual: resolveQuota("Casual", 12),
          pending_requests: pendingCount,
          list: dynamicBalances,
        },
        history: formattedHistory,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch leave details using a one-time approval token
 *
 * @param req - Express request with token param
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getLeaveByApprovalToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.params.token as string;
    if (!token) {
      res.sendError({ statusCode: 400, message: "Token is required" });
      return;
    }

    const leave = await prisma.leave.findFirst({
      where: { approval_token: token },
      include: { employee: true, leave_type_rel: true },
    });

    if (!leave) {
      res.sendError({ statusCode: 404, message: "Invalid or expired token" });
      return;
    }

    if (leave.status !== "Pending") {
      res.sendError({ statusCode: 400, message: "This request has already been processed" });
      return;
    }

    if (leave.approval_token_expires && new Date() > leave.approval_token_expires) {
      res.sendError({ statusCode: 400, message: "Approval link has expired" });
      return;
    }

    res.sendSuccess({
      message: "Leave request found",
      data: {
        id: leave.leave_code,
        employee_name: leave.employee.name,
        leave_type_id: leave.leave_type_id,
        leave_type: leave.leave_type_rel.name,
        start_date: leave.start_date.toISOString().split("T")[0],
        end_date: leave.end_date.toISOString().split("T")[0],
        days_count: leave.days_count,
        reason: leave.reason,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to process leave approval/rejection via one-time token
 *
 * @param req - Express request with token param and status body
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const processLeaveApproval = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.params.token as string;
    const { status } = req.body;

    if (!token) {
      res.sendError({ statusCode: 400, message: "Token is required" });
      return;
    }

    if (status !== "Approved" && status !== "Rejected") {
      res.sendError({ statusCode: 400, message: "Invalid status action" });
      return;
    }

    const leave = await prisma.leave.findFirst({
      where: { approval_token: token },
    });

    if (!leave) {
      res.sendError({ statusCode: 404, message: "Invalid or expired token" });
      return;
    }

    if (leave.status !== "Pending") {
      res.sendError({ statusCode: 400, message: "This request has already been processed" });
      return;
    }

    if (leave.approval_token_expires && new Date() > leave.approval_token_expires) {
      res.sendError({ statusCode: 400, message: "Approval link has expired" });
      return;
    }

    const updated = await prisma.leave.update({
      where: { id: leave.id },
      data: {
        status,
        approval_token: null,
        approval_token_expires: null,
      },
    });

    if (status === "Approved") {
      const year = new Date(leave.start_date).getFullYear();
      await adjustLeaveBalance(leave.employee_id, leave.leave_type_id, year, leave.days_count);
    }

    res.sendSuccess({
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: { status: updated.status },
    });
  } catch (err) {
    next(err);
  }
};
