import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import type { PackUnit, ProductForm } from "@/generated/prisma/enums";
import { getCategory, getSubtreeSlugs } from "@/lib/categories";
import { db } from "@/lib/db";
import {
  PAGE_SIZE,
  type Filters,
  type SizeBucket,
  type SortKey,
} from "@/lib/filters";
import {
  getEffectivePrice,
  type ActivePromotion,
  type EffectivePrice,
} from "@/lib/pricing";

// Every exported query awaits `connection()` before touching the database.
// The Prisma driver uses `Date.now()` and `crypto.getRandomValues()`, which
// Next.js rejects while prerendering, even on pages that read params or
// searchParams. `connection()` makes the query wait for the real request.

// ─── Promotions ──────────────────────────────────────────────────────────────

/**
 * Promotions active right now, with category targets expanded to their whole
 * subtree (a "Pre-Workout" promotion also covers "NO Boosters").
 * Wrapped in React `cache` so one request runs the query once.
 */
export const getActivePromotions = cache(
  async (): Promise<ActivePromotion[]> => {
    await connection();
    const now = new Date();
    const rows = await db.promotion.findMany({
      where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
      include: {
        category: { select: { slug: true } },
        products: { select: { id: true } },
      },
    });
    return rows.map((p) => {
      const category = p.category ? getCategory(p.category.slug) : undefined;
      return {
        id: p.id,
        name: p.name,
        percentOff: p.percentOff,
        brandId: p.brandId,
        categorySlugs: category ? getSubtreeSlugs(category) : [],
        productIds: p.products.map((x) => x.id),
      };
    });
  },
);

// ─── Product cards ───────────────────────────────────────────────────────────

const productCardInclude = {
  brand: { select: { slug: true, name: true } },
  categories: { select: { slug: true } },
} satisfies Prisma.ProductInclude;

type ProductCardRow = Prisma.ProductGetPayload<{
  include: typeof productCardInclude;
}>;

/** Everything a product card needs, with the promotion already applied. */
export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  brandSlug: string;
  packLabel: string;
  image: string;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  price: EffectivePrice;
};

function toProductCard(
  row: ProductCardRow,
  promotions: ActivePromotion[],
): ProductCardData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandName: row.brand.name,
    brandSlug: row.brand.slug,
    packLabel: row.packLabel,
    image: row.image,
    stock: row.stock,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    price: getEffectivePrice(
      { ...row, categorySlugs: row.categories.map((c) => c.slug) },
      promotions,
    ),
  };
}

async function findProductCards(
  args: Omit<Prisma.ProductFindManyArgs, "include" | "select">,
) {
  await connection();
  const [rows, promotions] = await Promise.all([
    db.product.findMany({ ...args, include: productCardInclude }),
    getActivePromotions(),
  ]);
  return rows.map((row) => toProductCard(row, promotions));
}

// ─── Listing queries ─────────────────────────────────────────────────────────

/** What a listing page is about, before the user's filters: a category, a brand, or a search. */
export type ListingScope = {
  /** The category and all its descendants. */
  categorySlugs?: string[];
  brandSlug?: string;
  q?: string;
};

const WEIGHT_UNITS: PackUnit[] = ["GRAMS", "ML"];
const COUNT_UNITS: PackUnit[] = [
  "CAPSULES",
  "SOFTGELS",
  "TABLETS",
  "GUMMIES",
  "SACHETS",
  "PATCHES",
];

const SIZE_LIMITS: Record<
  SizeBucket,
  { weight: Prisma.IntFilter; count: Prisma.IntFilter }
> = {
  small: { weight: { lte: 300 }, count: { lte: 60 } },
  medium: { weight: { gt: 300, lte: 1000 }, count: { gt: 60, lte: 120 } },
  large: { weight: { gt: 1000 }, count: { gt: 120 } },
};

function sizeWhere(size: SizeBucket): Prisma.ProductWhereInput {
  const limits = SIZE_LIMITS[size];
  return {
    OR: [
      { packUnit: { in: WEIGHT_UNITS }, packAmount: limits.weight },
      { packUnit: { in: COUNT_UNITS }, packAmount: limits.count },
    ],
  };
}

/** Products covered by at least one active promotion. */
function onSaleWhere(promotions: ActivePromotion[]): Prisma.ProductWhereInput {
  const brandIds = promotions.flatMap((p) => (p.brandId ? [p.brandId] : []));
  const categorySlugs = promotions.flatMap((p) => p.categorySlugs);
  const productIds = promotions.flatMap((p) => p.productIds);
  return {
    OR: [
      { brandId: { in: brandIds } },
      { categories: { some: { slug: { in: categorySlugs } } } },
      { id: { in: productIds } },
    ],
  };
}

/** Every word must appear in the product name or the brand name. */
function searchWhere(q: string): Prisma.ProductWhereInput {
  const words = q.split(/\s+/).filter(Boolean).slice(0, 8);
  return {
    AND: words.map((word) => ({
      OR: [
        { name: { contains: word, mode: "insensitive" } },
        { brand: { name: { contains: word, mode: "insensitive" } } },
      ],
    })),
  };
}

function scopeWhere(scope: ListingScope): Prisma.ProductWhereInput[] {
  const and: Prisma.ProductWhereInput[] = [{ archived: false }];
  if (scope.categorySlugs)
    and.push({ categories: { some: { slug: { in: scope.categorySlugs } } } });
  if (scope.brandSlug) and.push({ brand: { slug: scope.brandSlug } });
  if (scope.q) and.push(searchWhere(scope.q));
  return and;
}

type FacetKey = "brands" | "forms" | "sizes";

/**
 * Builds the Prisma `where` for a listing. `skip` leaves one filter out, which
 * the facet counts need: the brand counts should show what you'd get by
 * picking another brand, not only the brands already picked.
 */
export function buildProductWhere(
  scope: ListingScope,
  filters: Filters,
  promotions: ActivePromotion[],
  skip?: FacetKey,
): Prisma.ProductWhereInput {
  const and = scopeWhere(scope);

  if (skip !== "brands" && filters.brands.length) {
    and.push({ brand: { slug: { in: filters.brands } } });
  }
  if (skip !== "forms" && filters.forms.length) {
    and.push({ form: { in: filters.forms } });
  }
  if (skip !== "sizes" && filters.sizes.length) {
    and.push({ OR: filters.sizes.map(sizeWhere) });
  }
  // Price filters use the regular price; the sale price isn't stored in the database.
  if (filters.minPrice !== undefined) {
    and.push({ priceCents: { gte: Math.round(filters.minPrice * 100) } });
  }
  if (filters.maxPrice !== undefined) {
    and.push({ priceCents: { lte: Math.round(filters.maxPrice * 100) } });
  }
  if (filters.rating !== undefined)
    and.push({ ratingAvg: { gte: filters.rating } });
  if (filters.inStock) and.push({ stock: { gt: 0 } });
  if (filters.sale) and.push(onSaleWhere(promotions));

  return { AND: and };
}

// `id` last keeps the order stable across pages when the other values tie.
const ORDER_BY: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ featured: "desc" }, { soldCount: "desc" }, { id: "asc" }],
  "price-asc": [{ priceCents: "asc" }, { id: "asc" }],
  "price-desc": [{ priceCents: "desc" }, { id: "asc" }],
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  rating: [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { id: "asc" }],
  bestselling: [{ soldCount: "desc" }, { id: "asc" }],
};

export async function getProducts(scope: ListingScope, filters: Filters) {
  const promotions = await getActivePromotions();
  const where = buildProductWhere(scope, filters, promotions);

  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // A page past the end (e.g. after narrowing the filters) shows the last page.
  const page = Math.min(filters.page, pageCount);

  const items = await findProductCards({
    where,
    orderBy: ORDER_BY[filters.sort],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  return { items, total, page, pageCount };
}

export type Facets = {
  brands: { slug: string; name: string; count: number }[];
  forms: { value: ProductForm; count: number }[];
  sizes: { value: SizeBucket; count: number }[];
  /** Regular price range of the whole scope, in euros, for the price slider. */
  priceRange: { min: number; max: number };
};

/** Counts for the filter sidebar. Each facet ignores its own filter (see buildProductWhere). */
export async function getFacets(
  scope: ListingScope,
  filters: Filters,
): Promise<Facets> {
  const promotions = await getActivePromotions();

  const [brandGroups, formGroups, sizeCounts, price] = await Promise.all([
    db.product.groupBy({
      by: ["brandId"],
      where: buildProductWhere(scope, filters, promotions, "brands"),
      _count: { _all: true },
    }),
    db.product.groupBy({
      by: ["form"],
      where: buildProductWhere(scope, filters, promotions, "forms"),
      _count: { _all: true },
    }),
    Promise.all(
      (["small", "medium", "large"] as const).map(async (size) => ({
        value: size,
        count: await db.product.count({
          where: {
            AND: [
              buildProductWhere(scope, filters, promotions, "sizes"),
              sizeWhere(size),
            ],
          },
        }),
      })),
    ),
    db.product.aggregate({
      where: { AND: scopeWhere(scope) },
      _min: { priceCents: true },
      _max: { priceCents: true },
    }),
  ]);

  const brandCounts = new Map(
    brandGroups.map((g) => [g.brandId, g._count._all]),
  );
  // Also load brands that are selected but have no results, so they can be unticked.
  const brands = await db.brand.findMany({
    where: {
      OR: [
        { id: { in: [...brandCounts.keys()] } },
        { slug: { in: filters.brands } },
      ],
    },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    brands: brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      count: brandCounts.get(b.id) ?? 0,
    })),
    forms: formGroups
      .map((g) => ({ value: g.form, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    sizes: sizeCounts,
    priceRange: {
      min: Math.floor((price._min.priceCents ?? 0) / 100),
      max: Math.ceil((price._max.priceCents ?? 0) / 100),
    },
  };
}

// ─── Home page ───────────────────────────────────────────────────────────────

export function getFeaturedProducts(limit = 8) {
  return findProductCards({
    where: { archived: false, featured: true },
    orderBy: ORDER_BY.featured,
    take: limit,
  });
}

export function getBestSellers(limit = 8) {
  return findProductCards({
    where: { archived: false },
    orderBy: ORDER_BY.bestselling,
    take: limit,
  });
}

// ─── Product page ────────────────────────────────────────────────────────────

/** One product with everything the product page shows. Deduplicated per request. */
export const getProductBySlug = cache(async (slug: string) => {
  await connection();
  const [product, promotions] = await Promise.all([
    db.product.findUnique({
      where: { slug },
      include: {
        ...productCardInclude,
        reviews: {
          where: { hidden: false },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true } } },
        },
      },
    }),
    getActivePromotions(),
  ]);
  if (!product || product.archived) return null;

  const categorySlugs = product.categories.map((c) => c.slug);
  return {
    ...product,
    categorySlugs,
    price: getEffectivePrice({ ...product, categorySlugs }, promotions),
  };
});

/** How many visible reviews gave 5, 4, 3, 2 and 1 stars. */
export async function getRatingDistribution(productId: string) {
  await connection();
  const groups = await db.review.groupBy({
    by: ["rating"],
    where: { productId, hidden: false },
    _count: { _all: true },
  });
  const counts = new Map(groups.map((g) => [g.rating, g._count._all]));
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts.get(stars) ?? 0,
  }));
}

/** Best sellers from the product's own categories, excluding the product itself. */
export function getRelatedProducts(
  productId: string,
  categorySlugs: string[],
  limit = 8,
) {
  return findProductCards({
    where: {
      archived: false,
      id: { not: productId },
      categories: { some: { slug: { in: categorySlugs } } },
    },
    orderBy: ORDER_BY.bestselling,
    take: limit,
  });
}

// ─── Brands ──────────────────────────────────────────────────────────────────

export async function getBrandsWithCounts() {
  await connection();
  return db.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      featured: true,
      _count: { select: { products: { where: { archived: false } } } },
    },
  });
}

export const getBrand = cache(async (slug: string) => {
  await connection();
  return db.brand.findUnique({
    where: { slug },
    select: { slug: true, name: true },
  });
});
