// src/lib/stripe.ts
// Stripe client configured for the latest API version your SDK expects.

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover", // ✅ match installed SDK
});
