"use client";

import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition"
    >
      {loading ? "Redirecting..." : "Upgrade to Pro – $9/mo"}
    </button>
  );
}
