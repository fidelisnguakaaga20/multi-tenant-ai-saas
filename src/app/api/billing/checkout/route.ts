// src/app/api/billing/checkout/route.ts
// Creates a Stripe Checkout session and guarantees orgId exists (no TS nulls).

import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!priceId) return new Response("Missing NEXT_PUBLIC_STRIPE_PRICE_PRO", { status: 500 });

  // 1) Ensure User row exists (keyed by Clerk)
  const dbUser = await prisma.user.upsert({
    where: { clerkUserId: user.id },
    update: { email: user.emailAddresses?.[0]?.emailAddress || "" },
    create: {
      clerkUserId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || "",
    },
  });

  // 2) Ensure there is an organization and a membership; capture orgId (non-null)
  let existingMembership = await prisma.membership.findFirst({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "asc" },
  });

  let orgId: string;
  if (existingMembership) {
    orgId = existingMembership.orgId;
  } else {
    const org = await prisma.organization.create({
      data: {
        name: `${user.firstName || "My"} Workspace`,
      },
    });
    await prisma.membership.create({
      data: {
        orgId: org.id,
        userId: dbUser.id,
        role: "OWNER",
      },
    });
    orgId = org.id;
  }

  // 3) Create the Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    customer_email: user.emailAddresses?.[0]?.emailAddress,
    metadata: { orgId }, // used by webhook in prod
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
