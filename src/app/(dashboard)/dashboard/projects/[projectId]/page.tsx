// src/app/(dashboard)/dashboard/projects/[projectId]/page.tsx
// @ts-nocheck
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getActiveOrgContext } from "@/lib/orgAccess";

export default async function ProjectDetailPage(props: any) {
  // Next 16: params is a Promise
  const { params } = props;
  const { projectId } = await params;

  const user = await currentUser();
  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-red-400 text-sm">Not signed in.</div>
      </main>
    );
  }

  const ctx = await getActiveOrgContext(user.id);
  if (!ctx.ok || !ctx.org) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-yellow-300 text-sm">
          {ctx.error ?? "No active organization"}
        </div>
      </main>
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId: ctx.org.id },
    include: { client: true, owner: true },
  });

  if (!project) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-sm text-slate-300">Project not found.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const proposals = await prisma.proposal.findMany({
    where: { projectId: project.id, orgId: ctx.org.id },
    orderBy: { createdAt: "desc" },
  });

  const latestProposal = proposals[0] ?? null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{project.title}</h1>
            <p className="text-xs text-slate-400">
              {project.client?.name
                ? `Client: ${project.client.name}`
                : "No client name set"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 font-semibold hover:bg-white hover:text-black"
            >
              ← Back to dashboard
            </Link>
            <Link
              href={`/dashboard/projects/${project.id}/proposal`}
              className="rounded-md border border-slate-600 bg-slate-100 px-3 py-1.5 font-semibold text-black hover:bg-white"
            >
              Open proposal builder
            </Link>
          </div>
        </div>

        {/* Project summary */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl space-y-3 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-[11px] text-slate-400">Status</div>
              <div className="mt-1 inline-flex items-center rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {project.status}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Owner</div>
              <div className="mt-1 text-xs">
                {project.owner?.email ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Estimated value</div>
              <div className="mt-1 text-xs">
                {project.estimatedValue != null
                  ? `$${project.estimatedValue.toLocaleString()}`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Last activity</div>
              <div className="mt-1 text-xs">
                {project.lastActivityAt
                  ? new Date(project.lastActivityAt).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          </div>
        </section>

        {/* Proposals overview */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl text-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Proposals</h2>
            <Link
              href={`/dashboard/projects/${project.id}/proposal`}
              className="rounded-md border border-slate-600 bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-white"
            >
              Go to proposal builder
            </Link>
          </div>

          {proposals.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              No proposals yet for this project. Use the proposal builder to
              create the first draft.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      Version
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60"
                    >
                      <td className="px-3 py-2">
                        Version {p.version}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {latestProposal && (
            <p className="text-[10px] text-slate-500">
              Latest proposal: version {latestProposal.version} (
              {latestProposal.status}).
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

