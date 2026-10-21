import type { Metadata } from "next";
import { Suspense } from "react";

import { signOutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth-guards";

export const metadata: Metadata = { title: "My account" };

// Reads the session, so it renders at request time inside <Suspense>.
async function AccountOverview() {
  const user = await requireUser("/account");
  return (
    <div className="bg-card space-y-4 rounded-2xl border p-6">
      <dl className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <dt className="text-muted-foreground">Name</dt>
        <dd className="font-medium">{user.name ?? "—"}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="font-medium">{user.email}</dd>
        {user.role === "ADMIN" && (
          <>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">Admin</dd>
          </>
        )}
      </dl>
      <form action={signOutUser}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}

// Placeholder: Phase 7 adds the account sidebar, orders, wishlist, reviews and settings.
export default function AccountPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-wide uppercase">My account</h1>
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
        <AccountOverview />
      </Suspense>
    </section>
  );
}
