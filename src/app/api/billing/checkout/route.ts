// src/app/api/billing/checkout/route.ts

// @ts-nocheck
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST() {
  // 1) Auth with guard
  let user: any = null;
  try {
    user = await currentUser();
  } catch (err) {
    // swallow Clerk dev hiccup
  }

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!priceId) {
    return new Response(
      "Missing NEXT_PUBLIC_STRIPE_PRICE_PRO",
      { status: 500 }
    );
  }

  // 2) Ensure User row in DB
  const dbUser = await prisma.user.upsert({
    where: { clerkUserId: user.id },
    update: {
      email: user.emailAddresses?.[0]?.emailAddress || "",
    },
    create: {
      clerkUserId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || "",
    },
  });

  // 3) Ensure we have an org + get caller role
  let membership = await prisma.membership.findFirst({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    // if somehow no org, bootstrap them as OWNER
    const org = await prisma.organization.create({
      data: {
        name: `${user.firstName || "My"} Workspace`,
      },
    });

    membership = await prisma.membership.create({
      data: {
        orgId: org.id,
        userId: dbUser.id,
        role: "OWNER",
      },
    });
  }

  const orgId = membership.orgId;
  const callerRole = membership.role; // OWNER / ADMIN / MEMBER

  if (callerRole !== "OWNER" && callerRole !== "ADMIN") {
    return new Response(
      "Forbidden: only OWNER or ADMIN can upgrade billing.",
      { status: 403 }
    );
  }

  // 4) Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    customer_email:
      user.emailAddresses?.[0]?.emailAddress || undefined,
    metadata: { orgId }, // webhook uses this to set plan=PRO
  });

  return new Response(
    JSON.stringify({ url: session.url }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}


