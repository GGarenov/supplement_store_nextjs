"use client";

import { ErrorContent } from "@/components/error-content";

// Errors outside the shop pages (e.g. account and admin, before they get their own).
export default function RootError(props: {
  error: unknown;
  retry: () => void;
}) {
  return <ErrorContent {...props} />;
}
