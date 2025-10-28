"use client";

import React from "react";

export default function AIDemoPage() {
  const [prompt, setPrompt] = React.useState(
    "Give a short onboarding message for my SaaS dashboard. Be friendly."
  );
  const [loading, setLoading] = React.useState(false);
  const [responseBox, setResponseBox] = React.useState("");

  async function handleGenerate() {
    setLoading(true);
    setResponseBox("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      if (res.status === 402) {
        // FREE plan limit hit
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
    } catch (_err) {
      setResponseBox("Network error / fetch failed.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Demo</h1>

      <div className="flex flex-col gap-4 max-w-2xl">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="border border-gray-400 rounded px-4 py-2 text-black bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        <textarea
          className="w-full bg-black border border-gray-500 rounded p-3 text-sm text-white outline-none"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {responseBox && (
          <div className="border border-gray-600 rounded p-4 text-sm whitespace-pre-wrap bg-black/40">
            {responseBox}
          </div>
        )}
      </div>
    </main>
  );
}
