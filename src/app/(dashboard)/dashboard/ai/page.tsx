// src/app/(dashboard)/dashboard/ai/page.tsx
// NOTE: Pure client component. Only styling / layout improved.

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
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">
            AI Demo
          </h1>
          <p className="text-xs text-slate-400">
            Run a test generation. Usage counts against your org plan.
          </p>
        </div>

        {/* Card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex flex-col gap-4 max-w-2xl">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-lg border border-slate-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed w-fit transition-colors"
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            <textarea
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:ring-1 focus:ring-slate-400"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

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


// "use client";

// import React from "react";

// export default function AIDemoPage() {
//   const [prompt, setPrompt] = React.useState(
//     "Give a short onboarding message for my SaaS dashboard. Be friendly."
//   );
//   const [loading, setLoading] = React.useState(false);
//   const [responseBox, setResponseBox] = React.useState("");

//   async function handleGenerate() {
//     setLoading(true);
//     setResponseBox("");

//     try {
//       const res = await fetch("/api/ai/generate", {
//         method: "POST",
//         body: JSON.stringify({ prompt }),
//       });

//       if (res.status === 402) {
//         // FREE plan limit hit
//         setResponseBox(
//           "Free quota reached. Upgrade to PRO for unlimited generations.\nGo to Pricing → 'Upgrade to PRO'."
//         );
//         setLoading(false);
//         return;
//       }

//       if (!res.ok) {
//         setResponseBox("Error generating. Try again.");
//         setLoading(false);
//         return;
//       }

//       const data = await res.json();
//       setResponseBox(data.output || "(no output)");
//     } catch (_err) {
//       setResponseBox("Network error / fetch failed.");
//     }

//     setLoading(false);
//   }

//   return (
//     <main className="min-h-screen bg-black text-white p-6 space-y-6">
//       <h1 className="text-2xl font-bold">AI Demo</h1>

//       <div className="flex flex-col gap-4 max-w-2xl">
//         <button
//           onClick={handleGenerate}
//           disabled={loading}
//           className="border border-gray-400 rounded px-4 py-2 text-black bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
//         >
//           {loading ? "Generating..." : "Generate"}
//         </button>

//         <textarea
//           className="w-full bg-black border border-gray-500 rounded p-3 text-sm text-white outline-none"
//           rows={3}
//           value={prompt}
//           onChange={(e) => setPrompt(e.target.value)}
//         />

//         {responseBox && (
//           <div className="border border-gray-600 rounded p-4 text-sm whitespace-pre-wrap bg-black/40">
//             {responseBox}
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }
