// src/app/api/projects/route.ts
// @ts-nocheck

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { checkProjectAllowance } from "@/lib/usage";

async function getMembershipForUser(clerkUserId: string) {
  const membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: {
        include: {
          subscription: true,
        },
      },
      user: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return membership;
}

// GET /api/projects
// List projects for the caller's org
export async function GET() {
  const u = await currentUser();
  if (!u) {
    return new Response("Unauthorized", { status: 401 });
  }

  const membership = await getMembershipForUser(u.id);
  if (!membership || !membership.org) {
    return new Response("No org membership for user. Visit /dashboard once first.", {
      status: 400,
    });
  }

  const orgId = membership.orgId;

  const projects = await prisma.project.findMany({
    where: { orgId },
    include: {
      client: true,
      owner: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({ projects });
}

// POST /api/projects
// Create a project, enforcing Free plan project limit (Stage 5)
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) {
    return new Response("Unauthorized", { status: 401 });
  }

  const membership = await getMembershipForUser(u.id);
  if (!membership || !membership.org) {
    return new Response("No org membership for user. Visit /dashboard once first.", {
      status: 400,
    });
  }

  const orgId = membership.orgId;
  const userId = membership.userId;

  // Backend enforcement of Free plan project limit
  const allowance = await checkProjectAllowance(orgId);
  if (!allowance.allowed) {
    return Response.json(
      {
        ok: false,
        error: "Free plan project limit reached. Upgrade to add more projects.",
        code: "PROJECT_LIMIT_REACHED",
        remaining: allowance.remaining,
      },
      { status: 403 }
    );
  }

  // Support both form-encoded (from <form>) and JSON body
  const contentType = req.headers.get("content-type") || "";
  let payload: any = {};

  if (contentType.includes("application/json")) {
    payload = (await req.json().catch(() => ({}))) ?? {};
  } else {
    const form = await req.formData();
    payload = Object.fromEntries(form.entries());
  }

  const title =
    typeof payload.title === "string" && payload.title.trim() !== ""
      ? payload.title.trim()
      : "";
  const clientId =
    typeof payload.clientId === "string" && payload.clientId.trim() !== ""
      ? payload.clientId.trim()
      : "";
  const status =
    typeof payload.status === "string" && payload.status.trim() !== ""
      ? payload.status.trim()
      : "LEAD";
  const estimatedValueRaw =
    typeof payload.estimatedValue === "string" ? payload.estimatedValue.trim() : "";

  if (!title || !clientId) {
    return new Response("Missing title or clientId", { status: 400 });
  }

  const estimatedValue = estimatedValueRaw
    ? Number.isNaN(Number(estimatedValueRaw))
      ? null
      : Number(estimatedValueRaw)
    : null;

  const project = await prisma.project.create({
    data: {
      orgId,
      clientId,
      ownerId: userId,
      title,
      status,
      estimatedValue,
      lastActivityAt: new Date(),
    },
    include: {
      client: true,
      owner: true,
    },
  });

  // If JSON caller (e.g. fetch), return JSON
  if (contentType.includes("application/json")) {
    return Response.json({ ok: true, project });
  }

  // If HTML form, redirect back to dashboard
  return Response.redirect(new URL("/dashboard", req.url));
}

