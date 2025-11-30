// src/app/api/proposals/generate/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getActiveOrgContext } from "@/lib/orgAccess";
import { checkAllowance, incrementUsage } from "@/lib/usage";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getActiveOrgContext(user.id);
  if (!ctx.ok || !ctx.org) {
    return NextResponse.json(
      { error: ctx.error ?? "No active org" },
      { status: 400 },
    );
  }

  const contentType = req.headers.get("content-type") || "";
  let projectId: string;
  let brief: string;

  if (contentType.includes("application/json")) {
    const body = await req.json();
    projectId = (body.projectId ?? "").toString();
    brief = (body.brief ?? "").toString();
  } else {
    const formData = await req.formData();
    projectId = String(formData.get("projectId") || "");
    brief = String(formData.get("brief") || "");
  }

  if (!projectId || !brief) {
    return NextResponse.json(
      { error: "projectId and brief are required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId: ctx.org.id },
    include: { client: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // ✅ Stage 5: enforce monthly proposal generation limit for Free plan
  const allowance = await checkAllowance(ctx.org.id);
  if (!allowance.allowed) {
    const url = new URL(
      `/dashboard/projects/${project.id}/proposal`,
      req.url,
    );
    url.searchParams.set("limit", "proposals");
    return NextResponse.redirect(url);
  }

  // Simple structured sections (no external API, portfolio-friendly)
  const clientName = project.client?.name ?? "your client";
  const title = project.title;

  const sections = {
    overview: `This proposal outlines a project for ${clientName}, based on the following brief:\n\n${brief}`,
    scope:
      `Key scope items:\n` +
      `- Understand the client's goals and context\n` +
      `- Design and implement the agreed solution\n` +
      `- Iterate with feedback and track progress`,
    deliverables:
      `Core deliverables:\n` +
      `- Detailed implementation plan\n` +
      `- Working product / feature set\n` +
      `- Documentation and handover\n` +
      `- Post-launch support window`,
    timeline:
      `Indicative timeline (adjust per project):\n` +
      `- Week 1–2: Discovery & planning\n` +
      `- Week 3–4: Core build\n` +
      `- Week 5: Testing & polish\n` +
      `- Week 6: Launch & review`,
    pricing:
      `Pricing structure (to be customized):\n` +
      `- Fixed project fee OR\n` +
      `- Monthly retainer + success-based component\n` +
      `- Payment terms: e.g. 40% upfront, 40% on milestones, 20% on completion`,
  };

  // Versioning (per project)
  const last = await prisma.proposal.findFirst({
    where: { projectId: project.id, orgId: ctx.org.id },
    orderBy: { version: "desc" },
  });

  const nextVersion = (last?.version ?? 0) + 1;

  // ✅ Track usage now that we are generating
  await incrementUsage(ctx.org.id, 1);

  const proposal = await prisma.proposal.create({
    data: {
      projectId: project.id,
      orgId: ctx.org.id,
      version: nextVersion,
      status: "DRAFT",
      sections,
    },
  });

  const url = new URL(
    `/dashboard/projects/${project.id}/proposal`,
    req.url,
  );
  url.searchParams.set("proposalId", proposal.id);

  return NextResponse.redirect(url);
}

