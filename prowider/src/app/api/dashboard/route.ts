import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Provider from "@/lib/models/Provider";
import LeadAssignment from "@/lib/models/LeadAssignment";
import Lead from "@/lib/models/Lead";
import Service from "@/lib/models/Service";

/**
 * GET /api/dashboard
 */
export async function GET() {
  try {
    await connectDB();

    // Query 1: all providers
    const providers = await Provider.find({}).sort({ name: 1 }).lean();

    // Query 2: all assignments
    const allAssignments = await LeadAssignment.find({})
      .sort({ assignedAt: -1 })
      .lean();

    // Query 3: all leads referenced by assignments (single $in query)
    const leadIds = [...new Set(allAssignments.map((a) => a.leadId.toString()))];
    const leads =
      leadIds.length > 0
        ? await Lead.find({ _id: { $in: leadIds } }).lean()
        : [];
    const leadsById = new Map(leads.map((l) => [l._id.toString(), l]));

    // Query 4: all services referenced by those leads (single $in query)
    const serviceIds = [...new Set(leads.map((l) => l.serviceId.toString()))];
    const services =
      serviceIds.length > 0
        ? await Service.find({ _id: { $in: serviceIds } }).lean()
        : [];
    const servicesById = new Map(services.map((s) => [s._id.toString(), s]));

    // Group assignments by providerId 
    const assignmentsByProvider = new Map<string, typeof allAssignments>();
    for (const assignment of allAssignments) {
      const pid = assignment.providerId.toString();
      if (!assignmentsByProvider.has(pid)) assignmentsByProvider.set(pid, []);
      assignmentsByProvider.get(pid)!.push(assignment);
    }

    // Assemble dashboard payload
    const dashboardData = providers.map((provider) => {
      const pAssignments =
        assignmentsByProvider.get(provider._id.toString()) ?? [];

      const leadsWithDetails = pAssignments.map((assignment) => {
        const lead = leadsById.get(assignment.leadId.toString()) ?? null;
        const service = lead
          ? servicesById.get(lead.serviceId.toString()) ?? null
          : null;

        return {
          assignmentId: assignment._id,
          assignedAt: assignment.assignedAt,
          lead: lead
            ? {
                _id: lead._id,
                customerName: lead.customerName,
                phone: lead.phone,
                city: lead.city,
                description: lead.description,
                createdAt: lead.createdAt,
                service: service
                  ? { name: service.name, slug: service.slug }
                  : null,
              }
            : null,
        };
      });

      return {
        _id: provider._id,
        name: provider.name,
        monthlyQuota: provider.monthlyQuota,
        leadsReceived: provider.leadsReceived,
        remainingQuota: provider.monthlyQuota - provider.leadsReceived,
        leads: leadsWithDetails,
      };
    });

    return NextResponse.json({
      providers: dashboardData,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
