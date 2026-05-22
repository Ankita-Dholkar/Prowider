import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebhookEvent extends Document {
  _id: string; // idempotency key (sent by caller)
  type: string;
  processedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  _id: { type: String, required: true }, // eventId IS the _id — unique by design
  type: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>("WebhookEvent", WebhookEventSchema);

export default WebhookEvent;
