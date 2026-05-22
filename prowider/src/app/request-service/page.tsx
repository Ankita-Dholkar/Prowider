"use client";

import { useState, useEffect } from "react";

interface Service {
  _id: string;
  name: string;
  slug: string;
}

type FormStatus = "idle" | "loading" | "success" | "error" | "duplicate";

export default function RequestServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [result, setResult] = useState<{ assignedTo?: string[]; error?: string } | null>(null);
  const [fieldError, setFieldError] = useState<{ phone?: string }>({});

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    city: "",
    serviceId: "",
    description: "",
  });

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch(console.error);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "phone") setFieldError({});
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setResult(null);
    setFieldError({});

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.status === 409) {
        setStatus("duplicate");
        setResult({ error: data.error });
        setFieldError({ phone: "This phone number already has a lead for the selected service." });
      } else if (!res.ok) {
        setStatus("error");
        setResult({ error: data.error });
      } else {
        setStatus("success");
        setResult({ assignedTo: data.assignedTo });
        setForm({ customerName: "", phone: "", city: "", serviceId: "", description: "" });
      }
    } catch {
      setStatus("error");
      setResult({ error: "Network error. Please try again." });
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">Submit Service Enquiry</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in your details below. The system will automatically assign you to 3 providers.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="customerName" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              required
              value={form.customerName}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-300 transition"
            />
          </div>

          {/* Phone + City row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                maxLength={10}
                pattern="\d{10}"
                className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-300 transition ${
                  fieldError.phone
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:ring-gray-900"
                }`}
              />
              {fieldError.phone && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldError.phone}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="city" className="block text-xs font-semibold text-gray-700 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-300 transition"
              />
            </div>
          </div>

          {/* Service dropdown */}
          <div>
            <label htmlFor="serviceId" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              id="serviceId"
              name="serviceId"
              required
              value={form.serviceId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-700 transition"
            >
              <option value="" disabled>Select a service...</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {services.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠ No services found. Go to{" "}
                <a href="/test-tools" className="underline font-medium">Test Tools</a>
                {" "}and seed the database first.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Briefly describe your requirement..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-300 resize-none transition"
            />
          </div>

          {/* Submit button */}
          <button
            id="submit-enquiry-btn"
            type="submit"
            disabled={status === "loading"}
            className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Enquiry"
            )}
          </button>
        </form>
      </div>

      {/* Success result */}
      {status === "success" && result?.assignedTo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-600">✓</span>
            <p className="text-sm font-semibold text-emerald-800">Lead submitted successfully!</p>
          </div>
          <p className="text-xs text-emerald-700 mb-2">Assigned to:</p>
          <div className="flex flex-wrap gap-2">
            {result.assignedTo.map((name) => (
              <span key={name} className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* General error (non-duplicate) */}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 fade-in">
          <div className="flex items-center gap-2">
            <span className="text-red-500">✕</span>
            <div>
              <p className="text-sm font-semibold text-red-800">Submission Failed</p>
              <p className="text-xs text-red-700 mt-0.5">{result?.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
