# Work Log

## 2026-10-21 14:24 (UTC+03:00): Phase 0 and Phase 1

**Status:** All the code for Phase 0 and Phase 1 is written. Lint, typecheck and the build pass.

**Not done yet:** connecting the database. As agreed, no PostgreSQL or Docker was installed; we will use a free **Supabase** project later. Until then, the migration and the seed have not been run.

### Phase 0: Project setup

**Next.js app**
- Created with `create-next-app`. It was scaffolded in a temporary folder and moved to the root, because the root already contained `images/` and `docs/`.
- Versions: **Next.js 16.4.2**, React 19.3, TypeScript, Tailwind CSS v4, ESLint 9, App Router, `src/` directory.
- The scaffold enables `cacheComponents: true` in `next.config.ts`. This is the Next 16 default and is kept as is.
- The scaffold adds an `AGENTS.md` that tells AI agents to read the docs bundled in `node_modules/next/dist/docs/`, because Next 16 has breaking changes.
- Replaced the boilerplate home page with a simple "Healthy Street — under construction" placeholder, set the root metadata, and removed the default SVGs from `public/`.

**Tooling**
- Prettier with `prettier-plugin-tailwindcss` (`.prettierrc`, `.prettierignore`).
- New scripts: `typecheck` (`next typegen && tsc --noEmit`), `format`, `format:check`.
- `typecheck` runs `next typegen` first. Without it, global route types such as `LayoutProps` are missing and `tsc` fails.

**.gitignore**
- Merged the original rules with the Next.js ones.
- `/docs` is no longer ignored, so the plan, to-do and this log get committed.
- `/images` stays ignored (raw source data).
- `.env*` is ignored, except `.env.example`.
- The generated Prisma client (`src/generated/prisma`) is ignored.
- `public/products/` is **not** ignored, so a fresh clone has the images (≈ 9.4 MB).

**shadcn/ui**
- Initialised with the **Radix** base and the **Nova** preset (`components.json`).
- Added: button, card, input, label, textarea, sheet, dialog, dropdown-menu, select, slider, checkbox, badge, carousel, skeleton, sonner, table, tabs, separator, avatar, pagination, breadcrumb.
- In this shadcn version `form` is an empty placeholder. Its replacement **`field`** was added instead; it works with react-hook-form.
- shadcn now uses its own `cn` npm package (from the `shadcn-ui/cn` repo) instead of clsx + tailwind-merge. `next-themes`, `sonner`, `embla-carousel-react` and `lucide-react` were installed as component dependencies.
- Fixed one lint error in the generated `carousel.tsx` (`react-hooks/set-state-in-effect`). It is a legitimate initial sync from the Embla API, so the rule is disabled for that line, with a comment.

**Prisma**
- **Pinned to Prisma 7.10.1** for both `prisma` and `@prisma/client`. Reason: npm's `latest` tag for the `prisma` CLI currently points to a release candidate (`8.0.0-rc.24`), while `@prisma/client` latest is 7.10.1. Do **not** run `npm i prisma@latest` until v8 is stable.
- Prisma 7 works differently from older guides:
  - the generator is `prisma-client`, with output in `src/generated/prisma`
  - connection URLs are no longer in `schema.prisma`; the CLI reads them from **`prisma.config.ts`**
  - the app connects through a driver adapter (`@prisma/adapter-pg`)
  - the seed command is registered in `prisma.config.ts`, not in `package.json`
- `prisma.config.ts` loads `.env` (via `dotenv`) and uses `DIRECT_URL` for migrations. The URL is optional there, so `prisma generate` works before a database exists.
- `src/lib/db.ts`: a Prisma client singleton using the pooled `DATABASE_URL`. It is reused across hot reloads.
- `postinstall` runs `prisma generate`, so the gitignored client is recreated after every `npm install`.
- New scripts: `db:generate`, `db:migrate`, `db:seed`, `db:studio`, `catalog:check`.
- `.env.example` lists all variables, including Supabase's two connection strings (pooled `DATABASE_URL` on port 6543, direct `DIRECT_URL` on port 5432) and `SEED_ADMIN_PASSWORD`.

### Phase 1: Data model and seeding

**Schema (`prisma/schema.prisma`)**
- Models as in plan §4: User/Role plus the Auth.js models (Account, Session, VerificationToken), Brand, Category (tree), Product, Cart/CartItem, Order/OrderItem, WishlistItem, Review, Banner, Promotion.
- Validated with `prisma validate`; the client is generated.
- Changes compared to the plan:
  - `PackUnit` and `ProductForm` have more values, because the data contains them (see the pack parser below).
  - `Promotion.products` is a real many-to-many relation instead of a `productIds String[]` column.
  - `Product.archived` was added now. Phase 9 needs it to hide products that are referenced by orders.
  - `Banner.image` is optional, so the promo strip can be text only.
  - `onDelete` rules: user data cascades; deleting a user or product that is referenced by an order is restricted.

**Category map (`prisma/category-map.ts`)**
- **31 categories**: 7 groups, the `minerals` and `vitamins` mid-levels, and 22 leaves.
- Each leaf maps to its `images/` folder.
- Parents are listed before their children.

**Pack parser (`prisma/lib/parse-pack.ts`)**
- The real data has more formats than the to-do expected. All of them are handled:
  - softgels and chewable softgels
  - chewable, sublingual, effervescent and soluble tablets
  - gummies
  - sachets (form: powder)
  - patches (form: other)
  - ml (form: liquid)
  - weight ranges such as `600-750 грама` and `2000~2084 грама` (stored as the upper value, label "600–750 g")
  - multipacks such as `2 x 9 грама` (stored as the total, label "2 × 9 g")
  - the combo `1054 грама + 63 капсули`
- If a string can't be parsed, the parser returns `null`; the loader logs a warning and falls back to `form = OTHER`.

**Catalog loader (`prisma/lib/load-catalog.ts`)**
- Reads every `products.json` and merges duplicate products, collecting **all** of their categories.
- Builds the slugs (`brandSlug-name-id`) and converts prices to cents.
- Copies the images to `public/products/<sourceId>.webp`.
- Used by both the seed and the check script.

**Catalog check (`npm run catalog:check`, `prisma/check-catalog.ts`)**
- Validates the catalog and copies the images without needing a database. Result:
  - 433 entries → **428 unique products**
  - **94 brands**
  - **31 categories**
  - **5 products in 2 categories**
  - **0 warnings**
  - **428 images** copied to `public/products/`
- Form counts: powder 207, capsules 112, tablets 59, liquid 23, softgels 22, gummies 4, other 1.

**Seed (`prisma/seed.ts`)**
- Upserts categories (parents first), brands (the 8 biggest are featured) and products (upsert by `sourceId`, categories via `connect`).
- Fake data is deterministic (`faker.seed(42)`):
  - stock (≈5% out of stock), `soldCount`, a description built from templates, 12 featured products
  - admin `admin@healthystreet.test` (password from `SEED_ADMIN_PASSWORD`) and 5 users `user1..5@healthystreet.test` (password `password123`)
  - up to 150 reviews, after which `ratingAvg`/`ratingCount` are recomputed
  - 6 banners (1 strip, 3 hero, 2 inline)
  - 2 promotions: Pre-Workout −20% (category) and OstroVit −15% (brand), active for 60 days
- **Idempotent:**
  - users, reviews and brands are upserted by unique keys
  - banners and promotions use fixed ids (`seed-…`), so banners created later by an admin are not touched
  - re-running updates the catalog fields but does not reset stock, sales or descriptions
- **Not run yet**, because there is no database.

### Checks run
- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm run build` ✅
- `npm run dev`: the home page renders and `/products/20848.webp` returns 200 ✅
- `prisma validate` ✅ · `prisma generate` ✅ · `npm run catalog:check` ✅ (0 warnings)

### Next steps
1. Create the Supabase project, copy `.env.example` → `.env`, and fill in `DATABASE_URL`, `DIRECT_URL` and `SEED_ADMIN_PASSWORD`.
2. `npm run db:migrate -- --name init`
3. `npm run db:seed`, then check the counts in `npm run db:studio` (Phase 1 ✅ Check in the to-do).
4. Make the commits listed in the to-do (nothing has been committed yet).
5. Phase 2: layout and design system.

### Notes for later
- One product has a Bulgarian name ("VIP - Кутия", id 11003). Its slug becomes `…-vip-11003`. The name can be translated later in the admin panel.
- The pre-workout promotion targets the parent category `pre-workout`. The pricing logic in Phase 3/8 must apply it to the child categories as well.
- `npm audit` reports 5 high-severity issues. All of them come from the `shadcn` package's CLI dependencies (`braces` → `micromatch` → `fast-glob`, `ts-morph`).
  - The package can't be removed, because `globals.css` imports `shadcn/tailwind.css` from it.
  - The vulnerable code is the CLI's file-globbing, which never runs in the shop.
  - Don't run `npm audit fix --force`: it would downgrade to `shadcn@1.0.0`. Re-check when shadcn releases an update.

---

## 2026-10-21 14:47 (UTC+03:00): Phase 2 (layout and design system)

**Status:** Phase 2 is done. Lint, typecheck and the build pass. The layout was checked in a real browser (Chrome DevTools) at 375px, 768px, 1024px and 1280px in both themes, with no console errors or hydration warnings.

**Moved to Phase 4:** the account dropdown in the header. The icon links to `/login` until auth exists.

### Before starting
- Read the Next.js 16 docs bundled in `node_modules/next/dist/docs` (as `AGENTS.md` asks), especially Cache Components. The rules that shaped this phase:
  - Data that isn't cached must be rendered inside `<Suspense>`.
  - `"use cache"` together with `cacheLife`/`cacheTag` caches a function's result.
  - Calling `new Date()` or `Math.random()` outside a cache or `connection()` blocks prerendering. That's why the footer doesn't show the current year.

### Theme (`src/app/globals.css`, `src/components/theme-provider.tsx`, `src/components/layout/theme-toggle.tsx`)
- The plan §6 palette is defined as shadcn CSS variables: light values on `:root`, dark values on `.dark`.
- New tokens, registered in Tailwind:
  - `sale` / `sale-foreground`, e.g. `bg-sale text-sale-foreground`
  - `rating`
  - `tile`: always white, for product photos
- **Change from the plan:** the light-mode sale colour is `#C2410C` instead of `#EA580C`, so white badge text passes WCAG AA contrast. In dark mode, sale badges use dark text on orange.
- `next-themes`: `defaultTheme="dark"`, `enableSystem={false}`, `disableTransitionOnChange`.
  - The theme is stored in `localStorage` and applied before the page paints. Checked: after a reload the choice persists and there's no flash.
- The theme toggle renders both icons and swaps them with the `dark:` variant, so the server HTML always matches the client.

### Fonts and metadata (`src/app/layout.tsx`)
- **Inter** (body, `--font-sans`) and **Oswald** (headings, `--font-heading`, used through the `font-heading` class) via `next/font/google`.
- h1–h3 use Oswald automatically. Uppercase is added per section title, not globally, so shadcn dialog and sheet titles aren't forced into capitals.
- Metadata: title template `%s | Healthy Street`, a default title and a description.
- Favicon: the Next.js `favicon.ico` was replaced by `src/app/icon.svg`, a lime square with two road stripes. The same mark appears in the logo.

### Layout components (`src/components/layout/`)
- **`logo.tsx`**: the mark plus the wordmark, "HEALTHY" in the text colour and "STREET" in the primary colour.
- **`header.tsx`**: sticky header with a translucent background.
  - Top row: mobile menu (below `lg`), logo, search (`md` and up), actions.
  - Below `md` the search gets its own row.
  - From `lg` up, the category bar appears underneath.
- **`category-nav.tsx`**: shadcn `navigation-menu` with a dropdown per group, plus "Brands" and "Sale".
  - Vitamins & Minerals opens a 3-column panel: the plain categories, Minerals and Vitamins.
  - That panel opens leftwards so it stays on screen at 1024px.
- **`mobile-nav.tsx`**: a hamburger button opens a `Sheet` with an accordion of the 7 groups and their nested children. Following a link closes the sheet.
  - shadcn's accordion underlines links by default; that is overridden here.
- **`search-form.tsx`**: a `next/form` that sends `q` to `/search`. It navigates on the client and also works without JavaScript.
- **`header-actions.tsx`**: theme toggle, wishlist (`/account/wishlist`), account (`/login` for now) and cart (`/cart`).
  - The cart badge takes a `cartCount` prop; Phase 5 will pass the real count.
- **`promo-strip.tsx`** and **`src/lib/banners.ts`**:
  - `getActiveBanners(placement)` uses `"use cache"`, `cacheLife("minutes")` and `cacheTag("banners")`, and filters by `active`/`startsAt`/`endsAt`.
  - The admin (Phase 9) should call `revalidateTag(BANNERS_TAG)` after editing banners.
  - The strip is rendered inside `<Suspense fallback={null}>`.
  - It renders nothing when `DATABASE_URL` isn't set, and also when the query fails (the error is logged), so a database problem can't break every page.
  - **Not yet tested against real data**, because Supabase isn't connected.
- **`footer.tsx`**: logo, Shop column (7 groups), Store column (Brands, Sale, About), Account column, and the disclaimer "Demo store, not a real shop".
- **`site-shell.tsx`**: the promo strip, header, `<main>` and footer, shared by the `(shop)` and `(account)` layouts.

### Routes (`src/app/`)
- Route groups:
  - `(shop)/layout.tsx` and `(account)/layout.tsx` use `SiteShell`.
  - `(admin)/layout.tsx` is a placeholder; the admin UI gets its own shell in Phase 9.
- The home page moved to `(shop)/page.tsx` and became an on-brand placeholder: a "Coming soon" badge, the title "Fuel your training" and two buttons.
- New `(shop)/about/page.tsx` so the footer's About link works.
- A `Toaster` (sonner) was added to the root layout.

### Design decisions
- **Navigation categories come from code, not the database.**
  - `prisma/category-map.ts` moved to **`src/lib/categories.ts`**, and the seed now imports it from there.
  - It also builds `CATEGORY_TREE`, with URLs like `/c/vitamins-minerals/minerals/zinc`.
  - Reason: categories aren't editable in the admin (the plan has no category management), so this map is already the source of truth. The header also works without a database and doesn't query the database on every page.
- **Extra shadcn components:** `navigation-menu` (desktop menu) and `accordion` (mobile menu).

### Checks run
- `npm run lint` ✅ · `npm run typecheck` ✅ · `npm run build` ✅ (`/`, `/about` and `/icon.svg` are prerendered as static) · `npm run catalog:check` ✅ (still 0 warnings after moving the category map)
- In the browser (Chrome DevTools):
  - dark and light screenshots
  - Vitamins & Minerals dropdown at 1280px and at about 1030px
  - mobile sheet and accordion at 375px
  - tablet at about 785px
  - no horizontal scroll
  - console clean
- One testing note: with touch emulation on, the DevTools tap fires two clicks, so accordion items open and immediately close. A normal click, and `element.click()`, work correctly, so this is a quirk of the test tool, not a bug in the app.

### Next steps
1. Connect Supabase, then migrate and seed (see the Phase 0/1 next steps above). The promo strip will then show "Free shipping on orders over €60".
2. Phase 3: the catalog (`/c/[...slug]`, `/brands`, `/p/[slug]`, `/search`). The nav links to those pages return 404 until then.
3. Commits: nothing is committed yet.

---

## 2026-10-21 16:38 (UTC+03:00): Phase 3 (catalog)

**Status:** All the Phase 3 code is written. Lint, typecheck and the build pass.

**Not tested with real data:** as agreed, the catalog was built **without a database**. The ✅ Check items in the to-do stay open until Supabase is connected and seeded.

What was verified without data:
- **Build:** it succeeds with no database. Database-backed pages are partial prerenders: static shell at build time, data per request.
- **In the browser:**
  - The home page renders the category tiles, and each product section shows its own "couldn't be loaded" box.
  - A catalog page shows the shop error page, with the header and footer still in place.
  - An unknown category path shows the 404 page.
- **Logic:** a one-off script of `node:assert` checks passed for filter parsing and URL building, promotion pricing, and the category lookups.

### Next.js 16 rules that shaped this phase
- **Database reads happen at request time, not at build time.** Reasoning:
  - Anything cached with `"use cache"` is filled during the build.
  - With no database, a cached query would break the build.
  - So for now no catalog query is cached, and every database read runs inside a Suspense boundary.
  - Pages that read `params`/`searchParams` (category, brand, product, search) use `loading.tsx` as that boundary.
  - Pages without params (home, `/brands`) call `await connection()` before querying, inside `<Suspense>`.
  - Caching can be added once the database is connected (Phase 10).
- **`error.tsx` changes:** it now receives `retry()` (not `reset()`), and `error` is `unknown`.
- **`catchError` from `next/error`** gives component-level error boundaries; it's used for `SectionErrorBoundary`.
- **404 status:** `notFound()` on a streamed page returns HTTP 200 (the status is already sent), but Next.js shows the not-found page and adds `<meta name="robots" content="noindex">`. Unknown URLs that match no route still return a real 404.

### Data layer (`src/lib/`)
- **`format.ts`**: `formatPrice(cents)` → "€12.26".
- **`pricing.ts`**: pure functions with no database access.
  - `getEffectivePrice(product, promotions)` returns `{ priceCents, originalCents, percentOff, promotionId }`.
  - The best promotion wins; promotions don't stack.
  - A promotion matches by brand, by product, or by category.
- **`filters.ts`** (usable in the browser too): parses and serialises filters.
  - Zod parsing that **never throws**: invalid values are dropped, and min/max are swapped if reversed.
  - URL format: `?brand=a,b&form=powder&size=large&minPrice=10&maxPrice=50&rating=4&sale=1&inStock=1&sort=price-asc&page=2`. Defaults are left out of the URL.
  - Any filter change resets to page 1.
  - Also holds the labels for sort, form and pack size.
- **`catalog.ts`** (`server-only`): all catalog queries.
  - `getActivePromotions()`: a category promotion is expanded to the whole subtree, so "Pre-Workout −20%" also covers "NO Boosters".
  - `buildProductWhere(scope, filters, promotions, skip?)`. The *scope* is what the page is about (category subtree, brand or search). `skip` leaves one filter out for facet counts, so the brand counts show what picking another brand would give.
  - `getProducts`: 24 per page; a page number past the end shows the last page; `id` as the final sort key keeps paging stable.
  - `getFacets`: brand and form counts via `groupBy`, 3 counts for pack sizes, and the price min/max for the slider.
  - Home, product and brand queries: `getFeaturedProducts`, `getBestSellers`, `getProductBySlug` (deduplicated with React `cache`, because both `generateMetadata` and the page call it), `getRelatedProducts`, `getRatingDistribution`, `getBrandsWithCounts`, `getBrand`.
- **`categories.ts`**: new `findCategoryByPath`, `getCategoryTrail`, `getSubtreeSlugs` and `getCategory`.
  - Top-level groups now have an `image`, a product photo for the home tiles.
  - The seed writes it to `Category.image`.
- **Search:** every word must appear in the product name or the brand name, case-insensitive.
- **Pack size buckets** (`size` filter): weight and count packs use separate limits.

  | Bucket | Weight (g, ml) | Count (capsules, tablets…) |
  |---|---|---|
  | Small | ≤ 300 | ≤ 60 |
  | Medium | 301–1000 | 61–120 |
  | Large | > 1000 | > 120 |

- **Known limitation:** the price filter and the price sort use the **regular** price. Sale prices are calculated in code and aren't stored in the database.

### Components
- **`components/product/`**
  - **`ProductCard`**:
    - White image tile; −X% and "Out of stock" badges.
    - The name link stretches over the whole card, so the card is one click target. The brand link and the heart sit above it.
    - "Add to cart" is revealed on hover only on devices with a mouse (`@media (hover: hover)`); on touch screens it's always visible.
  - **`PriceTag`**: the sale price in orange with the struck-through regular price.
  - **`RatingStars`**: a filled row clipped to the exact rating, e.g. 4.3 stars.
  - **`ProductGrid`** (2/3/4 columns, first row loads with `priority`) and **`ProductGridSkeleton`**.
  - **`ProductPurchase`**: quantity stepper, at most 10 or the stock.
  - **`ProductReviews`**: average, a 5→1 breakdown bar, and the latest 20 reviews.
  - `AddToCartButton` and `WishlistButton` are **placeholders**; they show a toast until Phases 5 and 7.
- **`components/catalog/`**
  - `ProductListing`: the shared layout for category, brand and search pages.
  - `FilterControls` (client): brand search, "show all" and counts; price slider and inputs; form; pack size; rating; on sale; in stock.
    - The controls dim while the new results load (`useTransition`).
    - Options with 0 results are disabled unless already selected.
  - `CategoryFilter`: all 7 groups, with the current group expanded.
  - `MobileFilters`: the same sidebar in a bottom sheet, with a "Show N products" button.
  - `ActiveFilters`: removable chips plus "Clear all".
  - `SortSelect`.
  - `ListingPagination`: built on `next/link` with a page window like 1 … 4 5 6 … 18. The shadcn pagination uses plain `<a>` tags, which would reload the page.
  - `PageBreadcrumb` and `ListingSkeleton`.
- **`components/home/category-tiles.tsx`**: 7 tiles with product photos. They're static, so they don't need the database.
- **`section-error-boundary.tsx`** (`catchError`), **`not-found-content.tsx`** and **`error-content.tsx`** (shows the error digest so it can be matched in the server logs).

### Pages (`src/app/`)
- `(shop)/c/[...slug]`: the category listing. An invalid path such as `/c/protein/zinc` gives a 404.
- `(shop)/brands`: A–Z with letter anchors and product counts; featured brands in bold.
- `(shop)/brands/[slug]`: the listing without the brand filter.
- `(shop)/p/[slug]`: the product page:
  - image, brand, rating (links to the reviews), pack and form, price with "You save …", stock status ("Only N left" at 10 or fewer)
  - quantity and "Add to cart", wishlist, description, reviews, related products
  - Product JSON-LD (structured data for search engines)
- `(shop)/search`: results for `?q=`, or a search box when `q` is empty. Marked `noindex`.
- Home: placeholder hero, category tiles, Featured, and Best sellers. Each product section has its own Suspense and error boundary.
- `loading.tsx` for the category, brand, product and search pages.
- 404 and error pages:
  - `not-found.tsx` at the root (with the site shell, for URLs that match no route) and in `(shop)` (for `notFound()` calls).
  - `error.tsx` at the root and in `(shop)`.

### Other changes
- New dependencies: `zod`, `server-only`.
- `.prettierignore` now includes `src/components/ui`, so formatting doesn't rewrite the shadcn-generated files. A reformat of those files was reverted.

### Next steps
1. **Connect Supabase**, then migrate, seed and run the Phase 3 ✅ Check in the browser:
   - real product cards
   - filters together with their counts
   - pagination
   - the product page
   - search
2. Commit: `feat(catalog): listings, filters, product page and search`.
3. Phase 4: authentication.
