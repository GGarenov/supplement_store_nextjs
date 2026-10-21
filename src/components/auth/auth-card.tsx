import { Skeleton } from "@/components/ui/skeleton";

/** Centered card used by the login and register pages. */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-12">
      <div className="bg-card space-y-6 rounded-2xl border p-6 sm:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-wide uppercase">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

/** "or" divider between the Google button and the email form. */
export function OrDivider() {
  return (
    <div className="text-muted-foreground flex items-center gap-3 text-xs uppercase">
      <span className="bg-border h-px flex-1" />
      or
      <span className="bg-border h-px flex-1" />
    </div>
  );
}

export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div className="space-y-5" aria-busy="true">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
