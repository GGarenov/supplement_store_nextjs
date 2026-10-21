import fs from "node:fs";
import path from "node:path";

import { LEAF_CATEGORIES } from "../../src/lib/categories";
import { parsePack, type ParsedPack } from "./parse-pack";

export const IMAGES_DIR = path.join(process.cwd(), "images");
export const PUBLIC_PRODUCTS_DIR = path.join(
  process.cwd(),
  "public",
  "products",
);

/** One entry as it appears in images/**\/products.json. */
type RawProduct = {
  id: string;
  brand: string;
  brandSlug: string;
  name: string;
  pack: string;
  price: string;
  url: string;
  image: string;
};

export type CatalogProduct = {
  sourceId: string;
  slug: string;
  name: string;
  brandSlug: string;
  brandName: string;
  priceCents: number;
  pack: ParsedPack;
  /** Every category the product was listed in (some products are in two). */
  categorySlugs: string[];
  /** Absolute path of the source image. */
  imageSource: string;
  /** Public URL path the app will use, e.g. "/products/20848.webp". */
  imagePath: string;
};

export type Catalog = {
  products: CatalogProduct[];
  brands: Map<string, string>; // slug -> display name
  /** Number of entries read from all products.json files (before de-duplication). */
  entryCount: number;
  warnings: string[];
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export function loadCatalog(): Catalog {
  const products = new Map<string, CatalogProduct>();
  const brands = new Map<string, string>();
  const warnings: string[] = [];
  let entryCount = 0;

  for (const category of LEAF_CATEGORIES) {
    const folder = path.join(IMAGES_DIR, category.folder);
    const jsonPath = path.join(folder, "products.json");
    if (!fs.existsSync(jsonPath)) {
      warnings.push(`Missing ${jsonPath}`);
      continue;
    }

    const entries = JSON.parse(
      fs.readFileSync(jsonPath, "utf8"),
    ) as RawProduct[];
    entryCount += entries.length;

    for (const raw of entries) {
      const existing = products.get(raw.id);
      if (existing) {
        if (!existing.categorySlugs.includes(category.slug)) {
          existing.categorySlugs.push(category.slug);
        }
        continue;
      }

      const priceCents = Math.round(parseFloat(raw.price) * 100);
      if (!Number.isFinite(priceCents) || priceCents <= 0) {
        warnings.push(`[${raw.id}] Invalid price "${raw.price}", skipped`);
        continue;
      }

      const imageSource = path.join(folder, raw.image);
      if (!fs.existsSync(imageSource)) {
        warnings.push(`[${raw.id}] Image not found: ${imageSource}`);
      }

      let pack = parsePack(raw.pack);
      if (!pack) {
        warnings.push(`[${raw.id}] Could not parse pack "${raw.pack}"`);
        pack = { amount: 0, unit: "GRAMS", form: "OTHER", label: raw.pack };
      }

      if (!brands.has(raw.brandSlug))
        brands.set(raw.brandSlug, raw.brand.trim());

      products.set(raw.id, {
        sourceId: raw.id,
        slug: `${raw.brandSlug}-${slugify(raw.name)}-${raw.id}`,
        name: raw.name.trim(),
        brandSlug: raw.brandSlug,
        brandName: raw.brand.trim(),
        priceCents,
        pack,
        categorySlugs: [category.slug],
        imageSource,
        imagePath: `/products/${raw.id}${path.extname(raw.image)}`,
      });
    }
  }

  return { products: [...products.values()], brands, entryCount, warnings };
}

/** Copies product images to public/products/<sourceId>.webp. Returns the number copied. */
export function copyProductImages(products: CatalogProduct[]): number {
  fs.mkdirSync(PUBLIC_PRODUCTS_DIR, { recursive: true });
  let copied = 0;
  for (const p of products) {
    if (!fs.existsSync(p.imageSource)) continue;
    const target = path.join(process.cwd(), "public", p.imagePath);
    fs.copyFileSync(p.imageSource, target);
    copied++;
  }
  return copied;
}
