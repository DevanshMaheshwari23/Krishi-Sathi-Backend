"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListing = exports.updateListing = exports.getListingById = exports.getListings = exports.createListing = void 0;
const Listing_1 = require("../models/Listing");
const createListing = async (req, res) => {
    try {
        const sellerId = req.user?.userId;
        const { type, cropName, quantity, unit, pricePerUnit, description, location } = req.body;
        if (!type || !cropName || !quantity || !unit || !pricePerUnit) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const listing = await Listing_1.Listing.create({
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
    }
    catch (err) {
        console.error("Create listing error", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.createListing = createListing;
const getListings = async (req, res) => {
    try {
        const { cropName, type, status, page = 1, limit = 10 } = req.query;
        const query = {};
        if (cropName)
            query.cropName = { $regex: cropName, $options: "i" };
        if (type)
            query.type = type;
        if (status)
            query.status = status;
        else
            query.status = "active";
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const [items, total] = await Promise.all([
            Listing_1.Listing.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Listing_1.Listing.countDocuments(query),
        ]);
        return res.json({
            items,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
        });
    }
    catch (err) {
        console.error("Get listings error", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getListings = getListings;
const getListingById = async (req, res) => {
    try {
        const listing = await Listing_1.Listing.findById(req.params.id);
        if (!listing)
            return res.status(404).json({ message: "Listing not found" });
        listing.views += 1;
        await listing.save();
        return res.json(listing);
    }
    catch (err) {
        console.error("Get listing error", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getListingById = getListingById;
const updateListing = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const listing = await Listing_1.Listing.findById(id);
        if (!listing)
            return res.status(404).json({ message: "Listing not found" });
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
    }
    catch (err) {
        console.error("Update listing error", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.updateListing = updateListing;
const deleteListing = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const listing = await Listing_1.Listing.findById(id);
        if (!listing)
            return res.status(404).json({ message: "Listing not found" });
        if (listing.sellerId.toString() !== userId) {
            return res.status(403).json({ message: "Not allowed" });
        }
        await listing.deleteOne();
        return res.json({ message: "Listing deleted" });
    }
    catch (err) {
        console.error("Delete listing error", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.deleteListing = deleteListing;
