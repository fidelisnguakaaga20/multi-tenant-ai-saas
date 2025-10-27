// src/app/(dashboard)/dashboard/settings/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/usage";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) return null;

  const membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId: user.id } },
    include: {
      org: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="rounded-xl border p-4 space-y-2">
          <p>No workspace found for your account.</p>
          <Link href="/pricing" className="inline-flex rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            Create one via Pricing
          </Link>
        </div>
      </main>
    );
  }

  const orgId = membership.orgId;
  const [sub, members, used] = await Promise.all([
    prisma.subscription.findUnique({ where: { orgId }, select: { plan: true } }),
    prisma.membership.findMany({
      where: { orgId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    getUsage(orgId),
  ]);

  const plan = sub?.plan ?? "FREE";

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <span className="px-3 py-1 rounded-full text-sm border">Plan: {plan}</span>
      </div>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Workspace</h2>
        <div className="text-sm text-gray-500">
          <div>Name: <span className="text-white">{membership.org?.name ?? "Workspace"}</span></div>
          <div>Org ID: <code>{orgId}</code></div>
          <div>Usage this month: {plan === "FREE" ? `${used} / 10` : `${used}`}</div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Members</h2>
        <ul className="text-sm space-y-2">
          {members.map(m => (
            <li key={m.id} className="flex items-center justify-between">
              <span>{m.user.email}</span>
              <span className="px-2 py-0.5 rounded-full border text-xs">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2">
        <Link href="/dashboard" className="inline-flex rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">← Back</Link>
        <Link href="/pricing" className="inline-flex rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Upgrade</Link>
      </div>
    </main>
  );
}
