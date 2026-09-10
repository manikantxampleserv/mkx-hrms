import { Router } from "express";
import {
  getLeaves,
  getLeaveStats,
  exportLeaves,
  updateLeaveStatus,
  getLeaveFilters,
  createLeave,
  getMyLeaves,
  getLeaveByApprovalToken,
  processLeaveApproval,
} from "../controllers/leaves.controller";

const router = Router();

router.get("/approval/:token", getLeaveByApprovalToken);
router.post("/approval/:token", processLeaveApproval);

router.get("/", getLeaves);
router.get("/my", getMyLeaves);
router.post("/", createLeave);
router.get("/stats", getLeaveStats);
router.get("/filters", getLeaveFilters);
router.get("/export", exportLeaves);
router.patch("/:id/status", updateLeaveStatus);

export default router;
