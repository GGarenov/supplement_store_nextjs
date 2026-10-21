import { XIcon } from "lucide-react";
import Link from "next/link";

import type { Facets } from "@/lib/catalog";
import {
  FORM_LABELS,
  SIZE_OPTIONS,
  filtersHref,
  type Filters,
} from "@/lib/filters";

function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        className="bg-secondary hover:bg-muted inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
      >
        {children}
        <XIcon className="size-3" aria-hidden="true" />
        <span className="sr-only">(remove filter)</span>
      </Link>
    </li>
  );
}

/** Removable chips for each applied filter, plus "Clear all". */
export function ActiveFilters({
  pathname,
  filters,
  facets,
}: {
  pathname: string;
  filters: Filters;
  facets: Facets;
}) {
  const href = (patch: Partial<Filters>) =>
    filtersHref(pathname, filters, patch);
  const brandNames = new Map(facets.brands.map((b) => [b.slug, b.name]));
  const sizeLabels = new Map(SIZE_OPTIONS.map((s) => [s.value, s.label]));

  const chips: { key: string; label: string; href: string }[] = [
    ...filters.brands.map((slug) => ({
      key: `brand-${slug}`,
      label: brandNames.get(slug) ?? slug,
      href: href({ brands: filters.brands.filter((b) => b !== slug) }),
    })),
    ...filters.forms.map((form) => ({
      key: `form-${form}`,
      label: FORM_LABELS[form],
      href: href({ forms: filters.forms.filter((f) => f !== form) }),
    })),
    ...filters.sizes.map((size) => ({
      key: `size-${size}`,
      label: `${sizeLabels.get(size)} pack`,
      href: href({ sizes: filters.sizes.filter((s) => s !== size) }),
    })),
  ];
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    chips.push({
      key: "price",
      label: `€${filters.minPrice ?? facets.priceRange.min}–€${filters.maxPrice ?? facets.priceRange.max}`,
      href: href({ minPrice: undefined, maxPrice: undefined }),
    });
  }
  if (filters.rating !== undefined) {
    chips.push({
      key: "rating",
      label: `${filters.rating}★ & up`,
      href: href({ rating: undefined }),
    });
  }
  if (filters.sale)
    chips.push({ key: "sale", label: "On sale", href: href({ sale: false }) });
  if (filters.inStock)
    chips.push({
      key: "stock",
      label: "In stock",
      href: href({ inStock: false }),
    });

  if (chips.length === 0) return null;

  const clearAll = href({
    brands: [],
    forms: [],
    sizes: [],
    minPrice: undefined,
    maxPrice: undefined,
    rating: undefined,
    sale: false,
    inStock: false,
  });

  return (
    <ul
      aria-label="Applied filters"
      className="flex flex-wrap items-center gap-2"
    >
      {chips.map((c) => (
        <Chip key={c.key} href={c.href}>
          {c.label}
        </Chip>
      ))}
      <li>
        <Link
          href={clearAll}
          scroll={false}
          className="text-primary text-xs hover:underline"
        >
          Clear all
        </Link>
      </li>
    </ul>
  );
}
