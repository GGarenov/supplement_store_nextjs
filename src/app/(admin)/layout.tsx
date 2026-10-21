// Placeholder: Phase 9 adds the admin sidebar and the admin-only check.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
