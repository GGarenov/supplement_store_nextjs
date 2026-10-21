import "server-only";

import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * Authorization checks for pages and Server Actions. src/proxy.ts only does an
 * early, optimistic check; these are the ones to rely on.
 *
 * They read the session cookie, so in a page they must run inside <Suspense>
 * (Cache Components can't prerender request data).
 */

/** The logged-in user, or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** The logged-in user; otherwise redirects to /login and back to `returnTo` afterwards. */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      returnTo
        ? `/login?callbackUrl=${encodeURIComponent(returnTo)}`
        : "/login",
    );
  }
  return user;
}

/** The logged-in admin; anyone else gets a 404, so the admin area isn't advertised. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") notFound();
  return user;
}
