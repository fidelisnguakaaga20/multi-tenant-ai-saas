import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

// Stripe's Node SDK can't run in the Edge runtime
export const runtime = "nodejs";

export async function POST() {
  try {
    console.log("=== /api/billing/checkout HIT ===");

    // 1. get the signed-in user via Clerk
    const user = await currentUser();

    if (!user) {
      console.log("No user from currentUser()");
      return NextResponse.json(
        { error: "Not signed in" },
        { status: 401 }
      );
    }

    // 2. grab their email for Stripe
    const email =
      user.emailAddresses?.[0]?.emailAddress ??
      user.primaryEmailAddress?.emailAddress ??
      "no-email@example.com";

    console.log("Using email for checkout:", email);

    // 3. sanity check env so we don't call Stripe with bad config
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
      console.error("Missing NEXT_PUBLIC_STRIPE_PRICE_PRO");
      return NextResponse.json(
        { error: "Server missing price id" },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("Missing NEXT_PUBLIC_APP_URL");
      return NextResponse.json(
        { error: "Server missing NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      );
    }

    // 4. create a Stripe Checkout Session for a subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO as string,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancel`,
    });

    console.log("Stripe session created:", session.url);

    // 5. send the checkout URL back to the browser
    return NextResponse.json(
      { url: session.url },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Checkout failed" },
      { status: 500 }
    );
  }
}
