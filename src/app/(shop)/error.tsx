"use client";

import { ErrorContent } from "@/components/error-content";

// Errors in shop pages; the shop layout (header, footer) stays in place.
export default function ShopError(props: {
  error: unknown;
  retry: () => void;
}) {
  return <ErrorContent {...props} />;
}
