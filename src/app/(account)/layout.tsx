import { SiteShell } from "@/components/layout/site-shell";

// Placeholder: Phase 7 adds the account sidebar, and Phase 4 the login check.
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
