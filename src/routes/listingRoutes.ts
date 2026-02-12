import { Router } from "express";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
} from "../controllers/listingController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", getListings);
router.get("/:id", getListingById);
router.post("/", authMiddleware, createListing);
router.put("/:id", authMiddleware, updateListing);
router.delete("/:id", authMiddleware, deleteListing);

export default router;
