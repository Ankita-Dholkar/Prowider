"use client";

import { useState } from "react";

type TestStatus = "idle" | "loading" | "success" | "error";

interface WebhookResult {
  status?: string;
  message?: string;
  error?: string;
  eventId?: string;
}

interface GenerateResult {
  message?: string;
  successful?: unknown[];
  failed?: string[];
  error?: string;
}

export default function TestToolsPage() {
  const FIXED_EVENT_ID = "evt_prowider_quota_reset_v1";

  const [webhookStatus, setWebhookStatus] = useState<TestStatus>("idle");
  const [webhookLog, setWebhookLog] = useState<{ call: number; result: WebhookResult }[]>([]);

  const [generateStatus, setGenerateStatus] = useState<TestStatus>("idle");
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);

  const callWebhookOnce = async (eventId: string): Promise<WebhookResult> => {
    const res = await fetch("/api/webhook/quota-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, type: "quota-reset" }),
    });
    return res.json();
  };

  const handleResetQuota = async () => {
    setWebhookStatus("loading");
    setWebhookLog([]);
    const freshId = `evt_reset_${Date.now()}`;
    try {
      const result = await callWebhookOnce(freshId);
      setWebhookLog([{ call: 1, result }]);
      setWebhookStatus("success");
    } catch {
      setWebhookStatus("error");
    }
  };

  const handleIdempotencyTest = async () => {
    setWebhookStatus("loading");
    setWebhookLog([]);
    try {
      const results: { call: number; result: WebhookResult }[] = [];
      for (let i = 1; i <= 5; i++) {
        const result = await callWebhookOnce(FIXED_EVENT_ID);
        results.push({ call: i, result });
      }
      setWebhookLog(results);
      setWebhookStatus("success");
    } catch {
      setWebhookStatus("error");
    }
  };

  const handleGenerateLeads = async () => {
    setGenerateStatus("loading");
    setGenerateResult(null);
    try {
      const res = await fetch("/api/test/generate-leads", { method: "POST" });
      const data = await res.json();
      setGenerateResult(data);
      setGenerateStatus(data.error ? "error" : "success");
    } catch {
      setGenerateStatus("error");
      setGenerateResult({ error: "Network error" });
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Test Tools</h1>
        <p className="text-sm text-gray-500 mt-1">Webhook simulation, idempotency verification, and concurrency testing.</p>
      </div>

      {/* Section 0: Database Setup */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Database Setup</h2>
          <span className="text-xs text-gray-400">Run once before testing</span>
        </div>
        <div className="p-4 md:p-5 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Seeds 3 services, 8 providers (quota: 10 each), and 3 allocation states.
          </p>
          <a
            id="seed-database-btn"
            href="/api/seed"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            🌱 Seed Database
          </a>
        </div>
      </div>

      {/* Section 1: Webhook / Quota Reset */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Webhook Simulation</h2>
          <p className="text-xs text-gray-500 mt-0.5">POST /api/webhook/quota-reset</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reset quota */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Reset All Quotas</p>
                <p className="text-xs text-gray-500 mt-0.5">Fresh unique eventId on each call.</p>
              </div>
              <button
                id="reset-quota-btn"
                onClick={handleResetQuota}
                disabled={webhookStatus === "loading"}
                className="w-full py-2 px-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors"
              >
                {webhookStatus === "loading" ? "Processing..." : "Reset Provider Quotas"}
              </button>
            </div>

            {/* Idempotency test */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Idempotency Test ×5</p>
                <p className="text-xs text-gray-500 mt-0.5">Same eventId sent 5 times — only call #1 should succeed.</p>
                <code className="block mt-2 text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-600 break-all">
                  {FIXED_EVENT_ID}
                </code>
              </div>
              <button
                id="idempotency-test-btn"
                onClick={handleIdempotencyTest}
                disabled={webhookStatus === "loading"}
                className="w-full py-2 px-3 border border-gray-900 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                {webhookStatus === "loading" ? "Processing..." : "Run Idempotency Test"}
              </button>
            </div>
          </div>

          {/* Webhook log */}
          {webhookLog.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden fade-in">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600">Webhook Call Log</p>
              </div>
              <div className="divide-y divide-gray-50">
                {webhookLog.map(({ call, result }) => (
                  <div key={call} className="px-4 py-3 flex items-center gap-4 text-xs">
                    <span className="text-gray-400 font-mono w-10">#{call}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        result.status === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : result.status === "already_processed"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {result.status ?? "error"}
                    </span>
                    <span className="text-gray-600 flex-1">{result.message ?? result.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Concurrent lead generation */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Concurrency Stress Test</h2>
          <p className="text-xs text-gray-500 mt-0.5">10 leads fired simultaneously via Promise.allSettled</p>
        </div>
        <div className="p-5 space-y-4">
          <button
            id="generate-leads-btn"
            onClick={handleGenerateLeads}
            disabled={generateStatus === "loading"}
            className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors"
          >
            {generateStatus === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating 10 concurrent leads...
              </span>
            ) : (
              "⚡ Generate 10 Concurrent Leads"
            )}
          </button>

          {/* Generate result */}
          {generateResult && (
            <div className="border border-gray-100 rounded-xl overflow-hidden fade-in">
              <div
                className={`px-4 py-2.5 border-b border-gray-100 ${
                  generateStatus === "success" ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                <p className={`text-xs font-semibold ${generateStatus === "success" ? "text-emerald-800" : "text-red-800"}`}>
                  {generateResult.message ?? generateResult.error}
                </p>
              </div>

              {generateResult.successful && generateResult.successful.length > 0 && (
                <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                  {(generateResult.successful as Array<{
                    leadId: string;
                    customerName: string;
                    service: string;
                    assignedTo: string[];
                  }>).map((lead, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs border-b border-gray-50 pb-2 last:border-0">
                      <span className="text-gray-400 font-mono w-4">{i + 1}</span>
                      <span className="font-medium text-gray-900 w-32 truncate">{lead.customerName}</span>
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                        {lead.service}
                      </span>
                      <span className="text-gray-500 flex-1">→ {lead.assignedTo?.join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}

              {generateResult.failed && generateResult.failed.length > 0 && (
                <div className="px-4 py-3 bg-red-50">
                  <p className="text-xs font-semibold text-red-700 mb-1">Failed ({generateResult.failed.length}):</p>
                  {generateResult.failed.map((f, i) => (
                    <p key={i} className="text-xs text-red-600">{f}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
