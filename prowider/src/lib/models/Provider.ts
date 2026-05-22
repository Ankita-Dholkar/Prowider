import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProvider extends Document {
  name: string;
  monthlyQuota: number;
  leadsReceived: number;
}

const ProviderSchema = new Schema<IProvider>({
  name: { type: String, required: true, unique: true },
  monthlyQuota: { type: Number, required: true, default: 10 },
  leadsReceived: { type: Number, required: true, default: 0 },
});

const Provider: Model<IProvider> =
  mongoose.models.Provider ||
  mongoose.model<IProvider>("Provider", ProviderSchema);

export default Provider;
