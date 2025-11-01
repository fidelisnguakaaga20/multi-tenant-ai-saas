// src/app/(dashboard)/dashboard/ai/page.tsx
"use client";

import React from "react";
import Link from "next/link";

export default function AIDemoPage() {
  const [prompt, setPrompt] = React.useState(
    "Give a short onboarding message for my SaaS dashboard. Be friendly."
  );
  const [loading, setLoading] = React.useState(false);
  const [responseBox, setResponseBox] = React.useState<string>("");

  async function handleGenerate() {
    setLoading(true);
    setResponseBox("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      if (res.status === 402) {
        setResponseBox(
          "Free quota reached. Upgrade to PRO for unlimited generations.\nGo to Pricing → 'Upgrade to PRO'."
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setResponseBox("Error generating. Try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResponseBox(data.output || "(no output)");
    } catch {
      setResponseBox("Network error / fetch failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">AI Demo</h1>
            <p className="text-xs text-slate-400">
              Run a test generation. Counts against your org usage.
            </p>
          </div>

          {/* /// Back to Home */}
          <Link
            href="/"
            className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
          >
            ← Home
          </Link>
        </div>

        {/* Card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex flex-col gap-4 max-w-2xl">
            <label className="text-xs text-slate-300" htmlFor="prompt">
              Prompt
            </label>
            <textarea
              id="prompt"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:ring-1 focus:ring-slate-400"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-lg border border-slate-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
              <Link
                href="/pricing"
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
              >
                Upgrade plan
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
              >
                Dashboard
              </Link>
            </div>

            {responseBox && (
              <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-200 whitespace-pre-wrap shadow-inner">
                {responseBox}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
