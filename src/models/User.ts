import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "farmer" | "buyer" | "admin";

export interface ISoilHealthCard {
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  pH: number | null;
  lastUpdated?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  language: string;
  location?: {
    state?: string;
    district?: string;
    pincode?: string;
  };
  soilHealthCard?: ISoilHealthCard;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SoilHealthCardSchema = new Schema<ISoilHealthCard>(
  {
    nitrogen: { type: Number, default: null },
    phosphorus: { type: Number, default: null },
    potassium: { type: Number, default: null },
    pH: { type: Number, default: null },
    lastUpdated: { type: Date },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ["farmer", "buyer", "admin"], default: "farmer" },
    language: { type: String, default: "hi" },
    location: {
      state: { type: String },
      district: { type: String },
      pincode: { type: String },
    },
    soilHealthCard: { type: SoilHealthCardSchema, default: () => ({}) },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
