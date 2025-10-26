import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in .env.local");
}

// Use the Stripe API version Stripe shows you in dashboard / webhook setup screen.
// If Stripe throws about apiVersion later, just remove `apiVersion` from this config.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});
