// src/app/(dashboard)/dashboard/page.tsx
// Org-aware dashboard with usage counter and quick nav (Pricing, AI demo, Settings).
// Server component – no "use client".

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/usage";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return null;

  // 1) Find the user's first workspace (membership → orgId)
  const membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId: user.id } },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });

  // 2) If no workspace yet → FREE state
  if (!membership) {
    const used = 0;
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <span className="px-3 py-1 rounded-full text-sm border">Plan: FREE</span>
        </div>

        <div className="rounded-xl border p-4 space-y-3">
          <p>You are on the FREE plan. Unlock PRO features.</p>
          <p className="text-sm text-gray-500">This month used: {used} / 10 generations.</p>
          <div className="flex gap-2">
            <Link className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" href="/pricing">
              Go to Pricing
            </Link>
            <Link className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" href="/dashboard/ai">
              Try AI demo
            </Link>
            <Link className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" href="/dashboard/settings">
              Settings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const orgId = membership.orgId;

  // 3) Read plan & usage for this org
  const [sub, used] = await Promise.all([
    prisma.subscription.findUnique({ where: { orgId }, select: { plan: true } }),
    getUsage(orgId),
  ]);

  const plan = sub?.plan ?? "FREE";

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Dashboard{membership.org?.name ? ` · ${membership.org.name}` : ""}
        </h1>
        <span className="px-3 py-1 rounded-full text-sm border">Plan: {plan}</span>
      </div>

      {plan === "FREE" ? (
        <div className="rounded-xl border p-4 space-y-3">
          <p>You are on the FREE plan. Unlock PRO features.</p>
          <p className="text-sm text-gray-500">This month used: {used} / 10 generations.</p>
          <div className="flex gap-2">
            <Link className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" href="/pricing">
              Go to Pricing
            </Link>
            <Link className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" href="/dashboard/ai">
              Try AI demo
            </Link>
            <Link className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" href="/dashboard/settings">
              Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-4 space-y-3">
          <p>✅ PRO active — unlimited generations.</p>
          <p className="text-sm text-gray-500">This month used: {used}.</p>
          <div className="flex gap-2">
            <Link className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" href="/dashboard/ai">
              Open AI demo
            </Link>
            <Link className="inline-flex rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" href="/dashboard/settings">
              Settings
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
