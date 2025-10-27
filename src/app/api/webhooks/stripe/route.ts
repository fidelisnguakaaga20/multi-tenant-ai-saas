// src/app/api/webhooks/stripe/route.ts

import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// We expect checkout.session.completed only.
// On success we set that org to PRO.

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = headers().get("stripe-signature");

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
    event = stripe.webhooks.constructEvent(rawBody, sig as string, webhookSecret);
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

      // You set this when creating the Checkout session
      // in /api/billing/checkout/route.ts:
      // metadata: { orgId }
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
        console.warn(
          "⚠ checkout.session.completed with no orgId metadata"
        );
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
    // Ignore other event types for now but respond 200 so Stripe doesn't retry
    console.log(`ℹ Unhandled Stripe event type: ${event.type}`);
  }

  // Always send 200 OK back to Stripe if we didn't explicitly 4xx above.
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
