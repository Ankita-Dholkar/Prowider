import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILeadAssignment extends Document {
  leadId: Types.ObjectId;
  providerId: Types.ObjectId;
  assignedAt: Date;
}

const LeadAssignmentSchema = new Schema<ILeadAssignment>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
  providerId: { type: Schema.Types.ObjectId, ref: "Provider", required: true },
  assignedAt: { type: Date, default: Date.now },
});

// Prevent a provider from being assigned the same lead twice (concurrency safety net)
LeadAssignmentSchema.index({ leadId: 1, providerId: 1 }, { unique: true });

const LeadAssignment: Model<ILeadAssignment> =
  mongoose.models.LeadAssignment ||
  mongoose.model<ILeadAssignment>("LeadAssignment", LeadAssignmentSchema);

export default LeadAssignment;
