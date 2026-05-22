import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILead extends Document {
  customerName: string;
  phone: string;
  city: string;
  serviceId: Types.ObjectId;
  description: string;
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Duplicate prevention: same phone + same service is not allowed
// Enforced at DB level via unique compound index
LeadSchema.index({ phone: 1, serviceId: 1 }, { unique: true });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
