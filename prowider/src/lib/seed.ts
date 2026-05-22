

import { connectDB } from "./mongoose";
import Service from "./models/Service";
import Provider from "./models/Provider";
import AllocationState from "./models/AllocationState";
import { FAIR_POOL_RULES } from "./allocationConfig";

const SERVICES = [
  { name: "Service 1", slug: "service-1" },
  { name: "Service 2", slug: "service-2" },
  { name: "Service 3", slug: "service-3" },
];

const PROVIDERS = Array.from({ length: 8 }, (_, i) => ({
  name: `Provider ${i + 1}`,
  monthlyQuota: 10,
  leadsReceived: 0,
}));

export async function seedDatabase(): Promise<{ message: string }> {
  await connectDB();

  //Upsert Services 
  const serviceMap = new Map<string, import("mongoose").Types.ObjectId>();
  for (const svc of SERVICES) {
    const doc = await Service.findOneAndUpdate(
      { slug: svc.slug },
      { $setOnInsert: svc },
      { upsert: true, new: true }
    );
    serviceMap.set(svc.slug, doc._id as import("mongoose").Types.ObjectId);
  }

  //Upsert Providers
  const providerMap = new Map<string, import("mongoose").Types.ObjectId>();
  for (const prov of PROVIDERS) {
    const doc = await Provider.findOneAndUpdate(
      { name: prov.name },
      { $setOnInsert: prov },
      { upsert: true, new: true }
    );
    providerMap.set(prov.name, doc._id as import("mongoose").Types.ObjectId);
  }

  //Upsert AllocationState
  for (const [slug, poolNames] of Object.entries(FAIR_POOL_RULES)) {
    const serviceId = serviceMap.get(slug);
    if (!serviceId) continue;

    const poolIds = poolNames
      .map((name) => providerMap.get(name))
      .filter(Boolean) as import("mongoose").Types.ObjectId[];

    await AllocationState.findOneAndUpdate(
      { serviceSlug: slug },
      { $setOnInsert: { serviceId, serviceSlug: slug, pool: poolIds, pointer: 0 } },
      { upsert: true, new: true }
    );
  }

  return { message: "Database seeded successfully." };
}
