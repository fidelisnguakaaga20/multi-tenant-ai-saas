// src/lib/orgAccess.ts

// @ts-nocheck
import { prisma } from "@/lib/db";
import { getUsage } from "@/lib/usage";

const FREE_LIMIT = 10;
export async function getActiveOrgContext(clerkUserId: string) {
  // 1. Find the internal User row
  const userRow = await prisma.user.findFirst({
    where: { clerkUserId },
  });

  if (!userRow) {
    return {
      ok: false,
      error: "No local User row for this clerkUserId",
    };
  }

  // 2. Find their membership and org+subscription+members
  const membership = await prisma.membership.findFirst({
    where: { userId: userRow.id },
    include: {
      org: {
        include: {
          subscription: true,
          memberships: {
            include: {
              user: true, // so we can show emails
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership || !membership.org) {
    return {
      ok: false,
      error: "User is not in any Organization",
    };
  }

  const org = membership.org;
  const role = membership.role; // OWNER | ADMIN | MEMBER
  const plan = org.subscription?.plan ?? "FREE";
  const orgId = org.id;

  // 3. Usage
  const used = await getUsage(orgId);
  const usage = {
    used,
    remaining:
      plan === "PRO" ? null : Math.max(10 - used, 0),
    limit: plan === "PRO" ? null : 10,
  };

  // 4. Permission flag
  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";

  // 5. Member list
  const members =
    org.memberships?.map((m: any) => ({
      email: m.user?.email ?? "unknown",
      role: m.role,
    })) ?? [];

  return {
    ok: true,
    org: {
      id: orgId,
      name: org.name,
      role,
      plan,
      isOwnerOrAdmin,
      usage,
      members,
    },
  };
}
