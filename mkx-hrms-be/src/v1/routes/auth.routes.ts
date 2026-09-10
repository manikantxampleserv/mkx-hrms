import { Router } from "express";
import { login, logout, getMe, verifySetPasswordToken, setPasswordWithToken } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getMe);
router.get("/set-password", verifySetPasswordToken);
router.post("/set-password", setPasswordWithToken);

export default router;
