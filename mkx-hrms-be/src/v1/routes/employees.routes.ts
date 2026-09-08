import { Router } from "express";
import {
  getEmployees,
  getEmployeeStats,
  exportEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeFilters,
} from "../controllers/employees.controller";

const router = Router();

router.get("/", getEmployees);
router.get("/stats", getEmployeeStats);
router.get("/filters", getEmployeeFilters);
router.get("/export", exportEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
