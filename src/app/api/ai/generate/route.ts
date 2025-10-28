// @ts-nocheck

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage, incrementUsage } from "@/lib/usage";
import OpenAI from "openai";

const FREE_LIMIT = 10; // max generations/month for FREE

// month key like "2025-10"
function monthKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function POST(req: Request) {
  //
  // 0) Auth check (server-side, Clerk)
  //
  const u = await currentUser();
  if (!u) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clerkUserId = u.id;
  const email =
    u.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const firstName = u.firstName ?? "My";

  //
  // 1) Ensure org / membership / subscription exist
  //
  // Get the first org the user is in. If they have none, create org,
  // create user row, create membership row, and default plan=FREE.
  //
  let membership = await prisma.membership.findFirst({
    where: { user: { clerkUserId } },
    include: {
      org: {
        include: {
          subscription: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    // Create fresh org + membership + subscription + user.
    // NOTE: Model in Prisma is `Organization`, not `Org`, so we must use
    // prisma.organization (not prisma.org). We also can't rely on types
    // from Prisma right now for nested create, so we keep // @ts-nocheck.
    const newOrg = await prisma.organization.create({
      data: {
        name: `${firstName}'s Workspace`,
        // create Membership row with OWNER role
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
        subscription: true,
      },
    });

    membership = {
      orgId: newOrg.id,
      org: newOrg,
    };
  }

  const orgId = membership.orgId;
  const plan = membership.org?.subscription?.plan ?? "FREE";

  //
  // 2) Usage + quota check BEFORE running AI (protects cost)
  //
  const used = await getUsage(orgId);

  if (plan !== "PRO" && used >= FREE_LIMIT) {
    // 402 tells client "paywall hit"
    return new Response(
      JSON.stringify({
        error:
          "Free quota reached. Upgrade to PRO for unlimited generations.",
      }),
      { status: 402 }
    );
  }

  //
  // 3) Read prompt from request
  //
  const body = await req.json().catch(() => ({}));

  const promptText =
    typeof body.prompt === "string" && body.prompt.trim() !== ""
      ? body.prompt.trim()
      : "Give a short onboarding message for my SaaS dashboard. Be friendly.";

  //
  // 4) Call OpenAI (real output). If it fails, fall back.
  //
  let aiText = "";
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: promptText,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    aiText =
      completion.choices?.[0]?.message?.content?.trim() ||
      "No output";
  } catch (_err) {
    aiText = [
      "⚠ AI call failed or OPENAI_API_KEY missing.",
      "",
      "Stub fallback:",
      `"${promptText}"`,
    ].join("\n");
  }

  //
  // 5) Record usage (count this generation against quota)
  //
  await incrementUsage(orgId);

  //
  // 6) Respond to client with AI text + metadata
  //
  const nowUsed = used + 1;
  const remaining =
    plan === "PRO"
      ? null
      : Math.max(FREE_LIMIT - nowUsed, 0);

  return Response.json({
    output: aiText,
    meta: {
      plan,
      month: monthKey(),
      used: nowUsed,
      remaining,
    },
  });
}
