// src/app/api/ai/generate/route.ts

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage, incrementUsage } from "@/lib/usage";

const FREE_LIMIT = 10; // free tier monthly cap

// helper: "2025-10" style key
function monthKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function POST(req: Request) {
  //
  // 0) Get the Clerk user from backend
  //
  const u = await currentUser();
  if (!u) {
    // No authenticated Clerk user = not signed in
    return new Response("Unauthorized", { status: 401 });
  }

  const clerkUserId = u.id;
  const email =
    u.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const firstName = u.firstName ?? "My";

  //
  // 1) Find (or create) org + subscription for this user
  //
  let membership: any = (await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: { org: { include: { subscription: true } } },
    orderBy: { createdAt: "asc" },
  })) as any;

  if (!membership) {
    // prisma.org is valid at runtime, but Prisma's generated types on Vercel
    // might not expose `.org`, so cast prisma -> any to satisfy tsc.
    const db: any = prisma;

    const newOrg = await db.org.create({
      data: {
        name: `${firstName}'s Workspace`,
        users: {
          create: {
            user: {
              create: {
                clerkUserId,
                email,
              },
            },
            role: "OWNER",
          },
        },
        subscription: {
          create: {
            plan: "FREE",
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    membership = {
      orgId: newOrg.id,
      org: newOrg,
    } as any;
  }

  const orgId = membership.orgId;
  const plan = membership.org?.subscription?.plan ?? "FREE";

  //
  // 2) Usage + quota check
  //
  const used = await getUsage(orgId);

  if (plan !== "PRO" && used >= FREE_LIMIT) {
    // FREE tier limit reached
    return new Response(
      JSON.stringify({
        error:
          "Free quota reached. Upgrade to PRO for unlimited generations.",
      }),
      { status: 402 }
    );
  }

  //
  // 3) Stub AI response (no OpenAI key needed, no cost)
  //
  const body = await req.json().catch(() => ({}));
  const promptText =
    typeof body.prompt === "string" && body.prompt.trim() !== ""
      ? body.prompt.trim()
      : "Give a short onboarding message for my SaaS dashboard.";

  const output = `🔁 STUB RESPONSE
Prompt: "${promptText}"

This is demo output.
Real AI text will appear here once OPENAI_API_KEY is set and billing for AI is enabled.`;

  //
  // 4) Increment usage for this org
  //
  await incrementUsage(orgId);

  //
  // 5) Return payload with meta for UI
  //
  const nowUsed = used + 1;
  const remaining =
    plan === "PRO"
      ? null // unlimited
      : Math.max(FREE_LIMIT - nowUsed, 0);

  return Response.json({
    output,
    meta: {
      plan,
      month: monthKey(),
      used: nowUsed,
      remaining,
    },
  });
}
