"use client";

import { catchError, type ErrorInfo } from "next/error";

import { Button } from "@/components/ui/button";

function SectionError({ message }: { message?: string }, { retry }: ErrorInfo) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center text-sm">
      <p>{message ?? "This section couldn't be loaded."}</p>
      <Button variant="outline" size="sm" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}

/**
 * Error boundary for one section of a page (e.g. a product row on the home
 * page), so a failed query doesn't replace the whole page with an error.
 */
export const SectionErrorBoundary = catchError(SectionError);
