import Link from "next/link";

const quickLinks = [
  {
    href: "/request-service",
    label: "Submit Service Enquiry",
    description: "Customer lead submission form",
    icon: "📋",
  },
  {
    href: "/dashboard",
    label: "Provider Dashboard",
    description: "Real-time lead distribution view",
    icon: "📊",
  },
  {
    href: "/test-tools",
    label: "Test Tools",
    description: "Webhook & concurrency testing",
    icon: "🔧",
  },
];

const rules = [
  { service: "Service 1", mandatory: "Provider 1", pool: "Providers 2, 3, 4" },
  { service: "Service 2", mandatory: "Provider 5", pool: "Providers 6, 7, 8" },
  { service: "Service 3", mandatory: "Providers 1 & 4", pool: "Providers 2, 3, 5, 6, 7, 8" },
];

export default function HomePage() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Overview</h1>
          <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-200">
            Operational
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Automated lead distribution — fair, concurrent-safe allocation across providers.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Providers", value: "8", sub: "All active" },
          { label: "Monthly Quota", value: "10", sub: "Per provider" },
          { label: "Leads per Submit", value: "3", sub: "Exact assignments" },
          { label: "Services", value: "3", sub: "Service 1, 2, 3" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center mb-3">
                <span className="text-2xl">{link.icon}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                {link.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Allocation rules table */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Allocation Rules</h2>
          <p className="text-xs text-gray-500 mt-0.5">Mandatory + round-robin pool per service</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mandatory</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fair Pool (Round-Robin)</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{rule.service}</td>
                <td className="px-5 py-3">
                  <span className="bg-red-50 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {rule.mandatory}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600 text-xs">{rule.pool}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
