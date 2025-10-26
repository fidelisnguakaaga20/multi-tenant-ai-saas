import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
// import { db } from "@/lib/db"; // we'll create this Prisma helper soon

export const runtime = "nodejs"; // ensure Node runtime, not edge

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${err.message}` },
      { status: 400 }
    );
  }

  // We're interested in successful subscription checkouts.
  // Stripe docs: after Checkout completes in subscription mode,
  // the session has an active Subscription in event.data.object. :contentReference[oaicite:10]{index=10}
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const stripeCustomerId = session.customer as string | undefined;
    const stripeSubscriptionId = session.subscription as string | undefined;
    const customerEmail =
      session.customer_details?.email ?? session.customer_email;

    console.log("✅ Stripe checkout completed for:", customerEmail);
    console.log("Customer:", stripeCustomerId);
    console.log("Sub:", stripeSubscriptionId);

    // Later:
    // 1. Find org for this user (auth().orgId / Clerk orgs)
    // 2. Upsert Subscription row in Prisma with plan='PRO'
    // 3. Save stripeCustomerId, stripeSubscriptionId, currentPeriodEnd, etc.
    //
    // await db.subscription.upsert({...})
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
