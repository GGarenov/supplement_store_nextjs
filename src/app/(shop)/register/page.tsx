import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  AuthCard,
  AuthFormSkeleton,
  OrDivider,
} from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "@/components/auth/register-form";
import { googleEnabled } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-guards";
import { safeCallbackUrl } from "@/lib/validators/auth";

export const metadata: Metadata = { title: "Create an account" };

// Reads the URL and the session, so it renders at request time inside <Suspense>.
async function RegisterContent({
  searchParams,
}: {
  searchParams: PageProps<"/register">["searchParams"];
}) {
  const raw = (await searchParams).callbackUrl;
  const callbackUrl = safeCallbackUrl(Array.isArray(raw) ? raw[0] : raw, "/");
  if (await getCurrentUser()) redirect(callbackUrl);

  const loginHref =
    callbackUrl === "/"
      ? "/login"
      : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <GoogleButton callbackUrl={callbackUrl} />
          <OrDivider />
        </>
      )}
      <RegisterForm callbackUrl={callbackUrl} />
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <AuthCard
      title="Create an account"
      description="Track your orders, save a wishlist and review products."
    >
      <Suspense fallback={<AuthFormSkeleton fields={4} />}>
        <RegisterContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
