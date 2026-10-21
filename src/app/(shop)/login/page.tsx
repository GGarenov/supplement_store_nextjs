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
import { LoginForm } from "@/components/auth/login-form";
import { googleEnabled } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-guards";
import { safeCallbackUrl } from "@/lib/validators/auth";

export const metadata: Metadata = { title: "Sign in" };

// Auth.js redirects back here with ?error=… when a sign-in fails.
const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already registered with a different sign-in method.",
  AccessDenied: "Access was denied.",
  Configuration: "Sign-in isn't configured correctly. Please try again later.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Reads the URL and the session, so it renders at request time inside <Suspense>.
async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(first(params.callbackUrl), "/");
  if (await getCurrentUser()) redirect(callbackUrl);

  const errorCode = first(params.error);
  const error = errorCode
    ? (AUTH_ERRORS[errorCode] ?? "Sign-in failed. Please try again.")
    : null;
  const registerHref =
    callbackUrl === "/"
      ? "/register"
      : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
        >
          {error}
        </p>
      )}
      {googleEnabled && (
        <>
          <GoogleButton callbackUrl={callbackUrl} />
          <OrDivider />
        </>
      )}
      <LoginForm callbackUrl={callbackUrl} />
      <p className="text-muted-foreground text-center text-sm">
        New to Healthy Street?{" "}
        <Link
          href={registerHref}
          className="text-primary font-medium hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="Sign in"
      description="Welcome back. Sign in to see your orders and wishlist."
    >
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
