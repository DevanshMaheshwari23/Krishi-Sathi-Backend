import mongoose, { Document, Schema } from "mongoose";

export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId;
  profileCompletion: number;
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
  
  // Stats
  stats: {
    totalListings: number;
    activeListings: number;
    soldListings: number;
    totalRevenue: number;
    totalQuantitySold: number; // ADD THIS
    profileViews: number;
    averageRating: number;
    totalReviews: number;
  };

  // Farm Details
  farmDetails?: {
    farmName?: string;
    totalLandArea?: number;
    landUnit?: "acre" | "hectare" | "bigha";
    irrigationType?: "rainfed" | "canal" | "well" | "drip" | "sprinkler";
    primaryCrops?: string[];
    farmingType?: "organic" | "conventional" | "mixed";
    farmLocation?: {
      address?: string;
      coordinates?: {
        latitude?: number;
        longitude?: number;
      };
    };
  };

  // Bank Details - ADD THIS SECTION
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
    isVerified?: boolean;
  };

  // Business Details - ADD THIS SECTION
  businessDetails?: {
    gstNumber?: string;
    panNumber?: string;
    businessName?: string;
    businessType?: string;
  };

  // Achievements & Badges - ADD THIS SECTION
  achievements: Array<{
    name: string;
    earnedAt: Date;
    description?: string;
  }>;

  badges: string[]; // ADD THIS

  // Preferences
  preferences: {
    language: string;
    currency: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      priceAlerts: boolean;
      newMessages: boolean;
      listingUpdates: boolean;
      marketingEmails: boolean;
    };
  };

  // Recent Activities - ADD THIS
  recentActivities: Array<{
    action: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, string | number | boolean>;
  }>;

  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateProfileCompletion(): Promise<number>;
  addActivity(action: string, description: string, metadata?: Record<string, string | number | boolean>): void;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    kycStatus: {
      type: String,
      enum: ["not_started", "pending", "verified", "rejected"],
      default: "not_started",
    },
    stats: {
      totalListings: { type: Number, default: 0 },
      activeListings: { type: Number, default: 0 },
      soldListings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalQuantitySold: { type: Number, default: 0 }, // ADD THIS
      profileViews: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    farmDetails: {
      farmName: String,
      totalLandArea: Number,
      landUnit: {
        type: String,
        enum: ["acre", "hectare", "bigha"],
      },
      irrigationType: {
        type: String,
        enum: ["rainfed", "canal", "well", "drip", "sprinkler"],
      },
      primaryCrops: [String],
      farmingType: {
        type: String,
        enum: ["organic", "conventional", "mixed"],
      },
      farmLocation: {
        address: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
    },
    bankDetails: { // ADD THIS SECTION
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
      isVerified: { type: Boolean, default: false },
    },
    businessDetails: { // ADD THIS SECTION
      gstNumber: String,
      panNumber: String,
      businessName: String,
      businessType: String,
    },
    achievements: [
      {
        name: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
        description: String,
      },
    ],
    badges: [String], // ADD THIS
    preferences: {
      language: { type: String, default: "en" },
      currency: { type: String, default: "INR" },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: true },
        newMessages: { type: Boolean, default: true },
        listingUpdates: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false },
      },
    },
    recentActivities: [ // ADD THIS SECTION
      {
        action: { type: String, required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        metadata: Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to calculate profile completion
UserProfileSchema.methods.calculateProfileCompletion = async function (): Promise<number> {
  const user = await mongoose.model("User").findById(this.userId);
  let completion = 0;
  const totalFields = 10;

  // Basic info (3 fields)
  if (user?.name) completion++;
  if (user?.email) completion++;
  if (user?.phone) completion++;

  // Location
  if (user?.location?.state && user?.location?.district) completion++;

  // Farm details (if farmer)
  if (user?.role === "farmer") {
    if (this.farmDetails?.farmName) completion++;
    if (this.farmDetails?.totalLandArea) completion++;
    if (this.farmDetails?.primaryCrops && this.farmDetails.primaryCrops.length > 0) completion++;
  } else {
    completion += 3; // Skip for non-farmers
  }

  // KYC
  if (this.kycStatus === "verified") completion++;

  // Bank details
  if (this.bankDetails?.accountNumber) completion++;

  // Profile picture (check if user has uploaded)
  if (user?.profilePicture) completion++;

  return Math.round((completion / totalFields) * 100);
};

// Method to add activity
UserProfileSchema.methods.addActivity = function (
  action: string,
  description: string,
  metadata?: Record<string, string | number | boolean>
): void {
  this.recentActivities.unshift({
    action,
    description,
    timestamp: new Date(),
    metadata,
  });

  // Keep only last 50 activities
  if (this.recentActivities.length > 50) {
    this.recentActivities = this.recentActivities.slice(0, 50);
  }
};

const UserProfile = mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);
export default UserProfile;
