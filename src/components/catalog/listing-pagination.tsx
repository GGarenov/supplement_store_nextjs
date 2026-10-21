import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { filtersHref, type Filters } from "@/lib/filters";

/** Page numbers to show: first, last, and two either side of the current page. */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount]);
  for (let p = page - 2; p <= page + 2; p++)
    if (p >= 1 && p <= pageCount) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) =>
    i > 0 && p - sorted[i - 1] > 1 ? ["gap" as const, p] : [p],
  );
}

// The shadcn Pagination renders plain <a> tags (full page loads), so this uses next/link.
export function ListingPagination({
  pathname,
  filters,
  page,
  pageCount,
}: {
  pathname: string;
  filters: Filters;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => filtersHref(pathname, filters, { page: p });

  return (
    <nav aria-label="Pagination" className="mt-8 flex justify-center">
      <ul className="flex items-center gap-1">
        <li>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-disabled={page === 1}
          >
            {page === 1 ? (
              <span aria-label="Previous page" className="opacity-50">
                <ChevronLeftIcon />
              </span>
            ) : (
              <Link href={href(page - 1)} aria-label="Previous page">
                <ChevronLeftIcon />
              </Link>
            )}
          </Button>
        </li>
        {pageWindow(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li
              key={`gap-${i}`}
              className="text-muted-foreground px-1"
              aria-hidden="true"
            >
              …
            </li>
          ) : (
            <li key={p}>
              <Button
                asChild
                variant={p === page ? "outline" : "ghost"}
                size="icon"
              >
                <Link
                  href={href(p)}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Link>
              </Button>
            </li>
          ),
        )}
        <li>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-disabled={page === pageCount}
          >
            {page === pageCount ? (
              <span aria-label="Next page" className="opacity-50">
                <ChevronRightIcon />
              </span>
            ) : (
              <Link href={href(page + 1)} aria-label="Next page">
                <ChevronRightIcon />
              </Link>
            )}
          </Button>
        </li>
      </ul>
    </nav>
  );
}
