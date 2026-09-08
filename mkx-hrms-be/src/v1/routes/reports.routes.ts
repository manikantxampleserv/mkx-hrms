import { Router } from "express";
import { getReports, getReportAnalytics } from "../controllers/reports.controller";

const router = Router();

router.get("/", getReports);
router.get("/analytics", getReportAnalytics);

export default router;
