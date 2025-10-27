// src/app/api/ai/generate/route.ts

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage, incrementUsage } from "@/lib/usage";
import OpenAI from "openai";

// helper: ensure org + membership + subscription for this user
async function ensureOrgForUser(clerkUserId: string, emailFallback: string) {
  // 1. make sure we have app-level User row
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkUserId,
        email: emailFallback || "unknown@example.com",
      },
    });
  }

  // 2. check if user already belongs to an org
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { orgId: true },
  });

  if (membership?.orgId) {
    return membership.orgId;
  }

  // 3. create fresh org with default FREE sub + OWNER membership
  const org = await prisma.organization.create({
    data: {
      name: `${(emailFallback || "Workspace").split("@")[0].toUpperCase()} Workspace`,
      subscription: {
        create: {
          plan: "FREE",
        },
      },
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      orgId: org.id,
      role: "OWNER",
    },
  });

  return org.id;
}

// helper: get current YYYY-MM string
function currentMonthKey() {
  const d = new Date();
  const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return m;
}

// POST /api/ai/generate
export async function POST(req: Request) {
  try {
    // ------------------------------------------------------------------
    // 1. Clerk auth check
    // ------------------------------------------------------------------
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const u = await currentUser();
    const email = u?.emailAddresses?.[0]?.emailAddress || "";

    // ------------------------------------------------------------------
    // 2. Make sure this user has an org
    // ------------------------------------------------------------------
    const orgId = await ensureOrgForUser(userId, email);

    // ------------------------------------------------------------------
    // 3. Load subscription plan (FREE or PRO)
    // ------------------------------------------------------------------
    const sub = await prisma.subscription.findUnique({
      where: { orgId },
      select: { plan: true },
    });

    const plan = sub?.plan || "FREE";

    // ------------------------------------------------------------------
    // 4. Enforce FREE limit if not PRO
    // ------------------------------------------------------------------
    const used = await getUsage(orgId);
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

    // ------------------------------------------------------------------
    // 5. Parse body prompt
    // ------------------------------------------------------------------
    const { prompt } = await req.json().catch(() => ({ prompt: "" }));

    // ------------------------------------------------------------------
    // 6. Call OpenAI
    // ------------------------------------------------------------------
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      // explicit check so we can see it from browser
      return Response.json(
        {
          error: "Missing OPENAI_API_KEY on server",
          hint: "Add OPENAI_API_KEY to Vercel env & redeploy",
        },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content:
            prompt?.trim() ||
            "Say hello to MVENDAGA from the AI SaaS dashboard.",
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const output =
      completion.choices?.[0]?.message?.content?.trim() || "No output";

    // ------------------------------------------------------------------
    // 7. Increment usage (+1)
    // ------------------------------------------------------------------
    await incrementUsage(orgId);

    const month = currentMonthKey();
    const nowUsed = used + 1;
    const remaining =
      plan === "PRO" ? null : Math.max(FREE_LIMIT - nowUsed, 0);

    // ------------------------------------------------------------------
    // 8. Return successful JSON
    // ------------------------------------------------------------------
    return Response.json({
      output,
      meta: { plan, month, used: nowUsed, remaining },
    });
  } catch (err: any) {
    // SAFETY NET:
    // Instead of a silent 500 with no body,
    // we respond with JSON that includes the message.
    console.error("AI route error:", err);

    return Response.json(
      {
        error: "AI route crashed",
        message: err?.message || "unknown error",
        name: err?.name || "Error",
        stepHint:
          "Most common at this stage: OpenAI API error or model access.",
      },
      { status: 500 }
    );
  }
}
