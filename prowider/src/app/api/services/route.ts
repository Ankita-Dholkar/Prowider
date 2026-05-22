import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Service from "@/lib/models/Service";

export async function GET() {
  try {
    await connectDB();
    const services = await Service.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(services);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
