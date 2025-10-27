// src/app/(dashboard)/dashboard/ai/page.tsx
"use client";
import { useState } from "react";

export default function AIDemoPage() {
  const [resp, setResp] = useState<string>("");

  const run = async () => {
    setResp("Running...");
    const r = await fetch("/api/ai/generate", { method: "POST" });
    if (!r.ok) {
      setResp(await r.text());
      return;
    }
    const data = await r.json();
    setResp(`Output: ${data.output} | Remaining: ${data.remaining}`);
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI Demo</h1>
      <button onClick={run} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
        Generate
      </button>
      <pre className="rounded-xl border p-3 text-sm whitespace-pre-wrap">{resp}</pre>
    </main>
  );
}
