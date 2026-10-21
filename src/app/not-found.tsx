import type { Metadata } from "next";

import { SiteShell } from "@/components/layout/site-shell";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = { title: "Page not found" };

// For URLs that match no route. These render in the root layout only, so this adds the site shell.
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
