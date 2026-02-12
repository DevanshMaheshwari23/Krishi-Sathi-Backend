import { Router } from "express";
import { getProfile, updateProfile, updateSoilHealthCard } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.put("/me/soil-health-card", authMiddleware, updateSoilHealthCard);

export default router;
