// src/lib/usage.ts
import { prisma } from "@/lib/db";

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2,"0")}`;
}

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
  const sub = await prisma.subscription.findUnique({ where: { orgId }, select: { plan: true }});
  return sub?.plan === "PRO";
}

// Free plan: limit 10 / month
export async function checkAllowance(orgId: string) {
  const pro = await isPro(orgId);
  if (pro) return { allowed: true, remaining: Infinity };

  const used = await getUsage(orgId);
  const limit = 10;
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}
