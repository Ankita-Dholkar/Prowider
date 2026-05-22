import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import LeadAssignment from "@/lib/models/LeadAssignment";

/*
 * GET /api/dashboard/poll?since=<ISO timestamp>
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const sinceParam = req.nextUrl.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : new Date(0);

    const newAssignments = await LeadAssignment.find({
      assignedAt: { $gt: since },
    })
      .sort({ assignedAt: -1 })
      .lean();

    // Count distinct leads, not assignments (each lead creates 3 assignments)
    const uniqueLeadCount = new Set(
      newAssignments.map((a) => a.leadId.toString())
    ).size;

    return NextResponse.json({
      hasNew: uniqueLeadCount > 0,
      count: uniqueLeadCount,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
