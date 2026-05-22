"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notifCount, setNotifCount] = useState(0);
  // Track the last time we polled so we only count genuinely new assignments
  const lastCheckRef = useRef(new Date().toISOString());

  // Poll for new assignments every 5 s to drive the notification badge
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/dashboard/poll?since=${lastCheckRef.current}`
        );
        const data = await res.json();
        if (data.hasNew) {
          setNotifCount((c) => c + (data.count as number));
        }
        lastCheckRef.current = data.checkedAt;
      } catch {
        /* silent — polling is best-effort */
      }
    };

    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/dashboard?q=${encodeURIComponent(q)}`);
    }
  };

  const handleNotifClick = () => {
    setNotifCount(0);
    router.push("/dashboard");
  };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Functional search — navigates to /dashboard?q=... */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-48 md:w-72 focus-within:border-gray-400 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, providers..."
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
          />
        </form>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Live badge */}
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
          <span className="hidden sm:inline">Live Dashboard</span>
          <span className="sm:hidden">Live</span>
        </div>

        {/* Notification bell — shows badge for new assignments */}
        <button
          onClick={handleNotifClick}
          className="relative w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
          aria-label={notifCount > 0 ? `${notifCount} new assignments` : "No new assignments"}
          title={notifCount > 0 ? `${notifCount} new lead assignment${notifCount > 1 ? "s" : ""}` : "No new assignments"}
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">P</span>
        </div>
      </div>
    </header>
  );
}
