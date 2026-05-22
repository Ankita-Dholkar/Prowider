"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface LeadDetail {
  _id: string;
  customerName: string;
  phone: string;
  city: string;
  description: string;
  createdAt: string;
  service: { name: string; slug: string } | null;
}

interface Assignment {
  assignmentId: string;
  assignedAt: string;
  lead: LeadDetail | null;
}

interface ProviderData {
  _id: string;
  name: string;
  monthlyQuota: number;
  leadsReceived: number;
  remainingQuota: number;
  leads: Assignment[];
}


function DashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = (searchParams.get("q") ?? "").toLowerCase().trim();

  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const lastFetchRef = useRef<string>(new Date(0).toISOString());

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (data.providers) {
        setProviders(data.providers);
        setLastUpdated(new Date().toLocaleTimeString());
        lastFetchRef.current = data.fetchedAt;
      }
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/dashboard/poll?since=${lastFetchRef.current}`);
        const data = await res.json();
        if (data.hasNew) await fetchDashboard();
      } catch { /* silent fail */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);


  const highlight = (text: string) => {
    if (!searchQuery || !text) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(searchQuery);
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

 
  const filteredProviders = searchQuery
    ? providers.filter((p) => {
        if (p.name.toLowerCase().includes(searchQuery)) return true;
        return p.leads.some(
          (a) =>
            a.lead?.customerName.toLowerCase().includes(searchQuery) ||
            a.lead?.phone.includes(searchQuery) ||
            a.lead?.city.toLowerCase().includes(searchQuery) ||
            a.lead?.service?.name.toLowerCase().includes(searchQuery)
        );
      })
    : providers;

  // Get leads to show inside an expanded provider 
  // If provider name matched → show all leads; otherwise show only matching ones
  const getDisplayLeads = (provider: ProviderData) => {
    if (!searchQuery) return provider.leads;
    if (provider.name.toLowerCase().includes(searchQuery)) return provider.leads;
    return provider.leads.filter(
      (a) =>
        a.lead?.customerName.toLowerCase().includes(searchQuery) ||
        a.lead?.phone.includes(searchQuery) ||
        a.lead?.city.toLowerCase().includes(searchQuery) ||
        a.lead?.service?.name.toLowerCase().includes(searchQuery)
    );
  };

  // Total matching leads across all filtered providers (for banner)
  const totalMatchedLeads = searchQuery
    ? filteredProviders.reduce((sum, p) => sum + getDisplayLeads(p).length, 0)
    : 0;

  const totalLeads = providers.reduce((s, p) => s + p.leadsReceived, 0);
  const quotaUsedPercent =
    providers.length > 0
      ? Math.round((totalLeads / (providers.length * 10)) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Provider Dashboard</h1>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {providers.length} Providers
            </span>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</p>
          )}
        </div>
      </div>

      {/* ── Active search filter banner ── */}
      {searchQuery && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm text-blue-700 flex-1">
            <span className="font-semibold">&ldquo;{searchParams.get("q")}&rdquo;</span>
            {" "}matched{" "}
            <span className="font-semibold">{filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""}</span>
            {totalMatchedLeads > 0 && (
              <> · <span className="font-semibold">{totalMatchedLeads} lead{totalMatchedLeads !== 1 ? "s" : ""}</span></>
            )}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-blue-600 font-medium hover:text-blue-800 underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Leads Assigned", value: totalLeads, color: "text-gray-900" },
          { label: "Quota Used", value: `${quotaUsedPercent}%`, color: "text-gray-900" },
          {
            label: "Providers at Capacity",
            value: providers.filter((p) => p.remainingQuota === 0).length,
            color: providers.filter((p) => p.remainingQuota === 0).length > 0 ? "text-red-600" : "text-emerald-600",
          },
          {
            label: "Available Providers",
            value: providers.filter((p) => p.remainingQuota > 0).length,
            color: providers.filter((p) => p.remainingQuota > 0).length === 0 ? "text-red-600" : "text-emerald-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Provider table ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">All Providers</h2>
            <p className="text-xs text-gray-500 mt-0.5">Click a row to view full lead details</p>
          </div>
          <button
            id="refresh-dashboard-btn"
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {filteredProviders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-400">
              {searchQuery ? `No providers or leads match "${searchParams.get("q")}"` : "No providers found. Seed the database first."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Leads Received</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining Quota</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quota Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((provider) => {
                  const pct = Math.round((provider.leadsReceived / provider.monthlyQuota) * 100);
                  // Auto-expand all rows when a search is active
                  const isExpanded = searchQuery ? true : expandedProvider === provider._id;
                  const displayLeads = getDisplayLeads(provider);

                  return (
                    <React.Fragment key={provider._id}>
                      <tr
                        onClick={() => setExpandedProvider(isExpanded ? null : provider._id)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="pl-4 py-3">
                          <svg
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-xs font-semibold text-white">
                              {provider.name.split(" ")[1]}
                            </div>
                            <span className="font-medium text-gray-900">{provider.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">{provider.leadsReceived}</span>
                          <span className="text-gray-400 text-xs ml-1">/ {provider.monthlyQuota}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${provider.remainingQuota === 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {provider.remainingQuota}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            provider.remainingQuota === 0 ? "bg-red-50 text-red-700" :
                            provider.leadsReceived === 0 ? "bg-gray-100 text-gray-600" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {provider.remainingQuota === 0 ? "Quota Full" : provider.leadsReceived === 0 ? "No Leads" : "Active"}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50 px-6 py-4 border-b border-gray-100">
                            <div className="fade-in">
                              {displayLeads.length === 0 ? (
                                <p className="text-xs text-gray-400 italic text-center py-3">
                                  No leads assigned to {provider.name} yet.
                                </p>
                              ) : (
                                <>
                                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                                    Leads assigned to {provider.name}
                                    <span className="ml-2 text-gray-400 normal-case font-normal">
                                      {displayLeads.length} lead{displayLeads.length !== 1 ? "s" : ""}
                                      {searchQuery && displayLeads.length !== provider.leads.length && (
                                        <span className="ml-1 text-blue-500">(filtered from {provider.leads.length})</span>
                                      )}
                                    </span>
                                  </p>
                                  <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Customer Name</th>
                                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">City</th>
                                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Assigned At</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {displayLeads.map((assignment, idx) => (
                                          <tr
                                            key={assignment.assignmentId}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                                          >
                                            <td className="px-4 py-3 text-gray-400 font-mono">{idx + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{highlight(assignment.lead?.customerName ?? "—")}</td>
                                            <td className="px-4 py-3 text-gray-600 font-mono tracking-wide">{highlight(assignment.lead?.phone ?? "—")}</td>
                                            <td className="px-4 py-3 text-gray-600">{highlight(assignment.lead?.city ?? "—")}</td>
                                            <td className="px-4 py-3">
                                              {assignment.lead?.service ? (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                                  {highlight(assignment.lead.service.name)}
                                                </span>
                                              ) : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={assignment.lead?.description ?? ""}>
                                              {assignment.lead?.description ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                              {new Date(assignment.assignedAt).toLocaleString("en-IN", {
                                                day: "2-digit", month: "short", year: "numeric",
                                                hour: "2-digit", minute: "2-digit",
                                              })}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page export — wraps inner component in Suspense (required for useSearchParams) ──
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
