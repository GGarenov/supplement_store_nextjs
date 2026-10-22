# Work Log

What was done on Healthy Street, when, and why. The **Overview** below is the current state, kept up to date. The **Entries** further down are the history, oldest first; they describe each phase as it was at the time.

Related docs: [plan.md](plan.md) (what we're building) · [to-do.md](to-do.md) (task checklist).
All times are UTC+03:00.

---

## Overview

*Last updated: 2026-10-22 09:45*

### Status by phase

| Phase | Status | Commit |
|---|---|---|
| 0. Project setup | ✅ Done; Supabase connected | `0357135` |
| 1. Data model and seeding | ✅ Migrated and seeded · ⚠ the database still holds the rebuilt catalog: **re-seed needed** | `0357135` + `f3a52ae` (migration) |
| 2. Layout and design system | ✅ Done and checked in the browser | `da00e29` + `f5672f8` |
| 3. Catalog | ✅ Checked in the browser with real data | `5358fc5` + `f3a52ae` (fixes) |
| 4. Authentication | ✅ Register, log in, log out and redirects checked · ⏳ admin login not tried | `c5d25d9` + `f3a52ae` (fix) |
| 5. Cart | ⬜ Next | |
| 6–11 | ⬜ Not started | |

**In short:** the store runs against the Supabase database. Phases 0–4 are checked in the browser. The **original** catalog data (`images/`) is back in the repo and replaces the version rebuilt from the photos. The database gets it with the next `npm run db:seed`.

### Still open

1. **Re-seed with the original catalog.** On the computer that has `.env`:
   - `git pull`, then `npm run db:seed`
   - Check:
     - names and prices match the original data (e.g. "BCAA Instant Powder" by OstroVit, €26.05)
     - `/brands` has 94 brands
     - the 5 products listed in two folders show up in both categories
   - The seed now replaces each product's categories and removes brands left without products (see the 2026-10-22 09:45 entry).
2. **Admin login:** log in as `admin@healthystreet.test` with the `SEED_ADMIN_PASSWORD` from `.env`, and check that `/admin` opens.
3. **Optional: Google OAuth.** Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` (redirect URI `http://localhost:3000/api/auth/callback/google`); the Google button then appears.

### Tech stack and versions

| Area | Choice | Notes |
|---|---|---|
| Runtime | Node.js 26.2 | |
| Framework | **Next.js 16.4.2** (App Router, Cache Components on) + React 19.3 | Breaking changes vs. older guides; see the bundled docs in `node_modules/next/dist/docs/` |
| Language | TypeScript 5 | |
| Styling | Tailwind CSS v4 + **shadcn/ui** (Radix base, Nova preset) | `src/components/ui` is generated: don't hand-format it |
| Theme | `next-themes`, dark by default | Palette from plan §6 |
| Database | PostgreSQL on **Supabase** (free plan, region eu-west-1) | Free projects pause after 7 days without activity: "Restore project" in the dashboard |
| ORM | **Prisma 7.10.1** (pinned) | npm's `latest` for the CLI is an 8.0 RC. Don't upgrade yet |
| Auth | **Auth.js v5** `5.0.0-beta.32` (pinned) | JWT sessions, Credentials + optional Google |
| Validation and forms | Zod 4, react-hook-form 7, `@hookform/resolvers` 5 | resolvers v6 doesn't install (peer conflict) |
| Payments | Stripe (test mode) | Phase 6 |

### Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build. Works without a database |
| `npm run lint` · `npm run typecheck` · `npm run format` | Code checks and formatting |
| `npm run catalog:check` | Validates `images/**/products.json` and copies images to `public/products/` (no database needed) |
| `npm run db:migrate` · `npm run db:seed` · `npm run db:studio` | Database: migrations, seed data, browser UI (need `.env`) |

### Key decisions

| Decision | Why | Entry |
|---|---|---|
| Supabase instead of local Docker/Postgres | The owner's choice; nothing is installed locally | Phase 0–1 |
| Prisma pinned to 7.10.1 | The npm `latest` tag for the CLI points to an 8.0 release candidate | Phase 0–1 |
| Category tree lives in code (`src/lib/categories.ts`), not the database | Categories aren't editable in the admin; the nav works without a database | Phase 2 |
| Database reads at request time, nothing cached yet | `"use cache"` fills caches during the build, and there's no database at build time | Phase 3 |
| Filters live in the URL (`?brand=…&sort=…`) | Shareable links; the back button works | Phase 3 |
| Pricing is a pure function, and the best promotion wins | Same price everywhere (cards, cart, checkout); easy to unit-test | Phase 3 |
| `src/proxy.ts` plus page-level guards | Next 16 renamed Middleware to Proxy; the proxy is only an early check | Phase 4 |
| JWT sessions | Required by the Credentials provider | Phase 4 |
| Google login only when configured | No broken button without credentials | Phase 4 |
| `images/` (the source catalog) is committed, and it's the **original** data | It used to be gitignored, so a second computer had no source data and had to rebuild it from the photos. The original was then found on the first computer and restored | Supabase, Images restored |
| `await connection()` before every database or session read | Prisma and Auth.js call `Date.now()`/`crypto.getRandomValues()`, which Next 16 rejects while prerendering | Supabase |

### Known issues and limitations

- **Until the next seed, the database holds the rebuilt catalog** (names read from the photos, invented prices). The repo has the original again; see "Still open".
- **`images/` is committed:** the original `products.json` files and their images (≈ 9.4 MB). The photos are stored twice in the repo (here and in `public/products/`), which is accepted so a fresh clone can run `npm run db:seed`.

- **Price filter and sort use the regular price,** not the sale price, because sale prices are calculated in code.
- **A role change applies after the user's next login,** because the role is copied into the JWT at sign-in.
- **`notFound()` on streamed pages returns HTTP 200** with a `noindex` tag. URLs that match no route return a real 404.
- **`npm audit`: 5 high-severity issues,** all from the `shadcn` package's CLI. They're not used at runtime. Don't run `npm audit fix --force`, which would downgrade shadcn to 1.0.0.
- **"Add to cart" and "Wishlist" are placeholders** that show a toast, until Phases 5 and 7.

### Testing notes (Chrome DevTools)

- With **touch emulation** on, a tap fires two clicks, so accordions open and close at once. Use a normal click instead. This is a quirk of the tool, not an app bug.
- **Full-page screenshots** can look cut off on the right. Check `scrollWidth` instead; there was no real overflow.
- If DevTools reports "browser is already running", its own Chrome (profile `ClaudeCodeChromeProfile`) lost the connection. Close only that profile's processes; your normal Chrome isn't affected.
- **After changing `DATABASE_URL`, restart `npm run dev`.** The Prisma client is kept on `globalThis` across hot reloads, so it keeps the old connection string, and every query fails until a restart.
- The test account `test.buyer@healthystreet.test` / `testpass123` was created through the register form.

### Git history

| Commit | Time | Message | Note |
|---|---|---|---|
| *(this entry)* | 10-22 | chore(images): restore the original catalog data | Replaces the rebuilt `images/`; seed fixes |
| `1b3b9aa` | 10-21 22:18 | images | Second computer: commits the **rebuilt** `images/`, un-ignores it |
| `f3a52ae` | 10-21 22:16 | Phase 4 and supabase integration completed. | Second computer: migration, `connection()` fixes, rating stars |
| `f2f0467` | 10-21 17:48 | docs: add overview to the work log | |
| `c5d25d9` | 10-21 17:04 | feat(auth): credentials and OAuth login with roles | Phase 4 · pushed |
| `5358fc5` | 10-21 16:41 | feat(catalog): listings, filters, product page and search | Phase 3 · pushed |
| `f5672f8` | 10-21 15:11 | feat(ui): theme, fonts and main layout | The rest of Phase 2 · pushed |
| `da00e29` | 10-21 15:03 | The layout and the design system are implemented. | Only contains the move of the home page; the other Phase 2 files were still uncommitted, so they went into `f5672f8` |
| `0357135` | 10-21 14:30 | Project setup is done | Phases 0 and 1 |
| `4c6bf65` | 10-21 12:15 | all the items were removed | Before this log |
| `cea8e58` | 08-27 22:34 | Add global styles, layout, and initial page structure | Before this log |

---

## Entries

1. [2026-10-21 14:24 · Phase 0 and Phase 1](#2026-10-21-1424-utc0300-phase-0-and-phase-1)
2. [2026-10-21 14:47 · Phase 2 (layout and design system)](#2026-10-21-1447-utc0300-phase-2-layout-and-design-system)
3. [2026-10-21 16:38 · Phase 3 (catalog)](#2026-10-21-1638-utc0300-phase-3-catalog)
4. [2026-10-21 17:02 · Phase 4 (authentication)](#2026-10-21-1702-utc0300-phase-4-authentication)
5. [2026-10-21 21:00 · Supabase connected, catalog rebuilt, Phase 3–4 checks](#2026-10-21-2100-utc0300-supabase-connected-catalog-rebuilt-phase-34-checks)
6. [2026-10-22 09:45 · Original images restored](#2026-10-22-0945-utc0300-original-images-restored)

---

## 2026-10-21 14:24 (UTC+03:00): Phase 0 and Phase 1

**Status:** All the code for Phase 0 and Phase 1 is written. Lint, typecheck and the build pass.

**Commit:** `0357135` "Project setup is done".

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

**Category map (`prisma/category-map.ts`, moved to `src/lib/categories.ts` in Phase 2)**
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
4. ~~Make the commits listed in the to-do.~~ Done: `0357135`.
5. ~~Phase 2: layout and design system.~~ Done (next entry).

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

**Commits:** `da00e29` (only the home page move) and `f5672f8` "feat(ui): theme, fonts and main layout" (everything else).

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
2. ~~Phase 3: the catalog (`/c/[...slug]`, `/brands`, `/p/[slug]`, `/search`).~~ Done (next entry).
3. ~~Commit.~~ Done: `da00e29` + `f5672f8`.

---

## 2026-10-21 16:38 (UTC+03:00): Phase 3 (catalog)

**Status:** All the Phase 3 code is written. Lint, typecheck and the build pass.

**Commit:** `5358fc5` "feat(catalog): listings, filters, product page and search" (pushed).

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
2. ~~Commit.~~ Done: `5358fc5`.
3. ~~Phase 4: authentication.~~ Done (next entry).

---

## 2026-10-21 17:02 (UTC+03:00): Phase 4 (authentication)

**Status:** All the Phase 4 code is written. Lint, typecheck and the build pass, and the build log is free of errors.

**Commit:** `c5d25d9` "feat(auth): credentials and OAuth login with roles" (pushed).

**Not tested yet:** an actual login. As agreed, there's still **no database**, and there's no `.env` (so no `AUTH_SECRET`). The Phase 4 ✅ Check stays open until then.

What was verified, with the dev server running on a temporary `AUTH_SECRET` passed as a process variable (not saved anywhere):
- `/account`, `/account/orders` and `/admin` redirect logged-out users to `/login?callbackUrl=…` (307, from the proxy).
- `/api/auth/providers` lists only `credentials`, because Google isn't configured.
- **Login form:**
  - Submitting it empty shows field errors from the client-side Zod check.
  - A valid submit shows "Signing in…" and then "Something went wrong. Please try again.", because the database is unreachable. That's the generic error on purpose: it doesn't claim the password was wrong.
- **Register form:** "Name must be at least 2 characters" and "Passwords don't match" appear under the right fields.
- The `callbackUrl` survives the trip: the "Create an account" link on `/login?callbackUrl=…/account` points to `/register?callbackUrl=/account`.
- The browser console stays clean.

### Next.js 16 and Auth.js details
- **Middleware is now called Proxy** in Next.js 16, so the file is `src/proxy.ts` (`export { auth as proxy }`, matcher `/account/:path*`, `/admin/:path*`). Proxy runs on the Node.js runtime.
- **The session read must be inside `<Suspense>`.**
  - Reading `cookies()`/`headers()` (which `auth()` does) outside a boundary is a build error with Cache Components.
  - The header's account menu, the login/register content and the placeholder account/admin pages all read the session behind a boundary. The rest of the page stays in the static shell.
- **`unstable_rethrow`:**
  - During prerendering, `headers()` returns a promise that rejects when the prerender ends. That's how Next.js marks the part as dynamic.
  - The `try/catch` in `AccountMenu` was catching it and logging it as an error (`HANGING_PROMISE_REJECTION` in the build log).
  - Fixed by calling `unstable_rethrow(error)` first in the `catch`.
- **Auth.js v5 beta:** pinned to `next-auth@5.0.0-beta.32`, which supports Next 16. Two things needed care:
  - Its JWT type lives in `@auth/core/jwt`, so the type extension targets that module (`src/types/next-auth.d.ts`).
  - The Prisma adapter's types expect the classic `@prisma/client`. Our generated client is passed with a cast; at runtime it's the same API.
- **`@hookform/resolvers` v5** instead of v6: v6 fails to install (an `ERESOLVE` conflict between its optional peers and the `effect` version Prisma installs). v5.9 supports Zod 4.

### Files
- **`src/lib/auth.ts`**: the Auth.js configuration.
  - JWT sessions, which the Credentials provider requires. The Prisma adapter stores OAuth users and accounts.
  - **Credentials:** Zod check → look up the user → `bcrypt.compare`. Users without a password (Google-only) can't use it.
  - **Google:** added only if `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set. `allowDangerousEmailAccountLinking` lets a Google login join an existing account with the same email; that's safe because Google verifies emails.
  - **Callbacks:**
    - `jwt`/`session` put `id` and `role` into the session.
    - The role is copied at sign-in, so a role change applies after the next login.
    - `authorized` sends guests to `/login` and non-admins away from `/admin` (to `/`).
  - `pages.signIn = "/login"`.
- **`src/lib/auth-guards.ts`**: `getCurrentUser()`, `requireUser(returnTo)` (redirects to `/login?callbackUrl=…`) and `requireAdmin()` (returns a 404 for non-admins, so the admin area isn't advertised). These are the real checks; the proxy is only a first line.
- **`src/lib/validators/auth.ts`**:
  - `loginSchema` and `registerSchema`, shared by the forms and the server.
    - Email: trimmed and lowercased.
    - Password: 8–72 characters (bcrypt ignores everything after 72 bytes).
    - Name: 2–50 characters.
    - Confirm password must match.
  - **`safeCallbackUrl`**: keeps redirects inside the site.
    - Auth.js passes absolute URLs, so only the path is kept: `https://evil.com/x` becomes `/x` here.
    - `//evil.com`, `/\evil.com` and `javascript:` fall back to `/`.
    - Checked with a one-off assert script.
- **`src/actions/auth.ts`** (Server Actions):
  - `loginUser`: generic errors that never say which field was wrong.
  - `registerUser`:
    - errors are shown per field
    - "email already exists" is checked first, and a duplicate that slips through at the same moment is still caught via `P2002`
    - password hashed with bcrypt (cost 10)
    - the user is signed in automatically afterwards
  - `signInWithGoogle` and `signOutUser`.
  - `signIn` redirects by throwing, so the success redirect is always rethrown and never caught.
- **`src/app/api/auth/[...nextauth]/route.ts`**: the Auth.js route handlers.
- **Pages:**
  - `(shop)/login` and `(shop)/register`:
    - the card, the Google button (only if enabled) with an "or" divider, the form, and a link to the other page that keeps `callbackUrl`
    - a logged-in user who opens them is redirected to `callbackUrl`
    - `/login` shows Auth.js errors from `?error=`, e.g. `OAuthAccountNotLinked`
  - **Placeholders:**
    - `(account)/account`: name, email, role, Sign out
    - `(admin)/admin`: behind `requireAdmin()`
    - Phases 7 and 9 replace them.
- **Components:**
  - `components/auth/`: `LoginForm`, `RegisterForm` (errors the server finds, such as "email taken", appear under their fields), `FormField` (react-hook-form `Controller` + shadcn `Field`), `GoogleButton` (a plain form posting to a Server Action, so it works without JavaScript), and `AuthCard`/`OrDivider`/`AuthFormSkeleton`.
  - `components/layout/account-dropdown.tsx`: avatar with initials; links to My account, Orders, Wishlist and Admin (admins only); Sign out.
  - `header-actions.tsx`:
    - the account menu streams in inside `<Suspense>`, with the sign-in icon as fallback
    - if reading the session fails, it logs the error and shows the sign-in icon, because the header sits above the error pages and would otherwise break every page

### New dependencies
`next-auth@5.0.0-beta.32` (exact), `@auth/prisma-adapter`, `react-hook-form`, `@hookform/resolvers@5`.

### Next steps
1. With Supabase:
   - create `.env` (`DATABASE_URL`, `DIRECT_URL`, `SEED_ADMIN_PASSWORD`, plus `AUTH_SECRET` via `npx auth secret`)
   - migrate and seed
   - run the Phase 3 and Phase 4 ✅ Checks
2. Optional: create Google OAuth credentials (redirect URI `http://localhost:3000/api/auth/callback/google`) and set `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` to enable the Google button.
3. ~~Commit.~~ Done: `c5d25d9`.
4. Phase 5: the cart. Its guest-cart merge runs right after login.

---

## 2026-10-21 21:00 (UTC+03:00): Supabase connected, catalog rebuilt, Phase 3–4 checks

**Status:** The app runs against Supabase with real data. The Phase 0, 1, 3 and 4 checks pass in the browser, except the admin login (not tried) and Google OAuth (optional, not configured). Lint and typecheck pass.

**Commit:** `f3a52ae` "Phase 4 and supabase integration completed." (the migration, the fixes and these docs), then `1b3b9aa` "images" (the rebuilt `images/`). Both pushed from the second computer.

### Supabase
- Free project in **eu-west-1**. `.env` was created from `.env.example`. `AUTH_SECRET` was generated with Node's `crypto.randomBytes(32)` (same result as `npx auth secret`).
- Two problems with the connection strings, both fixed:
  - The password was still wrapped in the `[ ]` from Supabase's `[YOUR-PASSWORD]` template, so authentication failed.
  - Characters such as `@ , $ ]` in a password break the URL. They have to be URL-encoded, or the password must use only letters and digits. The owner then reset it to letters and digits.
- Both connections were checked: `DIRECT_URL` (port 5432) with `prisma db execute`, and the pooled `DATABASE_URL` (port 6543) with `pg`.
- `npm run db:migrate -- --name init` created `prisma/migrations/20261021172016_init`.

### Catalog rebuilt from the product photos
- **`images/` was missing.** The raw source folder (all the `products.json` files) was gone and couldn't be found anywhere on drive D. It was gitignored, so git couldn't restore it either. Only the 428 photos in `public/products/` were left.
- With the owner's agreement, the catalog was **rebuilt from the photos**: six agents opened every image and read the brand, name and pack from the label.
  - The output uses the original JSON format (`id, brand, brandSlug, name, pack, price, image, url`), with the pack written in Bulgarian so the existing parser reads it.
  - Each product went into the leaf folder that fits it, and its image was copied next to the JSON, as before.
  - The original ids (the file names) were kept, so the image paths didn't change.
- Result: 428 products, 95 brands, 0 parser warnings (`npm run catalog:check`).
- **Differences from the original data:**
  - **Prices are invented** but realistic, within €0.54–199.95.
  - About **40 pack sizes were guessed**, because the label doesn't show them.
  - A few brands were unreadable and are stored as "Unknown".
  - Each product is in **one category**; none are in two any more.
  - The category sizes differ from the original (e.g. NO Boosters has 1 product, Stim-Free NO Boosters 32).
- The temporary files are in the session scratchpad and not in the repo.

### Seed
- The first run stopped partway (after categories and users) because of the missing `images/`. The second run finished:
  - 31 categories, 95 brands, 428 products
  - 6 users; up to 150 reviews on 121 products
  - 6 banners, 2 promotions
- Re-running it was safe, as designed: nothing was duplicated.

### Fixes found with real data
- **Stale Prisma client in `next dev`.** The dev server was started before `.env` was right. The Prisma client lives on `globalThis` and survives hot reloads, so it kept the old connection string and every page showed "Something went wrong". Restarting `npm run dev` fixed it; the testing notes now mention it.
- **`crypto.getRandomValues()` / `Date.now()` while prerendering** (dev console error on every page):
  - The source was Auth.js inside `auth()`. It calls `crypto.getRandomValues()` after reading the cookie, and Next 16 still flags that even inside `<Suspense>`. This was found by switching parts of the header off one at a time.
  - Fix: `getCurrentUser()` in `src/lib/auth-guards.ts` now calls `await connection()` first.
  - Same for the database. Every exported query in `src/lib/catalog.ts` now calls `await connection()` before touching Prisma, as the Next 16 `connection()` docs recommend for database drivers. The Prisma driver used `Date.now()` in the same way.
- **Rating stars were never filled.** Lucide sets `fill="none"` on each `<svg>`, which beats a `fill` inherited from the wrapper. `RatingStars` now puts the fill on the svgs (`[&_svg]:fill-current`). Partial ratings such as 4.5 show correctly.

### Checks run
- **Catalog:**
  - every group page lists products; parent pages include their children (`/c/vitamins-minerals` has a full page of 24)
  - an invalid path (`/c/protein/zinc`) and unknown slugs show the 404 page with `noindex`
  - combined filters (`/c/pre-workout?brand=kevin-levrone,ostrovit&form=powder&minPrice=10&maxPrice=60&sort=price-asc`) give 4 results with chips, all at −20% from the Pre-Workout promotion
  - page 2 of Weight Loss sorted by price works
  - `/brands` lists 95 brands
  - the product page shows the price with "You save", stock, description, reviews and 8 related products
  - search: "creatine" gives 19 results, "ostrovit" a full page, nonsense gives the empty state
  - the promo strip shows "Free shipping on orders over €60"
- **Auth:**
  - a logged-out visit to `/account/orders` goes to `/login?callbackUrl=…`
  - registering returns to the callback URL; `/account/orders` itself is a 404 until Phase 7
  - a wrong password shows "Invalid email or password."; the right one returns to `/account`
  - sign-out works
  - a normal user who opens `/admin` is sent to `/`
- `npm run lint` ✅ · `npm run typecheck` ✅ · Prettier ✅ on the changed files (with `--end-of-line auto`; the working tree uses CRLF through `core.autocrlf`)
- `/sale` is a 404, which is expected: it's built in Phase 8.

### Next steps
1. Log in as the admin and open `/admin`.
2. ~~Commit.~~ Done: `f3a52ae` + `1b3b9aa`.
3. Phase 5: the cart.

---

## 2026-10-22 09:45 (UTC+03:00): Original images restored

**Status:** The repo has the **original** catalog data again. The `images/` that the second computer rebuilt from the photos has been replaced. Lint, typecheck, the build and `npm run catalog:check` pass.

**Not done here:** re-seeding the database. This computer has no `.env`. Run `npm run db:seed` on the computer that has it (see "Still open" in the Overview).

### What happened
- `images/` was gitignored, so it existed only on the first computer.
- On the second computer it was missing, so the catalog was **rebuilt from the photos** (entry 21:00). That version was committed as `1b3b9aa` and seeded into Supabase.
- The first computer still had the **original** folder. The owner asked to keep that one in GitHub and drop the rebuilt one.

### Comparing the two versions
| | Original (this computer) | Rebuilt (second computer) |
|---|---|---|
| Products | 428 (433 entries; 5 products in two folders) | 428, each in exactly one folder |
| Product ids | the same 428 | the same 428 |
| Photos | the same 428 files, byte for byte (SHA-1 checked) | the same, renamed to `<id>.webp` |
| Image file names | `<brandSlug>_<id>.webp` | `<id>.webp` |
| Names, brands, prices, packs | from the source shop | read from the labels; **prices invented** |
| `url` | the source product page | empty |

Every one of the 428 products had at least one different field, for example:
- 714: "Modern BCAA Plus", USP Labs, €35.28 → "Modern BCAA+", USPlabs, €39.90
- 2761: Scivation "Xtend BCAAs…" → brand "Xtend"
- 29677: listed under EAA → under BCAA

So "merging" meant: keep the second computer's **code** and take this computer's **data**. Nothing from the rebuilt data was worth keeping, because the photos are identical and the original metadata is the real one.

### Steps
1. Backed up the original `images/` to the session scratchpad (455 files).
2. Moved it out of the repo, because `git pull` won't overwrite untracked files at the same paths (`products.json` exists in both).
3. `git pull --ff-only`: fast-forwarded to `1b3b9aa`. This brought in the migration, the `connection()` fixes, the rating-star fix and the docs.
4. `git rm -r images`, put the original folder back, then `git add images`.
   - Git records the 428 photos as **renames** (same content, new name), so the history doesn't store them twice.
   - The 22 `products.json` files are modified, and 5 image files were added (the products that are in two folders).
5. `npm run catalog:check`: 433 entries → 428 products, 94 brands, 31 categories, 5 products in two categories, 0 warnings.
   - `public/products/` is unchanged (the same 428 images), so the site's images are untouched.

### Seed changes (`prisma/seed.ts`)
The database was seeded with the rebuilt data. Re-seeding with the original data has to **replace** it, not mix the two:
- **Categories:**
  - On update, a product's categories are now **`set`** to the list from the source data.
  - Before, `connect` only added links, so a product moved from EAA to BCAA would have stayed in both.
  - On create it's still `connect`, because Prisma doesn't allow `set` in a create.
- **Description:**
  - It's now updated together with the name and brand it's built from.
  - Before, it stayed on the rebuilt text, e.g. "Original BCAA by Xtend".
  - Stock and sales are still written on create only.
- **Leftover brands:**
  - After the products, brands with no products and no promotions are deleted, e.g. "Xtend" and "USPlabs" from the rebuilt data.
  - Brands a promotion points to are kept, because deleting a brand would also delete its promotions (cascade).
- Product ids, users, reviews, banners and promotions aren't affected:
  - products are upserted by `sourceId`, which is the same in both versions
  - existing reviews stay on the same products
  - slugs change to the original ones (e.g. `ostrovit-bcaa-instant-powder-20848`), so old product links from the rebuilt data return 404

### Checks run
- `npm run catalog:check` ✅ (0 warnings) · `npm run lint` ✅ · `npm run typecheck` ✅ · `npm run build` ✅
- Prettier ✅ on `prisma/seed.ts`, using `--end-of-line auto` because the working tree uses CRLF.

### Next steps
1. On the computer with `.env`: `git pull`, `npm run db:seed`, then the checks in "Still open".
2. Log in as the admin and open `/admin`.
3. Phase 5: the cart.
