// src/app/p/[publicToken]/page.tsx
// @ts-nocheck
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function PublicProposalPage(props: any) {
  const { params } = props;
  const { publicToken } = await params;

  const proposal = await prisma.proposal.findFirst({
    where: { publicToken },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!proposal || !proposal.project) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <p className="text-sm text-slate-300">Proposal not found.</p>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
          >
            ← Back to main site
          </Link>
        </div>
      </main>
    );
  }

  const sections = (proposal.sections as any) || {};

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Proposal for{" "}
            {proposal.project.client?.name || "Client"}
          </p>
          <h1 className="text-2xl font-bold">
            {proposal.project.title}
          </h1>
          <p className="text-[11px] text-slate-400">
            Shared via Multi-Tenant AI SaaS. This is a read-only view.
          </p>
        </header>

        <div className="space-y-6 text-sm leading-relaxed">
          <Section title="Overview" text={sections.overview} />
          <Section title="Scope" text={sections.scope} />
          <Section title="Deliverables" text={sections.deliverables} />
          <Section title="Timeline" text={sections.timeline} />
          <Section title="Pricing" text={sections.pricing} />
        </div>

        <footer className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-400">
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 font-semibold hover:bg-white hover:text-black"
          >
            ← Back to main site
          </Link>
          <span>
            To accept or request changes, please reply directly to the sender of this link.
          </span>
        </footer>
      </div>
    </main>
  );
}

function Section({ title, text }: { title: string; text?: string }) {
  if (!text) return null;
  return (
    <section className="space-y-1">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      <p className="text-[13px] text-slate-200 whitespace-pre-line">
        {text}
      </p>
    </section>
  );
}

