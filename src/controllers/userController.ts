import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { User } from "../models/User";

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    console.error("Get profile error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, phone, language, location } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, language, location },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    console.error("Update profile error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateSoilHealthCard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { nitrogen, phosphorus, potassium, pH } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        soilHealthCard: {
          nitrogen,
          phosphorus,
          potassium,
          pH,
          lastUpdated: new Date(),
        },
      },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    console.error("Update soil health card error", err);
    return res.status(500).json({ message: "Server error" });
  }
};
