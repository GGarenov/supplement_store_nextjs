import Link from "next/link";

import { SearchForm } from "@/components/layout/search-form";
import { Button } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <p className="font-heading text-primary text-7xl font-bold">404</p>
      <h1 className="text-3xl font-bold tracking-wide uppercase">
        Page not found
      </h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Try a
        search instead.
      </p>
      <SearchForm className="w-full" />
      <Button asChild variant="outline">
        <Link href="/">Back to the home page</Link>
      </Button>
    </section>
  );
}
