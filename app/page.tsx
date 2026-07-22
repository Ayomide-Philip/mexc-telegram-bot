"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */

interface Signal {
  symbol: string;
  side: "long" | "short";
  entry: string;
  stopLoss: number | null;
  takeProfits: number[];
  leverage: string | null;
  raw: string;
  ts: number;
}

/* ─── Helpers ─── */

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Page ─── */

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [, rerender] = useState(0);

  useEffect(() => {
    const id = setInterval(() => rerender((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch("/api/signals");
      const data = await res.json();
      const arr: Signal[] = (data.signals ?? []).sort(
        (a: Signal, b: Signal) => b.ts - a.ts,
      );
      setSignals(arr);
    } catch {
      /* network errors are expected before the server is ready */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchSignals, 0);
    const id = setInterval(fetchSignals, 7_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(id);
    };
  }, [fetchSignals]);

  const toggle = (raw: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(raw)) next.delete(raw);
      else next.add(raw);
      return next;
    });
  };

  const deleteSignal = (raw: string) => {
    setSignals((prev) => prev.filter((s) => s.raw !== raw));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(raw);
      return next;
    });
  };

  const clearAll = () => {
    setSignals([]);
    setExpanded(new Set());
  };

  if (loading && signals.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-emerald-400" />
          <span className="text-sm text-gray-500">Loading signals</span>
        </div>
      </div>
    );
  }

  if (!loading && signals.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-8">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-semibold text-gray-300">
            Waiting for the first signal
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            The dashboard will update automatically when a signal arrives.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-300">
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-[#0B0F19]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/20">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-emerald-400"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-100">
                Signal Tracker
              </h1>
              <p className="text-[10px] text-gray-600">
                Real-time · {signals.length} signal
                {signals.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400 sm:inline-flex">
              ● Live
            </span>
            <button
              onClick={clearAll}
              className="rounded-lg border border-gray-700/50 px-3 py-1.5 text-[11px] font-medium text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-300"
            >
              Clear all
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-5">
        <div className="mb-1 hidden border-b border-gray-800 px-4 pb-2 text-[11px] font-medium uppercase tracking-wider text-gray-600 sm:grid sm:grid-cols-[1fr_80px_1fr_1fr_1.5fr_70px_100px_36px]">
          <span>Pair</span>
          <span>Side</span>
          <span>Entry</span>
          <span>Stop Loss</span>
          <span>Take Profits</span>
          <span>Lev.</span>
          <span className="text-right">Time</span>
          <span />
        </div>

        <div className="divide-y divide-gray-800/60">
          {signals.map((s, i) => {
            const isOpen = expanded.has(s.raw);
            const isLong = s.side === "long";

            return (
              <div key={`${s.ts}-${i}`}>
                <div
                  onClick={() => toggle(s.raw)}
                  className="group grid cursor-pointer grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-white/[0.02] sm:grid-cols-[1fr_80px_1fr_1fr_1.5fr_70px_100px_36px] sm:items-center sm:gap-0"
                >
                  <div className="flex items-center gap-2 sm:block">
                    <span className="text-sm font-semibold text-gray-100">
                      {s.symbol}/USDT
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold sm:hidden ${
                        isLong
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {isLong ? "Long" : "Short"}
                    </span>
                  </div>

                  <span
                    className={`hidden rounded px-1.5 py-0.5 text-[10px] font-semibold sm:inline-flex sm:w-fit ${
                      isLong
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {isLong ? "Long" : "Short"}
                  </span>

                  <div>
                    <span className="mr-2 font-mono text-[11px] text-gray-500 sm:hidden">
                      Entry:
                    </span>
                    <span className="font-mono text-sm text-gray-200">
                      {s.entry}
                    </span>
                  </div>

                  <div>
                    <span className="mr-2 font-mono text-[11px] text-gray-500 sm:hidden">
                      SL:
                    </span>
                    <span className="font-mono text-sm text-red-400/90">
                      {s.stopLoss ?? "—"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <span className="mr-1 font-mono text-[11px] text-gray-500 sm:hidden">
                      TP:
                    </span>
                    {s.takeProfits.length > 0 ? (
                      s.takeProfits.map((tp, j) => (
                        <span
                          key={j}
                          className="rounded bg-emerald-500/8 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400/90"
                        >
                          {j + 1}: {tp}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-600">—</span>
                    )}
                  </div>

                  <div>
                    {s.leverage ? (
                      <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[11px] text-indigo-400">
                        {s.leverage}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-600">—</span>
                    )}
                  </div>

                  <span
                    className="text-right text-[11px] tabular-nums text-gray-500"
                    title={new Date(s.ts).toLocaleString()}
                  >
                    {ago(s.ts)}
                  </span>

                  <div className="hidden sm:flex sm:justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSignal(s.raw);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-700 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                      title="Delete signal"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M4 4L12 12M12 4L4 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end px-4 pb-1 sm:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSignal(s.raw);
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 4L12 12M12 4L4 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Remove
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-800/40 bg-gray-900/40 px-4 py-3">
                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-gray-500">
                      {s.raw}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
