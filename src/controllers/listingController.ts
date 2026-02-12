import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Listing } from "../models/Listing";

export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const sellerId = req.user?.userId;
    const { type, cropName, quantity, unit, pricePerUnit, description, location } = req.body;

    if (!type || !cropName || !quantity || !unit || !pricePerUnit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const listing = await Listing.create({
      sellerId,
      type,
      cropName,
      quantity,
      unit,
      pricePerUnit,
      description,
      location,
    });

    return res.status(201).json(listing);
  } catch (err) {
    console.error("Create listing error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getListings = async (req: Request, res: Response) => {
  try {
    const { cropName, type, status, page = 1, limit = 10 } = req.query as any;

    const query: any = {};
    if (cropName) query.cropName = { $regex: cropName, $options: "i" };
    if (type) query.type = type;
    if (status) query.status = status;
    else query.status = "active";

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      Listing.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Listing.countDocuments(query),
    ]);

    return res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Get listings error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getListingById = async (req: Request, res: Response) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    listing.views += 1;
    await listing.save();

    return res.json(listing);
  } catch (err) {
    console.error("Get listing error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.sellerId.toString() !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { cropName, quantity, unit, pricePerUnit, description, status, location } = req.body;

    listing.cropName = cropName ?? listing.cropName;
    listing.quantity = quantity ?? listing.quantity;
    listing.unit = unit ?? listing.unit;
    listing.pricePerUnit = pricePerUnit ?? listing.pricePerUnit;
    listing.description = description ?? listing.description;
    listing.status = status ?? listing.status;
    listing.location = location ?? listing.location;

    await listing.save();

    return res.json(listing);
  } catch (err) {
    console.error("Update listing error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.sellerId.toString() !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await listing.deleteOne();

    return res.json({ message: "Listing deleted" });
  } catch (err) {
    console.error("Delete listing error", err);
    return res.status(500).json({ message: "Server error" });
  }
};
