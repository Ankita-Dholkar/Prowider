import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAllocationState extends Document {
  serviceId: Types.ObjectId;
  serviceSlug: string;
  // Ordered array of provider IDs representing the fair rotation pool
  pool: Types.ObjectId[];
  // Current round-robin pointer into the pool array (persists across restarts)
  pointer: number;
}

const AllocationStateSchema = new Schema<IAllocationState>({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  serviceSlug: { type: String, required: true, unique: true },
  pool: [{ type: Schema.Types.ObjectId, ref: "Provider" }],
  pointer: { type: Number, default: 0 },
});

const AllocationState: Model<IAllocationState> =
  mongoose.models.AllocationState ||
  mongoose.model<IAllocationState>("AllocationState", AllocationStateSchema);

export default AllocationState;
