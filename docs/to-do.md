# Healthy Street: To-Do

This is a step-by-step task list for building the store described in [plan.md](plan.md).
- Work through the phases **in order**, because each one builds on the previous one.
- Tick a box (`- [x]`) when a task is done.
- Each phase ends with a **✅ Check** list. Don't move on to the next phase until everything in it passes.
- References like "(plan §4)" point to sections of `plan.md`.

---

## Start here

### Prerequisites (install / create once)
- [x] **Node.js** LTS (v20 or newer): check with `node -v`
- [x] **Git**: check with `git --version`
- [x] **PostgreSQL**: a free **Supabase** project (https://supabase.com). We decided on Supabase instead of Docker or Neon.
- [ ] **Stripe** account in **test mode** (https://dashboard.stripe.com/test)
- [ ] **Stripe CLI** (https://docs.stripe.com/stripe-cli), then run `stripe login`
- [ ] Google Cloud OAuth client **or** GitHub OAuth app, for social login (you need it in Phase 4)
- [ ] VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma

### Defaults for the plan's open questions (plan §9)
Use these defaults unless the project owner decides otherwise:
- **Shipping:** a flat **€4.99**, free on orders of **€60 or more**
- **Login required** to check out (no guest checkout)
- **Stock is decremented when the order is paid**, in the webhook. It is not reserved when the order is created.

### Conventions
- **Money:** store it as integer **cents** (`priceCents`). Format it only in the UI, with `Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })`.
- **Server checks:** never trust prices, totals or roles sent from the client. Recompute and check them on the server.
- **Validation:** validate every Server Action input with **Zod**.
- **Components:** Server Components by default. Add `"use client"` only for interactive parts.
- **Commits:** use small commits with clear messages, e.g. `feat(cart): merge guest cart on login`.

---

## Phase 0: Project setup

### 0.1 Create the Next.js app
- [x] In the project root, run:
  ```bash
  npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
  > If it refuses because the folder is not empty (`images/`, `docs/`, `.gitignore`), scaffold into a temporary folder instead (`npx create-next-app@latest tmp-app …`). Move its contents to the root, delete `tmp-app`, and merge the two `.gitignore` files.
- [x] Run `npm run dev` and open http://localhost:3000. The default page should load.
- [x] Delete the boilerplate content from `src/app/page.tsx` and `globals.css`. Keep the Tailwind imports.

### 0.2 Tooling
- [x] Install Prettier and the Tailwind plugin:
  `npm i -D prettier prettier-plugin-tailwindcss`
- [x] Create `.prettierrc` with `{ "plugins": ["prettier-plugin-tailwindcss"] }`
- [x] Add these scripts to `package.json`:
  - `"typecheck": "tsc --noEmit"`
  - `"format": "prettier --write ."`
- [x] Update `.gitignore`:
  - [x] remove `/docs`, so the plan and this to-do list are committed
  - [x] keep `/images` ignored, because it is only raw source data
  - [x] decide whether to commit `public/products/` (recommended: **yes**, so a fresh clone works)
  - [x] make sure `.env*` is ignored, except `.env.example`

### 0.3 shadcn/ui
- [x] `npx shadcn@latest init` (choose the defaults and CSS variables)
- [x] Add the components you need:
  ```bash
  npx shadcn@latest add button card input label textarea sheet dialog dropdown-menu select slider checkbox badge carousel skeleton sonner table tabs separator avatar form pagination breadcrumb
  ```

### 0.4 Database and Prisma
- [x] Create a free **Supabase** project. Then, in Supabase, open **Connect → ORMs → Prisma** and copy:
  - the **pooled** connection string (port 6543) → `DATABASE_URL`, used by the app at runtime
  - the **direct/session** connection string (port 5432) → `DIRECT_URL`, used by migrations and the seed
- [x] Install Prisma:
  ```bash
  npm i @prisma/client
  npm i -D prisma tsx
  npx prisma init
  ```
- [x] Copy `.env.example` to `.env` and set `DATABASE_URL`, `DIRECT_URL` and `SEED_ADMIN_PASSWORD`.
- [x] Create `src/lib/db.ts` with a **Prisma client singleton**, so that hot reload doesn't open new connections.
- [x] Create `.env.example` listing every variable without its value:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_APP_URL`

### ✅ Check
- [x] `npm run dev`, `npm run lint` and `npm run typecheck` all pass.
- [x] The database is reachable: `npx prisma db pull` or `npx prisma studio` connects.
- [x] First commit: `chore: scaffold Next.js app with Tailwind, shadcn and Prisma`

---

## Phase 1: Data model and seeding (plan §2, §4)

### 1.1 Schema
- [x] Write `prisma/schema.prisma` with these models (follow plan §4):
  - [x] `User`, `Role`, plus the **Auth.js adapter models** (`Account`, `Session`, `VerificationToken`), copied from the Auth.js Prisma adapter docs
  - [x] `Brand`, `Category` (self-relation for the tree) and `Product` (many-to-many with `Category`)
  - [x] `ProductForm` and `PackUnit` enums
  - [x] `Cart`, `CartItem`
  - [x] `Order`, `OrderItem`, `OrderStatus`
  - [x] `WishlistItem`, `Review`
  - [x] `Banner`, `BannerPlacement`, `Promotion`
- [x] Add relations and `onDelete` rules:
  - `Cascade`: cart items, wishlist items and reviews when their user is deleted
  - `Restrict`: products that are referenced by orders
- [x] Add indexes: `Product.brandId`, `Product.priceCents`, `Product.createdAt`, `Review.productId`.
- [x] Run `npx prisma migrate dev --name init`.

### 1.2 Category map
- [x] Create `prisma/category-map.ts`. It describes the 7 top-level groups and the 22 leaf categories (plan §2), and for each one gives:
  - `slug`
  - `name`
  - `parentSlug`
  - `sortOrder`
  - `folder` (the path under `images/`, leaf categories only)
- [x] Use clean slugs: `whey-protein`, `bcaa`, `eaa`, `creatine-monohydrate`, `mass-gainers`, `fat-burners`, `stim-free-fat-burners`, `l-carnitine`, `pump-formulas`, `no-boosters`, `stim-free-no-boosters`, `mens-health`, `womens-health`, `kids-health`, `minerals`, `iron`, `magnesium`, `zinc`, `vitamins`, `vitamin-b`, `vitamin-c`, `vitamin-d`, and so on.

### 1.3 Pack parser
- [x] Create `prisma/lib/parse-pack.ts` that turns a raw string into `{ amount, unit, form, label }`.
- [x] Handle the Bulgarian units:

  | Raw (contains)            | unit       | form        | label example  |
  |---------------------------|------------|-------------|----------------|
  | `грама`                   | `GRAMS`    | `POWDER`    | `400 g`        |
  | `Гел капсули` (check first) | `SOFTGELS` | `SOFTGELS`  | `90 softgels`  |
  | `капсули`                 | `CAPSULES` | `CAPSULES`  | `60 capsules`  |
  | `Таблетки` / `таблетки`   | `TABLETS`  | `TABLETS`   | `100 tablets`  |
  | `мл`                      | `ML`       | `LIQUID`    | `500 ml`       |

- [x] List every distinct `pack` value:
  ```bash
  grep -h '"pack"' $(find images -name products.json) | sort | uniq -c
  ```
  Add a rule for every unit you see.
- [x] For a value it cannot parse, the parser should **log a warning** and fall back to `label = raw` and `form = OTHER`, instead of crashing.

### 1.4 Seed script
- [x] Create `prisma/seed.ts` and add the script `"db:seed": "prisma db seed"`. In Prisma 7 the seed command is registered in `prisma.config.ts` (`migrations.seed`), not in `package.json`.
- [x] **Categories:** upsert them from `category-map.ts`. Do parents first, then children.
- [x] **Products:** for each leaf folder, read `products.json`, then:
  - [x] upsert the `Brand` by `brandSlug`. Use the first `brand` name you see as its display name.
  - [x] parse `pack` and convert `price` to `priceCents` (`Math.round(parseFloat(price) * 100)`)
  - [x] build `slug` = `${brandSlug}-${slugify(name)}-${id}`
  - [x] upsert the `Product` by `sourceId`, and **connect** the category. Don't use `set`, so that the 5 products listed in two folders end up with **both** categories.
  - [x] copy the image to `public/products/<sourceId>.webp` and set `image = "/products/<sourceId>.webp"`
- [x] **Fake data:** install faker (`npm i -D @faker-js/faker`) and call `faker.seed(42)` so the output is the same every run. Then generate:
  - [x] `stock`: 0–150, with about 5% of products at 0
  - [x] `soldCount`
  - [x] a short `description`
  - [x] `featured`: about 12 products
  - [x] `Brand.featured`: about 8 of the biggest brands
  - [x] 1 **admin** user (`admin@healthystreet.test` / password from an environment variable, bcrypt-hashed) and 5 normal users
  - [x] about 150 reviews from the seed users. Then recompute `ratingAvg`/`ratingCount` for each product.
  - [x] 3 HERO banners, 1 STRIP banner and 2 INLINE banners (text only for now)
  - [ ] banner images in `public/banners/`: still to do, together with the banner design in Phase 8
  - [x] 2 active promotions, e.g. "−20% Pre-Workout" (category) and "−15% OstroVit" (brand)
- [x] Make the seed **idempotent**: running it twice must not create duplicates.

### ✅ Check
- [x] `npm run db:seed` finishes without errors and logs nothing unparsed (or only expected warnings).
- [x] In Prisma Studio:
  - [x] **428** products
  - [x] about **90** brands
  - [x] **29+** categories (7 groups + 22 leaves + the `minerals` and `vitamins` mid-levels)
  - [ ] 5 products with 2 categories: not any more. The rebuilt catalog puts each product in one category (see `work_log.md`, 2026-10-21 21:00)
- [x] `public/products/` contains 428 `.webp` files.
- [x] Commit: `feat(db): schema, category map and catalog seed`

---

## Phase 2: Layout and design system (plan §6)

### 2.1 Theme
- [x] `npm i next-themes`
- [x] Create `src/components/theme-provider.tsx` and wrap the app in `layout.tsx` with `attribute="class"`, `defaultTheme="dark"` and `enableSystem={false}`.
- [x] In `globals.css`, define the colour tokens from plan §6 as CSS variables for `:root` (light) and `.dark`, using shadcn's variable names (`--background`, `--card`, `--primary`, `--destructive`…).
- [x] Add custom tokens `--sale` (orange) and `--rating` (yellow), and register them in Tailwind.
- [x] Create `ThemeToggle` (sun and moon icons, a dropdown or a button).

### 2.2 Fonts and metadata
- [x] Load **Inter** (body) and **Oswald** or **Barlow Condensed** (headings) with `next/font/google`, and expose them as CSS variables.
- [x] Root `metadata`:
  - `title.template = "%s | Healthy Street"`
  - a description
  - a favicon

### 2.3 Layout components (`src/components/layout/`)
- [x] `Logo`: "HEALTHY" in the text colour and "STREET" in lime; links to `/`.
- [x] `PromoStrip`: reads the active STRIP banner from the database (a Server Component); hidden if there is none. Not yet tested against real data, because Supabase isn't connected.
- [x] `Header`:
  - [x] logo
  - [x] category navigation with a mega-menu that lists the 7 groups and their children. It's built from `src/lib/categories.ts` (the same map the seed uses), not loaded from the database, because categories aren't editable in the admin.
  - [x] search input (it submits to `/search?q=`)
  - [x] wishlist icon
  - [x] account icon (a dropdown when logged in): done in Phase 4
  - [x] cart icon with a count badge (the badge is ready; the real count is wired up in Phase 5)
  - [x] theme toggle
  - [x] it stays at the top on scroll (sticky)
- [x] `MobileNav`: a hamburger button that opens a `Sheet` with the category tree.
- [x] `Footer`: category links, "About", and a "Demo store, not a real shop" disclaimer.
- [x] Create route groups `src/app/(shop)/layout.tsx`, `(account)` and `(admin)`. Each layout can be a placeholder for now.
- [x] Add a `Toaster` (sonner) to the root layout.

### ✅ Check
- [x] Every page shares the header and footer, and the theme toggle switches dark/light without a flash.
- [x] Layout looks right at 375px, 768px and 1280px wide.
- [x] Commit: `feat(ui): theme, fonts and main layout`

---

## Phase 3: Catalog (plan §3.1)

### 3.1 Shared helpers
- [x] `src/lib/format.ts`: `formatPrice(cents)`.
- [x] `src/lib/pricing.ts`: `getActivePromotions()` and `getEffectivePrice(product, promotions)`. It returns `{ priceCents, originalCents, percentOff }`; when several promotions apply, the **best** one wins. Keep it a **pure function** so it is easy to unit-test later. Promotions only become visible in Phase 8, but write the function now so that prices are already computed through it.
- [x] `src/lib/catalog.ts`:
  - [x] `parseFilters(searchParams)` → a typed object, validated with Zod. Parameters:
    - `brand` (array)
    - `minPrice`
    - `maxPrice`
    - `form` (array)
    - `size`
    - `rating`
    - `sale`
    - `inStock`
    - `sort`
    - `page`
  - [x] `buildProductWhere(filters, categoryIds)` → a Prisma `where`
  - [x] `getCategoryWithDescendants(slugPath)`: a parent category includes all of its children's products
  - [x] `getProducts(filters)`: returns `{ items, total, pageCount }` with a page size of 24
  - [x] `getFacets(categoryIds, filters)`: counts per brand and form, and the price min/max. Use `groupBy`.

### 3.2 Product components (`src/components/product/`)
- [x] `PriceTag`: the current price, plus the struck-through original price and a "−X%" badge when it is on sale.
- [x] `RatingStars`: read-only stars with the count.
- [x] `ProductCard`:
  - [x] the image on a white rounded tile (`next/image` with `sizes`)
  - [x] brand, name (2-line clamp), pack label, rating, `PriceTag`
  - [x] "Out of stock" badge
  - [x] wishlist heart (a placeholder until Phase 7)
  - [x] "Add to cart" button (a placeholder until Phase 5)
- [x] `ProductGrid`: a responsive grid (2 columns on mobile, 3 on tablet, 4 on desktop).
- [x] `ProductGridSkeleton`.

### 3.3 Catalog components (`src/components/catalog/`)
- [x] `FilterSidebar` (Client Component). Every filter **updates the URL** with `router.replace` and resets `page`:
  - [x] category tree links
  - [x] brand checkboxes with a search box, a "show more" toggle and counts
  - [x] price slider with min/max inputs (debounced)
  - [x] form checkboxes with counts
  - [x] pack size options
  - [x] minimum rating
  - [x] "On sale" and "In stock" toggles
- [x] `ActiveFilters`: removable chips plus "Clear all".
- [x] `SortSelect`: Featured, Price ↑, Price ↓, Newest, Best rated, Best selling.
- [x] `Pagination`: uses shadcn pagination and keeps the other parameters in the URL.
- [x] `MobileFilters`: the `FilterSidebar` inside a bottom `Sheet`, opened by a "Filters (n)" button.

### 3.4 Pages
- [x] `/c/[...slug]/page.tsx`:
  - breadcrumb, title and product count
  - sidebar, sort, grid and pagination
  - `notFound()` for an unknown slug
  - `generateMetadata`
- [x] `/c/[...slug]/loading.tsx`: show the skeleton grid.
- [x] `/brands/page.tsx`: all brands A–Z with letter anchors and product counts.
- [x] `/brands/[slug]/page.tsx`: the same listing UI, filtered by brand.
- [x] `/p/[slug]/page.tsx`:
  - [x] image and details: brand link, name, pack, rating, `PriceTag`, stock status
  - [x] quantity picker and "Add to cart" (placeholder)
  - [x] wishlist button (placeholder)
  - [x] description
  - [x] reviews section (read-only list for now)
  - [x] "Related products": 8 products from the same category
  - [x] `generateMetadata`, plus Product JSON-LD (optional)
- [x] `/search/page.tsx`: case-insensitive `contains` on `name` and `brand.name`, with the same listing UI; show an empty state for no results.
- [x] Home page (`/`), first version: a "Shop by category" grid of the 7 groups, "Featured products" and "Best sellers". The hero comes in Phase 8.
- [x] `not-found.tsx` and `error.tsx` at the root and in `(shop)`.

**Where the code differs from the wording above** (details in `work_log.md`):
- Filter parsing and URL building are in **`src/lib/filters.ts`**, because the browser needs them too. Database queries are in `src/lib/catalog.ts` (server-only). `getActivePromotions()` is in `catalog.ts`; `pricing.ts` stays pure.
- `buildProductWhere` takes a **scope** (category slugs, brand or search text) instead of category ids. Category lookups use the static tree in `src/lib/categories.ts` (`findCategoryByPath`, `getSubtreeSlugs`).
- The filter sidebar is a Server Component (`CategoryFilter`) plus a Client Component (`FilterControls`). Filters use `router.push`, not `replace`, so the back button undoes the last filter.
- The price inputs apply on blur or Enter instead of being debounced (typing "25" doesn't search for "2"). The slider applies when released.
- Pagination is a custom component built on `next/link`, because the shadcn version renders plain `<a>` tags (full page reloads).

### ✅ Check
- [x] Every category page lists products, and parent pages include their children's products.
- [x] Combining brand, price and form filters gives correct results and counts. A filtered URL opened in a new tab shows the same results.
- [x] Sorting and pagination work and keep the filters.
- [x] The product page loads for any product; an unknown slug returns 404.
- [x] Search for "creatine" or "ostrovit" returns results.
- [x] Commit: `feat(catalog): listings, filters, product page and search`

---

## Phase 4: Authentication (plan §1, §3.5)

### 4.1 Auth.js setup
- [x] `npm i next-auth@beta @auth/prisma-adapter bcryptjs` and `npm i -D @types/bcryptjs`
- [x] Generate a secret with `npx auth secret` (this sets `AUTH_SECRET`). Do this together with the Supabase setup, when `.env` is created.
- [x] `src/lib/auth.ts`:
  - [x] `PrismaAdapter(db)` with `session: { strategy: "jwt" }`. The Credentials provider requires JWT sessions.
  - [x] **Credentials** provider: validate the input with Zod, look up the user, then `bcrypt.compare`
  - [x] **Google** (or GitHub) provider
  - [x] `jwt` and `session` callbacks that put `user.id` and `user.role` into the session
  - [x] extend the types in `src/types/next-auth.d.ts` with `id` and `role`
  - [x] export `auth`, `signIn`, `signOut` and `handlers`
- [x] `src/app/api/auth/[...nextauth]/route.ts`: export the handlers.
- [x] `src/lib/auth-guards.ts`:
  - `requireUser()`: redirects to `/login?callbackUrl=…`
  - `requireAdmin()`: returns 404 or 403 for anyone who is not an admin

### 4.2 Pages and actions
- [x] `actions/auth.ts`:
  - `registerUser`: Zod (name, email, password ≥ 8 characters, confirm), check the email is unique, hash, create the user, sign in
  - `loginUser`
- [x] `/login` and `/register` pages, built with react-hook-form and the shadcn `Form`:
  - [x] error messages
  - [x] "Continue with Google" button
  - [x] the `callbackUrl` is respected
- [x] Header account menu:
  - logged out: "Sign in"
  - logged in: avatar with links to My account, Orders, Wishlist, Admin (admins only) and Sign out
- [x] Protect `/account/**` and `/admin/**` in `middleware.ts` (Auth.js `authorized` callback). **Also** call `requireUser()` or `requireAdmin()` inside the pages and actions.

**Where the code differs from the wording above** (details in `work_log.md`):
- **`src/proxy.ts`**, not `middleware.ts`: Next.js 16 renamed Middleware to Proxy.
- **Forms** use shadcn **`Field`**, because `Form` is empty in this shadcn version, plus a small `FormField` wrapper around react-hook-form's `Controller`.
- **Google** login is offered only when `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set; otherwise the button is hidden.
- **`@hookform/resolvers` is v5**: v6 fails to install because of an optional peer conflict with `effect`.
- **Placeholder pages** for `/account` and `/admin` were added so the protection can be tested. Phases 7 and 9 replace them.

### ✅ Check
- [x] Register, then log out, then log in with credentials.
- [ ] Google login works and creates a user and an account in the database. (Optional; needs `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`.)
- [x] `/account` redirects to `/login` when logged out, and returns to the original page after login.
- [ ] A normal user cannot open `/admin` (checked: sent to `/`). The seeded admin can (not checked yet: log in as `admin@healthystreet.test` with `SEED_ADMIN_PASSWORD`).
- [x] Commit: `feat(auth): credentials and OAuth login with roles`

---

## Phase 5: Cart (plan §3.3)

### 5.1 Guest cart (client)
- [ ] `npm i zustand`
- [ ] `src/stores/cart.ts`: a Zustand store with `persist` that holds items as `{ productId, quantity }` and has the actions `add`, `remove`, `setQty` and `clear`.

### 5.2 Database cart (server)
- [ ] `actions/cart.ts`. Every action:
  - validates with Zod
  - checks stock: clamp the quantity to the stock, return a message if it was clamped
  - calls `revalidatePath`

  Actions:
  - [ ] `addToCart(productId, qty)`
  - [ ] `updateCartItem(productId, qty)`, where qty 0 removes the item
  - [ ] `removeFromCart(productId)`
  - [ ] `getCart()`: returns lines with the **server-computed** effective prices, plus subtotal, discount, shipping (€4.99, or €0 when the subtotal is €60 or more) and total
  - [ ] `mergeGuestCart(items)`: on login, add the guest quantities to the database cart and cap each line at the stock
- [ ] `useCart()` hook: when logged out it uses Zustand. When logged in it uses the Server Actions with optimistic updates (`useOptimistic`).
- [ ] After login, call `mergeGuestCart` once, then clear the local cart.

### 5.3 Cart UI (`src/components/cart/`)
- [ ] `AddToCartButton`: shows a loading state and a toast "Added to cart" with a "View cart" action. Wire it into `ProductCard` and the product page.
- [ ] `CartDrawer` (a `Sheet`): lines, subtotal, `FreeShippingBar`, "Checkout" and "View cart"; opened from the header icon.
- [ ] `CartLine`: image, name, pack, quantity stepper, line price, remove.
- [ ] `FreeShippingBar`: "€X away from free shipping" with a progress bar.
- [ ] `/cart` page: full table and summary, with an empty state and a "Continue shopping" link.
- [ ] Header badge shows the total quantity.

### ✅ Check
- [ ] A guest adds items, refreshes the page, and the cart is still there.
- [ ] A guest adds items, logs in, and the items are merged into the database cart with no duplicate lines.
- [ ] You can't add more than the stock; out-of-stock products can't be added.
- [ ] Totals match the server values (check in the database or the logs).
- [ ] Commit: `feat(cart): guest and user cart with merge`

---

## Phase 6: Stripe checkout and orders (plan §3.4)

### 6.1 Setup
- [ ] `npm i stripe`
- [ ] Put the test keys in `.env`: `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] `src/lib/stripe.ts`: a server-only Stripe client (`import "server-only"`).

### 6.2 Create the checkout
- [ ] `actions/checkout.ts` → `createCheckoutSession()`:
  - [ ] `requireUser()`
  - [ ] load the database cart and recompute effective prices; fail if the cart is empty or a line is over stock
  - [ ] in a **transaction**, create an `Order` (`PENDING`, totals) and `OrderItem` snapshots (name, image, unitPriceCents, quantity)
  - [ ] create a Stripe Checkout Session with:
    - `mode: "payment"`
    - `line_items` using `price_data` (currency `eur`, `unit_amount` = the effective price, `product_data.name` and `images`, which must be absolute URLs)
    - a shipping line, through `shipping_options` or an extra line item
    - `shipping_address_collection: { allowed_countries: ["BG", "DE", "FR", …] }`
    - `allow_promotion_codes: true`
    - `customer_email`
    - `metadata: { orderId }`
    - `success_url: ${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    - `cancel_url: ${APP_URL}/cart`
  - [ ] save `stripeSessionId` on the order, then `redirect(session.url)`
- [ ] Connect the "Checkout" button in the drawer and on the cart page. If the user is logged out, send them to login first.

### 6.3 Webhook
- [ ] `src/app/api/webhooks/stripe/route.ts` (`POST`):
  - [ ] read the **raw body** with `await req.text()` and call `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`. Return 400 if it fails.
  - [ ] `checkout.session.completed`, in one transaction:
    - [ ] find the order by `metadata.orderId`; **if it is already `PAID`, return 200 and do nothing** (idempotency)
    - [ ] set it to `PAID` and store `paidAt`, `stripePaymentIntentId`, `shippingAddress` and the final `totalCents`/`discountCents` from the session, because a promotion code may have changed them
    - [ ] decrement `stock` and increment `soldCount` for each item
    - [ ] clear the user's cart
  - [ ] `checkout.session.expired`: set the order to `CANCELLED` if it is still `PENDING`.
  - [ ] Return 200 quickly and log any unhandled event types.
- [ ] To test locally:
  - run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  - copy the `whsec_…` secret it prints into `STRIPE_WEBHOOK_SECRET`

### 6.4 Result pages
- [ ] `/checkout/success`: retrieve the session and show the order number (`HS-000123`), items and total. If the webhook hasn't run yet, show "Payment received, processing…" and refresh after a few seconds.
- [ ] `/checkout/cancel`, or reuse `/cart` with a toast.

### ✅ Check
- [ ] Pay with `4242 4242 4242 4242` (any future date, any CVC). The order becomes `PAID`, stock goes down and the cart is empty.
- [ ] Paying with `4000 0000 0000 0002` (declined) shows Stripe's error, and the order stays `PENDING`.
- [ ] Resending the event with `stripe events resend <id>` doesn't change stock again.
- [ ] Changing a price in the database between "add to cart" and "checkout" makes the **new** price show in Stripe.
- [ ] Commit: `feat(checkout): Stripe Checkout with webhook order fulfilment`

---

## Phase 7: User profile (plan §3.5)

### 7.1 Account layout
- [ ] `(account)/account/layout.tsx`: a sidebar (tabs on mobile) with Overview, Orders, Wishlist, Reviews and Settings. Call `requireUser()` in it.
- [ ] `/account`: avatar, name, email, member since, order count, total spent, and the last 3 orders.

### 7.2 Orders
- [ ] `/account/orders`: a paginated table with number, date, status badge (one colour per status), item count and total.
- [ ] `/account/orders/[number]`:
  - [ ] **only the order's owner** can see it; anyone else gets 404
  - [ ] items with thumbnails, subtotal, discount, shipping, total and the shipping address
  - [ ] a **status timeline**: Placed, then Paid, then Shipped, then Delivered
  - [ ] a "Buy again" button that adds every item back to the cart (only items that are still in stock)

### 7.3 Wishlist
- [ ] `actions/wishlist.ts`: `toggleWishlist(productId)` and `getWishlistIds()`.
- [ ] `WishlistButton` (a heart) on `ProductCard` and the product page. It updates optimistically, and when the user is logged out it sends them to login.
- [ ] `/account/wishlist`: a grid of the products with "Move to cart" and "Remove".

### 7.4 Reviews
- [ ] `actions/review.ts`:
  - [ ] `canReview(productId)`: true only if the user has a `PAID`, `SHIPPED` or `DELIVERED` order containing the product **and** hasn't reviewed it yet
  - [ ] `createReview`, `updateReview` and `deleteReview`, all validated with Zod (rating 1–5, body 10–1000 characters)
  - [ ] after each one, recompute `ratingAvg`/`ratingCount` for the product **in the same transaction**
- [ ] Product page:
  - [ ] rating summary (average and a 5→1 distribution bar)
  - [ ] review list, newest first, without hidden reviews
  - [ ] the "Write a review" form appears only when `canReview` is true
- [ ] `/account/reviews`: the user's reviews, with edit and delete.

### 7.5 Settings
- [ ] Change name.
- [ ] Change password: credentials users only, and the current password is required.
- [ ] Delete account: requires confirmation, cascades the user's data, and keeps their orders anonymised (or soft-deletes the user).

### ✅ Check
- [ ] After a test purchase the order appears in the list and its details page shows the right data.
- [ ] Opening another user's order URL returns 404.
- [ ] The wishlist toggles on cards and the product page, and the state persists.
- [ ] The review form appears only for products the user bought; after posting, the stars and count update on the card.
- [ ] Commit: `feat(account): orders, wishlist, reviews and settings`

---

## Phase 8: Promotions and banners (plan §3.2)

- [ ] `src/lib/banners.ts`: `getActiveBanners(placement)`, filtered by `active`, `startsAt ≤ now ≤ endsAt` and `sortOrder`.
- [ ] `HeroCarousel` (Client Component, shadcn Carousel/Embla):
  - [ ] autoplay that pauses on hover
  - [ ] dots and arrows
  - [ ] a CTA button
  - [ ] an optional **countdown** to `endsAt`
  - [ ] responsive images
- [ ] `InlineBanner`: a full-width promo card between sections on the home page.
- [ ] `PromoStrip`: can now be dismissed; remember that in `localStorage`.
- [ ] Make sure `getEffectivePrice` (Phase 3) is used **everywhere**: cards, product page, cart, checkout line items and order snapshots.
- [ ] `/sale` page: products with an active promotion, using the listing UI with filters.
- [ ] Add a "Sale" link in the header and an "On sale" section on the home page.
- [ ] Final home page order: PromoStrip → Hero → Shop by category → On sale → InlineBanner → Best sellers → Featured brands → New arrivals.
- [ ] Stripe promotion codes:
  - [ ] create a coupon and a promotion code in the Stripe dashboard (test mode), e.g. `WELCOME10`
  - [ ] confirm the code field appears in Checkout and the discount ends up in the order's `discountCents`

### ✅ Check
- [ ] Setting a promotion's `endsAt` to the past removes the sale badges and restores the prices **everywhere**.
- [ ] Turning off a banner hides it from the home page.
- [ ] `WELCOME10` reduces the Stripe total, and the stored order total matches Stripe.
- [ ] Commit: `feat(promo): banners, promotions and promo codes`

---

## Phase 9: Admin (plan §3.6)

### 9.1 Base
- [ ] `(admin)/admin/layout.tsx`: call `requireAdmin()`; sidebar navigation with Dashboard, Products, Orders, Banners, Promotions and Reviews.
- [ ] Every admin Server Action starts with `await requireAdmin()`. This is **not optional**.
- [ ] Reusable `DataTable` built on the shadcn `Table`: server-side pagination, search and sort through URL params.

### 9.2 Dashboard
- [ ] Stat cards: revenue (sum of PAID+ orders), order count, average order value, new users in the last 7 days.
- [ ] Top 5 products by `soldCount`; a low-stock list (stock < 10).
- [ ] Optional: a revenue chart for the last 30 days (`recharts`).

### 9.3 Products
- [ ] List with search by name or brand, a brand/category filter and stock.
- [ ] Create/edit form:
  - name, slug (auto-generated, editable), brand (select), categories (multi-select), price in € (converted to cents), stock, pack fields, description, featured
  - **image upload** to `public/products/` for local development. For a deployed version, use Vercel Blob or UploadThing.
- [ ] Delete: block it if the product is in any order; offer a "hide"/archive flag instead. This may mean adding an `archived Boolean` field to `Product` with a migration.

### 9.4 Orders
- [ ] List filtered by status and date, with the customer's email.
- [ ] Details page with a **status change** (`PAID → SHIPPED → DELIVERED`, or `CANCELLED`). Only allow valid transitions.

### 9.5 Banners and promotions
- [ ] Banner CRUD: image upload, placement, schedule (`startsAt`/`endsAt`), active, sort order, and a live **preview**.
- [ ] Promotion CRUD: name, percent (1–90), target (brand **or** category **or** products), schedule and active. Add a validation error when no target is selected.

### 9.6 Reviews
- [ ] List of the newest reviews with hide/unhide and delete; recompute the product rating afterwards.

### ✅ Check
- [ ] A normal user calling an admin action directly (e.g. through a crafted request) is rejected.
- [ ] An admin creates a banner and it appears on the home page; marks an order SHIPPED and the customer sees it in `/account/orders`.
- [ ] A created or edited product appears correctly in the catalog and filters.
- [ ] Commit: `feat(admin): dashboard and management screens`

---

## Phase 10: Polish

- [ ] Empty states: no results, empty cart, empty wishlist, no orders, no reviews.
- [ ] `loading.tsx` skeletons for every data-heavy route; `error.tsx` with a "Try again" button.
- [ ] Toasts for every mutation (success and error).
- [ ] **Accessibility:**
  - [ ] every interactive element can be reached and used with the keyboard
  - [ ] focus rings are visible in both themes
  - [ ] every image has `alt`
  - [ ] the price slider and stars have `aria-*` labels
  - [ ] contrast is AA in both themes
- [ ] **Performance:**
  - [ ] `next/image` with correct `sizes`
  - [ ] `priority` on the first hero image
  - [ ] no client components where a server component would do
  - [ ] check bundle size with `next build`
- [ ] **SEO:**
  - [ ] `generateMetadata` on every page
  - [ ] `app/sitemap.ts` (categories, brands, products)
  - [ ] `app/robots.ts`
  - [ ] Open Graph image
- [ ] Run Lighthouse on the home, category and product pages: aim for **90+** on Performance, Accessibility and SEO.
- [ ] **README.md:**
  - [ ] project description and screenshots
  - [ ] tech stack
  - [ ] setup steps (environment variables, database, migrate, seed, `stripe listen`, `npm run dev`)
  - [ ] test card numbers
  - [ ] the demo admin login
  - [ ] the "demo store" disclaimer

### ✅ Check
- [ ] `npm run build` succeeds with no type or lint errors.
- [ ] A fresh clone can be set up by following the README alone.
- [ ] Commit: `chore: polish, a11y, SEO and README`

---

## Phase 11: Stretch goals (optional, pick any)

- [ ] **Unit tests (Vitest):**
  - [ ] `parse-pack.ts`
  - [ ] `pricing.ts` (best promotion wins, expired promotions are ignored)
  - [ ] `catalog.ts` filter parsing and building the `where`
  - [ ] the shipping rule
- [ ] **End-to-end tests (Playwright):**
  - browse → filter → add to cart → login → checkout (Stripe test card)
  - leaving a review
  - admin changes an order's status
- [ ] **CI:** a GitHub Actions workflow that runs install, lint, typecheck, test and build on every push and PR.
- [ ] **Deploy:**
  - [ ] Vercel and Neon
  - [ ] set the environment variables
  - [ ] run `prisma migrate deploy` during the build
  - [ ] seed once
  - [ ] register the production webhook endpoint in the Stripe dashboard
- [ ] **Docker:** a `docker-compose.yml` with Postgres (and optionally the app).
- [ ] **Full-text search:** a Postgres `tsvector` column and a GIN index, plus a header autocomplete (debounced, top 6 results with thumbnails).
- [ ] **Order emails:** Resend and React Email, sent from the webhook after an order is PAID.
- [ ] **Refunds:** an admin "Refund" button calls `stripe.refunds.create`, and the `charge.refunded` webhook sets the order to `REFUNDED` and restores the stock.
- [ ] **Recently viewed** products (`localStorage`) and a **"Frequently bought together"** section (from order items).
- [ ] **Flavours/variants:** a `ProductVariant` model (flavour, size, price, stock) and a variant picker on the product page.

---

## Progress summary

| Phase | Status |
|---|---|
| 0. Project setup | ✅ |
| 1. Data and seeding | ✅ (catalog rebuilt from the product photos) |
| 2. Layout and design system | ✅ (account dropdown moves to Phase 4) |
| 3. Catalog | ✅ |
| 4. Authentication | ✅ except the admin login check and optional Google |
| 5. Cart | ⬜ |
| 6. Stripe checkout and orders | ⬜ |
| 7. User profile | ⬜ |
| 8. Promotions and banners | ⬜ |
| 9. Admin | ⬜ |
| 10. Polish | ⬜ |
| 11. Stretch goals | ⬜ |

Legend: ⬜ not started · 🟨 in progress · ✅ done
