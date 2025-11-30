// src/app/api/billing/portal/route.ts

// @ts-nocheck
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logServerError } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const u = await currentUser();
    if (!u) {
      return new Response("Unauthorized", { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { user: { clerkUserId: u.id } },
      include: {
        org: {
          include: {
            subscription: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!membership || !membership.org) {
      return new Response("No organization found", { status: 400 });
    }

    // ✅ Stage 5 RBAC: only OWNER / ADMIN can access billing portal
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return new Response(
        "Forbidden: only OWNER or ADMIN can manage billing.",
        { status: 403 },
      );
    }

    const sub = membership.org.subscription;
    if (!sub || !sub.stripeCustomerId) {
      return new Response("No Stripe customer for this org", {
        status: 400,
      });
    }

    const url = new URL(req.url);
    const returnUrl = new URL("/dashboard", url.origin).toString();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });

    return Response.redirect(portalSession.url, 303);
  } catch (err) {
    logServerError("billing_portal_error", err);
    return new Response("Server error", { status: 500 });
  }
}

