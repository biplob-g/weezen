import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/auth(.*)", "/portal(.*)"]);
const isIgnoredRoute = createRouteMatcher(["/chatbot"]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return;
  if (isIgnoredRoute(req)) return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
