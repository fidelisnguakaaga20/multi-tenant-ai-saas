// src/app/api/ai/generate/route.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage, incrementUsage } from "@/lib/usage";
import OpenAI from "openai";

// ---- helpers ---------------------------------------------------------------

async function ensureOrgForUser(clerkUserId: string, emailFallback: string) {
  // Ensure app-level User
  let user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) {
    user = await prisma.user.create({
      data: { clerkUserId, email: emailFallback || "unknown@example.com" },
    });
  }

  // Find existing membership
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { orgId: true },
  });
  if (membership?.orgId) return membership.orgId;

  // Create org + subscription + membership
  const org = await prisma.organization.create({
    data: {
      name: `${(emailFallback || "Workspace").split("@")[0].toUpperCase()} Workspace`,
      subscription: { create: { plan: "FREE" } },
    },
  });

  await prisma.membership.create({
    data: { userId: user.id, orgId: org.id, role: "OWNER" },
  });

  return org.id;
}

function currentMonthKey() {
  const d = new Date();
  const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return m; // e.g. "2025-10"
}

// ---- POST /api/ai/generate -------------------------------------------------

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const u = await currentUser();
  const email = u?.emailAddresses?.[0]?.emailAddress || "";

  // 1) Ensure the user has an org (and free subscription by default)
  const orgId = await ensureOrgForUser(userId, email);

  // 2) Enforce plan/usage
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { plan: true },
  });
  const plan = sub?.plan || "FREE";

  const used = await getUsage(orgId); // counts for current YYYY-MM
  const FREE_LIMIT = 10;

  if (plan !== "PRO" && used >= FREE_LIMIT) {
    return Response.json(
      {
        error: "Free quota reached",
        plan,
        used,
        remaining: 0,
        action: "upgrade",
      },
      { status: 402 }
    );
  }

  // 3) Run real AI call
  const { prompt } = await req.json().catch(() => ({ prompt: "" }));
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Keep it simple & inexpensive
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt?.trim() || "Say hello to MVENDAGA!",
      },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  const output =
    completion.choices?.[0]?.message?.content?.trim() || "No output";

  // 4) Record usage for this month
  await incrementUsage(orgId);

  const month = currentMonthKey();
  const nowUsed = used + 1;
  const remaining = plan === "PRO" ? null : Math.max(FREE_LIMIT - nowUsed, 0);

  return Response.json({
    output,
    meta: { plan, month, used: nowUsed, remaining },
  });
}
