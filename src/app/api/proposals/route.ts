// src/app/api/proposals/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getActiveOrgContext } from "@/lib/orgAccess";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") || undefined;

  const proposals = await prisma.proposal.findMany({
    where: {
      orgId: ctx.org.id,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: [{ projectId: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ proposals });
}
