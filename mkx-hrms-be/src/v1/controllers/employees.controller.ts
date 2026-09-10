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
      department_rel?: { name?: string };
      department_id?: number;
      role_rel?: { name?: string };
      role_id?: number;
      manager?: { name?: string };
      manager_id?: number;
      join_date?: { gte?: Date; lte?: Date };
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search.trim()) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { role_rel: { name: { contains: search, mode: "insensitive" } } },
          { department_rel: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    if (status !== "All") {
      whereClause.status = status;
    }
    if (department !== "All") {
      if (!isNaN(Number(department))) {
        whereClause.department_id = Number(department);
      } else {
        whereClause.department_rel = { name: department };
      }
    }
    if (role !== "All") {
      if (!isNaN(Number(role))) {
        whereClause.role_id = Number(role);
      } else {
        whereClause.role_rel = { name: role };
      }
    }
    if (manager !== "All") {
      if (!isNaN(Number(manager))) {
        whereClause.manager_id = Number(manager);
      } else {
        whereClause.manager = { name: manager };
      }
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
        manager: true,
      },
    });

    const formatted = employees.map((emp) => ({
      id: emp.employee_id,
      db_id: emp.id,
      name: emp.name,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      role: emp.role_rel?.name || "Staff",
      role_id: emp.role_id,
      department: emp.department_rel?.name || "General",
      department_id: emp.department_id,
      status: emp.status,
      manager: emp.manager?.name || "None",
      manager_id: emp.manager_id,
      join_date: emp.join_date.toISOString().split("T")[0],
      birth_date: emp.birth_date ? emp.birth_date.toISOString().split("T")[0] : null,
      address: emp.address,
      phone: emp.phone,
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
    let role_id: number | null =
      req.body.role_id !== undefined && req.body.role_id !== null && req.body.role_id !== ""
        ? Number(req.body.role_id)
        : null;
    let department_id: number | null =
      req.body.department_id !== undefined &&
      req.body.department_id !== null &&
      req.body.department_id !== ""
        ? Number(req.body.department_id)
        : null;
    let manager_id: number | null =
      req.body.manager_id !== undefined &&
      req.body.manager_id !== null &&
      req.body.manager_id !== ""
        ? Number(req.body.manager_id)
        : null;

    if (!department_id && req.body.department) {
      const dbDept = await prisma.department.findFirst({ where: { name: req.body.department } });
      if (dbDept) department_id = dbDept.id;
    }

    if (!role_id && req.body.role) {
      const dbRole = await prisma.role.findFirst({ where: { name: req.body.role } });
      if (dbRole) role_id = dbRole.id;
    }

    if (!manager_id && (req.body.manager || req.body.manager_name)) {
      const mgrName = req.body.manager || req.body.manager_name;
      const dbManager = await prisma.employee.findFirst({ where: { name: mgrName } });
      if (dbManager) manager_id = dbManager.id;
    }

    const input: CreateEmployeeInput = {
      ...req.body,
      role_id,
      department_id,
      manager_id,
    };

    if (!input.employee_id) {
      const count = await prisma.employee.count();
      input.employee_id = `EMP-${String(count + 1).padStart(3, "0")}`;
    }

    const created = await createEmployeeWithUser(input);

    if (created.temporaryPassword && created.employee.email) {
      const resolvedRole = role_id
        ? (await prisma.role.findUnique({ where: { id: role_id } }))?.name || "Employee"
        : "Employee";
      const resolvedDept = department_id
        ? (await prisma.department.findUnique({ where: { id: department_id } }))?.name || "General"
        : "General";

      sendEmployeeWelcomeEmail({
        name: created.employee.name,
        email: created.employee.email,
        employeeId: created.employee.employee_id,
        role: resolvedRole,
        department: resolvedDept,
        temporaryPassword: created.temporaryPassword,
        setPasswordToken: created.setPasswordToken,
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
    const { name, email, role, department, status, manager, join_date, birth_date, address, phone, avatar } = req.body;

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

    let department_id: number | undefined =
      req.body.department_id !== undefined &&
      req.body.department_id !== null &&
      req.body.department_id !== ""
        ? Number(req.body.department_id)
        : undefined;
    if (department_id === undefined && department) {
      const dbDept = await prisma.department.findFirst({ where: { name: department } });
      if (dbDept) department_id = dbDept.id;
    }

    let role_id: number | undefined =
      req.body.role_id !== undefined && req.body.role_id !== null && req.body.role_id !== ""
        ? Number(req.body.role_id)
        : undefined;
    if (role_id === undefined && role) {
      const dbRole = await prisma.role.findFirst({ where: { name: role } });
      if (dbRole) role_id = dbRole.id;
    }

    let manager_id: number | null | undefined =
      req.body.manager_id !== undefined && req.body.manager_id !== ""
        ? req.body.manager_id === null
          ? null
          : Number(req.body.manager_id)
        : undefined;
    if (manager_id === undefined && manager) {
      const dbManager = await prisma.employee.findFirst({ where: { name: manager } });
      if (dbManager) manager_id = dbManager.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id: existing.id },
        data: {
          name: name ?? existing.name,
          email: email ?? existing.email,
          role_id: role_id !== undefined ? role_id : existing.role_id,
          department_id: department_id !== undefined ? department_id : existing.department_id,
          status: status ?? existing.status,
          manager_id: manager_id !== undefined ? manager_id : existing.manager_id,
          join_date: join_date ? new Date(join_date) : existing.join_date,
          birth_date: birth_date ? new Date(birth_date) : birth_date === null ? null : existing.birth_date,
          address: address !== undefined ? address : existing.address,
          phone: phone !== undefined ? phone : existing.phone,
          avatar: avatar !== undefined ? avatar : existing.avatar,
        },
        include: {
          role_rel: true,
          department_rel: true,
          manager: true,
        },
      });

      if (existing.user_id) {
        await tx.user.update({
          where: { id: existing.user_id },
          data: {
            email: email ?? existing.email,
            avatar: avatar !== undefined ? avatar : existing.avatar,
            role_id: role_id !== undefined ? role_id : undefined,
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
        role_rel: true,
        department_rel: true,
        manager: true,
      },
    });

    const exportData = employees.map((emp) => ({
      "Employee ID": emp.employee_id,
      "Full Name": emp.name,
      Email: emp.email,
      Role: emp.role_rel?.name || "Staff",
      Department: emp.department_rel?.name || "General",
      Status: emp.status,
      Manager: emp.manager?.name || "None",
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
      where: { status: "Active" },
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbRoles = await prisma.role.findMany({
      where: { status: "Active" },
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbEmployees = await prisma.employee.findMany({
      include: {
        manager: true,
      },
    });

    const departmentsSet = new Set<string>(dbDepartments.map((d) => d.name));
    const rolesSet = new Set<string>(dbRoles.map((r) => r.name));
    const managersSet = new Set<string>();

    dbEmployees.forEach((emp) => {
      if (emp.manager?.name) managersSet.add(emp.manager.name);
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
