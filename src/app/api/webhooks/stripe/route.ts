// src/app/api/webhooks/stripe/route.ts
// Stage 5: Stripe webhook to mark user PRO after successful checkout

import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs"; // ensure Node runtime (not edge)
export const dynamic = "force-dynamic"; // // allow reading raw body

// /// Helper: upsert Subscription to PRO
async function activateProForUser(userId: string) {
  // // Upsert on userId; adjust fields to match your schema
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: "PRO",
      status: "ACTIVE",
    },
    update: {
      plan: "PRO",
      status: "ACTIVE",
    },
  });
}

export async function POST(req: Request) {
  // // Stripe sends a raw body. In App Router, use req.text() for verification.
  const signature = headers().get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // // Handle only what's needed for Stage 5
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // // We stored Clerk userId in checkout metadata (see updated checkout route)
    const userId = session.metadata?.userId;
    if (!userId) {
      // // Fallback via email if you prefer (optional)
      return new Response("Missing userId in metadata", { status: 400 });
    }

    await activateProForUser(userId);
  }

  return new Response("ok", { status: 200 });
}




// import { NextResponse } from "next/server";
// import { stripe } from "@/lib/stripe";
// // import { db } from "@/lib/db"; // we'll create this Prisma helper soon

// export const runtime = "nodejs"; // ensure Node runtime, not edge

// export async function POST(req: Request) {
//   const sig = req.headers.get("stripe-signature");

//   if (!sig) {
//     return NextResponse.json({ error: "No signature" }, { status: 400 });
//   }

//   const rawBody = await req.text();

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       rawBody,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET as string
//     );
//   } catch (err: any) {
//     return NextResponse.json(
//       { error: `Webhook signature failed: ${err.message}` },
//       { status: 400 }
//     );
//   }

//   // We're interested in successful subscription checkouts.
//   // Stripe docs: after Checkout completes in subscription mode,
//   // the session has an active Subscription in event.data.object. :contentReference[oaicite:10]{index=10}
//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object as any;

//     const stripeCustomerId = session.customer as string | undefined;
//     const stripeSubscriptionId = session.subscription as string | undefined;
//     const customerEmail =
//       session.customer_details?.email ?? session.customer_email;

//     console.log("✅ Stripe checkout completed for:", customerEmail);
//     console.log("Customer:", stripeCustomerId);
//     console.log("Sub:", stripeSubscriptionId);

//     // Later:
//     // 1. Find org for this user (auth().orgId / Clerk orgs)
//     // 2. Upsert Subscription row in Prisma with plan='PRO'
//     // 3. Save stripeCustomerId, stripeSubscriptionId, currentPeriodEnd, etc.
//     //
//     // await db.subscription.upsert({...})
//   }

//   return NextResponse.json({ received: true }, { status: 200 });
// }
