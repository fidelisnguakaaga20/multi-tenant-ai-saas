"use client";

import React from "react";

export default function AiDemoPage() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string>("");

  async function handleGenerate() {
    try {
      setLoading(true);
      setResult("");

      // We ALWAYS call the absolute route starting with "/"
      // so cookies (Clerk session) go with the request.
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // You can customize this prompt later. For demo it's fine.
        body: JSON.stringify({
          prompt:
            "Give a short onboarding message for my SaaS dashboard. Be friendly.",
        }),
        // VERY IMPORTANT:
        // We keep same-origin so browser sends Clerk session cookie.
        credentials: "include",
      });

      // If server returned non-2xx, grab text/error
      if (!res.ok) {
        // Try to read JSON error first
        let errText = "Request failed";
        try {
          const data = await res.json();
          errText = data.error || JSON.stringify(data);
        } catch {
          errText = await res.text();
        }
        setResult(errText || "Unauthorized");
        return;
      }

      // Success path
      const data = await res.json();
      // Our route returns { output, meta: {...} }
      setResult(data.output || "(no output)");
    } catch (err: any) {
      setResult("Client error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">AI Demo</h1>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="border border-gray-500 rounded px-4 py-2 text-sm font-medium hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      <div className="mt-6 rounded border border-gray-500 p-4 text-sm whitespace-pre-wrap break-words min-h-[4rem]">
        {result || ""}
      </div>
    </main>
  );
}
