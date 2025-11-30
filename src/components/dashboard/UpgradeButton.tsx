// src/components/dashboard/UpgradeButton.tsx
"use client";
import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "Redirecting..." : "Upgrade to PRO"}
    </button>
  );
}

