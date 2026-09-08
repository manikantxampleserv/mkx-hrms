import { Router } from "express";
import {
  getSettings,
  updateProfile,
  updateNotificationPreferences,
} from "../controllers/settings.controller";

const router = Router();

router.get("/", getSettings);
router.put("/profile", updateProfile);
router.put("/notifications", updateNotificationPreferences);

export default router;
