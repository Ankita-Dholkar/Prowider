import { connectDB } from "./mongoose";
import { Types } from "mongoose";
import Provider from "./models/Provider";
import AllocationState from "./models/AllocationState";
import LeadAssignment from "./models/LeadAssignment";
import { MANDATORY_RULES, FAIR_POOL_RULES } from "./allocationConfig";


export async function assignLeadToProviders(
  leadId: Types.ObjectId,
  serviceSlug: string
): Promise<{ assignedProviderNames: string[] }> {
  await connectDB();

  const TOTAL_SLOTS = 3;

  //Resolve mandatory providers
  const mandatoryNames = MANDATORY_RULES[serviceSlug] ?? [];
  const allProviders = await Provider.find({});

  const providerByName = new Map(allProviders.map((p) => [p.name, p]));

  const validMandatory = mandatoryNames
    .map((name) => providerByName.get(name))
    .filter(
      (p): p is NonNullable<typeof p> =>
        p !== undefined && p.leadsReceived < p.monthlyQuota
    );

  const assignedIds = new Set(validMandatory.map((p) => p._id.toString()));
  const slotsNeeded = TOTAL_SLOTS - validMandatory.length;

  //Atomic round-robin fair selection
  const fairPoolNames = FAIR_POOL_RULES[serviceSlug] ?? [];
  const fairPool = fairPoolNames
    .map((name) => providerByName.get(name))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const fairPicks: typeof fairPool = [];

  if (slotsNeeded > 0 && fairPool.length > 0) {
    // Atomically advance the pointer and get the OLD value.
    // Each concurrent call reserves its own unique starting range.
    const stateDoc = await AllocationState.findOneAndUpdate(
      { serviceSlug },
      { $inc: { pointer: slotsNeeded } },
      { new: false } // return the document BEFORE the increment
    );

    const startPointer = stateDoc?.pointer ?? 0;
    const poolLen = fairPool.length;

    // Try up to 2 full pool cycles to fill remaining slots
    for (let i = 0; i < poolLen * 2 && fairPicks.length < slotsNeeded; i++) {
      const candidate = fairPool[(startPointer + i) % poolLen];
      if (!candidate) continue;
      if (assignedIds.has(candidate._id.toString())) continue;
      if (candidate.leadsReceived >= candidate.monthlyQuota) continue;

      fairPicks.push(candidate);
      assignedIds.add(candidate._id.toString());
    }
  }

  //Step 3: Combine final assignment list
  const finalProviders = [...validMandatory, ...fairPicks];

  if (finalProviders.length === 0) {
    throw new Error("No providers available with remaining quota.");
  }

  //Step 4: Atomically claim quota slots and insert assignments
  const assignedProviderNames: string[] = [];

  for (const provider of finalProviders) {
    const updated = await Provider.findOneAndUpdate(
      {
        _id: provider._id,
        leadsReceived: { $lt: provider.monthlyQuota },
      },
      { $inc: { leadsReceived: 1 } },
      { new: true }
    );

    if (!updated) continue; 

    try {
      await LeadAssignment.create({
        leadId,
        providerId: provider._id,
        assignedAt: new Date(),
      });
      assignedProviderNames.push(provider.name);
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 11000) {
        // Duplicate: concurrent request already assigned — rollback quota
        await Provider.findByIdAndUpdate(provider._id, {
          $inc: { leadsReceived: -1 },
        });
      } else {
        throw err;
      }
    }
  }

  return { assignedProviderNames };
}
