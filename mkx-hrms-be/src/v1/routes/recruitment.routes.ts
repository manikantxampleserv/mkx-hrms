import { Router } from "express";
import {
  getCandidates,
  getRecruitmentStats,
  exportCandidates,
  onboardCandidate,
  getRecruitmentFilters,
  updateCandidateStatus,
  deleteCandidate,
} from "../controllers/recruitment.controller";

const router = Router();

router.get("/candidates", getCandidates);
router.get("/stats", getRecruitmentStats);
router.get("/filters", getRecruitmentFilters);
router.get("/export", exportCandidates);
router.post("/candidates/:id/onboard", onboardCandidate);
router.patch("/candidates/:id/status", updateCandidateStatus);
router.delete("/candidates/:id", deleteCandidate);

export default router;
