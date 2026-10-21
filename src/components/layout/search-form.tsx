import { SearchIcon } from "lucide-react";
import Form from "next/form";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Submits to /search?q=… (next/form navigates client-side, and works without JS). */
export function SearchForm({ className }: { className?: string }) {
  return (
    <Form action="/search" role="search" className={cn("relative", className)}>
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        name="q"
        placeholder="Search products or brands…"
        aria-label="Search products or brands"
        className="h-10 pl-9"
      />
    </Form>
  );
}
