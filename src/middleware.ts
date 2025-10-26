// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// Tell Clerk which routes it should run on
export const config = {
  matcher: [
    // 👇 protect all dashboard pages
    "/dashboard(.*)",
    // 👇 protect API routes that require auth
    "/api/billing/checkout",
    // you can add more later, like webhooks/org routes etc.
  ],
};
