import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Lead from "@/lib/models/Lead";
import Service from "@/lib/models/Service";
import { assignLeadToProviders } from "@/lib/allocation";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { customerName, phone, city, serviceId, description } = body;

    if (!customerName || !phone || !city || !serviceId || !description) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Phone format: digits only
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone must be a 10-digit number." },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json({ error: "Invalid service." }, { status: 400 });
    }

    //Create lead 
    let lead;
    try {
      lead = await Lead.create({
        customerName,
        phone,
        city,
        serviceId,
        description,
      });
    } catch (err: unknown) {
      // MongoDB duplicate key error (code 11000)
      if ((err as { code?: number }).code === 11000) {
        return NextResponse.json(
          {
            error:
              "A lead with this phone number already exists for the selected service.",
          },
          { status: 409 }
        );
      }
      throw err;
    }

    //Trigger provider assignment
    const { assignedProviderNames } = await assignLeadToProviders(
      lead._id as import("mongoose").Types.ObjectId,
      service.slug
    );

    return NextResponse.json(
      {
        message: "Lead created and assigned successfully.",
        leadId: lead._id,
        assignedTo: assignedProviderNames,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
