// src/app/(dashboard)/dashboard/page.tsx
// @ts-nocheck
"use server";

import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma, dbPing } from "@/lib/db";
import { getUsage } from "@/lib/usage";

const FREE_LIMIT = 10;

function getMonthRangeUTC() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return { start, end: nextMonth };
}

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-red-400 font-medium text-sm">
          Not signed in.
        </div>
      </main>
    );
  }

  // DB health check
  if (!(await dbPing())) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-yellow-300 text-sm">
          Database is unreachable. Check DATABASE_URL (use -pooler &
          pgbouncer=true).
        </div>
      </main>
    );
  }

  const clerkUserId = user.id;
  const email =
    user.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const firstName = user.firstName ?? "My";

  // find/create org + subscription (owner by default)
  let membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: {
        include: {
          subscription: true,
          memberships: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    // Create org + owner membership + FREE sub on first visit
    const newOrg = await prisma.organization.create({
      data: {
        name: `${firstName.toUpperCase()} Workspace`,
        memberships: {
          create: {
            role: "OWNER",
            user: { create: { clerkUserId, email } },
          },
        },
        subscription: { create: { plan: "FREE" } },
      },
      include: {
        subscription: true,
        memberships: { include: { user: true } },
      },
    });

    membership = {
      orgId: newOrg.id,
      org: newOrg,
      role: "OWNER",
    };
  }

  const org = membership.org!;
  const plan = org.subscription?.plan ?? "FREE";

  // Usage
  const used = await getUsage(org.id);
  const remainingText =
    plan === "PRO"
      ? "unlimited"
      : `${Math.max(FREE_LIMIT - used, 0)} / ${FREE_LIMIT} left this month`;

  // Documents created this month
  const { start, end } = getMonthRangeUTC();
  const docsThisMonth = await prisma.document.count({
    where: {
      orgId: org.id,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  const sub = org.subscription;
  const nextBilling =
    sub?.currentPeriodEnd
      ? sub.currentPeriodEnd.toLocaleDateString()
      : "—";

  // Stage 2: clients & projects for this org
  const clients = await prisma.client.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
  });

  const projects = await prisma.project.findMany({
    where: { orgId: org.id },
    include: { client: true, owner: true },
    orderBy: { updatedAt: "desc" },
  });

  // ---------- Stage 6: simple pipeline analytics (derived only) ----------
  const totalClients = clients.length;
  const totalProjects = projects.length;

  const activePipeline = projects.filter(
    (p: any) =>
      p.status === "LEAD" || p.status === "PROPOSAL_SENT"
  );
  const pipelineCount = activePipeline.length;

  const wonCount = projects.filter(
    (p: any) => p.status === "WON"
  ).length;
  const sentCount = projects.filter(
    (p: any) => p.status === "PROPOSAL_SENT"
  ).length;

  const winRate =
    sentCount > 0 ? Math.round((wonCount / sentCount) * 100) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              Dashboard ·{" "}
              <span className="uppercase">{org.name}</span>
            </h1>
            <p className="text-xs text-slate-400">
              Usage, billing, members, clients, and projects.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs font-medium">
              Plan: {plan}
            </span>
            <Link
              href="/"
              className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Top cards: Usage + Billing */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Usage card */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
            <div className="text-sm">
              <div>
                Generations this month:{" "}
                <span className="font-semibold text-white">
                  {used}
                </span>{" "}
                {plan === "PRO" ? (
                  <span className="text-green-400">(unlimited)</span>
                ) : (
                  <span className="text-yellow-300">
                    ({remainingText})
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Free limit is {FREE_LIMIT}/month per organization.
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Documents created this month:{" "}
                <span className="font-semibold text-white">
                  {docsThisMonth}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/dashboard/ai"
                className="rounded-lg border border-slate-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"
              >
                Open AI Copilot
              </Link>
              <Link
                href="/dashboard/settings"
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Billing card */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-4">
            <div className="text-sm font-semibold mb-1">
              Billing
            </div>
            <div className="space-y-1 text-sm">
              <div>
                Current plan:{" "}
                <span className="font-semibold text-white">
                  {plan}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Next billing date:{" "}
                <span className="font-semibold text-slate-200">
                  {nextBilling}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Manage payment method and invoices in the Stripe
                customer portal.
              </div>
            </div>

            <div className="pt-2">
              <form
                method="POST"
                action="/api/billing/portal"
                className="inline-block"
              >
                <button
                  type="submit"
                  className="rounded-lg border border-slate-600 bg-slate-100 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
                >
                  Manage billing
                </button>
              </form>
              <Link
                href="/pricing"
                className="ml-3 inline-block rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-semibold hover:bg-white hover:text-black"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Stage 6: simple analytics row */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-semibold">
                Pipeline snapshot
              </h2>
              <p className="text-xs text-slate-400">
                Quick view of how many clients and deals are moving
                through your workspace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="text-[11px] text-slate-400">
                Clients
              </div>
              <div className="mt-1 text-lg font-semibold">
                {totalClients}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="text-[11px] text-slate-400">
                Projects
              </div>
              <div className="mt-1 text-lg font-semibold">
                {totalProjects}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="text-[11px] text-slate-400">
                Deals in pipeline
              </div>
              <div className="mt-1 text-lg font-semibold">
                {pipelineCount}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                LEAD + PROPOSAL_SENT
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="text-[11px] text-slate-400">
                Won / win rate
              </div>
              <div className="mt-1 text-lg font-semibold">
                {wonCount}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {winRate !== null
                  ? `Win rate: ${winRate}%`
                  : "Win rate: —"}
              </div>
            </div>
          </div>
        </section>

        {/* Stage 2: Clients & Projects */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">
                Projects
              </h2>
              <p className="text-xs text-slate-400">
                CRM-style view of clients and active projects for this org.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="#new-client"
                className="rounded-md border border-slate-600 bg-slate-950/80 px-3 py-1 hover:bg-white hover:text-black"
              >
                + New Client
              </a>
              <a
                href="#new-project"
                className="rounded-md border border-slate-600 bg-slate-950/80 px-3 py-1 hover:bg-white hover:text-black"
              >
                + New Project
              </a>
            </div>
          </div>

          {/* Projects table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/80 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Client</th>
                  <th className="px-3 py-2 text-left font-medium">Project</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 text-left font-medium">
                    Last activity
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Owner
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      No projects yet. Create a client and then a
                      project to get started.
                    </td>
                  </tr>
                ) : (
                  projects.map((p: any) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60"
                    >
                      <td className="px-3 py-2 align-middle">
                        <div className="font-medium text-slate-100">
                          {p.client?.name ?? "—"}
                        </div>
                        {p.client?.company && (
                          <div className="text-[10px] text-slate-400">
                            {p.client.company}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="text-xs font-semibold">
                          {p.title}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span className="inline-flex items-center rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {p.estimatedValue != null ? (
                          <span className="text-xs">
                            ${p.estimatedValue.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-slate-300">
                        {p.lastActivityAt
                          ? new Date(
                              p.lastActivityAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-slate-300">
                        {p.owner?.email ?? "—"}
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <Link
                          href={`/dashboard/projects/${p.id}`}
                          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Inline forms for new client / new project */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* New client form */}
            <form
              id="new-client"
              method="POST"
              action="/api/clients"
              className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-4"
            >
              <div className="text-xs font-semibold mb-1">
                New Client
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Company
                  </label>
                  <input
                    name="company"
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Contact email
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Estimated value (USD)
                  </label>
                  <input
                    name="estimatedValue"
                    type="number"
                    step="0.01"
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-md border border-slate-600 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-200"
              >
                Save client
              </button>
            </form>

            {/* New project form */}
            <form
              id="new-project"
              method="POST"
              action="/api/projects"
              className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-4"
            >
              <div className="text-xs font-semibold mb-1">
                New Project
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="title"
                    required
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Client <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="clientId"
                    required
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs"
                  >
                    <option value="">Select client…</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? ` · ${c.company}` : ""}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="mt-1 text-[10px] text-yellow-300">
                      Create a client first.
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="LEAD"
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs"
                  >
                    <option value="LEAD">LEAD</option>
                    <option value="PROPOSAL_SENT">PROPOSAL_SENT</option>
                    <option value="WON">WON</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">
                    Estimated value (USD)
                  </label>
                  <input
                    name="estimatedValue"
                    type="number"
                    step="0.01"
                    className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-md border border-slate-600 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-black hover:bg-white"
                disabled={clients.length === 0}
              >
                Save project
              </button>
            </form>
          </div>
        </section>

        {/* Members card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="text-sm font-semibold mb-3">Members</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {org.memberships.map((m: any) => (
              <div
                key={m.id}
                className="rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm flex items-center justify-between"
              >
                <span className="text-slate-200">
                  {m.user?.email ?? "unknown"}
                </span>
                <span className="text-xs rounded-full border border-slate-600 px-2 py-0.5">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Invite flow available at{" "}
            <code>/dashboard/settings</code>.
          </div>
        </section>
      </div>
    </main>
  );
}

