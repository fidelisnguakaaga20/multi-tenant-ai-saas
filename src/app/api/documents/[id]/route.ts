// src/app/api/documents/[id]/route.ts

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

// NOTE: in Next 16 `params` is a Promise, so we type it that way and `await` it.
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

    /// ✅ unwrap params Promise
    const { id } = await params;

    const doc = await prisma.document.findFirst({
      where: { id, orgId },
    });

    if (!doc) {
      return new Response("Not found", { status: 404 });
    }

    return Response.json({ document: doc });
  } catch (err) {
    logServerError("documents_id_get_error", err);
    return new Response("Server error", { status: 500 });
  }
}

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

    /// ✅ unwrap params Promise
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" ? body.title.trim() : undefined;
    const content =
      typeof body.content === "string" ? body.content.trim() : undefined;

    if (!title && !content) {
      return new Response("Nothing to update", { status: 400 });
    }

    const updated = await prisma.document.updateMany({
      where: { id, orgId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    });

    if (!updated.count) {
      return new Response("Not found", { status: 404 });
    }

    const doc = await prisma.document.findFirst({
      where: { id, orgId },
    });

    return Response.json({ document: doc });
  } catch (err) {
    logServerError("documents_id_patch_error", err);
    return new Response("Server error", { status: 500 });
  }
}

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

    /// ✅ unwrap params Promise
    const { id } = await params;

    const deleted = await prisma.document.deleteMany({
      where: { id, orgId },
    });

    if (!deleted.count) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    logServerError("documents_id_delete_error", err);
    return new Response("Server error", { status: 500 });
  }
}
