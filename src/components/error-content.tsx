"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** Shared body of the error.tsx pages. */
export function ErrorContent({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // In production, server errors only carry a digest that matches the server logs.
  const digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-wide uppercase">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        We couldn&apos;t load this page. Please try again in a moment.
      </p>
      {digest && (
        <p className="text-muted-foreground text-xs">
          Error reference: {digest}
        </p>
      )}
      <Button onClick={() => retry()}>Try again</Button>
    </section>
  );
}
