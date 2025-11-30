// src/lib/usage.ts
import { prisma } from "@/lib/db";

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ---------- AI GENERATION USAGE (per month) ----------

export async function getUsage(orgId: string) {
  const rec = await prisma.usageRecord.findUnique({
    where: { orgId_month: { orgId, month: monthKey() } },
  });
  return rec?.generations ?? 0;
}

export async function incrementUsage(orgId: string, by = 1) {
  const key = monthKey();
  const rec = await prisma.usageRecord.upsert({
    where: { orgId_month: { orgId, month: key } },
    update: { generations: { increment: by } },
    create: { orgId, month: key, generations: by },
  });
  return rec.generations;
}

export async function isPro(orgId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { plan: true },
  });
  return sub?.plan === "PRO";
}

// Free plan: limit 10 proposal generations / month
export async function checkAllowance(orgId: string) {
  const pro = await isPro(orgId);
  if (pro) return { allowed: true, remaining: Infinity };

  const used = await getUsage(orgId);
  const limit = 10;
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}

// ---------- PROJECT COUNT LIMITS (Stage 5) ----------

// Free orgs can have 3 active projects.
export const FREE_PROJECT_LIMIT = 3;

/**
 * Count active projects for this org.
 * If later you add soft-delete, update this to exclude deleted ones.
 */
export async function getActiveProjectCount(orgId: string) {
  const count = await prisma.project.count({
    where: { orgId },
  });
  return count;
}

/**
 * Check whether org can create another project under its plan.
 * Free: limit = 3 active projects.
 * Pro: unlimited.
 */
export async function checkProjectAllowance(orgId: string) {
  const pro = await isPro(orgId);
  if (pro) {
    return {
      allowed: true,
      remaining: Infinity,
    };
  }

  const current = await getActiveProjectCount(orgId);
  const limit = FREE_PROJECT_LIMIT;

  return {
    allowed: current < limit,
    remaining: Math.max(0, limit - current),
  };
}


