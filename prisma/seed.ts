/**
 * Seeds the database from images/**\/products.json plus deterministic fake data.
 * Safe to run repeatedly: everything is upserted by a stable key.
 *
 * Usage: npm run db:seed
 */
import "dotenv/config";

import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES } from "../src/lib/categories";
import {
  copyProductImages,
  loadCatalog,
  type CatalogProduct,
} from "./lib/load-catalog";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

faker.seed(42);

const FEATURED_PRODUCT_COUNT = 12;
const FEATURED_BRAND_COUNT = 8;
const REVIEW_COUNT = 150;
const DEFAULT_USER_PASSWORD = "password123";

async function seedCategories() {
  const ids = new Map<string, string>();
  // CATEGORIES lists parents before children, so parent ids are always known.
  for (const c of CATEGORIES) {
    const parentId = c.parentSlug ? ids.get(c.parentSlug) : null;
    const data = {
      name: c.name,
      sortOrder: c.sortOrder,
      parentId,
      image: c.image ?? null,
    };
    const row = await db.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, ...data },
      update: data,
    });
    ids.set(c.slug, row.id);
  }
  return ids;
}

async function seedBrands(
  brands: Map<string, string>,
  products: CatalogProduct[],
) {
  const productCount = new Map<string, number>();
  for (const p of products)
    productCount.set(p.brandSlug, (productCount.get(p.brandSlug) ?? 0) + 1);
  const featured = new Set(
    [...productCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, FEATURED_BRAND_COUNT)
      .map(([slug]) => slug),
  );

  const ids = new Map<string, string>();
  for (const [slug, name] of brands) {
    const row = await db.brand.upsert({
      where: { slug },
      create: { slug, name, featured: featured.has(slug) },
      update: { name, featured: featured.has(slug) },
    });
    ids.set(slug, row.id);
  }
  return ids;
}

function describe(p: CatalogProduct, categoryName: string): string {
  const templates = [
    `${p.name} by ${p.brandName} is a ${categoryName.toLowerCase()} supplement in a ${p.pack.label} pack, made for athletes who want consistent results.`,
    `A ${categoryName.toLowerCase()} favourite from ${p.brandName}. ${p.name} comes in a ${p.pack.label} pack and fits easily into any training routine.`,
    `${p.brandName} ${p.name}: quality ${categoryName.toLowerCase()} in a ${p.pack.label} pack. Use as directed on the label as part of a balanced diet.`,
  ];
  return faker.helpers.arrayElement(templates);
}

async function seedProducts(
  products: CatalogProduct[],
  brandIds: Map<string, string>,
  categoryIds: Map<string, string>,
) {
  const categoryNames = new Map(CATEGORIES.map((c) => [c.slug, c.name]));
  const featured = new Set(
    faker.helpers
      .arrayElements(products, FEATURED_PRODUCT_COUNT)
      .map((p) => p.sourceId),
  );

  const ids: string[] = [];
  for (const p of products) {
    // Fake values are generated on every run (to keep the faker sequence stable).
    // Stock and sales are only written on create, so re-seeding doesn't reset them.
    const stock =
      faker.number.float() < 0.05 ? 0 : faker.number.int({ min: 1, max: 150 });
    const soldCount = faker.number.int({ min: 0, max: 500 });
    const description = describe(
      p,
      categoryNames.get(p.categorySlugs[0]) ?? "",
    );

    const catalogFields = {
      slug: p.slug,
      name: p.name,
      brandId: brandIds.get(p.brandSlug)!,
      priceCents: p.priceCents,
      form: p.pack.form,
      packAmount: p.pack.amount,
      packUnit: p.pack.unit,
      packLabel: p.pack.label,
      image: p.imagePath,
      featured: featured.has(p.sourceId),
      // Built from the name and brand, so it's refreshed together with them.
      description,
    };
    const categoryRefs = p.categorySlugs.map((slug) => ({
      id: categoryIds.get(slug)!,
    }));

    const row = await db.product.upsert({
      where: { sourceId: p.sourceId },
      create: {
        sourceId: p.sourceId,
        stock,
        soldCount,
        ...catalogFields,
        categories: { connect: categoryRefs },
      },
      // `set` replaces the product's categories with the ones in the source
      // data, so moving a product to another folder doesn't leave it in both.
      update: { ...catalogFields, categories: { set: categoryRefs } },
    });
    ids.push(row.id);
  }
  return ids;
}

async function seedUsers() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("Set SEED_ADMIN_PASSWORD in .env before seeding.");
  }

  const admin = await db.user.upsert({
    where: { email: "admin@healthystreet.test" },
    create: {
      email: "admin@healthystreet.test",
      name: "Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
    update: { role: "ADMIN" },
  });

  const userHash = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const name = faker.person.fullName();
    const email = `user${i}@healthystreet.test`;
    users.push(
      await db.user.upsert({
        where: { email },
        create: { email, name, passwordHash: userHash },
        update: {},
      }),
    );
  }
  return { admin, users };
}

const REVIEW_TITLES = [
  "Great taste",
  "Does the job",
  "Good value",
  "Would buy again",
  "Mixes well",
  "Not bad",
  "Excellent quality",
  "Just okay",
  "My go-to product",
  "Noticeable results",
];

async function seedReviews(userIds: string[], productIds: string[]) {
  for (let i = 0; i < REVIEW_COUNT; i++) {
    const userId = faker.helpers.arrayElement(userIds);
    const productId = faker.helpers.arrayElement(productIds);
    // Skewed towards good ratings, like real shops.
    const rating = faker.helpers.weightedArrayElement([
      { value: 5, weight: 45 },
      { value: 4, weight: 30 },
      { value: 3, weight: 15 },
      { value: 2, weight: 6 },
      { value: 1, weight: 4 },
    ]);
    const data = {
      rating,
      title: faker.helpers.arrayElement(REVIEW_TITLES),
      body: faker.lorem.sentences({ min: 1, max: 3 }),
    };
    // A user can review a product once; a repeated pair just updates that review.
    await db.review.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, ...data },
      update: data,
    });
  }

  const stats = await db.review.groupBy({
    by: ["productId"],
    where: { hidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const s of stats) {
    await db.product.update({
      where: { id: s.productId },
      data: { ratingAvg: s._avg.rating ?? 0, ratingCount: s._count._all },
    });
  }
  return stats.length;
}

async function seedPromotions(
  brandIds: Map<string, string>,
  categoryIds: Map<string, string>,
) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const startsAt = new Date(now - day);
  const endsAt = new Date(now + 60 * day);

  // Fixed ids keep these idempotent without overwriting banners an admin creates later.
  const banners = [
    {
      id: "seed-strip-shipping",
      placement: "STRIP" as const,
      title: "Free shipping on orders over €60",
      sortOrder: 0,
    },
    {
      id: "seed-hero-preworkout",
      placement: "HERO" as const,
      title: "Pre-Workout Week",
      subtitle: "20% off every pre-workout. Train harder for less.",
      ctaLabel: "Shop pre-workout",
      ctaHref: "/c/pre-workout",
      sortOrder: 1,
    },
    {
      id: "seed-hero-ostrovit",
      placement: "HERO" as const,
      title: "OstroVit Deals",
      subtitle: "15% off the whole OstroVit range.",
      ctaLabel: "Shop OstroVit",
      ctaHref: "/brands/ostrovit",
      sortOrder: 2,
    },
    {
      id: "seed-hero-protein",
      placement: "HERO" as const,
      title: "Build Muscle Right",
      subtitle: "Whey protein from the brands you trust.",
      ctaLabel: "Shop protein",
      ctaHref: "/c/protein",
      sortOrder: 3,
    },
    {
      id: "seed-inline-vitamins",
      placement: "INLINE" as const,
      title: "Daily Vitamins",
      subtitle: "Cover the basics: vitamin D, C, zinc and magnesium.",
      ctaLabel: "Shop vitamins",
      ctaHref: "/c/vitamins-minerals",
      sortOrder: 1,
    },
    {
      id: "seed-inline-creatine",
      placement: "INLINE" as const,
      title: "Creatine: The Classic",
      subtitle: "The most researched supplement in sport.",
      ctaLabel: "Shop creatine",
      ctaHref: "/c/creatine",
      sortOrder: 2,
    },
  ];
  for (const { id, ...data } of banners) {
    const fields = { ...data, startsAt, endsAt, active: true };
    await db.banner.upsert({
      where: { id },
      create: { id, ...fields },
      update: fields,
    });
  }

  const promotions = [
    {
      id: "seed-promo-preworkout",
      name: "Pre-Workout Week −20%",
      percentOff: 20,
      categoryId: categoryIds.get("pre-workout")!,
    },
    {
      id: "seed-promo-ostrovit",
      name: "OstroVit −15%",
      percentOff: 15,
      brandId: brandIds.get("ostrovit")!,
    },
  ];
  for (const { id, ...data } of promotions) {
    const fields = { ...data, startsAt, endsAt, active: true };
    await db.promotion.upsert({
      where: { id },
      create: { id, ...fields },
      update: fields,
    });
  }

  return { banners: banners.length, promotions: promotions.length };
}

async function main() {
  const catalog = loadCatalog();
  for (const w of catalog.warnings) console.warn(`⚠ ${w}`);

  const copied = copyProductImages(catalog.products);
  console.log(`Copied ${copied} images to public/products/`);

  const categoryIds = await seedCategories();
  console.log(`Categories: ${categoryIds.size}`);

  const brandIds = await seedBrands(catalog.brands, catalog.products);
  console.log(`Brands: ${brandIds.size}`);

  const productIds = await seedProducts(
    catalog.products,
    brandIds,
    categoryIds,
  );
  console.log(`Products: ${productIds.length}`);

  // Brands left over from earlier source data (e.g. renamed ones) have no
  // products any more. Brands a promotion points to are kept.
  const orphans = await db.brand.deleteMany({
    where: { products: { none: {} }, promotions: { none: {} } },
  });
  if (orphans.count)
    console.log(`Removed ${orphans.count} brands with no products`);

  const { admin, users } = await seedUsers();
  console.log(`Users: ${users.length + 1} (admin: ${admin.email})`);

  const reviewed = await seedReviews(
    users.map((u) => u.id),
    productIds,
  );
  console.log(`Reviews: up to ${REVIEW_COUNT}, on ${reviewed} products`);

  const promo = await seedPromotions(brandIds, categoryIds);
  console.log(`Banners: ${promo.banners}, promotions: ${promo.promotions}`);
}

main()
  .then(() => console.log("Seed complete."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
