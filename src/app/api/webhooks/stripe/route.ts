// src/app/api/webhooks/stripe/route.ts

import { headers as nextHeaders } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// We expect checkout.session.completed only.
// On success we set that org to PRO.

export async function POST(req: Request) {
  // 1. Get raw body for Stripe signature verification
  const rawBody = await req.text();

  // 2. Get Stripe signature header safely
  // NOTE: nextHeaders() returns a Headers-like object in Next 16,
  // but TS sometimes treats it as Promise-like. We just await it.
  const hdrs = await nextHeaders();
  const sig = hdrs.get("stripe-signature") || "";

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Misconfigured deployment
    return new Response(
      JSON.stringify({
        error: "Missing STRIPE_WEBHOOK_SECRET on server",
      }),
      { status: 500 }
    );
  }

  let event;
  try {
    // Stripe needs the exact raw body + signature
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Stripe signature verify failed:", err?.message);
    return new Response(
      JSON.stringify({
        error: "Invalid signature",
        message: err?.message || "no message",
      }),
      { status: 400 }
    );
  }

  // We only really care about checkout.session.completed
  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object as any;

      // orgId is attached as metadata when we created the checkout session
      const orgId = session?.metadata?.orgId;

      if (orgId) {
        // Mark subscription as PRO
        await prisma.subscription.upsert({
          where: { orgId },
          create: {
            orgId,
            plan: "PRO",
          },
          update: {
            plan: "PRO",
          },
        });

        console.log("✅ Upgraded org to PRO:", orgId);
      } else {
        console.warn("⚠ checkout.session.completed with no orgId metadata");
      }
    } catch (err: any) {
      console.error("❌ Failed to process checkout.session.completed:", err);
      return new Response(
        JSON.stringify({
          error: "Failed to upgrade org to PRO",
          message: err?.message || "no message",
        }),
        { status: 500 }
      );
    }
  } else {
    // Ignore other events but still 200 so Stripe doesn't retry spam
    console.log(`ℹ Unhandled Stripe event type: ${event.type}`);
  }

  // Always acknowledge
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
