import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes
const isPublicRoute = createRouteMatcher([
  "/", // home page
  "/sign-in(.*)", // sign-in
  "/sign-up(.*)", // sign-up
  "/api/webhooks(.*)", // webhook endpoint
]);

export default clerkMiddleware(async (auth, req) => {
  console.log("Middleware triggered for path:", req.nextUrl.pathname);

  // Hardcode check for '/' to debug
  if (req.nextUrl.pathname === "/") {
    console.log("Hardcoded match for '/', allowing access");
    return; // Allow access to '/' explicitly
  }

  if (isPublicRoute(req)) {
    console.log("Path is public, allowing access:", req.nextUrl.pathname);
    return;
  }

  const { userId } = await auth();
  console.log("User ID:", userId);

  if (!userId) {
    console.log("User not authenticated, redirecting to /sign-in");
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  console.log("User authenticated, proceeding to route:", req.nextUrl.pathname);
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)", // Match all routes except static files and _next
    "/api/(.*)", // Match API routes except webhook
  ],
};