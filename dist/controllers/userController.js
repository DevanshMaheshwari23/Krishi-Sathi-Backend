"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSoilHealthCard = exports.updateProfile = exports.getProfile = void 0;
const User_1 = require("../models/User");
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await User_1.User.findById(userId).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json(user);
    }
    catch (err) {
        console.error("Get profile error", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { name, phone, language, location } = req.body;
        const user = await User_1.User.findByIdAndUpdate(userId, { name, phone, language, location }, { new: true }).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json(user);
    }
    catch (err) {
        console.error("Update profile error", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.updateProfile = updateProfile;
const updateSoilHealthCard = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { nitrogen, phosphorus, potassium, pH } = req.body;
        const user = await User_1.User.findByIdAndUpdate(userId, {
            soilHealthCard: {
                nitrogen,
                phosphorus,
                potassium,
                pH,
                lastUpdated: new Date(),
            },
        }, { new: true }).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json(user);
    }
    catch (err) {
        console.error("Update soil health card error", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.updateSoilHealthCard = updateSoilHealthCard;
