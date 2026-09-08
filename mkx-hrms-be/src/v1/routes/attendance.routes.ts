import { Router } from "express";
import {
  getAttendance,
  getAttendanceStats,
  exportAttendance,
  getAttendanceFilters,
  updateAttendanceStatus,
  punchAttendance,
  getMyAttendance,
} from "../controllers/attendance.controller";

const router = Router();

router.get("/", getAttendance);
router.get("/my", getMyAttendance);
router.get("/stats", getAttendanceStats);
router.get("/filters", getAttendanceFilters);
router.get("/export", exportAttendance);
router.patch("/:id/status", updateAttendanceStatus);
router.post("/punch", punchAttendance);

export default router;
