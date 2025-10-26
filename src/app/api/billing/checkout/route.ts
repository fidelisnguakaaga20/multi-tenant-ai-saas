import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

// Force Node runtime (Stripe can't run in edge runtime)
export const runtime = "nodejs";

export async function POST() {
  try {
    console.log("=== /api/billing/checkout HIT ===");

    // 1. must be signed in
    const { userId } = auth();
    if (!userId) {
      console.log("No userId");
      return NextResponse.json(
        { error: "Not signed in" },
        { status: 401 }
      );
    }

    // 2. get user email
    const user = await currentUser();
    const email =
      user?.emailAddresses?.[0]?.emailAddress ??
      user?.primaryEmailAddress?.emailAddress ??
      "no-email@example.com";

    console.log("Using email for checkout:", email);

    // 3. sanity-check env
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

    // 4. create Checkout Session
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

    // 5. return URL to client
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err);
    // Always respond JSON, never HTML
    return NextResponse.json(
      { error: err?.message || "Checkout failed" },
      { status: 500 }
    );
  }
}
