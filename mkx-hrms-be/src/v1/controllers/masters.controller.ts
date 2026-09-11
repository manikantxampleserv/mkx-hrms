import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { logger } from "../../utils/logger";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateRoleInput,
  UpdateRoleInput,
  CreateDesignationInput,
  UpdateDesignationInput,
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  CreateSalaryStructureInput,
  UpdateSalaryStructureInput,
  CreateWorkShiftInput,
  UpdateWorkShiftInput,
} from "../../types/masters.types";

/**
 * Retrieves all departments with counts of linked employees and designations
 */
export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";

    const whereClause: {
      status?: string;
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (status !== "All") {
      whereClause.status = status;
    }

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: {
            employees: true,
            designations: true,
          },
        },
      },
    });

    const formatted = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code || `DEP-${String(d.id).padStart(3, "0")}`,
      description: d.description || "",
      status: d.status,
      employee_count: d._count.employees,
      designation_count: d._count.designations,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));

    res.sendSuccess({
      message: "Departments retrieved successfully",
      data: formatted,
    });
  } catch (error) {
    logger.error("Failed to retrieve departments:", error);
    next(error);
  }
};

/**
 * Creates a new department
 */
export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input: CreateDepartmentInput = req.body;
    if (!input.name || !input.name.trim()) {
      res.sendError({ message: "Department name is required", statusCode: 400 });
      return;
    }

    const existing = await prisma.department.findUnique({
      where: { name: input.name.trim() },
    });
    if (existing) {
      res.sendError({ message: "Department with this name already exists", statusCode: 409 });
      return;
    }

    const code =
      input.code && input.code.trim()
        ? input.code.trim().toUpperCase()
        : `DEP-${input.name.trim().substring(0, 3).toUpperCase()}`;

    const department = await prisma.department.create({
      data: {
        name: input.name.trim(),
        code,
        description: input.description?.trim() || null,
        status: input.status || "Active",
      },
    });

    res.sendSuccess({
      message: "Department created successfully",
      data: department,
      statusCode: 201,
    });
  } catch (error) {
    logger.error("Failed to create department:", error);
    next(error);
  }
};

/**
 * Updates an existing department
 */
export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const input: UpdateDepartmentInput = req.body;

    const existing = await prisma.department.findUnique({
      where: { id },
    });
    if (!existing) {
      res.sendError({ message: "Department not found", statusCode: 404 });
      return;
    }

    if (input.name && input.name.trim() !== existing.name) {
      const nameConflict = await prisma.department.findUnique({
        where: { name: input.name.trim() },
      });
      if (nameConflict) {
        res.sendError({ message: "Department with this name already exists", statusCode: 409 });
        return;
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        code: input.code?.trim().toUpperCase(),
        description: input.description !== undefined ? input.description.trim() || null : undefined,
        status: input.status,
      },
    });

    res.sendSuccess({
      message: "Department updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Failed to update department:", error);
    next(error);
  }
};

/**
 * Deletes a department
 */
export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const employeeCount = await prisma.employee.count({
      where: { department_id: id },
    });

    if (employeeCount > 0) {
      res.sendError({
        message: `Cannot delete department because it is assigned to ${employeeCount} employee(s). Set status to Inactive instead.`,
        statusCode: 400,
      });
      return;
    }

    await prisma.department.delete({
      where: { id },
    });

    res.sendSuccess({
      message: "Department deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete department:", error);
    next(error);
  }
};

/**
 * Retrieves all roles with their assigned permissions and user count
 */
export const getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { created_at: "asc" },
      include: {
        role_permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
            employees: true,
          },
        },
      },
    });

    const formatted = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      status: r.status,
      user_count: r._count.users || r._count.employees,
      permissions: r.role_permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        module: rp.permission.module,
        description: rp.permission.description,
      })),
      created_at: r.created_at,
    }));

    res.sendSuccess({
      message: "Roles retrieved successfully",
      data: formatted,
    });
  } catch (error) {
    logger.error("Failed to retrieve roles:", error);
    next(error);
  }
};

/**
 * Retrieves all available permissions grouped by module
 */
export const getPermissions = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });

    res.sendSuccess({
      message: "Permissions retrieved successfully",
      data: permissions,
    });
  } catch (error) {
    logger.error("Failed to retrieve permissions:", error);
    next(error);
  }
};

/**
 * Creates a new role with assigned permissions
 */
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input: CreateRoleInput = req.body;
    if (!input.name || !input.name.trim()) {
      res.sendError({ message: "Role name is required", statusCode: 400 });
      return;
    }

    const existing = await prisma.role.findUnique({
      where: { name: input.name.trim() },
    });
    if (existing) {
      res.sendError({ message: "Role with this name already exists", statusCode: 409 });
      return;
    }

    const role = await prisma.role.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        status: input.status || "Active",
      },
    });

    if (input.permission_ids && input.permission_ids.length > 0) {
      await prisma.rolePermission.createMany({
        data: input.permission_ids.map((pId) => ({
          role_id: role.id,
          permission_id: pId,
        })),
        skipDuplicates: true,
      });
    }

    res.sendSuccess({
      message: "Role created successfully",
      data: role,
      statusCode: 201,
    });
  } catch (error) {
    logger.error("Failed to create role:", error);
    next(error);
  }
};

/**
 * Updates an existing role and synchronizes assigned permissions
 */
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const input: UpdateRoleInput = req.body;

    const existing = await prisma.role.findUnique({
      where: { id },
    });
    if (!existing) {
      res.sendError({ message: "Role not found", statusCode: 404 });
      return;
    }

    if (input.name && input.name.trim() !== existing.name) {
      const conflict = await prisma.role.findUnique({
        where: { name: input.name.trim() },
      });
      if (conflict) {
        res.sendError({ message: "Role with this name already exists", statusCode: 409 });
        return;
      }
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description: input.description !== undefined ? input.description.trim() || null : undefined,
        status: input.status,
      },
    });

    if (input.permission_ids !== undefined) {
      await prisma.rolePermission.deleteMany({
        where: { role_id: id },
      });

      if (input.permission_ids.length > 0) {
        await prisma.rolePermission.createMany({
          data: input.permission_ids.map((pId) => ({
            role_id: id,
            permission_id: pId,
          })),
          skipDuplicates: true,
        });
      }
    }

    res.sendSuccess({
      message: "Role updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Failed to update role:", error);
    next(error);
  }
};

/**
 * Deletes a role
 */
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const count = await prisma.user.count({
      where: { role_id: id },
    });

    if (count > 0) {
      res.sendError({
        message: `Cannot delete role because it is assigned to ${count} user(s).`,
        statusCode: 400,
      });
      return;
    }

    await prisma.role.delete({
      where: { id },
    });

    res.sendSuccess({
      message: "Role deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete role:", error);
    next(error);
  }
};

/**
 * Retrieves all designations
 */
export const getDesignations = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";

    const whereClause: {
      status?: string;
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (status !== "All") {
      whereClause.status = status;
    }

    if (search.trim()) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const designations = await prisma.designation.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        department: true,
      },
    });

    res.sendSuccess({
      message: "Designations retrieved successfully",
      data: designations,
    });
  } catch (error) {
    logger.error("Failed to retrieve designations:", error);
    next(error);
  }
};

/**
 * Creates a new designation
 */
export const createDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input: CreateDesignationInput = req.body;
    if (!input.title || !input.title.trim()) {
      res.sendError({ message: "Designation title is required", statusCode: 400 });
      return;
    }
    if (!input.code || !input.code.trim()) {
      res.sendError({ message: "Designation code is required", statusCode: 400 });
      return;
    }

    const existingTitle = await prisma.designation.findUnique({
      where: { title: input.title.trim() },
    });
    if (existingTitle) {
      res.sendError({ message: "Designation with this title already exists", statusCode: 409 });
      return;
    }

    const existingCode = await prisma.designation.findUnique({
      where: { code: input.code.trim().toUpperCase() },
    });
    if (existingCode) {
      res.sendError({ message: "Designation code already exists", statusCode: 409 });
      return;
    }

    const designation = await prisma.designation.create({
      data: {
        title: input.title.trim(),
        code: input.code.trim().toUpperCase(),
        department_id: input.department_id || null,
        description: input.description?.trim() || null,
        status: input.status || "Active",
      },
      include: {
        department: true,
      },
    });

    res.sendSuccess({
      message: "Designation created successfully",
      data: designation,
      statusCode: 201,
    });
  } catch (error) {
    logger.error("Failed to create designation:", error);
    next(error);
  }
};

/**
 * Updates an existing designation
 */
export const updateDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const input: UpdateDesignationInput = req.body;

    const existing = await prisma.designation.findUnique({
      where: { id },
    });
    if (!existing) {
      res.sendError({ message: "Designation not found", statusCode: 404 });
      return;
    }

    const updated = await prisma.designation.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        code: input.code?.trim().toUpperCase(),
        department_id: input.department_id,
        description: input.description !== undefined ? input.description.trim() || null : undefined,
        status: input.status,
      },
      include: {
        department: true,
      },
    });

    res.sendSuccess({
      message: "Designation updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Failed to update designation:", error);
    next(error);
  }
};

/**
 * Deletes a designation
 */
export const deleteDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.designation.delete({
      where: { id },
    });

    res.sendSuccess({
      message: "Designation deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete designation:", error);
    next(error);
  }
};

/**
 * Retrieves all leave types
 */
export const getLeaveTypes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";

    const whereClause: {
      status?: string;
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (status !== "All") {
      whereClause.status = status;
    }

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where: whereClause,
      orderBy: { created_at: "asc" },
    });

    res.sendSuccess({
      message: "Leave types retrieved successfully",
      data: leaveTypes,
    });
  } catch (error) {
    logger.error("Failed to retrieve leave types:", error);
    next(error);
  }
};

/**
 * Creates a new leave type
 */
export const createLeaveType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input: CreateLeaveTypeInput = req.body;
    if (!input.name || !input.name.trim()) {
      res.sendError({ message: "Leave type name is required", statusCode: 400 });
      return;
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        days_per_year: Number(input.days_per_year) || 12,
        is_paid: input.is_paid !== undefined ? input.is_paid : true,
        color: input.color || "#4f46e5",
        description: input.description?.trim() || null,
        status: input.status || "Active",
      },
    });

    res.sendSuccess({
      message: "Leave type created successfully",
      data: leaveType,
      statusCode: 201,
    });
  } catch (error) {
    logger.error("Failed to create leave type:", error);
    next(error);
  }
};

/**
 * Updates an existing leave type
 */
export const updateLeaveType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const input: UpdateLeaveTypeInput = req.body;

    const updated = await prisma.leaveType.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        code: input.code?.trim().toUpperCase(),
        days_per_year: input.days_per_year !== undefined ? Number(input.days_per_year) : undefined,
        is_paid: input.is_paid,
        color: input.color,
        description: input.description !== undefined ? input.description.trim() || null : undefined,
        status: input.status,
      },
    });

    res.sendSuccess({
      message: "Leave type updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Failed to update leave type:", error);
    next(error);
  }
};

/**
 * Deletes a leave type
 */
export const deleteLeaveType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.leaveType.delete({
      where: { id },
    });

    res.sendSuccess({
      message: "Leave type deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete leave type:", error);
    next(error);
  }
};

/**
 * Retrieves all salary structures
 */
export const getSalaryStructures = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";

    const whereClause: {
      status?: string;
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (status !== "All") {
      whereClause.status = status;
    }

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const structures = await prisma.salaryStructure.findMany({
      where: whereClause,
      orderBy: { created_at: "asc" },
    });

    res.sendSuccess({
      message: "Salary structures retrieved successfully",
      data: structures,
    });
  } catch (error) {
    logger.error("Failed to retrieve salary structures:", error);
    next(error);
  }
};

/**
 * Creates a new salary structure
 */
export const createSalaryStructure = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input: CreateSalaryStructureInput = req.body;
    if (!input.name || !input.name.trim()) {
      res.sendError({ message: "Salary structure name is required", statusCode: 400 });
      return;
    }

    const structure = await (
      prisma as unknown as { salaryStructure: { create: Function } }
    ).salaryStructure.create({
      data: {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        description: input.description?.trim() || null,
        is_deduction: Boolean(input.is_deduction),
        is_taxable: input.is_taxable !== undefined ? Boolean(input.is_taxable) : true,
        is_base_salary: Boolean(input.is_base_salary),
        calculation_type: input.calculation_type || "Fixed",
        default_value: Number(input.default_value) || 0,
        status: input.status || "Active",
      },
    });

    res.sendSuccess({
      message: "Salary structure created successfully",
      data: structure,
      statusCode: 201,
    });
  } catch (error) {
    logger.error("Failed to create salary structure:", error);
    next(error);
  }
};

/**
 * Updates an existing salary structure
 */
export const updateSalaryStructure = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const input: UpdateSalaryStructureInput = req.body;

    const updated = await (
      prisma as unknown as { salaryStructure: { update: Function } }
    ).salaryStructure.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        code: input.code?.trim().toUpperCase(),
        description: input.description !== undefined ? input.description.trim() || null : undefined,
        is_deduction: input.is_deduction !== undefined ? Boolean(input.is_deduction) : undefined,
        is_taxable: input.is_taxable !== undefined ? Boolean(input.is_taxable) : undefined,
        is_base_salary:
          input.is_base_salary !== undefined ? Boolean(input.is_base_salary) : undefined,
        calculation_type: input.calculation_type,
        default_value: input.default_value !== undefined ? Number(input.default_value) : undefined,
        status: input.status,
      },
    });

    res.sendSuccess({
      message: "Salary structure updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Failed to update salary structure:", error);
    next(error);
  }
};

/**
 * Deletes a salary structure
 */
export const deleteSalaryStructure = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.salaryStructure.delete({
      where: { id },
    });

    res.sendSuccess({
      message: "Salary structure deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete salary structure:", error);
    next(error);
  }
};

/**
 * Retrieves all work shifts
 */
export const getWorkShifts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";

    const whereClause: {
      status?: string;
      OR?: Array<Record<string, unknown>>;
    } = {};

    if (status !== "All") {
      whereClause.status = status;
    }

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const shifts = await prisma.workShift.findMany({
      where: whereClause,
      orderBy: { created_at: "asc" },
    });

    res.sendSuccess({
      message: "Work shifts retrieved successfully",
      data: shifts,
    });
  } catch (error) {
    logger.error("Failed to retrieve work shifts:", error);
    next(error);
  }
};

/**
 * Creates a new work shift
 */
export const createWorkShift = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input: CreateWorkShiftInput = req.body;
    if (!input.name || !input.name.trim()) {
      res.sendError({ message: "Work shift name is required", statusCode: 400 });
      return;
    }

    const shift = await prisma.workShift.create({
      data: {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        start_time: input.start_time,
        end_time: input.end_time,
        grace_mins: Number(input.grace_mins) || 15,
        description: input.description?.trim() || null,
        status: input.status || "Active",
      },
    });

    res.sendSuccess({
      message: "Work shift created successfully",
      data: shift,
      statusCode: 201,
    });
  } catch (error) {
    logger.error("Failed to create work shift:", error);
    next(error);
  }
};

/**
 * Updates an existing work shift
 */
export const updateWorkShift = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const input: UpdateWorkShiftInput = req.body;

    const updated = await prisma.workShift.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        code: input.code?.trim().toUpperCase(),
        start_time: input.start_time,
        end_time: input.end_time,
        grace_mins: input.grace_mins !== undefined ? Number(input.grace_mins) : undefined,
        description: input.description !== undefined ? input.description.trim() || null : undefined,
        status: input.status,
      },
    });

    res.sendSuccess({
      message: "Work shift updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Failed to update work shift:", error);
    next(error);
  }
};

/**
 * Deletes a work shift
 */
export const deleteWorkShift = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await prisma.workShift.delete({
      where: { id },
    });

    res.sendSuccess({
      message: "Work shift deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete work shift:", error);
    next(error);
  }
};
