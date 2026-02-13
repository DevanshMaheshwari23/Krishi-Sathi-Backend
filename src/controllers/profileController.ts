import { Request, Response } from "express";
import { User } from "../models/User";
import { UserProfile, IUserProfile } from "../models/UserProfile";
import { Listing } from "../models/Listing";
import { ChatHistory } from "../models/ChatHistory";
import mongoose from "mongoose";

// Get complete profile with real stats
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user basic info
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get or create user profile
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      profile = await UserProfile.create({
        userId,
        stats: {
          totalListings: 0,
          activeListings: 0,
          soldListings: 0,
          totalRevenue: 0,
          totalQuantitySold: 0,
          averageRating: 0,
          totalReviews: 0,
          profileViews: 0,
          lastActiveAt: new Date(),
        },
      });
    }

    // Calculate real-time stats
    const stats = await calculateUserStats(userId);
    
    // Update profile stats
    profile.stats = { ...profile.stats, ...stats };
    await profile.save();

    // Calculate profile completion
    await profile.calculateProfileCompletion();
    await profile.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        location: user.location,
        soilHealthCard: user.soilHealthCard,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      profile: {
        profileCompletion: profile.profileCompletion,
        farmDetails: profile.farmDetails,
        businessDetails: profile.businessDetails,
        kycStatus: profile.kycStatus,
        stats: profile.stats,
        badges: profile.badges,
        achievements: profile.achievements,
        preferences: profile.preferences,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Calculate real user statistics
async function calculateUserStats(userId: string) {
  try {
    const objectId = new mongoose.Types.ObjectId(userId);

    // Aggregate listing stats
    const listingStats = await Listing.aggregate([
      { $match: { sellerId: objectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "sold"] },
                { $multiply: ["$quantity", "$pricePerUnit"] },
                0,
              ],
            },
          },
          totalQuantity: {
            $sum: {
              $cond: [{ $eq: ["$status", "sold"] }, "$quantity", 0],
            },
          },
        },
      },
    ]);

    const stats = {
      totalListings: 0,
      activeListings: 0,
      soldListings: 0,
      totalRevenue: 0,
      totalQuantitySold: 0,
      lastActiveAt: new Date(),
    };

    listingStats.forEach((stat) => {
      stats.totalListings += stat.count;
      if (stat._id === "active") stats.activeListings = stat.count;
      if (stat._id === "sold") {
        stats.soldListings = stat.count;
        stats.totalRevenue = stat.totalRevenue || 0;
        stats.totalQuantitySold = stat.totalQuantity || 0;
      }
    });

    return stats;
  } catch (error) {
    console.error("Calculate stats error:", error);
    return {
      totalListings: 0,
      activeListings: 0,
      soldListings: 0,
      totalRevenue: 0,
      totalQuantitySold: 0,
      lastActiveAt: new Date(),
    };
  }
}

// Update basic profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, phone, location } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (location) {
      user.location = {
        state: location.state?.trim(),
        district: location.district?.trim(),
        pincode: location.pincode?.trim(),
      };
    }

    await user.save();

    // Log activity
    const profile = await UserProfile.findOne({ userId });
    if (profile) {
      profile.addActivity(
        "profile_updated",
        "Updated profile information",
        { fields: Object.keys(req.body) }
      );
      await profile.calculateProfileCompletion();
      await profile.save();
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Update farm details
export const updateFarmDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const farmDetails = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "farmer") {
      return res.status(400).json({ message: "Only farmers can update farm details" });
    }

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    profile.farmDetails = {
      ...profile.farmDetails,
      ...farmDetails,
    };

    profile.addActivity(
      "farm_details_updated",
      "Updated farm information"
    );

    await profile.calculateProfileCompletion();
    await profile.save();

    res.json({
      message: "Farm details updated successfully",
      farmDetails: profile.farmDetails,
      profileCompletion: profile.profileCompletion,
    });
  } catch (error) {
    console.error("Update farm details error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Update soil health card
export const updateSoilHealthCard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { nitrogen, phosphorus, potassium, pH } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate values
    if (
      (nitrogen != null && (nitrogen < 0 || nitrogen > 1000)) ||
      (phosphorus != null && (phosphorus < 0 || phosphorus > 1000)) ||
      (potassium != null && (potassium < 0 || potassium > 1000)) ||
      (pH != null && (pH < 0 || pH > 14))
    ) {
      return res.status(400).json({ message: "Invalid soil health values" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.soilHealthCard = {
      nitrogen: nitrogen ?? user.soilHealthCard?.nitrogen ?? null,
      phosphorus: phosphorus ?? user.soilHealthCard?.phosphorus ?? null,
      potassium: potassium ?? user.soilHealthCard?.potassium ?? null,
      pH: pH ?? user.soilHealthCard?.pH ?? null,
      lastUpdated: new Date(),
    };

    await user.save();

    // Update profile completion
    const profile = await UserProfile.findOne({ userId });
    if (profile) {
      profile.addActivity(
        "soil_health_updated",
        "Updated soil health card data"
      );
      await profile.calculateProfileCompletion();
      await profile.save();
    }

    res.json({
      message: "Soil health card updated successfully",
      soilHealthCard: user.soilHealthCard,
    });
  } catch (error) {
    console.error("Update soil health error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Get activity log with pagination
export const getActivityLog = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.json({ activities: [], total: 0, page, totalPages: 0 });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const activities = profile.recentActivities.slice(startIndex, endIndex);
    const total = profile.recentActivities.length;

    res.json({
      activities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: endIndex < total,
    });
  } catch (error) {
    console.error("Get activity log error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Get detailed analytics
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const period = (req.query.period as string) || "30d"; // 7d, 30d, 90d, 1y

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    let dateFilter: Date;

    switch (period) {
      case "7d":
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Listings over time
    const listingsOverTime = await Listing.aggregate([
      {
        $match: {
          sellerId: objectId,
          createdAt: { $gte: dateFilter },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "sold"] },
                { $multiply: ["$quantity", "$pricePerUnit"] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Crop distribution
    const cropDistribution = await Listing.aggregate([
      { $match: { sellerId: objectId } },
      {
        $group: {
          _id: "$cropName",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "sold"] },
                { $multiply: ["$quantity", "$pricePerUnit"] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Performance metrics
    const profile = await UserProfile.findOne({ userId });
    const stats = profile?.stats || {};

    const analytics = {
      period,
      summary: {
        totalListings: stats.totalListings || 0,
        activeListings: stats.activeListings || 0,
        soldListings: stats.soldListings || 0,
        totalRevenue: stats.totalRevenue || 0,
        averageListingPrice:
          stats.soldListings > 0
            ? Math.round(stats.totalRevenue / stats.soldListings)
            : 0,
        conversionRate:
          stats.totalListings > 0
            ? ((stats.soldListings / stats.totalListings) * 100).toFixed(2)
            : "0.00",
      },
      listingsOverTime,
      cropDistribution,
      topPerformingCrops: cropDistribution.slice(0, 5),
    };

    res.json(analytics);
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Update bank details
export const updateBankDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { accountHolderName, accountNumber, ifscCode, bankName, branch } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate IFSC code format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (ifscCode && !ifscRegex.test(ifscCode)) {
      return res.status(400).json({ message: "Invalid IFSC code format" });
    }

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    profile.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branch,
      isVerified: false, // Needs verification
    };

    profile.addActivity(
      "bank_details_updated",
      "Updated bank account details"
    );

    await profile.calculateProfileCompletion();
    await profile.save();

    res.json({
      message: "Bank details updated successfully",
      bankDetails: {
        ...profile.bankDetails,
        accountNumber: profile.bankDetails?.accountNumber
          ? `XXXX${profile.bankDetails.accountNumber.slice(-4)}`
          : undefined,
      },
    });
  } catch (error) {
    console.error("Update bank details error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const preferences = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    profile.preferences.notifications = {
      ...profile.preferences.notifications,
      ...preferences,
    };

    await profile.save();

    res.json({
      message: "Notification preferences updated",
      preferences: profile.preferences.notifications,
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Get user listings with filters
export const getUserListings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query: any = { sellerId: userId };
    if (status && ["active", "sold", "expired"].includes(status)) {
      query.status = status;
    }

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Listing.countDocuments(query),
    ]);

    res.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Get user listings error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

// Export profile data (GDPR compliance)
export const exportProfileData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [user, profile, listings, chatHistory] = await Promise.all([
      User.findById(userId).select("-password").lean(),
      UserProfile.findOne({ userId }).lean(),
      Listing.find({ sellerId: userId }).lean(),
      ChatHistory.find({ userId }).lean(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      profile,
      listings,
      chatHistory,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="krishi-sathi-profile-${userId}-${Date.now()}.json"`
    );
    res.json(exportData);
  } catch (error) {
    console.error("Export profile data error:", error);
    res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};
