import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  getWorkShifts,
  createWorkShift,
  updateWorkShift,
  deleteWorkShift,
} from "../controllers/masters.controller";

const router = Router();

/**
 * Department Master Endpoints
 */
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

/**
 * Role and Permission Master Endpoints
 */
router.get("/roles", getRoles);
router.post("/roles", createRole);
router.put("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);
router.get("/permissions", getPermissions);

/**
 * Designation Master Endpoints
 */
router.get("/designations", getDesignations);
router.post("/designations", createDesignation);
router.put("/designations/:id", updateDesignation);
router.delete("/designations/:id", deleteDesignation);

/**
 * Leave Type Master Endpoints
 */
router.get("/leave-types", getLeaveTypes);
router.post("/leave-types", createLeaveType);
router.put("/leave-types/:id", updateLeaveType);
router.delete("/leave-types/:id", deleteLeaveType);

/**
 * Salary Structure Master Endpoints
 */
router.get("/salary-structures", getSalaryStructures);
router.post("/salary-structures", createSalaryStructure);
router.put("/salary-structures/:id", updateSalaryStructure);
router.delete("/salary-structures/:id", deleteSalaryStructure);

/**
 * Work Shift Master Endpoints
 */
router.get("/shifts", getWorkShifts);
router.post("/shifts", createWorkShift);
router.put("/shifts/:id", updateWorkShift);
router.delete("/shifts/:id", deleteWorkShift);

export default router;
