// src/lib/org.ts
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

// returns { orgId, orgName }
export async function getCurrentOrgForUser() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId: user.id } },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) return null;
  return { orgId: membership.orgId, orgName: membership.org?.name ?? "Workspace" };
}
