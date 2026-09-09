import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { generateExcelBuffer } from "../services/excel.service";
import { generateDailyAttendance } from "../services/cron.service";

/**
 * Controller to retrieve all attendance records with optional filtering
 *
 * @param req - Express request with optional query params `search`, `status`
 * @param res - Express response with augmented response helpers
 * @param next - Next middleware delegate
 */
export const getAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";
    const department = (req.query.department as string) || "All";
    const location = (req.query.location as string) || "All";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const whereClause: {
      AND?: Array<Record<string, unknown>>;
      status?: string;
      location?: string;
      date?: { gte?: Date; lte?: Date };
      employee?: { department?: string };
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search.trim()) {
      andConditions.push({
        OR: [
          { record_id: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          {
            employee: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { department: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    }

    if (status !== "All") {
      whereClause.status = status;
    }
    if (location !== "All") {
      whereClause.location = location;
    }
    if (department !== "All") {
      whereClause.employee = { department };
    }
    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      whereClause.date = dateFilter;
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        employee: true,
      },
    });

    const formatted = records.map((item) => ({
      id: item.record_id,
      db_id: item.id,
      name: item.employee.name,
      email: item.employee.email,
      department: item.employee.department,
      check_in: item.check_in || "--:--",
      check_out: item.check_out || "--:--",
      work_hours: item.work_hours || "0h 00m",
      status: item.status as "Present" | "Late" | "Absent" | "Remote",
      location: item.location,
      avatar: item.employee.avatar || undefined,
    }));

    res.sendSuccess({
      message: "Attendance records fetched successfully",
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to compute daily attendance KPI cards
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getAttendanceStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const headerTz = (req.headers["x-timezone"] as string | undefined) || undefined;
    const queryTz = (req.query.timezone as string | undefined) || undefined;
    const targetTz = resolveTimezone(queryTz || headerTz);

    const department = (req.query.department as string | undefined) || "All";
    const location = (req.query.location as string | undefined) || "All";

    const startDateStr =
      (req.query.startDate as string | undefined) ||
      (req.query.date as string | undefined) ||
      new Date().toLocaleDateString("en-CA", { timeZone: targetTz });

    const endDateStr = (req.query.endDate as string | undefined) || startDateStr;

    const start = new Date(`${startDateStr}T00:00:00.000Z`);
    const end = new Date(`${endDateStr}T23:59:59.999Z`);

    const employeeWhere: { status?: string; department?: string } = {
      status: "Active",
    };
    if (department !== "All") {
      employeeWhere.department = department;
    }
    const totalEmployees = await prisma.employee.count({ where: employeeWhere });

    const attendanceWhere: {
      date: { gte: Date; lte: Date };
      location?: string;
      employee?: { department?: string };
    } = {
      date: { gte: start, lte: end },
    };

    if (location !== "All") {
      attendanceWhere.location = location;
    }
    if (department !== "All") {
      attendanceWhere.employee = { department };
    }

    const records = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: { employee: true },
    });

    const presentCount = records.filter((r) => r.status === "Present").length;
    const lateCount = records.filter((r) => r.status === "Late").length;
    const remoteCount = records.filter((r) => r.status === "Remote").length;
    const explicitAbsentCount = records.filter((r) => r.status === "Absent").length;
    const onLeaveCount = records.filter((r) => r.status === "On Leave").length;

    const onTimeCount = presentCount;
    const totalPresent = presentCount + lateCount + remoteCount;

    /**
     * For single-day queries like Today, employees on leave, absent, or unrecorded are counted in absent card
     */
    const isSingleDay = startDateStr === endDateStr;
    const recordedEmpIds = new Set(records.map((r) => r.employee_id));
    const unrecordedCount = Math.max(0, totalEmployees - recordedEmpIds.size);
    const absentCount = isSingleDay
      ? explicitAbsentCount + onLeaveCount + unrecordedCount
      : explicitAbsentCount + onLeaveCount;

    const cards = [
      {
        id: "present-today",
        title: isSingleDay ? "Present Today" : "Total Present",
        value: `${totalPresent} / ${totalEmployees > 0 ? totalEmployees : records.length}`,
        subtext: "Active workforce attendance",
        icon_name: "HowToReg",
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "on-time",
        title: "On Time",
        value: String(onTimeCount),
        subtext: "Punctuality compliance",
        icon_name: "CheckCircle",
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "late-arrivals",
        title: "Late Arrivals",
        value: String(lateCount),
        subtext: "Flagged after scheduled shift start",
        icon_name: "AccessTime",
        icon_color: "text-[#ff8b25]",
        icon_bg: "bg-[#ff8b25]/10",
      },
      {
        id: "absent",
        title: "Absent",
        value: String(absentCount),
        subtext: "Planned leaves and unaccounted call-ins",
        icon_name: "PersonOff",
        icon_color: "text-[#f14d4c]",
        icon_bg: "bg-[#f14d4c]/10",
      },
    ];

    res.sendSuccess({
      message: "Attendance statistics fetched successfully",
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to export attendance records as an Excel (.xlsx) spreadsheet
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const exportAttendance = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const records = await prisma.attendance.findMany({
      orderBy: { date: "desc" },
      include: {
        employee: true,
      },
    });

    const exportData = records.map((rec) => ({
      "Record ID": rec.record_id,
      Employee: rec.employee?.name || "Unknown",
      Department: rec.employee?.department || "General",
      Date: rec.date ? rec.date.toISOString().split("T")[0] : "",
      "Check In": rec.check_in || "--:--",
      "Check Out": rec.check_out || "--:--",
      "Work Hours": rec.work_hours || "--",
      Status: rec.status,
      Location: rec.location,
    }));

    const buffer = await generateExcelBuffer("Attendance", exportData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="Attendance_Export.xlsx"');

    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch dynamic attendance filter options (departments, locations) directly from database
 *
 * @param _req - Express request instance
 * @param res - Express response with sendSuccess helper
 * @param next - Express next middleware function
 */
export const getAttendanceFilters = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dbDepartments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbAttendance = await prisma.attendance.findMany({
      select: {
        location: true,
        employee: {
          select: { department: true },
        },
      },
    });

    const departmentsSet = new Set<string>(dbDepartments.map((d) => d.name));
    const locationsSet = new Set<string>();

    dbAttendance.forEach((item) => {
      if (item.employee?.department) departmentsSet.add(item.employee.department);
      if (item.location) locationsSet.add(item.location);
    });

    res.sendSuccess({
      message: "Attendance filter options retrieved successfully",
      data: {
        departments: Array.from(departmentsSet).sort(),
        locations: Array.from(locationsSet).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update attendance record status (Present, Late, Absent, Remote)
 *
 * @param req - Express request with attendance ID and new status
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const updateAttendanceStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, check_in, check_out, location, work_hours } = req.body;

    const existing = await prisma.attendance.findFirst({
      where: {
        OR: [{ record_id: id }, { id: !isNaN(Number(id)) ? Number(id) : undefined }],
      },
      include: { employee: true },
    });

    if (!existing) {
      res.sendError({
        statusCode: 404,
        message: "Attendance record not found",
      });
      return;
    }

    const effectiveCheckIn = check_in !== undefined ? check_in : existing.check_in;
    const effectiveCheckOut = check_out !== undefined ? check_out : existing.check_out;
    let computedWorkHours = work_hours !== undefined ? work_hours : existing.work_hours;

    if (
      !work_hours &&
      effectiveCheckIn &&
      effectiveCheckOut &&
      effectiveCheckIn !== "--:--" &&
      effectiveCheckOut !== "--:--"
    ) {
      computedWorkHours = calculateElapsedWorkHours(
        effectiveCheckIn,
        effectiveCheckOut,
        existing.date,
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        status: status || existing.status,
        check_in: effectiveCheckIn,
        check_out: effectiveCheckOut,
        work_hours: computedWorkHours,
        location: location || existing.location,
      },
      include: { employee: true },
    });

    res.sendSuccess({
      message: `Attendance marked as ${status || existing.status} successfully`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Interface representing the attendance fields to update during punch
 */
interface PunchUpdatePayload {
  check_in?: string;
  check_out?: string;
  status?: string;
  location?: string;
  work_hours?: string;
}

/**
 * Application-wide fixed timezone constant pinned to Asia/Kolkata
 */
export const APP_TIMEZONE = "Asia/Kolkata";

/**
 * Returns the fixed application timezone
 *
 * @param _clientTz - Unused client timezone argument
 * @param _userTz - Unused user timezone argument
 * @returns Standard timezone string always pinned to Asia/Kolkata
 */
export const resolveTimezone = (_clientTz?: string | null, _userTz?: string | null): string => {
  return APP_TIMEZONE;
};

/**
 * Computes elapsed work hours and minutes between check-in time and check-out time
 *
 * @param checkInTimeStr - Check-in time string (e.g. "04:46 PM" or "09:00 AM")
 * @param checkOut - Check-out time string (e.g. "05:56 PM") or Date timestamp instance
 * @param recordDate - Base attendance date
 * @param timeZone - Timezone string to use when checkOut is a Date
 * @returns Formatted duration string (e.g. "0h 02m" or "7h 45m")
 */
export const calculateElapsedWorkHours = (
  checkInTimeStr: string,
  checkOut: string | Date,
  recordDate?: Date,
  timeZone: string = "Asia/Kolkata",
): string => {
  const matchIn = checkInTimeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!matchIn) return "0h 00m";

  let inHours = parseInt(matchIn[1], 10);
  const inMinutes = parseInt(matchIn[2], 10);
  const inMod = matchIn[3]?.toUpperCase();

  if (inMod === "PM" && inHours < 12) inHours += 12;
  if (inMod === "AM" && inHours === 12) inHours = 0;
  const inTotal = inHours * 60 + inMinutes;

  let outTotal: number;

  if (typeof checkOut === "string") {
    const matchOut = checkOut.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!matchOut) return "0h 00m";
    let outHours = parseInt(matchOut[1], 10);
    const outMinutes = parseInt(matchOut[2], 10);
    const outMod = matchOut[3]?.toUpperCase();
    if (outMod === "PM" && outHours < 12) outHours += 12;
    if (outMod === "AM" && outHours === 12) outHours = 0;
    outTotal = outHours * 60 + outMinutes;
  } else {
    const outTimeStr = checkOut.toLocaleTimeString("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return calculateElapsedWorkHours(checkInTimeStr, outTimeStr, recordDate, timeZone);
  }

  let diffMinutes = outTotal - inTotal;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }

  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  const mStr = m < 10 ? `0${m}` : `${m}`;

  return `${h}h ${mStr}m`;
};

/**
 * Controller to handle real-time attendance punch in/out
 *
 * @param req - Express request with action (check-in/check-out) and optional location/employee_id
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const punchAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let { employee_id, action, location } = req.body;

    if (!employee_id && req.user?.employee_db_id) {
      employee_id = req.user.employee_db_id;
    }

    if (!employee_id) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const user = await prisma.user.findFirst({
          where: { employee_id: { not: "" } },
        });
        if (user && user.employee_id) {
          const emp = await prisma.employee.findFirst({
            where: { employee_id: user.employee_id },
          });
          if (emp) employee_id = emp.id;
        }
      }
    }

    if (!employee_id || !action) {
      res.sendError({
        statusCode: 400,
        message: "Missing employee_id or action (check-in/check-out)",
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

    const headerTz = (req.headers["x-timezone"] as string | undefined) || undefined;
    const bodyTz = (req.body.timezone as string | undefined) || undefined;

    const emp = await prisma.employee.findUnique({
      where: { id: resolvedEmpId },
      include: { user: true },
    });

    const targetTz = resolveTimezone(bodyTz || headerTz, emp?.user?.timezone);

    const now = new Date();
    const localDateString =
      (req.body.date as string | undefined) ||
      now.toLocaleDateString("en-CA", { timeZone: targetTz });
    const recordId = `ATT-${resolvedEmpId}-${localDateString}`;

    let existing = await prisma.attendance.findUnique({
      where: { record_id: recordId },
    });

    if (!existing) {
      const recordDate = new Date(`${localDateString}T00:00:00.000Z`);
      existing = await prisma.attendance.create({
        data: {
          record_id: recordId,
          employee_id: resolvedEmpId,
          date: recordDate,
          status: "Absent",
          location: location || "Office",
          check_in: null,
          check_out: null,
          work_hours: null,
        },
      });
    }

    const timeString =
      (req.body.time as string | undefined) ||
      now.toLocaleTimeString("en-US", {
        timeZone: targetTz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    const updatedData: PunchUpdatePayload = {};

    if (action === "check-in") {
      const matchTime = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      let punchHour = matchTime ? parseInt(matchTime[1], 10) : 0;
      const punchMod = matchTime?.[3]?.toUpperCase();
      if (punchMod === "PM" && punchHour < 12) punchHour += 12;
      if (punchMod === "AM" && punchHour === 12) punchHour = 0;
      const isLate = punchHour >= 10;

      updatedData.check_in = timeString;
      updatedData.status = isLate ? "Late" : "Present";
      if (location) updatedData.location = location;
    } else if (action === "check-out") {
      updatedData.check_out = timeString;
      if (existing.check_in) {
        updatedData.work_hours = calculateElapsedWorkHours(
          existing.check_in,
          timeString,
          existing.date,
          targetTz,
        );
      }
    }

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: updatedData,
      include: { employee: true },
    });

    res.sendSuccess({
      message: `Successfully punched ${action} for today`,
      data: {
        id: updated.record_id,
        db_id: updated.id,
        employee_id: updated.employee_id,
        name: updated.employee.name,
        date: updated.date.toISOString().split("T")[0],
        check_in: updated.check_in || "--:--",
        check_out: updated.check_out || "--:--",
        work_hours: updated.work_hours || "0h 00m",
        status: updated.status,
        location: updated.location,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to retrieve an employee's personal attendance history and today's punch state
 *
 * @param req - Express request with employee_id query param or authorization context
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getMyAttendance = async (
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

    const headerTz = (req.headers["x-timezone"] as string | undefined) || undefined;
    const queryTz = (req.query.timezone as string | undefined) || undefined;
    let userTz: string | undefined;

    if (req.user?.id) {
      const authUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { timezone: true },
      });
      userTz = authUser?.timezone || undefined;
    }

    const targetTz = resolveTimezone(queryTz || headerTz, userTz);

    const todayDateStr =
      (req.query.date as string | undefined) ||
      new Date().toLocaleDateString("en-CA", { timeZone: targetTz });

    const records = await prisma.attendance.findMany({
      where: { employee_id: employeeId },
      orderBy: { date: "desc" },
      take: 30,
      include: { employee: true },
    });

    const todayRecord = records.find(
      (r) =>
        r.date.toISOString().split("T")[0] === todayDateStr ||
        r.record_id.endsWith(`-${todayDateStr}`),
    );

    const formattedHistory = records.map((item) => ({
      id: item.record_id,
      db_id: item.id,
      date: item.date.toISOString().split("T")[0],
      check_in: item.check_in || "--:--",
      check_out: item.check_out || "--:--",
      work_hours: item.work_hours || "0h 00m",
      status: item.status,
      location: item.location,
    }));

    const presentCount = records.filter((r) => r.status === "Present").length;
    const lateCount = records.filter((r) => r.status === "Late").length;
    const absentCount = records.filter((r) => r.status === "Absent").length;

    res.sendSuccess({
      message: "Personal attendance retrieved successfully",
      data: {
        today: todayRecord
          ? {
              id: todayRecord.record_id,
              db_id: todayRecord.id,
              date: todayRecord.date.toISOString().split("T")[0],
              check_in: todayRecord.check_in || "--:--",
              check_out: todayRecord.check_out || "--:--",
              work_hours: todayRecord.work_hours || "0h 00m",
              status: todayRecord.status,
              location: todayRecord.location,
            }
          : null,
        stats: {
          present_days: presentCount,
          late_days: lateCount,
          absent_days: absentCount,
          total_days: records.length,
        },
        history: formattedHistory,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to manually trigger daily attendance initialization for all active employees
 *
 * @param req - Express request with optional date body parameter
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const triggerDailyAttendanceCron = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const targetDate = req.body?.date as string | undefined;
    const result = await generateDailyAttendance(targetDate);

    res.sendSuccess({
      message: `Daily attendance initialized: created ${result.createdCount} new records for ${result.date}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
