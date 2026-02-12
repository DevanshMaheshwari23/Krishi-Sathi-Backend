import mongoose, { Document, Schema } from "mongoose";

export type ListingType = "sell" | "buy";
export type ListingStatus = "active" | "sold" | "expired";

export interface IListing extends Document {
  sellerId: mongoose.Types.ObjectId;
  type: ListingType;
  cropName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  images: string[];
  description?: string;
  location: {
    state?: string;
    district?: string;
  };
  status: ListingStatus;
  expiryDate?: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["sell", "buy"], required: true },
    cropName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    pricePerUnit: { type: Number, required: true },
    images: { type: [String], default: [] },
    description: { type: String },
    location: {
      state: { type: String },
      district: { type: String },
    },
    status: { type: String, enum: ["active", "sold", "expired"], default: "active" },
    expiryDate: { type: Date },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ListingSchema.index({ cropName: 1, status: 1, createdAt: -1 });

export const Listing = mongoose.model<IListing>("Listing", ListingSchema);
