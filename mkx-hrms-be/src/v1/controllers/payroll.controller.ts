import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { generateExcelBuffer } from "../services/excel.service";
import { PayrollPreviewItem } from "../../types/payroll.types";

/**
 * Controller to retrieve all payroll records with optional filtering
 *
 * @param req - Express request with optional query params `search`, `status`, `department`, `startDate`, `endDate`
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
      employee?: { department_rel?: { name?: string } };
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
                { role_rel: { name: { contains: search, mode: "insensitive" } } },
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
    if (department !== "All") {
      whereClause.employee = {
        department_rel: { name: department },
      };
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

    const records = await (
      prisma.payroll as unknown as {
        findMany: (args: unknown) => Promise<
          Array<{
            id: number;
            payroll_code: string;
            employee_id: number;
            month?: number;
            year?: number;
            gross_pay?: unknown;
            total_deductions?: unknown;
            net_pay: unknown;
            working_days?: number;
            paid_days?: unknown;
            lop_days?: unknown;
            lop_amount?: unknown;
            status: string;
            pay_date: Date;
            employee: {
              name: string;
              email: string;
              avatar: string | null;
              role_rel?: { name: string } | null;
              department_rel?: { name: string } | null;
            };
            items?: Array<{
              id: number;
              name: string;
              code: string;
              category: string;
              amount: unknown;
              is_taxable: boolean;
            }>;
          }>
        >;
      }
    ).findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        employee: {
          include: {
            role_rel: true,
            department_rel: true,
          },
        },
        items: true,
      },
    });

    const formatted = records.map((item) => {
      const gross = Number(item.gross_pay || 0);
      const deductions = Number(item.total_deductions || 0);
      const net = Number(item.net_pay || 0);

      return {
        id: item.payroll_code,
        db_id: item.id,
        payroll_code: item.payroll_code,
        name: item.employee.name,
        email: item.employee.email,
        role: item.employee.role_rel?.name || "Staff",
        department: item.employee.department_rel?.name || "General",
        month: item.month,
        year: item.year,
        gross_pay: `$${gross.toLocaleString()}`,
        total_deductions: `$${deductions.toLocaleString()}`,
        net_pay: `$${net.toLocaleString()}`,
        raw_gross: gross,
        raw_deductions: deductions,
        raw_net: net,
        working_days: item.working_days ?? 30,
        paid_days: Number(item.paid_days ?? 30),
        lop_days: Number(item.lop_days ?? 0),
        lop_amount: Number(item.lop_amount ?? 0),
        items:
          item.items?.map((it) => ({
            id: it.id,
            name: it.name,
            code: it.code,
            category: it.category,
            amount: Number(it.amount),
            is_taxable: it.is_taxable,
          })) || [],
        status: item.status as "Processed" | "Pending" | "On Hold" | "Paid",
        pay_date: item.pay_date.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        avatar: item.employee.avatar || undefined,
      };
    });

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
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    const records = await prisma.payroll.findMany();
    const totalNet = records.reduce((acc, curr) => acc + Number(curr.net_pay), 0);
    const avgSalary = records.length > 0 ? Math.round(totalNet / records.length) * 12 : 0;

    const pendingRecords = await prisma.payroll.findMany({ where: { status: "Pending" } });
    const pendingTotal = pendingRecords.reduce((acc, curr) => acc + Number(curr.net_pay), 0);
    const pendingCount = pendingRecords.length;

    /**
     * Locate the next scheduled disbursement date from future payroll records
     */
    const upcomingPayroll = await prisma.payroll.findFirst({
      where: {
        pay_date: { gte: todayDate },
      },
      orderBy: { pay_date: "asc" },
    });

    const nextPayDateStr = upcomingPayroll
      ? upcomingPayroll.pay_date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        );

    const cards = [
      {
        id: "total-payroll",
        title: "Total Monthly Payroll",
        value: `$${totalNet.toLocaleString()}`,
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
        value: `$${pendingTotal.toLocaleString()}`,
        subtext: `${pendingCount} payroll batch cycles awaiting signoff`,
        icon_name: "Clock",
        icon_color: "text-[#ff8b25]",
        icon_bg: "bg-[#ff8b25]/10",
      },
      {
        id: "next-pay-date",
        title: "Next Pay Date",
        value: nextPayDateStr,
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
 * Controller to generate payroll for a given month and year
 * Supports preview dry-run or atomic database persistence
 *
 * @param req - Express request with month, year, department_id, employee_ids, preview
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const generatePayroll = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      department_id,
      employee_ids,
      preview = false,
    } = req.body as {
      month?: number;
      year?: number;
      department_id?: number;
      employee_ids?: number[];
      preview?: boolean;
    };

    const targetMonth = Number(month);
    const targetYear = Number(year);
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    const employeeWhere: {
      status: string;
      department_id?: number;
      id?: { in: number[] };
    } = {
      status: "Active",
    };

    if (department_id) {
      employeeWhere.department_id = Number(department_id);
    }

    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      employeeWhere.id = { in: employee_ids.map((id) => Number(id)) };
    }

    const employees = await (
      prisma.employee as unknown as {
        findMany: (args: unknown) => Promise<
          Array<{
            id: number;
            employee_id: string;
            name: string;
            email: string;
            role_rel?: { name: string } | null;
            department_rel?: { name: string } | null;
            salary_structures: Array<{
              id: number;
              amount: unknown;
              status: string;
              salary_structure: {
                id: number;
                name: string;
                code: string;
                is_deduction: boolean;
                is_taxable: boolean;
                is_base_salary: boolean;
              };
            }>;
            leaves: Array<{
              id: number;
              start_date: Date;
              end_date: Date;
              days_count: number;
              status: string;
              leave_type_rel: {
                is_paid: boolean;
              };
            }>;
          }>
        >;
      }
    ).findMany({
      where: employeeWhere,
      orderBy: { name: "asc" },
      include: {
        role_rel: true,
        department_rel: true,
        salary_structures: {
          where: { status: "Active" },
          include: { salary_structure: true },
        },
        leaves: {
          where: {
            status: "Approved",
            start_date: {
              gte: new Date(targetYear, targetMonth - 1, 1),
              lte: new Date(targetYear, targetMonth, 0, 23, 59, 59, 999),
            },
          },
          include: { leave_type_rel: true },
        },
      },
    });

    const calculatedRecords: PayrollPreviewItem[] = [];

    for (const emp of employees) {
      const earnings = emp.salary_structures.filter(
        (s) => !s.salary_structure.is_deduction,
      );
      const deductions = emp.salary_structures.filter(
        (s) => s.salary_structure.is_deduction,
      );

      const baseSalaryComponent =
        emp.salary_structures.find((s) => s.salary_structure.is_base_salary) ||
        earnings[0];

      const baseSalaryAmount = baseSalaryComponent ? Number(baseSalaryComponent.amount) : 0;
      const perDayBaseRate = daysInMonth > 0 ? baseSalaryAmount / daysInMonth : 0;

      const unpaidLeaves = emp.leaves.filter((l) => !l.leave_type_rel.is_paid);
      const lopDays = unpaidLeaves.reduce((sum, l) => sum + l.days_count, 0);
      const paidDays = Math.max(0, daysInMonth - lopDays);
      const lopAmount = Math.round(lopDays * perDayBaseRate * 100) / 100;

      const grossPay =
        Math.round(earnings.reduce((sum, e) => sum + Number(e.amount), 0) * 100) / 100;
      const regularDeductions =
        Math.round(deductions.reduce((sum, d) => sum + Number(d.amount), 0) * 100) / 100;
      const totalDeductions = Math.round((regularDeductions + lopAmount) * 100) / 100;
      const netPay = Math.max(0, Math.round((grossPay - totalDeductions) * 100) / 100);

      const items: PayrollPreviewItem["items"] = [];

      for (const e of earnings) {
        items.push({
          name: e.salary_structure.name,
          code: e.salary_structure.code,
          category: "Earning",
          amount: Number(e.amount),
          is_taxable: e.salary_structure.is_taxable,
          salary_structure_id: e.salary_structure.id,
        });
      }

      for (const d of deductions) {
        items.push({
          name: d.salary_structure.name,
          code: d.salary_structure.code,
          category: "Deduction",
          amount: Number(d.amount),
          is_taxable: false,
          salary_structure_id: d.salary_structure.id,
        });
      }

      if (lopAmount > 0) {
        items.push({
          name: `Loss of Pay (${lopDays} days)`,
          code: "LOP",
          category: "Deduction",
          amount: lopAmount,
          is_taxable: false,
          salary_structure_id: null,
        });
      }

      const warnings: string[] = [];
      if (emp.salary_structures.length === 0) {
        warnings.push("No salary structure components assigned");
      }

      calculatedRecords.push({
        employee_id: emp.id,
        employee_code: emp.employee_id,
        employee_name: emp.name,
        department: emp.department_rel?.name || "General",
        role: emp.role_rel?.name || "Staff",
        working_days: daysInMonth,
        paid_days: paidDays,
        lop_days: lopDays,
        lop_amount: lopAmount,
        gross_pay: grossPay,
        total_deductions: totalDeductions,
        net_pay: netPay,
        items,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    }

    if (preview) {
      res.sendSuccess({
        message: "Payroll calculation preview generated successfully",
        data: {
          month: targetMonth,
          year: targetYear,
          days_in_month: daysInMonth,
          employee_count: calculatedRecords.length,
          total_gross: calculatedRecords.reduce((sum, r) => sum + r.gross_pay, 0),
          total_deductions: calculatedRecords.reduce((sum, r) => sum + r.total_deductions, 0),
          total_net: calculatedRecords.reduce((sum, r) => sum + r.net_pay, 0),
          records: calculatedRecords,
        },
      });
      return;
    }

    const payDate = new Date(targetYear, targetMonth - 1, Math.min(daysInMonth, 28));

    const generatedPayrolls = await prisma.$transaction(async (tx) => {
      const results = [];
      const payrollClient = tx as unknown as {
        payroll: {
          upsert: (args: unknown) => Promise<{ id: number; payroll_code: string }>;
        };
        payrollItem: {
          deleteMany: (args: { where: { payroll_id: number } }) => Promise<unknown>;
          create: (args: unknown) => Promise<unknown>;
        };
      };

      for (let i = 0; i < calculatedRecords.length; i++) {
        const item = calculatedRecords[i];
        const monthCode = String(targetMonth).padStart(2, "0");
        const payrollCode = `PAY-${targetYear}-${monthCode}-${item.employee_code}`;

        const payroll = await payrollClient.payroll.upsert({
          where: {
            employee_id_month_year: {
              employee_id: item.employee_id,
              month: targetMonth,
              year: targetYear,
            },
          },
          update: {
            payroll_code: payrollCode,
            gross_pay: item.gross_pay,
            total_deductions: item.total_deductions,
            net_pay: item.net_pay,
            working_days: item.working_days,
            paid_days: item.paid_days,
            lop_days: item.lop_days,
            lop_amount: item.lop_amount,
            status: "Pending",
            pay_date: payDate,
          },
          create: {
            payroll_code: payrollCode,
            employee_id: item.employee_id,
            month: targetMonth,
            year: targetYear,
            gross_pay: item.gross_pay,
            total_deductions: item.total_deductions,
            net_pay: item.net_pay,
            working_days: item.working_days,
            paid_days: item.paid_days,
            lop_days: item.lop_days,
            lop_amount: item.lop_amount,
            status: "Pending",
            pay_date: payDate,
          },
        });

        await payrollClient.payrollItem.deleteMany({
          where: { payroll_id: payroll.id },
        });

        for (const line of item.items) {
          await payrollClient.payrollItem.create({
            data: {
              payroll_id: payroll.id,
              salary_structure_id: line.salary_structure_id || null,
              name: line.name,
              code: line.code,
              category: line.category,
              amount: line.amount,
              is_taxable: line.is_taxable,
            },
          });
        }

        results.push(payroll);
      }

      return results;
    });

    res.sendSuccess({
      message: `Successfully generated payroll for ${generatedPayrolls.length} employees`,
      data: {
        month: targetMonth,
        year: targetYear,
        count: generatedPayrolls.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update payroll statuses in bulk (e.g. mark pending batch as Processed or Paid)
 *
 * @param req - Express request with payroll_ids and optional status
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const processBatchPayroll = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { payroll_ids, status = "Processed" } = req.body as {
      payroll_ids: number[];
      status?: "Pending" | "Processed" | "Paid" | "On Hold";
    };

    if (!Array.isArray(payroll_ids) || payroll_ids.length === 0) {
      res.sendError({
        statusCode: 400,
        message: "payroll_ids array is required and must not be empty",
      });
      return;
    }

    const updated = await (
      prisma.payroll as unknown as {
        updateMany: (args: {
          where: { id: { in: number[] } };
          data: { status: string };
        }) => Promise<{ count: number }>;
      }
    ).updateMany({
      where: {
        id: { in: payroll_ids.map((id) => Number(id)) },
      },
      data: {
        status,
      },
    });

    res.sendSuccess({
      message: `Batch status updated to ${status} for ${updated.count} payroll records`,
      data: updated,
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
    const payrolls = await (
      prisma.payroll as unknown as {
        findMany: (args: unknown) => Promise<
          Array<{
            payroll_code: string;
            gross_pay?: unknown;
            total_deductions?: unknown;
            net_pay: unknown;
            lop_days?: unknown;
            lop_amount?: unknown;
            status: string;
            pay_date: Date;
            employee: {
              name: string;
              role_rel?: { name: string } | null;
              department_rel?: { name: string } | null;
            };
          }>
        >;
      }
    ).findMany({
      orderBy: { created_at: "desc" },
      include: {
        employee: {
          include: {
            role_rel: true,
            department_rel: true,
          },
        },
      },
    });

    const exportData = payrolls.map((pay) => {
      const gross = Number(pay.gross_pay || 0);
      const deductions = Number(pay.total_deductions || 0);
      const net = Number(pay.net_pay || 0);

      return {
        "Payroll Code": pay.payroll_code,
        Employee: pay.employee?.name || "Unknown",
        Department: pay.employee?.department_rel?.name || "General",
        Role: pay.employee?.role_rel?.name || "General",
        "Gross Pay": `$${gross.toLocaleString()}`,
        Deductions: `$${deductions.toLocaleString()}`,
        "LOP Days": Number(pay.lop_days || 0),
        "LOP Deductions": `$${Number(pay.lop_amount || 0).toLocaleString()}`,
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

    const dbStructures = await prisma.salaryStructure.findMany({
      where: { status: "Active" },
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbPayroll = await prisma.payroll.findMany({
      select: {
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
    const structuresSet = new Set<string>(dbStructures.map((s) => s.name));

    dbPayroll.forEach((item) => {
      if (item.employee?.department_rel?.name)
        departmentsSet.add(item.employee.department_rel.name);
    });

    res.sendSuccess({
      message: "Payroll filter options retrieved successfully",
      data: {
        departments: Array.from(departmentsSet).sort(),
        salaryStructures: Array.from(structuresSet).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update payroll record status (Paid, Pending, On Hold, Processed)
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

    const records = await (
      prisma.payroll as unknown as {
        findMany: (args: unknown) => Promise<
          Array<{
            id: number;
            payroll_code: string;
            employee_id: number;
            month?: number;
            year?: number;
            gross_pay?: unknown;
            total_deductions?: unknown;
            net_pay: unknown;
            working_days?: number;
            paid_days?: unknown;
            lop_days?: unknown;
            lop_amount?: unknown;
            status: string;
            pay_date: Date;
            employee: {
              name: string;
              email: string;
              avatar: string | null;
              role_rel?: { name: string } | null;
              department_rel?: { name: string } | null;
            };
            items?: Array<{
              id: number;
              name: string;
              code: string;
              category: string;
              amount: unknown;
              is_taxable: boolean;
            }>;
          }>
        >;
      }
    ).findMany({
      where: { employee_id: employeeId },
      orderBy: { pay_date: "desc" },
      include: {
        employee: {
          include: {
            role_rel: true,
            department_rel: true,
          },
        },
        items: true,
      },
    });

    const formattedSlips = records.map((item) => {
      const grossNum = Number(item.gross_pay || 0);
      const deductionsNum = Number(item.total_deductions || 0);
      const netNum = Number(item.net_pay || 0);
      const dateObj = new Date(item.pay_date);
      const monthStr = dateObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      return {
        id: item.payroll_code,
        db_id: item.id,
        payroll_code: item.payroll_code,
        month: item.month,
        year: item.year,
        gross_pay: grossNum,
        total_deductions: deductionsNum,
        net_pay: netNum,
        working_days: item.working_days ?? 30,
        paid_days: Number(item.paid_days ?? 30),
        lop_days: Number(item.lop_days ?? 0),
        lop_amount: Number(item.lop_amount ?? 0),
        formatted_gross: `$${grossNum.toLocaleString()}`,
        formatted_deductions: `$${deductionsNum.toLocaleString()}`,
        formatted_net_pay: `$${netNum.toLocaleString()}`,
        items:
          item.items?.map((it) => ({
            id: it.id,
            name: it.name,
            code: it.code,
            category: it.category,
            amount: Number(it.amount),
            is_taxable: it.is_taxable,
          })) || [],
        status: item.status,
        pay_date: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        month_label: monthStr,
        employee_name: item.employee.name,
        role: item.employee.role_rel?.name || "Staff",
        department: item.employee.department_rel?.name || "General",
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
