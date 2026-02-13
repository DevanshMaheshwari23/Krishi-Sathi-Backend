import mongoose, { Document, Schema } from "mongoose";

export interface IFarmDetails {
  farmName?: string;
  totalLandArea?: number;
  landUnit: "acre" | "hectare" | "bigha";
  irrigationType?: "rainfed" | "canal" | "well" | "drip" | "sprinkler";
  primaryCrops: string[];
  farmingType?: "organic" | "conventional" | "mixed";
  farmLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export interface IDocument {
  type: "aadhaar" | "kisan_credit_card" | "land_record" | "bank_passbook" | "other";
  documentName: string;
  documentUrl: string;
  verificationStatus: "pending" | "verified" | "rejected";
  uploadedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface IBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branch?: string;
  isVerified: boolean;
}

export interface IActivity {
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface INotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketingEmails: boolean;
  priceAlerts: boolean;
  newMessages: boolean;
  listingUpdates: boolean;
}

export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Profile completeness tracking
  profileCompletion: number; // 0-100
  
  // Farm details (for farmers)
  farmDetails?: IFarmDetails;
  
  // Business details (for buyers)
  businessDetails?: {
    businessName?: string;
    gstNumber?: string;
    businessType?: string;
    purchaseVolume?: number;
  };
  
  // Documents and verification
  documents: IDocument[];
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
  kycVerifiedAt?: Date;
  
  // Bank details
  bankDetails?: IBankDetails;
  
  // Statistics (cached for performance)
  stats: {
    totalListings: number;
    activeListings: number;
    soldListings: number;
    totalRevenue: number;
    totalQuantitySold: number;
    averageRating: number;
    totalReviews: number;
    profileViews: number;
    lastActiveAt: Date;
  };
  
  // Activity log
  recentActivities: IActivity[];
  
  // Settings
  preferences: {
    language: string;
    currency: "INR";
    timezone: string;
    notifications: INotificationPreferences;
  };
  
  // Security
  twoFactorEnabled: boolean;
  trustedDevices: string[];
  
  // Achievements
  badges: string[];
  achievements: {
    name: string;
    earnedAt: Date;
    description: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const FarmDetailsSchema = new Schema<IFarmDetails>({
  farmName: String,
  totalLandArea: Number,
  landUnit: { type: String, enum: ["acre", "hectare", "bigha"], default: "acre" },
  irrigationType: { type: String, enum: ["rainfed", "canal", "well", "drip", "sprinkler"] },
  primaryCrops: [String],
  farmingType: { type: String, enum: ["organic", "conventional", "mixed"] },
  farmLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
}, { _id: false });

const DocumentSchema = new Schema<IDocument>({
  type: { 
    type: String, 
    enum: ["aadhaar", "kisan_credit_card", "land_record", "bank_passbook", "other"],
    required: true 
  },
  documentName: { type: String, required: true },
  documentUrl: { type: String, required: true },
  verificationStatus: { 
    type: String, 
    enum: ["pending", "verified", "rejected"],
    default: "pending" 
  },
  uploadedAt: { type: Date, default: Date.now },
  verifiedAt: Date,
  rejectionReason: String,
}, { _id: true });

const BankDetailsSchema = new Schema<IBankDetails>({
  accountHolderName: String,
  accountNumber: String,
  ifscCode: String,
  bankName: String,
  branch: String,
  isVerified: { type: Boolean, default: false },
}, { _id: false });

const ActivitySchema = new Schema<IActivity>({
  action: { type: String, required: true },
  description: { type: String, required: true },
  metadata: Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const NotificationPreferencesSchema = new Schema<INotificationPreferences>({
  email: { type: Boolean, default: true },
  sms: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  marketingEmails: { type: Boolean, default: false },
  priceAlerts: { type: Boolean, default: true },
  newMessages: { type: Boolean, default: true },
  listingUpdates: { type: Boolean, default: true },
}, { _id: false });

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
    
    farmDetails: FarmDetailsSchema,
    
    businessDetails: {
      businessName: String,
      gstNumber: String,
      businessType: String,
      purchaseVolume: Number,
    },
    
    documents: [DocumentSchema],
    kycStatus: { 
      type: String, 
      enum: ["not_started", "pending", "verified", "rejected"],
      default: "not_started" 
    },
    kycVerifiedAt: Date,
    
    bankDetails: BankDetailsSchema,
    
    stats: {
      totalListings: { type: Number, default: 0 },
      activeListings: { type: Number, default: 0 },
      soldListings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalQuantitySold: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      profileViews: { type: Number, default: 0 },
      lastActiveAt: { type: Date, default: Date.now },
    },
    
    recentActivities: {
      type: [ActivitySchema],
      default: [],
      validate: [(val: IActivity[]) => val.length <= 50, 'Max 50 activities'],
    },
    
    preferences: {
      language: { type: String, default: "hi" },
      currency: { type: String, default: "INR" },
      timezone: { type: String, default: "Asia/Kolkata" },
      notifications: {
        type: NotificationPreferencesSchema,
        default: () => ({}),
      },
    },
    
    twoFactorEnabled: { type: Boolean, default: false },
    trustedDevices: [String],
    
    badges: [String],
    achievements: [{
      name: { type: String, required: true },
      earnedAt: { type: Date, default: Date.now },
      description: String,
    }],
  },
  { timestamps: true }
);

// Indexes for performance
UserProfileSchema.index({ userId: 1 });
UserProfileSchema.index({ "stats.lastActiveAt": -1 });
UserProfileSchema.index({ kycStatus: 1 });

// Method to calculate profile completion
UserProfileSchema.methods.calculateProfileCompletion = async function() {
  const User = mongoose.model("User");
  const user = await User.findById(this.userId);
  
  if (!user) return 0;
  
  let completion = 0;
  const weights = {
    basicInfo: 20,      // name, email, phone
    location: 10,        // location details
    soilHealthCard: 15,  // soil health data
    farmDetails: 20,     // farm information
    bankDetails: 15,     // bank account
    kyc: 20,            // KYC verification
  };
  
  // Basic info
  if (user.name && user.email && user.phone) completion += weights.basicInfo;
  
  // Location
  if (user.location?.state && user.location?.district) completion += weights.location;
  
  // Soil health card
  const shc = user.soilHealthCard;
  if (shc?.nitrogen != null && shc?.phosphorus != null && shc?.potassium != null && shc?.pH != null) {
    completion += weights.soilHealthCard;
  }
  
  // Farm details (for farmers)
  if (user.role === "farmer" && this.farmDetails) {
    const fd = this.farmDetails;
    if (fd.farmName && fd.totalLandArea && fd.primaryCrops?.length > 0) {
      completion += weights.farmDetails;
    }
  } else if (user.role === "buyer") {
    completion += weights.farmDetails; // Buyers don't need farm details
  }
  
  // Bank details
  if (this.bankDetails?.accountNumber && this.bankDetails?.ifscCode && this.bankDetails?.isVerified) {
    completion += weights.bankDetails;
  }
  
  // KYC
  if (this.kycStatus === "verified") completion += weights.kyc;
  
  this.profileCompletion = Math.min(completion, 100);
  return this.profileCompletion;
};

// Method to add activity
UserProfileSchema.methods.addActivity = function(action: string, description: string, metadata?: Record<string, any>) {
  const activity: IActivity = {
    action,
    description,
    metadata,
    timestamp: new Date(),
  };
  
  this.recentActivities.unshift(activity);
  
  // Keep only last 50 activities
  if (this.recentActivities.length > 50) {
    this.recentActivities = this.recentActivities.slice(0, 50);
  }
};

export const UserProfile = mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);
