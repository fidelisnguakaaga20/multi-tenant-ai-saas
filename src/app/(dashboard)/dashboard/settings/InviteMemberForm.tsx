// src/app/(dashboard)/dashboard/settings/InviteMemberForm.tsx
"use client";

import React from "react";

export function InviteMemberForm({ canInvite }: { canInvite: boolean }) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleInvite() {
    if (!canInvite || !email) return;

    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/org/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("Error: " + (data?.message || res.statusText));
      } else {
        setStatus(data?.message || "Done.");
      }
    } catch (_err) {
      setStatus("Network error.");
    }

    setLoading(false);
  }

  return (
    <section className="border border-gray-600 rounded-xl p-4 max-w-xl space-y-3 bg-black/40">
      <div className="text-sm font-semibold text-white">
        Invite Teammate
      </div>

      <div className="flex flex-col gap-2 text-sm text-gray-300">
        <input
          type="email"
          className="bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm outline-none disabled:opacity-50"
          placeholder="teammate@example.com"
          value={email}
          disabled={loading || !canInvite}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleInvite}
          disabled={loading || !canInvite}
          className={`border rounded px-3 py-2 text-sm font-medium w-fit
            ${
              canInvite
                ? "border-gray-500 hover:bg-white hover:text-black text-white"
                : "border-gray-800 text-gray-600 cursor-not-allowed"
            }`}
        >
          {loading ? "Sending..." : "Invite"}
        </button>

        {!canInvite && (
          <div className="text-xs text-gray-500">
            Only OWNER / ADMIN can invite members.
          </div>
        )}

        {status && (
          <div className="text-xs text-yellow-300 whitespace-pre-wrap">
            {status}
          </div>
        )}
      </div>
    </section>
  );
}
