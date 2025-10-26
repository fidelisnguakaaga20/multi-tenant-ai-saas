// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect /dashboard and anything under it
const isDashboardRoute = createRouteMatcher([
  "/dashboard(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    // If not signed in, this will redirect to /sign-in automatically
    await auth.protect();
  }
});

// Same matcher pattern Clerk recommends:
// - run on everything except Next internals/static assets
// - always run on API routes
// This is from Clerk's current middleware reference. :contentReference[oaicite:3]{index=3}
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run middleware for API/trpc
    "/(api|trpc)(.*)",
  ],
};
