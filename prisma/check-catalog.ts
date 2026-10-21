/**
 * Reads the catalog from images/ without touching the database, prints a summary
 * and any warnings, and copies product images to public/products/.
 *
 * Usage: npm run catalog:check
 */
import { CATEGORIES } from "../src/lib/categories";
import { copyProductImages, loadCatalog } from "./lib/load-catalog";

const catalog = loadCatalog();
const { products, brands, warnings } = catalog;

const multiCategory = products.filter((p) => p.categorySlugs.length > 1);
const countBy = (key: (p: (typeof products)[number]) => string) =>
  products.reduce<Record<string, number>>((acc, p) => {
    acc[key(p)] = (acc[key(p)] ?? 0) + 1;
    return acc;
  }, {});

console.log(`Entries read:        ${catalog.entryCount}`);
console.log(`Unique products:     ${products.length}`);
console.log(`Brands:              ${brands.size}`);
console.log(`Categories:          ${CATEGORIES.length}`);
console.log(`In 2+ categories:    ${multiCategory.length}`);
for (const p of multiCategory) {
  console.log(`  - ${p.sourceId} ${p.name} → ${p.categorySlugs.join(", ")}`);
}
console.log(
  "Forms:",
  countBy((p) => p.pack.form),
);
console.log(
  "Units:",
  countBy((p) => p.pack.unit),
);

const copied = copyProductImages(products);
console.log(`Images copied:       ${copied} → public/products/`);

if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  ${w}`);
  process.exitCode = 1;
} else {
  console.log("\nNo warnings.");
}
