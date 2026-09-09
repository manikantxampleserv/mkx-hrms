import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { createEmployeeWithUser } from "../services/employee.service";
import { generateExcelBuffer } from "../services/excel.service";
import { sendEmployeeWelcomeEmail } from "../services/email.service";
import { logger } from "../../utils/logger";
import { CreateEmployeeInput } from "../../types/employee.types";

/**
 * Controller to retrieve all employees with optional filtering
 *
 * @param req - Express request with optional query params `search`, `status`, `department`, `role`, `manager`
 * @param res - Express response with augmented response helpers
 * @param next - Next middleware delegate for error handling
 */
export const getEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";
    const department = (req.query.department as string) || "All";
    const role = (req.query.role as string) || "All";
    const manager = (req.query.manager as string) || "All";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const whereClause: {
      AND?: Array<Record<string, unknown>>;
      status?: string;
      department?: string;
      role?: string;
      manager_name?: string;
      join_date?: { gte?: Date; lte?: Date };
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search.trim()) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { role: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (status !== "All") {
      whereClause.status = status;
    }
    if (department !== "All") {
      whereClause.department = department;
    }
    if (role !== "All") {
      whereClause.role = role;
    }
    if (manager !== "All") {
      whereClause.manager_name = manager;
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
      whereClause.join_date = dateFilter;
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        department_rel: true,
        role_rel: true,
      },
    });

    const formatted = employees.map((emp) => ({
      id: emp.employee_id,
      db_id: emp.id,
      name: emp.name,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      role: emp.role,
      department: emp.department,
      status: emp.status,
      manager: emp.manager_name || "None",
      join_date: emp.join_date.toISOString().split("T")[0],
      avatar: emp.avatar || undefined,
    }));

    res.sendSuccess({
      message: "Employees fetched successfully",
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to compute dynamic workforce KPI metrics
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getEmployeeStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const total = await prisma.employee.count();
    const active = await prisma.employee.count({ where: { status: "Active" } });
    const inactive = await prisma.employee.count({ where: { status: "Inactive" } });

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const newHires = await prisma.employee.count({
      where: {
        join_date: {
          gte: sixtyDaysAgo,
        },
      },
    });

    const cards = [
      {
        id: "total-employees",
        title: "Total Employees",
        value: String(total),
        subtext: "Across active global departments",
        icon_name: "People",
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "active-workforce",
        title: "Active Staff",
        value: String(active),
        subtext: `${total > 0 ? ((active / total) * 100).toFixed(1) : 0}% active status deployment`,
        icon_name: "CheckCircle",
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "inactive-workforce",
        title: "Inactive Staff",
        value: String(inactive),
        subtext: `${total > 0 ? ((inactive / total) * 100).toFixed(1) : 0}% offboarded or inactive`,
        icon_name: "Cancel",
        icon_color: "text-[#f14d4c]",
        icon_bg: "bg-[#f14d4c]/10",
      },
      {
        id: "new-hires",
        title: "New Hires",
        value: String(newHires),
        subtext: "Joined in the last 60 days",
        icon_name: "PersonAdd",
        icon_color: "text-[#ad87ed]",
        icon_bg: "bg-[#ad87ed]/10",
      },
    ];

    res.sendSuccess({
      message: "Employee statistics fetched successfully",
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to create a new employee and automatically provision their user account
 *
 * @param req - Express request with employee creation payload
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const manager_name = req.body.manager || req.body.manager_name;
    const input: CreateEmployeeInput = { ...req.body, manager_name };

    if (!input.employee_id) {
      const count = await prisma.employee.count();
      input.employee_id = `EMP-${String(count + 1).padStart(3, "0")}`;
    }

    if (input.role) {
      const dbRole = await prisma.role.findFirst({ where: { name: input.role } });
      if (dbRole) input.role_id = dbRole.id;
    }

    if (input.manager_name) {
      const dbManager = await prisma.employee.findFirst({ where: { name: input.manager_name } });
      if (dbManager) input.manager_id = dbManager.id;
    }

    const created = await createEmployeeWithUser(input);

    if (created.temporaryPassword && created.employee.email) {
      sendEmployeeWelcomeEmail({
        name: created.employee.name,
        email: created.employee.email,
        employeeId: created.employee.employee_id,
        role: created.employee.role,
        department: created.employee.department,
        temporaryPassword: created.temporaryPassword,
      }).catch((emailError: unknown) => {
        logger.error("Failed to send welcome email for created employee:", emailError);
      });
    }

    res.sendSuccess({
      statusCode: 201,
      message: "Employee and user account created successfully",
      data: created,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update an existing employee record
 *
 * @param req - Express request with employee ID in params and updated fields in body
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, email, role, department, status, manager, join_date, avatar } = req.body;

    const existing = await prisma.employee.findFirst({
      where: {
        OR: [{ employee_id: id }, { id: !isNaN(Number(id)) ? Number(id) : undefined }],
      },
    });

    if (!existing) {
      res.sendError({
        statusCode: 404,
        message: "Employee not found",
      });
      return;
    }

    let role_id: number | undefined;
    if (role) {
      const dbRole = await prisma.role.findFirst({ where: { name: role } });
      if (dbRole) role_id = dbRole.id;
    }

    let manager_id: number | undefined;
    if (manager) {
      const dbManager = await prisma.employee.findFirst({ where: { name: manager } });
      if (dbManager) manager_id = dbManager.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id: existing.id },
        data: {
          name: name ?? existing.name,
          email: email ?? existing.email,
          role: role ?? existing.role,
          role_id: role_id !== undefined ? role_id : existing.role_id,
          department: department ?? existing.department,
          status: status ?? existing.status,
          manager_name: manager ?? existing.manager_name,
          manager_id: manager_id !== undefined ? manager_id : existing.manager_id,
          join_date: join_date ? new Date(join_date) : existing.join_date,
          avatar: avatar !== undefined ? avatar : existing.avatar,
        },
      });

      if (existing.user_id) {
        await tx.user.update({
          where: { id: existing.user_id },
          data: {
            email: email ?? existing.email,
            avatar: avatar !== undefined ? avatar : existing.avatar,
            status: status ? status.toLowerCase() : undefined,
          },
        });
      }

      return emp;
    });

    res.sendSuccess({
      message: "Employee updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to delete an employee record
 *
 * @param req - Express request with employee ID in params
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const deleteEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const existing = await prisma.employee.findFirst({
      where: {
        OR: [{ employee_id: id }, { id: !isNaN(Number(id)) ? Number(id) : undefined }],
      },
    });

    if (!existing) {
      res.sendError({
        statusCode: 404,
        message: "Employee not found",
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.employee.delete({
        where: { id: existing.id },
      });

      if (existing.user_id) {
        await tx.user.delete({
          where: { id: existing.user_id },
        });
      }
    });

    res.sendSuccess({
      message: "Employee removed successfully",
      data: { id: existing.employee_id },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to export all employees as an Excel (.xlsx) spreadsheet
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const exportEmployees = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { id: "asc" },
      include: {
        manager: true,
      },
    });

    const exportData = employees.map((emp) => ({
      "Employee ID": emp.employee_id,
      "Full Name": emp.name,
      Email: emp.email,
      Role: emp.role,
      Department: emp.department,
      Status: emp.status,
      Manager: emp.manager?.name || emp.manager_name || "None",
      "Join Date": emp.join_date ? emp.join_date.toISOString().split("T")[0] : "",
    }));

    const buffer = await generateExcelBuffer("Employees", exportData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="Employees_Export.xlsx"');

    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch dynamic filter options (departments, roles, managers) directly from database
 *
 * @param _req - Express request instance
 * @param res - Express response with sendSuccess helper
 * @param next - Express next middleware function
 */
export const getEmployeeFilters = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dbDepartments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbRoles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbEmployees = await prisma.employee.findMany({
      select: {
        department: true,
        role: true,
        manager_name: true,
      },
    });

    const departmentsSet = new Set<string>(dbDepartments.map((d) => d.name));
    const rolesSet = new Set<string>(dbRoles.map((r) => r.name));
    const managersSet = new Set<string>();

    dbEmployees.forEach((emp) => {
      if (emp.department) departmentsSet.add(emp.department);
      if (emp.role) rolesSet.add(emp.role);
      if (emp.manager_name) managersSet.add(emp.manager_name);
    });

    res.sendSuccess({
      message: "Employee filter options retrieved successfully",
      data: {
        departments: Array.from(departmentsSet).sort(),
        roles: Array.from(rolesSet).sort(),
        managers: Array.from(managersSet).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
};
