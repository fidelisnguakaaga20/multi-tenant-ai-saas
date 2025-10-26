"use client";

import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Upgrade failed:", data);
        alert("Upgrade failed: " + (data?.error || "Unknown error"));
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        alert("No checkout URL returned from server.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Upgrade exception:", err);
      alert("Unexpected error: " + err?.message);
      setLoading(false);
    }
  };

  return (
    <button
      disabled={loading}
      onClick={handleUpgrade}
      className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
    >
      {loading ? "Redirecting..." : "Upgrade to Pro"}
    </button>
  );
}
