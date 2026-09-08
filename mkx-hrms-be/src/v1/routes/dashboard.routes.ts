import { Router } from "express";
import { getDashboardOverview, getAllActivities } from "../controllers/dashboard.controller";

const router = Router();

router.get("/overview", getDashboardOverview);
router.get("/activities", getAllActivities);

export default router;
