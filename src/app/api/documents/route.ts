// src/app/api/documents/route.ts

// @ts-nocheck
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logServerError } from "@/lib/logger";

async function ensureMembership(clerkUserId: string, email: string, firstName: string) {
  let membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: true,
      user: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (membership && membership.org && membership.user) {
    return membership;
  }

  // If no membership, mirror what AI route does: create org + user + membership
  const newOrg = await prisma.organization.create({
    data: {
      name: `${firstName}'s Workspace`,
      memberships: {
        create: {
          role: "OWNER",
          user: {
            create: {
              clerkUserId,
              email,
            },
          },
        },
      },
      subscription: {
        create: {
          plan: "FREE",
        },
      },
    },
    include: {
      memberships: {
        include: { user: true },
      },
    },
  });

  const ownerMembership = newOrg.memberships.find(
    (m: any) => m.user?.clerkUserId === clerkUserId
  );

  if (!ownerMembership) {
    throw new Error("Failed to create membership for new org");
  }

  return ownerMembership;
}

export async function GET() {
  try {
    const u = await currentUser();
    if (!u) {
      return new Response("Unauthorized", { status: 401 });
    }

    const clerkUserId = u.id;
    const email = u.emailAddresses?.[0]?.emailAddress ?? "unknown";
    const firstName = u.firstName ?? "My";

    const membership = await ensureMembership(clerkUserId, email, firstName);

    const orgId = membership.orgId;

    const docs = await prisma.document.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ documents: docs });
  } catch (err) {
    logServerError("documents_get_error", err);
    return new Response("Server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const u = await currentUser();
    if (!u) {
      return new Response("Unauthorized", { status: 401 });
    }

    const clerkUserId = u.id;
    const email = u.emailAddresses?.[0]?.emailAddress ?? "unknown";
    const firstName = u.firstName ?? "My";

    const membership = await ensureMembership(clerkUserId, email, firstName);

    const orgId = membership.orgId;
    const userId = membership.userId;

    const body = await req.json().catch(() => ({}));
    const type = typeof body.type === "string" ? body.type : "PROPOSAL";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return new Response("Content is required", { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        orgId,
        userId,
        type,
        title: title || "(Untitled)",
        content,
      },
    });

    return Response.json({ document: doc });
  } catch (err) {
    logServerError("documents_post_error", err);
    return new Response("Server error", { status: 500 });
  }
}
