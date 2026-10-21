import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth-guards";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

// Reads the session, so it renders at request time inside <Suspense>.
async function AdminWelcome() {
  const admin = await requireAdmin();
  return (
    <p className="text-muted-foreground">
      Signed in as{" "}
      <span className="text-foreground font-medium">{admin.email}</span>. The
      dashboard and management screens come in Phase 9.
    </p>
  );
}

// Placeholder: Phase 9 builds the admin area.
export default function AdminPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-wide uppercase">Admin</h1>
      <Suspense fallback={<Skeleton className="h-6 w-80" />}>
        <AdminWelcome />
      </Suspense>
      <Link href="/" className="text-primary text-sm hover:underline">
        ← Back to the store
      </Link>
    </section>
  );
}
