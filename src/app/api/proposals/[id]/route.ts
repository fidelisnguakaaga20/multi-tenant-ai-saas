// src/app/api/proposals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getActiveOrgContext } from "@/lib/orgAccess";
import type { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProposalStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";

interface UpdateProposalBody {
  sections?: unknown;
  status?: ProposalStatus;
  publicToken?: string | null;
}

/**
 * GET /api/proposals/[id]
 * Load a single proposal for the active org.
 */
export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getActiveOrgContext(userId);
  if (!ctx.ok || !ctx.org) {
    return NextResponse.json(
      { error: ctx.error ?? "No active organization" },
      { status: 400 }
    );
  }

  const { id } = await context.params;

  const proposal = await prisma.proposal.findFirst({
    where: { id, orgId: ctx.org.id },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}

/**
 * POST /api/proposals/[id]
 * Handles HTML form submit from the proposal builder ("Save draft").
 * Updates sections and redirects back to the proposal builder page.
 */
export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getActiveOrgContext(userId);
  if (!ctx.ok || !ctx.org) {
    return NextResponse.json(
      { error: ctx.error ?? "No active organization" },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const form = await req.formData();

  const projectId = form.get("projectId")?.toString() ?? null;

  const sections = {
    overview: form.get("overview")?.toString() ?? "",
    scope: form.get("scope")?.toString() ?? "",
    deliverables: form.get("deliverables")?.toString() ?? "",
    timeline: form.get("timeline")?.toString() ?? "",
    pricing: form.get("pricing")?.toString() ?? "",
  };

  try {
    const updated = await prisma.proposal.updateMany({
      where: { id, orgId: ctx.org.id },
      data: {
        sections: sections as Prisma.InputJsonValue,
        // status stays whatever it was (DRAFT / SENT / etc)
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // If this came from the browser form, redirect back to the builder UI.
    if (projectId) {
      const url = new URL(
        `/dashboard/projects/${projectId}/proposal?proposalId=${id}`,
        req.url
      );
      return NextResponse.redirect(url);
    }

    // Fallback: return JSON if projectId is missing
    const proposal = await prisma.proposal.findFirst({
      where: { id, orgId: ctx.org.id },
    });

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("[PROPOSAL_POST]", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/proposals/[id]
 * Update proposal sections / status / publicToken via JSON (programmatic use).
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getActiveOrgContext(userId);
  if (!ctx.ok || !ctx.org) {
    return NextResponse.json(
      { error: ctx.error ?? "No active organization" },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const body = (await req.json()) as UpdateProposalBody;

  const data: Prisma.ProposalUpdateManyMutationInput = {};

  if (body.sections && typeof body.sections === "object") {
    data.sections = body.sections as Prisma.InputJsonValue;
  }

  if (
    body.status === "DRAFT" ||
    body.status === "SENT" ||
    body.status === "ACCEPTED" ||
    body.status === "REJECTED"
  ) {
    data.status = body.status;
  }

  if (body.publicToken === null || typeof body.publicToken === "string") {
    data.publicToken = body.publicToken;
  }

  try {
    const updated = await prisma.proposal.updateMany({
      where: { id, orgId: ctx.org.id },
      data,
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const proposal = await prisma.proposal.findFirst({
      where: { id, orgId: ctx.org.id },
    });

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("[PROPOSAL_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proposals/[id]
 * Hard-delete proposal for the active org (simple version).
 */
export async function DELETE(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getActiveOrgContext(userId);
  if (!ctx.ok || !ctx.org) {
    return NextResponse.json(
      { error: ctx.error ?? "No active organization" },
      { status: 400 }
    );
  }

  const { id } = await context.params;

  try {
    const deleted = await prisma.proposal.deleteMany({
      where: { id, orgId: ctx.org.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROPOSAL_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete proposal" },
      { status: 500 }
    );
  }
}


