// src/app/(dashboard)/dashboard/projects/[projectId]/proposal/page.tsx
// @ts-nocheck
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getActiveOrgContext } from "@/lib/orgAccess";

export default async function ProjectProposalPage(props: any) {
  // ✅ Next 16: params/searchParams are Promises
  const { params, searchParams } = props;
  const { projectId } = await params;
  const sp = (await searchParams) || {};
  const activeIdFromQuery = sp.proposalId || null;

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

  const activeProposal =
    (activeIdFromQuery &&
      proposals.find((p) => p.id === activeIdFromQuery)) ||
    proposals[0] ||
    null;

  const sections = (activeProposal?.sections as any) || {
    overview: "",
    scope: "",
    deliverables: "",
    timeline: "",
    pricing: "",
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-bold">
              Proposal builder · {project.title}
            </h1>
            <p className="text-xs text-slate-400">
              {project.client?.name
                ? `Client: ${project.client.name}`
                : "No client name set"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 font-semibold hover:bg-white hover:text-black"
            >
              ← Back to project
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 font-semibold hover:bg-white hover:text-black"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: brief + sections */}
          <div className="space-y-4 lg:col-span-2">
            {/* Brief + AI generate */}
            <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">Project brief</div>
                <span className="text-[10px] text-slate-400">
                  Used to generate proposal sections with AI-style helper.
                </span>
              </div>

              <form
                method="POST"
                action="/api/proposals/generate"
                className="space-y-2"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <textarea
                  name="brief"
                  rows={4}
                  required
                  className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="Describe the client, goals, scope, constraints, and success criteria..."
                />
                <button
                  type="submit"
                  className="mt-1 rounded-md border border-slate-600 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-200"
                >
                  Generate with AI
                </button>
              </form>
            </section>

            {/* Sections editor */}
            <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">Proposal sections</div>
                <span className="text-[10px] text-slate-400">
                  Edit sections and save as a draft version.
                </span>
              </div>

              {activeProposal ? (
                <form
                  method="POST"
                  action={`/api/proposals/${activeProposal.id}`}
                  className="space-y-3"
                >
                  <input type="hidden" name="projectId" value={project.id} />

                  <Field
                    name="overview"
                    label="Overview"
                    defaultValue={sections.overview}
                  />
                  <Field
                    name="scope"
                    label="Scope"
                    defaultValue={sections.scope}
                  />
                  <Field
                    name="deliverables"
                    label="Deliverables"
                    defaultValue={sections.deliverables}
                  />
                  <Field
                    name="timeline"
                    label="Timeline"
                    defaultValue={sections.timeline}
                  />
                  <Field
                    name="pricing"
                    label="Pricing"
                    defaultValue={sections.pricing}
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="submit"
                      className="rounded-md border border-slate-600 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-black hover:bg-white"
                    >
                      Save draft
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[11px] text-slate-400">
                  No proposal versions yet. Use the brief box above and click
                  &quot;Generate with AI&quot; to create the first draft.
                </p>
              )}
            </section>
          </div>

          {/* Right: versions list + sharing */}
          <aside className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-sm">Versions</div>
              <div className="text-[10px] text-slate-400">Latest first</div>
            </div>

            {proposals.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                No proposals yet for this project.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  {proposals.map((p) => {
                    const isActive =
                      activeProposal && p.id === activeProposal.id;
                    return (
                      <Link
                        key={p.id}
                        href={`/dashboard/projects/${project.id}/proposal?proposalId=${p.id}`}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                          isActive
                            ? "border-slate-300 bg-slate-800/90"
                            : "border-slate-700 bg-slate-950/70 hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-semibold">
                            Version {p.version}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="text-[10px] uppercase border border-slate-500 rounded-full px-2 py-0.5">
                          {p.status}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* 🔗 Stage 4: Sharing controls */}
                {activeProposal && (
                  <div className="mt-4 space-y-2 border-t border-slate-700 pt-3">
                    <div className="text-[11px] font-semibold">Sharing</div>

                    {activeProposal.publicToken ? (
                      <div className="space-y-1">
                        <Link
                          href={`/p/${activeProposal.publicToken}`}
                          className="inline-flex items-center rounded-md border border-slate-500 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-black hover:bg-white"
                        >
                          Open public view
                        </Link>
                        <p className="text-[10px] text-slate-400 break-all">
                          Link: /p/{activeProposal.publicToken}
                        </p>
                      </div>
                    ) : (
                      <form
                        method="POST"
                        action={`/api/proposals/${activeProposal.id}/publish`}
                        className="space-y-1"
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md border border-green-600 bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"
                        >
                          Publish shareable link
                        </button>
                        <p className="text-[10px] text-slate-400">
                          Publishing creates a read-only public page you can
                          send to clients.
                        </p>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1 text-[11px]">
      <label className="block text-slate-300">{label}</label>
      <textarea
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </div>
  );
}

