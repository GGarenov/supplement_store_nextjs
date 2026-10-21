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
