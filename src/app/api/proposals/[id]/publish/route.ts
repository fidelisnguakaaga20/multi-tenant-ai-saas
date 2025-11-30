// src/app/api/proposals/[id]/publish/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getActiveOrgContext } from "@/lib/orgAccess";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/proposals/:id/publish
// Publishes a proposal by assigning (or reusing) a publicToken
export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // ✅ Clerk auth is async in your setup
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { params } = context;
    const { id } = await params;

    // ✅ Get active org for this user
    const ctx = await getActiveOrgContext(userId);
    if (!ctx.ok || !ctx.org) {
      return NextResponse.json(
        { error: ctx.error ?? "No active organization" },
        { status: 403 }
      );
    }

    // ✅ Only allow publishing proposals that belong to this org
    const proposal = await prisma.proposal.findFirst({
      where: { id, orgId: ctx.org.id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // If it already has a token, reuse it; otherwise create one
    const publicToken =
      proposal.publicToken ?? crypto.randomUUID().replace(/-/g, "");

    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        publicToken,
        // optional status bump when publishing:
        status: proposal.status === "DRAFT" ? "SENT" : proposal.status,
      },
    });

    const origin =
      process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const publicUrl = `${origin}/p/${updated.publicToken}`;

    return NextResponse.json({
      ok: true,
      publicToken: updated.publicToken,
      publicUrl,
    });
  } catch (err) {
    console.error("[proposal_publish_error]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

