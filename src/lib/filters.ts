/**
 * Catalog filters live in the URL query string, so filtered pages can be shared
 * and the back button works. This file parses and serialises them; it has no
 * server imports, so client components (sidebar, sort) use it too.
 *
 * Format: ?brand=ostrovit,now-foods&form=powder&minPrice=10&sort=price-asc&page=2
 */
import { z } from "zod";

import { ProductForm } from "@/generated/prisma/enums";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Best rated" },
  { value: "bestselling", label: "Best selling" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const FORM_LABELS: Record<ProductForm, string> = {
  POWDER: "Powder",
  CAPSULES: "Capsules",
  SOFTGELS: "Softgels",
  TABLETS: "Tablets",
  LIQUID: "Liquid",
  GUMMIES: "Gummies",
  OTHER: "Other",
};

/** Pack size buckets. Weight packs (g, ml) and count packs (capsules, tablets…) use different limits. */
export const SIZE_OPTIONS = [
  { value: "small", label: "Small", hint: "≤ 300 g · ≤ 60 pcs" },
  { value: "medium", label: "Medium", hint: "301–1000 g · 61–120 pcs" },
  { value: "large", label: "Large", hint: "> 1 kg · > 120 pcs" },
] as const;
export type SizeBucket = (typeof SIZE_OPTIONS)[number]["value"];

export const RATING_OPTIONS = [4, 3, 2] as const;

export const PAGE_SIZE = 24;

export type Filters = {
  brands: string[];
  forms: ProductForm[];
  sizes: SizeBucket[];
  /** Euros (not cents), as typed by the user. */
  minPrice?: number;
  maxPrice?: number;
  /** Minimum average rating. */
  rating?: number;
  sale: boolean;
  inStock: boolean;
  sort: SortKey;
  page: number;
  /** Search text (only used on /search). */
  q: string;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

const SORT_VALUES = SORT_OPTIONS.map((o) => o.value) as [SortKey, ...SortKey[]];
const SIZE_VALUES = SIZE_OPTIONS.map((o) => o.value) as [
  SizeBucket,
  ...SizeBucket[],
];

const priceSchema = z.coerce
  .number()
  .nonnegative()
  .max(100_000)
  .optional()
  .catch(undefined);
const pageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);
const ratingSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(4)
  .optional()
  .catch(undefined);
const sortSchema = z.enum(SORT_VALUES).catch("featured");

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

function list(value: string | string[] | undefined): string[] {
  const v = first(value);
  return v
    ? [
        ...new Set(
          v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ]
    : [];
}

/** Parses the query string into filters. Invalid values are dropped, never an error. */
export function parseFilters(params: RawSearchParams): Filters {
  const forms = list(params.form)
    .map((f) => f.toUpperCase())
    .filter((f): f is ProductForm => Object.hasOwn(ProductForm, f));
  const sizes = list(params.size).filter((s): s is SizeBucket =>
    (SIZE_VALUES as string[]).includes(s),
  );

  let minPrice = priceSchema.parse(first(params.minPrice));
  let maxPrice = priceSchema.parse(first(params.maxPrice));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return {
    brands: list(params.brand).slice(0, 50),
    forms,
    sizes,
    minPrice,
    maxPrice,
    rating: ratingSchema.parse(first(params.rating)),
    sale: first(params.sale) === "1",
    inStock: first(params.inStock) === "1",
    sort: sortSchema.parse(first(params.sort)),
    page: pageSchema.parse(first(params.page)),
    q: (first(params.q) ?? "").slice(0, 100),
  };
}

/** Serialises filters back to a query string, leaving out defaults. */
export function toSearchParams(filters: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.brands.length) p.set("brand", filters.brands.join(","));
  if (filters.forms.length)
    p.set("form", filters.forms.map((f) => f.toLowerCase()).join(","));
  if (filters.sizes.length) p.set("size", filters.sizes.join(","));
  if (filters.minPrice !== undefined)
    p.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined)
    p.set("maxPrice", String(filters.maxPrice));
  if (filters.rating !== undefined) p.set("rating", String(filters.rating));
  if (filters.sale) p.set("sale", "1");
  if (filters.inStock) p.set("inStock", "1");
  if (filters.sort !== "featured") p.set("sort", filters.sort);
  if (filters.page > 1) p.set("page", String(filters.page));
  return p;
}

/**
 * URL for the same listing with some filters changed. Any change other than
 * the page number goes back to page 1.
 */
export function filtersHref(
  pathname: string,
  filters: Filters,
  patch: Partial<Filters>,
): string {
  const next: Filters = { ...filters, page: 1, ...patch };
  const qs = toSearchParams(next).toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Filters the user has applied, not counting sort, page or the search text. */
export function countActiveFilters(filters: Filters): number {
  return (
    filters.brands.length +
    filters.forms.length +
    filters.sizes.length +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.rating !== undefined ? 1 : 0) +
    (filters.sale ? 1 : 0) +
    (filters.inStock ? 1 : 0)
  );
}
