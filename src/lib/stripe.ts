// src/lib/stripe.ts
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Let Stripe use the account's configured API version.
// This avoids type/runtime mismatches from hard-coded future versions.
export const stripe = new Stripe(stripeSecretKey, {});

