import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { generateExcelBuffer } from "../services/excel.service";

/**
 * Controller to retrieve all payroll records with optional filtering
 *
 * @param req - Express request with optional query params `search`, `status`
 * @param res - Express response with augmented response helpers
 * @param next - Next middleware delegate
 */
export const getPayroll = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";
    const department = (req.query.department as string) || "All";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const whereClause: {
      AND?: Array<Record<string, unknown>>;
      status?: string;
      pay_date?: { gte?: Date; lte?: Date };
      employee?: { department?: string };
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search.trim()) {
      andConditions.push({
        OR: [
          { payroll_code: { contains: search, mode: "insensitive" } },
          {
            employee: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { role: { contains: search, mode: "insensitive" } },
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
      whereClause.pay_date = dateFilter;
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const records = await prisma.payroll.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        employee: true,
      },
    });

    const formatted = records.map((item) => ({
      id: item.payroll_code,
      db_id: item.id,
      name: item.employee.name,
      email: item.employee.email,
      role: item.employee.role,
      department: item.employee.department,
      base_salary: `$${Number(item.base_salary).toLocaleString()}`,
      allowance: Number(item.allowance) > 0 ? `+$${Number(item.allowance).toLocaleString()}` : "$0",
      net_pay: `$${Number(item.net_pay).toLocaleString()}`,
      status: item.status as "Processed" | "Pending" | "On Hold",
      pay_date: item.pay_date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      avatar: item.employee.avatar || undefined,
    }));

    res.sendSuccess({
      message: "Payroll records fetched successfully",
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to compute payroll operation KPI cards
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getPayrollStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const records = await prisma.payroll.findMany();
    const totalNet = records.reduce((acc, curr) => acc + Number(curr.net_pay), 0);
    const avgSalary = records.length > 0 ? Math.round(totalNet / records.length) * 12 : 89200;
    const pendingCount = await prisma.payroll.count({ where: { status: "Pending" } });

    const cards = [
      {
        id: "total-payroll",
        title: "Total Monthly Payroll",
        value: `$${totalNet > 0 ? totalNet.toLocaleString() : "182,450"}`,
        subtext: "Calculated across active workforce",
        icon_name: "Wallet",
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "avg-salary",
        title: "Average Salary",
        value: `$${avgSalary.toLocaleString()}`,
        subtext: "Annualized compensation benchmark",
        icon_name: "TrendingUp",
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "pending-disbursements",
        title: "Pending Approval",
        value: "$24,800",
        subtext: `${pendingCount} payroll batch cycles awaiting signoff`,
        icon_name: "Clock",
        icon_color: "text-[#ff8b25]",
        icon_bg: "bg-[#ff8b25]/10",
      },
      {
        id: "next-pay-date",
        title: "Next Pay Date",
        value: "Sep 15, 2024",
        subtext: "Scheduled disbursement cycle",
        icon_name: "Calendar",
        icon_color: "text-[#ad87ed]",
        icon_bg: "bg-[#ad87ed]/10",
      },
    ];

    res.sendSuccess({
      message: "Payroll statistics fetched successfully",
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to export payroll records as an Excel (.xlsx) spreadsheet
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const exportPayroll = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payrolls = await prisma.payroll.findMany({
      orderBy: { created_at: "desc" },
      include: {
        employee: true,
      },
    });

    const exportData = payrolls.map((pay) => {
      const base = Number(pay.base_salary);
      const allowance = Number(pay.allowance);
      const net = Number(pay.net_pay);
      const deductions = Math.max(0, base + allowance - net);

      return {
        "Payroll Code": pay.payroll_code,
        Employee: pay.employee?.name || "Unknown",
        Department: pay.employee?.department || "General",
        Role: pay.employee?.role || "General",
        "Base Salary": `$${base.toLocaleString()}`,
        Allowances: `$${allowance.toLocaleString()}`,
        Deductions: `$${deductions.toLocaleString()}`,
        "Net Salary": `$${net.toLocaleString()}`,
        Status: pay.status,
        "Pay Date": pay.pay_date ? pay.pay_date.toISOString().split("T")[0] : "",
      };
    });

    const buffer = await generateExcelBuffer("Payroll", exportData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="Payroll_Export.xlsx"');

    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch dynamic payroll filter options (departments) directly from database
 *
 * @param _req - Express request instance
 * @param res - Express response with sendSuccess helper
 * @param next - Express next middleware function
 */
export const getPayrollFilters = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dbDepartments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbPayroll = await prisma.payroll.findMany({
      select: {
        employee: {
          select: { department: true },
        },
      },
    });

    const departmentsSet = new Set<string>(dbDepartments.map((d) => d.name));

    dbPayroll.forEach((item) => {
      if (item.employee?.department) departmentsSet.add(item.employee.department);
    });

    res.sendSuccess({
      message: "Payroll filter options retrieved successfully",
      data: {
        departments: Array.from(departmentsSet).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update payroll record status (Paid, Pending, On Hold)
 *
 * @param req - Express request with payroll ID and new status
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const updatePayrollStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status } = req.body;

    const existing = await prisma.payroll.findFirst({
      where: {
        OR: [{ payroll_code: id }, { id: !isNaN(Number(id)) ? Number(id) : undefined }],
      },
      include: { employee: true },
    });

    if (!existing) {
      res.sendError({
        statusCode: 404,
        message: "Payroll record not found",
      });
      return;
    }

    const updated = await prisma.payroll.update({
      where: { id: existing.id },
      data: {
        status: status || existing.status,
      },
      include: { employee: true },
    });

    res.sendSuccess({
      message: `Payroll status updated to ${status || existing.status} successfully`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to retrieve an employee's personal payroll history and salary slips
 *
 * @param req - Express request with optional employee_id or token context
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getMyPayroll = async (
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

    const records = await prisma.payroll.findMany({
      where: { employee_id: employeeId },
      orderBy: { pay_date: "desc" },
      include: { employee: true },
    });

    const formattedSlips = records.map((item) => {
      const baseNum = Number(item.base_salary);
      const allowNum = Number(item.allowance);
      const netNum = Number(item.net_pay);
      const dateObj = new Date(item.pay_date);
      const monthStr = dateObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      return {
        id: item.payroll_code,
        db_id: item.id,
        payroll_code: item.payroll_code,
        base_salary: baseNum,
        allowance: allowNum,
        net_pay: netNum,
        formatted_base: `$${baseNum.toLocaleString()}`,
        formatted_allowance: allowNum > 0 ? `+$${allowNum.toLocaleString()}` : "$0",
        formatted_net_pay: `$${netNum.toLocaleString()}`,
        status: item.status,
        pay_date: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        month_label: monthStr,
        employee_name: item.employee.name,
        role: item.employee.role,
        department: item.employee.department,
      };
    });

    const ytdTotal = formattedSlips.reduce((sum, item) => sum + item.net_pay, 0);

    res.sendSuccess({
      message: "Personal payroll records retrieved successfully",
      data: {
        latest: formattedSlips[0] || null,
        ytd_earnings: `$${ytdTotal.toLocaleString()}`,
        slips: formattedSlips,
      },
    });
  } catch (err) {
    next(err);
  }
};

