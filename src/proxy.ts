// src/middleware.ts
// Goal: protect only /dashboard (and keep Stripe webhook public)

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",        // protect dashboard-only
  // DO NOT protect: /pricing, /, /sign-in, /api/webhooks/stripe
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Next.js matcher to run middleware for app routes
export const config = {
  matcher: [
    // Skip static files and _next, run for everything else
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
  ],
};



// // src/middleware.ts
// import { clerkMiddleware } from "@clerk/nextjs/server";

// export default clerkMiddleware();

// // Tell Clerk which routes it should run on
// export const config = {
//   matcher: [
//     // 👇 protect all dashboard pages
//     "/dashboard(.*)",
//     // 👇 protect API routes that require auth
//     "/api/billing/checkout",
//     // you can add more later, like webhooks/org routes etc.
//   ],
// };
