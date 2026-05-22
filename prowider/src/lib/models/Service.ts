import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
  name: string;
  slug: string;
}

const ServiceSchema = new Schema<IService>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
});

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);

export default Service;
