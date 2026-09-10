import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./users.routes";
import employeesRoutes from "./employees.routes";
import attendanceRoutes from "./attendance.routes";
import leavesRoutes from "./leaves.routes";
import payrollRoutes from "./payroll.routes";
import recruitmentRoutes from "./recruitment.routes";
import reportsRoutes from "./reports.routes";
import dashboardRoutes from "./dashboard.routes";
import settingsRoutes from "./settings.routes";
import blogsRoutes from "./blogs.routes";
import mastersRoutes from "./masters.routes";

const router = Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);
router.use("/employees", employeesRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leaves", leavesRoutes);
router.use("/payroll", payrollRoutes);
router.use("/recruitment", recruitmentRoutes);
router.use("/reports", reportsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);
router.use("/blogs", blogsRoutes);
router.use("/masters", mastersRoutes);

export default router;
