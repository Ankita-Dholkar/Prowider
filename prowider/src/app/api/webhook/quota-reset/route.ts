import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Provider from "@/lib/models/Provider";
import WebhookEvent from "@/lib/models/WebhookEvent";

/**
 * Idempotent quota-reset webhook.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { eventId, type } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required for idempotency." },
        { status: 400 }
      );
    }

    if (type !== "quota-reset") {
      return NextResponse.json(
        { error: "Unsupported webhook type." },
        { status: 400 }
      );
    }

    //Idempotency check
    try {
      await WebhookEvent.create({
        _id: eventId,
        type,
        processedAt: new Date(),
      });
    } catch (err: unknown) {
      // Duplicate key → this event was already processed
      if ((err as { code?: number }).code === 11000) {
        return NextResponse.json({
          status: "already_processed",
          message: `Webhook event '${eventId}' was already processed. No changes made.`,
        });
      }
      throw err;
    }

    // Reset all provider quotas 
    await Provider.updateMany({}, { $set: { leadsReceived: 0 } });

    return NextResponse.json({
      status: "success",
      message: "All provider quotas have been reset to 10.",
      eventId,
    });
  } catch (err) {
    console.error("[POST /api/webhook/quota-reset]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
