// src/app/api/webhooks/stripe/route.ts
// Verifies Stripe signature and flips the org's plan to PRO.
// Upserts Subscription by orgId (matches your schema), no extra Stripe fetch.

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: any) {
    return new Response(`Invalid signature: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const orgId = session.metadata?.orgId || null;
    if (!orgId) {
      // Acknowledge to avoid retries; nothing to update without orgId.
      return new Response("No orgId in metadata", { status: 200 });
    }

    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id || null;

    const stripeSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null;

    await prisma.subscription.upsert({
      where: { orgId },
      create: {
        orgId,
        plan: "PRO",
        stripeCustomerId: stripeCustomerId || undefined,
        stripeSubscriptionId: stripeSubscriptionId || undefined,
      },
      update: {
        plan: "PRO",
        stripeCustomerId: stripeCustomerId || undefined,
        stripeSubscriptionId: stripeSubscriptionId || undefined,
      },
    });
  }

  return new Response("ok", { status: 200 });
}
