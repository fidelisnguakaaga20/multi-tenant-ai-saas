
// src/app/api/billing/checkout/route.ts
// Stage 4/5: always provide orgId for webhook (later), and work even if user/org not in DB yet.

import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!priceId) return new Response("Missing NEXT_PUBLIC_STRIPE_PRICE_PRO", { status: 500 });

  // 1) Ensure User row exists (keyed by clerkUserId)
  const dbUser = await prisma.user.upsert({
    where: { clerkUserId: user.id },
    update: { email: user.emailAddresses?.[0]?.emailAddress || "" },
    create: {
      clerkUserId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || "",
    },
  });

  // 2) Find or create an Organization (first membership wins)
  let membership = await prisma.membership.findFirst({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "asc" },
    include: { org: true },
  });

  if (!membership) {
    const org = await prisma.organization.create({
      data: {
        name: `${user.firstName || "My"} Workspace`,
        memberships: {
          create: {
            role: "OWNER",
            user: { connect: { id: dbUser.id } },
          },
        },
      },
    });
    membership = { org, orgId: org.id } as any;
  }

  const orgId = membership.orgId;

  // 3) Create the Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    customer_email: user.emailAddresses?.[0]?.emailAddress,
    metadata: { orgId }, // webhook will use this later
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}



// import { NextResponse } from "next/server";
// import { currentUser } from "@clerk/nextjs/server";
// import { stripe } from "@/lib/stripe";

// // Stripe's Node SDK can't run in the Edge runtime
// export const runtime = "nodejs";

// export async function POST() {
//   try {
//     console.log("=== /api/billing/checkout HIT ===");

//     // 1. get the signed-in user via Clerk
//     const user = await currentUser();

//     if (!user) {
//       console.log("No user from currentUser()");
//       return NextResponse.json(
//         { error: "Not signed in" },
//         { status: 401 }
//       );
//     }

//     // 2. grab their email for Stripe
//     const email =
//       user.emailAddresses?.[0]?.emailAddress ??
//       user.primaryEmailAddress?.emailAddress ??
//       "no-email@example.com";

//     console.log("Using email for checkout:", email);

//     // 3. sanity check env so we don't call Stripe with bad config
//     if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
//       console.error("Missing NEXT_PUBLIC_STRIPE_PRICE_PRO");
//       return NextResponse.json(
//         { error: "Server missing price id" },
//         { status: 500 }
//       );
//     }

//     if (!process.env.NEXT_PUBLIC_APP_URL) {
//       console.error("Missing NEXT_PUBLIC_APP_URL");
//       return NextResponse.json(
//         { error: "Server missing NEXT_PUBLIC_APP_URL" },
//         { status: 500 }
//       );
//     }

//     // 4. create a Stripe Checkout Session for a subscription
//     const session = await stripe.checkout.sessions.create({
//       mode: "subscription",
//       customer_email: email,
//       line_items: [
//         {
//           price: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO as string,
//           quantity: 1,
//         },
//       ],
//       success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
//       cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancel`,
//     });

//     console.log("Stripe session created:", session.url);

//     // 5. send the checkout URL back to the browser
//     return NextResponse.json(
//       { url: session.url },
//       { status: 200 }
//     );
//   } catch (err: any) {
//     console.error("CHECKOUT ERROR:", err);
//     return NextResponse.json(
//       { error: err?.message || "Checkout failed" },
//       { status: 500 }
//     );
//   }
// }
