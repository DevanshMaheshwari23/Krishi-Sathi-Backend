import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateFarmDetails,
  updateSoilHealthCard,
  getActivityLog,
  getAnalytics,
  updateBankDetails,
  updateNotificationPreferences,
  getUserListings,
  exportProfileData,
} from "../controllers/profileController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Profile management
router.get("/", getProfile);
router.put("/", updateProfile);

// Farm details (farmers only)
router.put("/farm-details", updateFarmDetails);

// Soil health card
router.put("/soil-health-card", updateSoilHealthCard);

// Activity log
router.get("/activity-log", getActivityLog);

// Analytics
router.get("/analytics", getAnalytics);

// Bank details
router.put("/bank-details", updateBankDetails);

// Notification preferences
router.put("/notification-preferences", updateNotificationPreferences);

// User listings
router.get("/listings", getUserListings);

// Export data (GDPR compliance)
router.get("/export", exportProfileData);

export default router;
