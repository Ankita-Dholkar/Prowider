import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { seedDatabase } from "@/lib/seed";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development." },
      { status: 403 }
    );
  }
  try {
    await connectDB();
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
