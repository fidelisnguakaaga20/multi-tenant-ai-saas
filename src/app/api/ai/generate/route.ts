



// src/app/api/ai/generate/route.ts

// @ts-nocheck

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getUsage, incrementUsage } from "@/lib/usage";
import OpenAI from "openai";
import { checkRateLimit } from "@/middleware/rateLimit";
import { logServerError } from "@/lib/logger";

const FREE_LIMIT = 10;

// month key like "2025-10"
function monthKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function POST(req: Request) {
  //
  // 0) Auth
  //
  let u: any = null;
  try {
    u = await currentUser();
  } catch (err) {
    // Clerk sometimes throws in dev/hot-reload
    logServerError("clerk_currentUser_failed", err);
  }

  if (!u) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clerkUserId = u.id;
  const email =
    u.emailAddresses?.[0]?.emailAddress ?? "unknown";
  const firstName = u.firstName ?? "My";

  try {
    //
    // 1) Ensure we have org + subscription for this user
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
      // create new org with this user as OWNER on first use
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
          subscription: true,
        },
      });

      membership = {
        orgId: newOrg.id,
        org: newOrg,
        role: "OWNER",
      };
    }

    const orgId = membership.orgId;
    const plan = membership.org?.subscription?.plan ?? "FREE";

    //
    // 2) Rate limit per org (protects from spam)
    //
    const rl = checkRateLimit(orgId);
    if (!rl.ok) {
      return new Response(
        JSON.stringify({
          error: `Too many requests. Try again in ${rl.retryAfterSeconds}s.`,
        }),
        { status: 429 }
      );
    }

    //
    // 3) Check usage/quota BEFORE calling OpenAI
    //
    const used = await getUsage(orgId);

    if (plan !== "PRO" && used >= FREE_LIMIT) {
      return new Response(
        JSON.stringify({
          error:
            "Free quota reached. Upgrade to PRO for unlimited generations.",
        }),
        { status: 402 }
      );
    }

    //
    // 4) Get prompt text from body
    //
    const body = await req.json().catch(() => ({}));
    const promptText =
      typeof body.prompt === "string" && body.prompt.trim() !== ""
        ? body.prompt.trim()
        : "Give a short onboarding message for my SaaS dashboard. Be friendly.";

    //
    // 5) Call OpenAI (fallback if missing key or fails)
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
    } catch (err) {
      logServerError("openai_error", err);

      aiText = [
        "⚠ AI call failed or OPENAI_API_KEY missing.",
        "",
        "Stub fallback:",
        `"${promptText}"`,
      ].join("\n");
    }

    //
    // 6) Increment usage AFTER generation
    //
    await incrementUsage(orgId);

    //
    // 7) Respond
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
  } catch (err) {
    logServerError("ai_generate_fatal", err);

    return new Response(
      JSON.stringify({
        error: "Server error while generating.",
      }),
      { status: 500 }
    );
  }
}

