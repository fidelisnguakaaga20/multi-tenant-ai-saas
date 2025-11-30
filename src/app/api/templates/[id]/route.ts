// src/app/api/templates/[id]/route.ts

// @ts-nocheck
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logServerError } from "@/lib/logger";

async function getOrgContextForUser(clerkUserId: string) {
  const membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: true,
      user: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership || !membership.org || !membership.user) {
    throw new Error("No org membership for user");
  }

  return {
    orgId: membership.orgId,
    userId: membership.userId,
  };
}

/// GET /api/templates/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const u = await currentUser();
    if (!u) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { orgId } = await getOrgContextForUser(u.id);
    const { id } = await params; /// unwrap params Promise

    const template = await prisma.template.findFirst({
      where: { id, orgId },
    });

    if (!template) {
      return new Response("Not found", { status: 404 });
    }

    return Response.json({ template });
  } catch (err) {
    logServerError("templates_id_get_error", err);
    return new Response("Server error", { status: 500 });
  }
}

/// PATCH /api/templates/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const u = await currentUser();
    if (!u) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { orgId } = await getOrgContextForUser(u.id);
    const { id } = await params; /// unwrap params Promise

    const body = await req.json().catch(() => ({}));
    const name =
      typeof body.name === "string" ? body.name.trim() : undefined;
    const type =
      typeof body.type === "string" ? body.type.trim() : undefined;
    const templateBody =
      typeof body.body === "string" ? body.body.trim() : undefined;

    if (!name && !type && !templateBody) {
      return new Response("Nothing to update", { status: 400 });
    }

    const updated = await prisma.template.updateMany({
      where: { id, orgId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(templateBody !== undefined ? { body: templateBody } : {}),
      },
    });

    if (!updated.count) {
      return new Response("Not found", { status: 404 });
    }

    const template = await prisma.template.findFirst({
      where: { id, orgId },
    });

    return Response.json({ template });
  } catch (err) {
    logServerError("templates_id_patch_error", err);
    return new Response("Server error", { status: 500 });
  }
}

/// DELETE /api/templates/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const u = await currentUser();
    if (!u) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { orgId } = await getOrgContextForUser(u.id);
    const { id } = await params; /// unwrap params Promise

    const deleted = await prisma.template.deleteMany({
      where: { id, orgId },
    });

    if (!deleted.count) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    logServerError("templates_id_delete_error", err);
    return new Response("Server error", { status: 500 });
  }
}
