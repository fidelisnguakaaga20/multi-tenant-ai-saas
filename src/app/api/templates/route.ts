// src/app/api/templates/route.ts

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

/// GET /api/templates  → list templates for current org
export async function GET(_req: Request) {
  try {
    const u = await currentUser();
    if (!u) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { orgId } = await getOrgContextForUser(u.id);

    const templates = await prisma.template.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ templates });
  } catch (err) {
    logServerError("templates_get_error", err);
    return new Response("Server error", { status: 500 });
  }
}

/// POST /api/templates  → create new template
export async function POST(req: Request) {
  try {
    const u = await currentUser();
    if (!u) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { orgId, userId } = await getOrgContextForUser(u.id);

    const body = await req.json().catch(() => ({}));
    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const type =
      typeof body.type === "string" ? body.type.trim() : "";
    const templateBody =
      typeof body.body === "string" ? body.body.trim() : "";

    if (!name || !type || !templateBody) {
      return new Response("Missing name, type, or body", { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        orgId,
        createdBy: userId,
        name,
        type,
        body: templateBody,
      },
    });

    return Response.json({ template }, { status: 201 });
  } catch (err) {
    logServerError("templates_post_error", err);
    return new Response("Server error", { status: 500 });
  }
}
