// src/app/api/projects/[id]/route.ts
// @ts-nocheck

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

async function getMembershipForUser(clerkUserId: string) {
  const membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: true,
      user: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return membership;
}

// GET /api/projects/:id
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) {
    return new Response("Unauthorized", { status: 401 });
  }

  const membership = await getMembershipForUser(u.id);
  if (!membership || !membership.org) {
    return new Response("No org membership for user.", { status: 400 });
  }

  const { id } = await params;
  const orgId = membership.orgId;

  const project = await prisma.project.findFirst({
    where: { id, orgId },
    include: {
      client: true,
      owner: true,
    },
  });

  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json({ project });
}

// PATCH /api/projects/:id
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) {
    return new Response("Unauthorized", { status: 401 });
  }

  const membership = await getMembershipForUser(u.id);
  if (!membership || !membership.org) {
    return new Response("No org membership for user.", { status: 400 });
  }

  // Stage 5: any org member (OWNER / ADMIN / MEMBER → OWNER / MANAGER / CONTRIBUTOR)
  // can update project details. Destructive actions restricted in DELETE.
  const { id } = await params;
  const orgId = membership.orgId;

  const body = (await req.json().catch(() => ({}))) ?? {};
  const title =
    typeof body.title === "string" ? body.title.trim() : undefined;
  const status =
    typeof body.status === "string" ? body.status.trim() : undefined;
  const estimatedValueRaw =
    typeof body.estimatedValue === "string" || typeof body.estimatedValue === "number"
      ? String(body.estimatedValue)
      : undefined;

  if (title === undefined && status === undefined && estimatedValueRaw === undefined) {
    return new Response("Nothing to update", { status: 400 });
  }

  const data: any = {
    lastActivityAt: new Date(),
  };

  if (title !== undefined) data.title = title;
  if (status !== undefined) data.status = status;
  if (estimatedValueRaw !== undefined) {
    const num = Number(estimatedValueRaw);
    data.estimatedValue = Number.isNaN(num) ? null : num;
  }

  const updated = await prisma.project.updateMany({
    where: { id, orgId },
    data,
  });

  if (!updated.count) {
    return new Response("Not found", { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { id, orgId },
    include: {
      client: true,
      owner: true,
    },
  });

  return Response.json({ project });
}

// DELETE /api/projects/:id
// Stage 5: only OWNER / ADMIN (OWNER / MANAGER in product language) can delete.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) {
    return new Response("Unauthorized", { status: 401 });
  }

  const membership = await getMembershipForUser(u.id);
  if (!membership || !membership.org) {
    return new Response("No org membership for user.", { status: 400 });
  }

  const role = membership.role; // "OWNER" | "ADMIN" | "MEMBER"
  if (role !== "OWNER" && role !== "ADMIN") {
    return new Response(
      "Forbidden: only OWNER / MANAGER can delete projects.",
      { status: 403 }
    );
  }

  const { id } = await params;
  const orgId = membership.orgId;

  const deleted = await prisma.project.deleteMany({
    where: { id, orgId },
  });

  if (!deleted.count) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(null, { status: 204 });
}

