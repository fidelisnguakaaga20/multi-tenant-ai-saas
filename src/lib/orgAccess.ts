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
    remaining: plan === "PRO" ? null : Math.max(FREE_LIMIT - used, 0),
    limit: plan === "PRO" ? null : FREE_LIMIT,
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

/**
 * Stage 5 RBAC helpers
 *
 * We keep DB roles as OWNER / ADMIN / MEMBER.
 * Conceptually:
 * - OWNER / ADMIN ≈ OWNER / MANAGER in the plan
 * - MEMBER ≈ CONTRIBUTOR
 */

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER";

export function isOwnerOrManager(role: OrgRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function isContributor(role: OrgRole) {
  // In practice, any member of the org can contribute to projects/proposals.
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

/**
 * Optional guards for APIs that want a simple role check.
 * Currently not used by existing routes but available for future endpoints.
 */
export async function requireOrgContext(clerkUserId: string) {
  const ctx = await getActiveOrgContext(clerkUserId);
  if (!ctx.ok || !ctx.org) {
    throw new Error(ctx.error || "No org context");
  }
  return ctx.org;
}

export async function requireOwnerOrManager(clerkUserId: string) {
  const org = await requireOrgContext(clerkUserId);
  if (!org.isOwnerOrAdmin) {
    throw new Error("Forbidden: OWNER or ADMIN required");
  }
  return org;
}

