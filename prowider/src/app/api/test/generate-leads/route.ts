import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Lead from "@/lib/models/Lead";
import Service from "@/lib/models/Service";
import { assignLeadToProviders } from "@/lib/allocation";

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Hyderabad", "Kolkata", "Ahmedabad"];
const NAMES = ["Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Singh", "Ravi Verma", "Ananya Rao", "Vikram Joshi", "Pooja Mehta", "Suresh Nair", "Kavya Iyer"];

/**
 * Generates 10 concurrent leads across all services to test
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development." },
      { status: 403 }
    );
  }
  try {
    await connectDB();

    const services = await Service.find({}).lean();
    if (services.length === 0) {
      return NextResponse.json(
        { error: "No services found. Please seed the database first." },
        { status: 400 }
      );
    }

    const timestamp = Date.now();

    // Create 10 lead payloads
    const leadPayloads = Array.from({ length: 10 }, (_, i) => {
      const service = services[i % services.length];
      return {
        customerName: NAMES[i],
        phone: `99${String(timestamp).slice(-8).slice(0, 6)}${String(i).padStart(2, "0")}`,
        city: CITIES[i % CITIES.length],
        serviceId: service._id,
        serviceSlug: service.slug,
        description: `Concurrent test lead #${i + 1} for ${service.name}`,
      };
    });

    // Fire all 10 simultaneously to test concurrency
    const results = await Promise.allSettled(
      leadPayloads.map(async (payload) => {
        const lead = await Lead.create({
          customerName: payload.customerName,
          phone: payload.phone,
          city: payload.city,
          serviceId: payload.serviceId,
          description: payload.description,
        });

        const { assignedProviderNames } = await assignLeadToProviders(
          lead._id as import("mongoose").Types.ObjectId,
          payload.serviceSlug
        );

        return {
          leadId: lead._id,
          customerName: payload.customerName,
          service: payload.serviceSlug,
          assignedTo: assignedProviderNames,
        };
      })
    );

    const successful = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);

    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.toString());

    return NextResponse.json({
      message: `Generated ${successful.length}/10 leads successfully.`,
      successful,
      failed,
    });
  } catch (err) {
    console.error("[POST /api/test/generate-leads]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
