// Optimistic check before /account and /admin pages render: logged-out users go
// to /login, non-admins are sent away from /admin. This is a first line only;
// every protected page and Server Action checks again (src/lib/auth-guards.ts).
export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
